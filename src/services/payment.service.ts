import { api } from "@/lib/axios";
import { 
  InitiatePaymentRequest, 
  InitiatePaymentResponse, 
  ConfirmPaymentRequest 
} from "@/types/payment";

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const paymentService = {
  // 1. Trigger STK Push
  initiateSTK: async (data: InitiatePaymentRequest) => {
    // Adjust the endpoint URL if your backend is different
    const response = await api.post<BackendResponse<InitiatePaymentResponse>>("/payments/deposit", data);
    return response.data.data as InitiatePaymentResponse;
  },

  // 2. Confirm Payment (The Callback Simulation)
  confirmPayment: async (data: ConfirmPaymentRequest) => {
    // This sends the manual confirmation to your backend
    const response = await api.post("/payments/callback", data);
    return response.data;
  }
};
