import { format as fnsFormat } from 'date-fns';

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
    const date = new Date(dateString);
    return fnsFormat(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
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
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formats a phone number to a more readable format
 * @param phone - The phone number to format (10 digits)
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone || phone.length !== 10) return phone;
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
