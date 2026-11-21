
const API_URL = "http://localhost:5000/api/orders";

// ==========================================
// TYPES
// ==========================================

export type OrderItem = {
  productId: string;
  quantity: number;
  size?: {
    id: string;
  };
};

export type Order = {
  _id: string;
  orderNumber: string;

  items: {
    productId: string;
    name: string;
    barcode: string;
    size?: {
      id: string;
      name: string;
      volume: string;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];

  subtotal: number;
  discount: number;
  total: number;

  paymentMethod: "Cash" | "GCash" | "Card";
  cashReceived: number;
  change: number;

  paymentStatus: "Paid" | "Pending" | "Refunded";
  orderStatus: "Completed" | "Cancelled";

  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrder = {
  items: OrderItem[];
  discount?: number;
  paymentMethod: "Cash" | "GCash" | "Card";
  cashReceived?: number;
  notes?: string;
};

// ==========================================
// API HELPER
// ==========================================

const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (order: CreateOrder) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  return handleResponse(response);
};

// ==========================================
// GET ALL ORDERS
// ==========================================

export const getOrders = async (): Promise<Order[]> => {
  const response = await fetch(API_URL);

  const data = await handleResponse(response);

  return data.orders;
};

// ==========================================
// GET ORDER BY ID
// ==========================================

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await fetch(`${API_URL}/${id}`);

  const data = await handleResponse(response);

  return data.order;
};

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

export const updateOrderStatus = async (
  id: string,
  orderStatus: "Completed" | "Cancelled"
) => {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderStatus }),
  });

  return handleResponse(response);
};

// ==========================================
// DELETE ORDER
// ==========================================

export const deleteOrder = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return handleResponse(response);
};
