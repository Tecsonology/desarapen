export type PaymentMethod = "Cash" | "Gcash" | "Card"

export const paymentOptions : PaymentMethod[] = [
    "Cash", "Gcash", "Card"
]

export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Refunded"

export interface Payment {
  _id?: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  cashReceived?: number;
  change?: number;
  referenceNumber?: string;
  status: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}