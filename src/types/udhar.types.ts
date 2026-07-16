export interface UdharEntry {
  _id: string;
  shop_id: string;
  recorded_by: {
    _id: string;
    name: string;
  };
  customer_name: string;
  customer_phone: string | null;
  type: "credit" | "payment";
  amount: number;
  packets: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface UdharCustomerSummary {
  customer_name: string;
  customer_phone: string | null;
  net_balance: number;
  last_transaction_date: string;
}

export interface UdharFormInput {
  customer_name: string;
  customer_phone?: string;
  type: "credit" | "payment";
  amount: number;
  packets: number;
  description?: string;
  date?: string;
}
