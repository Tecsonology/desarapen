
const API_URL = "http://localhost:5000/api/products";

export type ProductSize = {
  id: string;
  name: string;
  volume: string;
  price: number;
};

export type Product = {
  _id: string;
  name: string;
  category: "Fruit Soda" | "Fruit Milk" | "Snack" | "Iced Coffee";
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  description: string;
  image: string;
  status: "active" | "inactive";
  sizes: ProductSize[];
};

export type CreateProduct = Omit<Product, "_id">;

// GET ALL PRODUCTS
export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await response.json();

  return data.products;
};

// CREATE PRODUCT
export const createProduct = async (product: CreateProduct) => {
  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create product");
  }

  return data;
};

// GET PRODUCT BY ID
export const getProductById = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Product not found");
  }

  return response.json();
};

// UPDATE PRODUCT
export const updateProduct = async (
  id: string,
  product: Partial<CreateProduct>
) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update product");
  }

  return data;
};

// DELETE PRODUCT
export const deleteProduct = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete product");
  }

  return data;
};
