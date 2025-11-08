const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Debug: Log environment variables
console.log('🔍 Orders route - Environment variables:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('✅ Orders route - Supabase client initialized successfully');

// Create a new order
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;

    // Validate required fields
    if (!orderData.user_id || !orderData.vendor_id || !orderData.items || !orderData.total_price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, vendor_id, items, or total_price'
      });
    }

    // ============ VENDOR SETTINGS VALIDATION ============
    // Check vendor operational settings before accepting order
    const { data: vendorSettings, error: settingsError } = await supabase
      .from('vendor_settings')
      .select('*')
      .eq('vendor_id', orderData.vendor_id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching vendor settings:', settingsError);
      return res.status(500).json({
        success: false,
        error: 'Unable to verify vendor availability'
      });
    }

    if (!vendorSettings) {
      console.warn(`No settings found for vendor ${orderData.vendor_id}`);
      return res.status(503).json({
        success: false,
        error: 'Vendor settings not configured. Please contact support.'
      });
    }

    // Check if vendor is accepting orders
    if (!vendorSettings.is_accepting_orders) {
      console.log(`Vendor ${orderData.vendor_id} is not accepting orders`);
      return res.status(503).json({
        success: false,
        error: 'This vendor is currently not accepting orders. Please try again later.'
      });
    }

    // Check busy mode
    if (vendorSettings.is_busy_mode) {
      console.log(`Vendor ${orderData.vendor_id} is in busy mode`);
      return res.status(503).json({
        success: false,
        error: 'This vendor is currently busy. Please try again in a few minutes.'
      });
    }

    // Check maximum concurrent orders capacity
    const { count: activeOrdersCount, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', orderData.vendor_id)
      .in('status', ['pending', 'accepted', 'preparing']);

    if (countError) {
      console.error('Error counting active orders:', countError);
      // Don't block order creation for count errors, just log it
    } else if (activeOrdersCount >= vendorSettings.max_concurrent_orders) {
      console.log(`Vendor ${orderData.vendor_id} at max capacity: ${activeOrdersCount}/${vendorSettings.max_concurrent_orders}`);
      return res.status(503).json({
        success: false,
        error: 'This vendor is at maximum capacity. Please try again later.'
      });
    }

    // ============ QUEUE POSITION ASSIGNMENT ============
    // Assign queue position for the new order
    let queuePosition = null;
    const { data: lastQueueOrder } = await supabase
      .from('orders')
      .select('queue_position')
      .eq('vendor_id', orderData.vendor_id)
      .not('queue_position', 'is', null)
      .order('queue_position', { ascending: false })
      .limit(1)
      .maybeSingle();

    queuePosition = lastQueueOrder && lastQueueOrder.queue_position 
      ? lastQueueOrder.queue_position + 1 
      : 1;

    console.log(`Assigning queue position ${queuePosition} to new order for vendor ${orderData.vendor_id}`);

    // Generate sequential bill number for the vendor
    let billNumber = 1;
    if (orderData.vendor_id) {
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('bill_number')
        .eq('vendor_id', orderData.vendor_id)
        .order('bill_number', { ascending: false })
        .limit(1)
        .single();

      if (lastOrder && lastOrder.bill_number) {
        billNumber = lastOrder.bill_number + 1;
      }
    }

    // Prepare order payload
    const payload = {
      user_id: orderData.user_id,
      vendor_id: orderData.vendor_id,
      items: orderData.items,
      total_price: parseFloat(orderData.total_price),
      status: orderData.status || 'pending',
      payment_status: orderData.payment_status || 'pending',
      payment_method: orderData.payment_method || 'cod',
      payment_id: orderData.payment_id,
      delivery_address: orderData.delivery_address,
      scheduled_for: orderData.scheduled_for,
      special_instructions: orderData.special_instructions,
      group_order_id: orderData.group_order_id,
      queue_position: queuePosition, // Assigned above based on vendor queue
      bill_number: billNumber,
      bill_date: new Date().toISOString().split('T')[0], // Date only
      order_type: orderData.order_type || 'delivery'
    };

    // Insert order using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('orders')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in order creation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// Get all orders (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { user_id, vendor_id, status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch orders'
      });
    }

    res.status(200).json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error in order fetching:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch orders'
    });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order'
    });
  }
});

// Update order payment status
router.patch('/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_id, payment_status, status } = req.body;

    // Validate required fields
    if (!payment_id || !payment_status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: payment_id or payment_status'
      });
    }

    // Update order with payment information
    // Only update payment fields, keep status as 'pending' for vendor to accept
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_id,
        payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Error updating order payment status:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update order payment status'
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: data[0]
    });

  } catch (error) {
    console.error('Error in order payment status update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order payment status'
    });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, payment_status } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or update failed'
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order'
    });
  }
});

module.exports = router;
