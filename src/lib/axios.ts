import axios from "axios";
import Cookies from "js-cookie";

// 1. Define the Base URL (Best practice: use ENV variables)
// For now, we default to localhost if not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial! Allows sending cookies (RefreshToken) to backend
});

// 2. Variable to hold the Access Token in memory
let accessToken: string | null = null;

// Helper to set token
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// 3. Request Interceptor: Injects the token into every request
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor: Handles 401 (Expiration) logic
let isRefreshing = false;
let failedQueue: any[] = [];

// Helper to process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // IF error is 401 (Unauthorized) AND we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // CASE A: We are already refreshing. Queue this request.
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // CASE B: First request to fail. Start the refresh process.
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call your refresh endpoint
        // NOTE: We rely on the HTTP-Only cookie being sent automatically
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`, 
          {}, 
          { withCredentials: true } // Important!
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        
        // Process the queue with the new token
        processQueue(null, newAccessToken);
        
        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // If refresh fails (e.g., refresh token also expired), logout user
        processQueue(refreshError, null);
        // Ideally, redirect to login here or clear state
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
