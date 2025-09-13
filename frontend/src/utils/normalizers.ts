/**
 * Utility functions for normalizing data between frontend and backend.
 * Handles conversion between snake_case (API) and camelCase (Frontend) property names.
 */

import { Order, QueueStatus, MenuItem, OrderStatus } from '../types/index';

/**
 * Normalize queue status data from API response (snake_case) to frontend format (camelCase)
 */
export const normalizeQueueStatus = (data: any): QueueStatus => {
  if (!data) return {} as QueueStatus;
  
  return {
    id: data.id || 0,
    current_position: data.current_position || 0,
    max_active_orders: data.max_active_orders || 10,
    is_accepting_orders: data.is_accepting_orders ?? true,
    estimated_wait_time: data.estimated_wait_time || 0,
    next_interval_time: data.next_interval_time || new Date().toISOString(),
    cooldown_remaining: data.cooldown_remaining || 0,
    interval_minutes: data.interval_minutes || 15,
    active_orders_count: data.active_orders_count || 0,
    cooldown_end_time: data.cooldown_end_time || null,
    
    // Optional camelCase aliases for frontend use
    currentPosition: data.current_position || 0,
    maxActiveOrders: data.max_active_orders || 10,
    isAcceptingOrders: data.is_accepting_orders ?? true,
    estimatedWaitTime: data.estimated_wait_time || 0,
    nextIntervalTime: data.next_interval_time || new Date().toISOString(),
    cooldownRemaining: data.cooldown_remaining || 0
  };
};

/**
 * Normalize order data from API response (snake_case) to frontend format (camelCase)
 */
export const normalizeOrder = (data: any): Order => {
  if (!data) return {} as Order;
  
  return {
    id: data.id || 0,
    user_id: data.user_id || '',
    status: data.status as OrderStatus || 'pending',
    items: data.items || [],
    total_price: data.total_price || 0,
    created_at: data.created_at || new Date().toISOString(),
    payment_status: data.payment_status || 'pending',
    payment_method: data.payment_method || 'cod',
    payment_id: data.payment_id || '',
    delivery_address: data.delivery_address || {},
    scheduled_for: data.scheduled_for || '',
    special_instructions: data.special_instructions || '',
    updated_at: data.updated_at || new Date().toISOString(),
    group_order_id: data.group_order_id || '',
    queue_position: data.queue_position || 0,
    estimated_ready_time: data.estimated_ready_time || '',
    preparation_time: data.preparation_time || 0
  };
};

/**
 * Normalize menu item data from API response (snake_case) to frontend format (camelCase)
 */
export const normalizeMenuItem = (data: any): MenuItem => {
  if (!data) return {} as MenuItem;

  return {
    id: data.id || 0,
    name: data.name || '',
    description: data.description || '',
    // Ensure price is always a number (Supabase DECIMAL may come as string)
    price: Number(data.price ?? 0),
    image_url: data.image_url || '',
    category: data.category || '',
    category_id: data.category_id || undefined,
    is_available: data.is_available ?? true,
    preparation_time: data.preparation_time || 10,
    tags: data.tags || [],
    ingredients: data.ingredients || [],
    nutritional_info: data.nutritional_info || undefined,
    rating: (data.rating === null || data.rating === undefined) ? undefined : Number(data.rating),
    review_count: data.review_count || undefined,
    vendor_id: data.vendor_id || undefined, // CRITICAL: Include vendor_id
    is_featured: data.is_featured ?? false,
    inventory_count: data.inventory_count ?? -1,
    low_stock_threshold: data.low_stock_threshold ?? 5,
    discount_percentage: data.discount_percentage || undefined,
    original_price: data.original_price || undefined,
    created_at: data.created_at || undefined,
    updated_at: data.updated_at || undefined
  };
};

/**
 * Denormalize data from frontend format (camelCase) to API format (snake_case)
 * Used when sending data to the API
 */
export const denormalizeToSnakeCase = <T>(data: T): any => {
  if (!data || typeof data !== 'object') return data;
  
  const result: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Handle nested objects and arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[snakeKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? denormalizeToSnakeCase(item) 
            : item
        );
      } else {
        result[snakeKey] = denormalizeToSnakeCase(value);
      }
    } else {
      result[snakeKey] = value;
    }
  });
  
  return result;
};

/**
 * General normalizer - accepts any data and a normalization function
 * Falls back to returning the original data if normalizer is not provided
 */
export const normalizeData = <T>(data: any, normalizer?: (data: any) => T): T => {
  if (!data) return {} as T;
  if (!normalizer) return data as T;
  
  if (Array.isArray(data)) {
    return data.map(item => normalizer(item)) as unknown as T;
  }
  
  return normalizer(data);
}; 