import axios from "axios";
import { localStorageKey } from "../lib/utils";
import type { UdharFormInput } from "../types/udhar.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorageKey()}`,
});

export const getUdharCustomersApi = async (recordedBy?: string) => {
  const params: any = {};
  if (recordedBy) {
    params.recorded_by = recordedBy;
  }

  const res = await axios.get(`${API_BASE_URL}/api/udhar/customers`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getUdharTransactionsApi = async (customerName?: string, recordedBy?: string) => {
  const params: any = {};
  if (customerName) {
    params.customer_name = customerName;
  }
  if (recordedBy) {
    params.recorded_by = recordedBy;
  }

  const res = await axios.get(`${API_BASE_URL}/api/udhar/transactions`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const createUdharEntryApi = async (payload: UdharFormInput) => {
  const res = await axios.post(`${API_BASE_URL}/api/udhar`, payload, {
    headers: getHeaders(),
  });
  return res.data;
};

export const deleteUdharEntryApi = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/udhar/${id}`, {
    headers: getHeaders(),
  });
  return res.data;
};
