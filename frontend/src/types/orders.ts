export type OrderStatusType = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderType {
  id: string;
  created_at: string;
  user_id: string;
  status: OrderStatusType;
  total_amount: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

export interface QueueStatusType {
  id: string;
  is_accepting_orders: boolean;
  last_checked: string;
  next_check: string;
  shopkeeper_id: string;
} 