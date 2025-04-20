export interface QueueStatus {
  id: number;
  max_active_orders: number;
  interval_minutes: number;
  is_accepting_orders: boolean;
  last_interval_time: string;
  next_interval_time: string;
  active_orders_count: number;
  current_position: number;
  cooldown_remaining?: number;
  max_orders_per_batch?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url: string;
  category: string;
  preparation_time: number;
  tags: string[];
  ingredients: string[];
}

export interface Order {
  id: number;
  user_id: string;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
  total_price: number;
}

export interface OrderItem {
  menu_item: MenuItem;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'; 