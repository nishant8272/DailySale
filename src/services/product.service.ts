import axios from "axios";
import { localStorageKey } from "../lib/utils";
import type { Product } from "../types/product.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type Unit = "piece" | "packet" | "kg" | "litre";

interface ProductListFilters {
  category?: string;
  low_stock_only?: boolean;
  search?: string;
}

interface CreateProductPayload {
  name: string;
  category: string;
  unit: Unit;
  current_sell_price: number;
  current_buy_price: number;
  current_stock?: number;
  low_stock_threshold?: number;
}

interface UpdateProductPayload {
  name?: string;
  category?: string;
  unit?: Unit;
  current_sell_price?: number;
  current_buy_price?: number;
  low_stock_threshold?: number;
  current_stock?: number; // ✅ yeh add kiya
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorageKey()}` },
});

const buildProductQueryParams = (filters?: ProductListFilters) => {
  if (!filters) return undefined;

  return {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.low_stock_only !== undefined
      ? { low_stock_only: String(filters.low_stock_only) }
      : {}),
  };
};

export const getAllProducts = async (
  filters?: ProductListFilters
): Promise<Product[]> => {
  const res = await axios.get<ApiResponse<Product[]>>(
    `${API_BASE_URL}/api/products`,
    {
      ...authHeaders(),
      params: buildProductQueryParams(filters),
    }
  );

  return res.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await axios.get<ApiResponse<Product>>(
    `${API_BASE_URL}/api/products/${id}`,
    authHeaders()
  );

  return res.data.data;
};

export const getProductCategories = async (): Promise<string[]> => {
  const res = await axios.get<ApiResponse<string[]>>(
    `${API_BASE_URL}/api/products/categories`,
    authHeaders()
  );

  return res.data.data;
};

export const createProduct = async (
  payload: CreateProductPayload
): Promise<Product> => {
  const res = await axios.post<ApiResponse<Product>>(
    `${API_BASE_URL}/api/products`,
    payload,
    authHeaders()
  );

  return res.data.data;
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload
): Promise<Product> => {
  const res = await axios.put<ApiResponse<Product>>(
    `${API_BASE_URL}/api/products/${id}`,
    payload,
    authHeaders()
  );

  return res.data.data;
};

export const deleteProduct = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  const res = await axios.delete<{ success: boolean; message?: string }>(
    `${API_BASE_URL}/api/products/${id}`,
    authHeaders()
  );

  return res.data;
};

export const toggleProductStatus = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  return deleteProduct(id);
};