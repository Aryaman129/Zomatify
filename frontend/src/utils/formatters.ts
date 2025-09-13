import { format as fnsFormat } from 'date-fns';
import { QueueStatus, OrderItem, Order, DeliveryAddress } from '../types/index';

/**
 * Formats a currency value with the Indian Rupee symbol
 * @param amount - The amount to format
 * @returns Formatted string with currency symbol
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

/**
 * Formats a date string using date-fns format
 * @param dateString - Date string to format
 * @param formatString - Format pattern to use, defaults to 'MMM dd, yyyy'
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    return fnsFormat(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || '';
  }
};

/**
 * Format a date string into a human-readable format with locale options
 */
export const formatDateLocale = (dateString: string, format: string = 'short'): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (format === 'short') {
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } else if (format === 'full') {
      return date.toLocaleString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } else {
      // Custom format
      return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      } as Intl.DateTimeFormatOptions);
    }
  } catch (error) {
    console.error('Error formatting date with locale:', error);
    return dateString;
  }
};

/**
 * Truncates text with ellipsis if it exceeds the maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length, defaults to 100
 * @returns Truncated text with ellipsis or original text
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formats a phone number to a more readable format
 * @param phone - The phone number to format (10 digits)
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  if (phone.length !== 10) return phone;
  return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
};

/**
 * Capitalizes the first letter of each word in a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Normalizes a QueueStatus object to ensure all fields are populated in both snake_case and camelCase
 * This helps with compatibility between the backend (snake_case) and frontend (camelCase)
 */
export function normalizeQueueStatus(queue: Partial<QueueStatus>): QueueStatus {
  // Default interval time (10 minutes from now)
  const defaultNextInterval = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  
  // Default values for required fields
  const defaultQueue: QueueStatus = {
    current_position: 0,
    max_active_orders: 10,
    is_accepting_orders: true,
    next_interval_time: defaultNextInterval,
    interval_minutes: 10,
    active_orders_count: 0,
    
    // Set camelCase versions too
    currentPosition: 0,
    maxActiveOrders: 10,
    isAcceptingOrders: true,
    nextIntervalTime: defaultNextInterval,
    cooldownRemaining: 0
  };
  
  if (!queue) return defaultQueue;
  
  const normalized: QueueStatus = {
    ...defaultQueue,
    ...queue,
  };
  
  // Ensure camelCase versions are set based on snake_case values and vice versa
  normalized.currentPosition = queue.currentPosition ?? queue.current_position ?? 0;
  normalized.maxActiveOrders = queue.maxActiveOrders ?? queue.max_active_orders ?? 10;
  normalized.isAcceptingOrders = queue.isAcceptingOrders ?? queue.is_accepting_orders ?? true;
  normalized.estimatedWaitTime = queue.estimatedWaitTime ?? queue.estimated_wait_time ?? 0;
  normalized.nextIntervalTime = queue.nextIntervalTime ?? queue.next_interval_time ?? defaultNextInterval;
  normalized.cooldownRemaining = queue.cooldownRemaining ?? queue.cooldown_remaining ?? 0;
  
  // Ensure snake_case versions are also set
  normalized.current_position = normalized.currentPosition;
  normalized.max_active_orders = normalized.maxActiveOrders;
  normalized.is_accepting_orders = normalized.isAcceptingOrders;
  normalized.estimated_wait_time = normalized.estimatedWaitTime;
  normalized.next_interval_time = normalized.nextIntervalTime;
  normalized.cooldown_remaining = normalized.cooldownRemaining;
  
  return normalized;
}

/**
 * Normalizes an OrderItem to ensure compatibility between menu_item and menuItem properties
 */
export function normalizeOrderItem(item: any): OrderItem | null {
  if (!item) return null;
  
  const normalizedItem = { ...item };
  
  // If menu_item is present but menuItem is not, copy menu_item to menuItem
  if (normalizedItem.menu_item && !normalizedItem.menuItem) {
    normalizedItem.menuItem = normalizedItem.menu_item;
  }
  // If menuItem is present but menu_item is not, copy menuItem to menu_item
  else if (normalizedItem.menuItem && !normalizedItem.menu_item) {
    normalizedItem.menu_item = normalizedItem.menuItem;
  }
  
  return normalizedItem as OrderItem;
}

/**
 * Normalize an array of OrderItems
 */
export function normalizeOrderItems(items: any[]): OrderItem[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => normalizeOrderItem(item)).filter(Boolean) as OrderItem[];
}

/**
 * Convert a number to string safely
 */
export function numberToString(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

/**
 * Format time remaining in minutes and seconds
 */
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Normalizes an Order object to ensure all required and optional properties are properly set
 */
export function normalizeOrder(order: Partial<Order>): Order {
  if (!order) {
    throw new Error('Order data is required');
  }
  
  // Create a default delivery address if missing
  const deliveryAddress: DeliveryAddress = order.delivery_address || {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: ''
  };
  
  // Normalize order items
  const normalizedItems = order.items?.map(item => normalizeOrderItem(item)).filter(Boolean) as OrderItem[] || [];
  
  // Create the normalized order
  const normalizedOrder: Order = {
    id: order.id || 0,
    user_id: order.user_id || '',
    status: order.status || 'pending',
    items: normalizedItems,
    total_price: order.total_price || 0,
    created_at: order.created_at || new Date().toISOString(),
    payment_status: order.payment_status || 'pending',
    payment_method: order.payment_method || 'cod',
    payment_id: order.payment_id || '',
    delivery_address: deliveryAddress,
    scheduled_for: order.scheduled_for || '',
    special_instructions: order.special_instructions || '',
    updated_at: order.updated_at || new Date().toISOString(),
    group_order_id: order.group_order_id || '',
    queue_position: order.queue_position || 0,
    estimated_ready_time: order.estimated_ready_time || '',
    preparation_time: order.preparation_time || 0,
    bill_number: order.bill_number || undefined
  };
  
  return normalizedOrder;
}

/**
 * Safely converts a numeric ID to string for display
 */
export function formatId(id: number | string): string {
  if (id === undefined || id === null) return '';
  
  // Convert to string and take last 6 characters for display
  return String(id).slice(-6);
}
