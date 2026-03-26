export interface DailyReportProduct {
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

export interface DailyReport {
	date: string;
	is_closed: boolean;
	closed_at?: string;
	opened_by: string;
	closed_by?: string;
	day_total_revenue: number;
	day_total_profit: number;
	total_products: number;
	products: DailyReportProduct[];
}
