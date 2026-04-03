export interface Shop {
  _id: string;
  name: string;
  owner_name: string;
  phone: string;
  address?: string;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: "owner" | "worker";
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: { user: User; shop: Shop };
}

export interface MeResponse {
  success: boolean;
  data: { user: User; shop: Shop };
}

export interface DailyProduct {
  product_id: string;
  product_name: string;
  opening_stock: number;
  closing_stock: number;
  total_added: number;
  units_sold: number;
  active_sell_price: number;
  active_buy_price: number;
  revenue: number;
  profit: number;
  is_closing_entered: boolean;
}

export interface DailyEntry {
  _id: string;
  date: string;
  opened_by?:
    | string
    | {
        _id: string;
        name: string;
        role: "owner" | "worker";
      };
  is_closed: boolean;
  closed_at?: string;
  day_total_revenue: number;
  day_total_profit: number;
  products: DailyProduct[];
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  unit: "piece" | "packet" | "kg" | "litre";
  current_sell_price: number;
  current_buy_price: number;
  current_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface Alert {
  _id: string;
  type: "low_stock" | "price_loss" | "shift_not_closed";
  message: string;
  is_read: boolean;
  created_at: string;
  product_id?: { _id: string; name: string };
}

export interface WeeklyReport {
  period: { from: string; to: string };
  week_total_revenue: number;
  week_total_profit: number;
  week_total_units: number;
  best_day: { date: string; revenue: number } | null;
  top_products?: {
    product_name: string;
    units_sold: number;
    revenue: number;
    profit: number;
  }[];
  daily_breakdown: {
    date: string;
    revenue: number;
    profit: number;
    units_sold: number;
    has_data: boolean;
  }[];
}