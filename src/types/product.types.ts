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
  created_at: string;
  updated_at: string;
}
