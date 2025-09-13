import supabase from '../services/supabaseClient';
import { ApiResponse } from '../types/index';

// Security validation utilities
export class SecurityError extends Error {
  constructor(message: string, public code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityError';
  }
}

// Validate user authentication
export const validateAuth = async (): Promise<{ user: any; profile: any }> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new SecurityError('Authentication required', 'AUTH_REQUIRED');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new SecurityError('User profile not found', 'PROFILE_NOT_FOUND');
  }

  return { user, profile };
};

// Validate vendor access
export const validateVendorAccess = async (): Promise<{ user: any; profile: any; vendor: any }> => {
  const { user, profile } = await validateAuth();

  // Check if user has vendor role
  if (!['shopkeeper', 'admin'].includes(profile.role)) {
    throw new SecurityError('Vendor access required', 'VENDOR_ACCESS_REQUIRED');
  }

  // Get vendor data
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (vendorError || !vendor) {
    throw new SecurityError('Vendor not found for this user', 'VENDOR_NOT_FOUND');
  }

  return { user, profile, vendor };
};

// Validate order access (user can access their own orders or vendor can access their orders)
export const validateOrderAccess = async (orderId: string): Promise<{ user: any; profile: any; order: any }> => {
  const { user, profile } = await validateAuth();

  // Get order data
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, vendors(*)')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new SecurityError('Order not found', 'ORDER_NOT_FOUND');
  }

  // Check access permissions
  const isCustomer = order.user_id === user.id;
  const isVendorOwner = order.vendors?.owner_id === user.id;
  const isAdmin = profile.role === 'admin';

  if (!isCustomer && !isVendorOwner && !isAdmin) {
    throw new SecurityError('Access denied to this order', 'ORDER_ACCESS_DENIED');
  }

  return { user, profile, order };
};

// Validate menu item access
export const validateMenuItemAccess = async (menuItemId: string): Promise<{ user: any; profile: any; menuItem: any; vendor: any }> => {
  const { user, profile } = await validateAuth();

  // Get menu item with vendor data
  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .select('*, vendors(*)')
    .eq('id', menuItemId)
    .single();

  if (menuError || !menuItem) {
    throw new SecurityError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
  }

  // Check vendor ownership
  const isVendorOwner = menuItem.vendors?.owner_id === user.id;
  const isAdmin = profile.role === 'admin';

  if (!isVendorOwner && !isAdmin) {
    throw new SecurityError('Access denied to this menu item', 'MENU_ITEM_ACCESS_DENIED');
  }

  return { user, profile, menuItem, vendor: menuItem.vendors };
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Rate limiting utility (client-side basic implementation)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Secure API wrapper
export const secureApiCall = async <T>(
  operation: () => Promise<ApiResponse<T>>,
  requiredPermissions?: string[]
): Promise<ApiResponse<T>> => {
  try {
    // Basic rate limiting
    const userKey = (await supabase.auth.getUser()).data.user?.id || 'anonymous';
    if (!rateLimiter.isAllowed(userKey)) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    // Validate authentication if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const { profile } = await validateAuth();
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.some(permission => {
        switch (permission) {
          case 'vendor':
            return ['shopkeeper', 'admin'].includes(profile.role);
          case 'admin':
            return profile.role === 'admin';
          case 'customer':
            return profile.role === 'customer';
          default:
            return false;
        }
      });

      if (!hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions'
        };
      }
    }

    // Execute the operation
    return await operation();
  } catch (error: any) {
    console.error('Secure API call error:', error);
    
    if (error instanceof SecurityError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
};

// Data validation schemas
export const validationSchemas = {
  order: {
    total_price: (value: number) => value > 0 && value < 10000,
    special_instructions: (value: string) => value.length <= 500,
    order_type: (value: string) => ['delivery', 'pickup'].includes(value)
  },
  
  menuItem: {
    name: (value: string) => value.length >= 2 && value.length <= 100,
    price: (value: number) => value > 0 && value < 5000,
    description: (value: string) => value.length <= 1000,
    category: (value: string) => value.length >= 2 && value.length <= 50
  },
  
  vendor: {
    business_name: (value: string) => value.length >= 2 && value.length <= 100,
    phone_number: (value: string) => validatePhoneNumber(value),
    email: (value: string) => validateEmail(value)
  }
};

// Validate data against schema
export const validateData = (data: any, schema: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [field, validator] of Object.entries(schema)) {
    if (data[field] !== undefined && data[field] !== null) {
      try {
        const isValid = (validator as Function)(data[field]);
        if (!isValid) {
          errors.push(`Invalid ${field}`);
        }
      } catch (error) {
        errors.push(`Validation error for ${field}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Audit logging
export const auditLog = async (action: string, resourceType: string, resourceId: string, details?: any) => {
  try {
    const { user } = await validateAuth();
    
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: 'client', // In a real app, you'd get the actual IP
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw error for audit logging failures
  }
};
