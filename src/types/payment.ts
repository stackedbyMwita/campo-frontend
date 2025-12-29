export interface InitiatePaymentRequest {
  amount: number;
  phoneNumber: string; // 2547...
}

// Updated to match your backend response
export interface InitiatePaymentResponse {
  userId: string;
  phoneNumber: string;
  amount: number;
  checkoutRequestID: string; // 👈 Note: camelCase here based on your JSON
  status: string;
  reference: string;
}

export interface ConfirmPaymentRequest {
  CheckoutRequestID: string; // 👈 PascalCase required for the Callback endpoint
  Status: "Success" | "Failed";
  MpesaReceiptNumber?: string;
}