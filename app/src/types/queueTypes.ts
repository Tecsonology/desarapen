export interface QueueOrder {
  productName: string;
  category: String;
  quantity: number;
  size: string;
  price: number;
  subtotal: number;
  notes?: string;
}

export type QueueStatus = "pending" | "preparing" | "done";

export interface Queue {
  _id: string;
  queueNumber: number;
  orders: QueueOrder[];
  time: string;
  status: QueueStatus;
  kioksCode?: number | null,
  orderSource?: "Cashier" | "Kiosk"

}