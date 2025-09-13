const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to verify vendor authentication
const verifyVendorAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Check if user is a vendor (shopkeeper)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'shopkeeper') {
      return res.status(403).json({ success: false, error: 'Vendor access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// Get vendor dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';

    // Get order statistics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId);

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
      return res.status(500).json({ success: false, error: ordersError.message });
    }

    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => ['pending', 'accepted', 'preparing'].includes(order.status)).length;
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

    // Get menu items count
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('available', true);

    if (menuError) {
      console.error('Menu fetch error:', menuError);
      return res.status(500).json({ success: false, error: menuError.message });
    }

    const activeMenuItems = menuItems.length;

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue.toFixed(2),
        activeMenuItems
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get vendor orders
router.get('/orders', async (req, res) => {
  try {
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(email, first_name, last_name, phone_number)
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders fetch error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data: orders || []
    });

  } catch (error) {
    console.error('Vendor orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.patch('/orders/:orderId/status', verifyVendorAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    // Get the vendor ID for the authenticated user
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, upi_id')
      .eq('owner_id', req.user.id)
      .single();

    if (vendorError || !vendorData) {
      return res.status(404).json({ success: false, error: 'Vendor not found for authenticated user' });
    }

    const vendorId = vendorData.id;

    // Get current order details to check payment status
    const { data: currentOrder, error: orderError } = await supabase
      .from('orders')
      .select('*, payment_status, total_price, payment_id')
      .eq('id', orderId)
      .eq('vendor_id', vendorId)
      .single();

    if (orderError || !currentOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Prepare update object
    const updateData = { 
      status,
      updated_at: new Date().toISOString()
    };

    // Add cancellation reason if status is cancelled
    if (status === 'cancelled' && reason) {
      updateData.cancellation_reason = reason;
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (error) {
      console.error('Order status update error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // REFUND PROCESSING: When vendor cancels a paid order
    if (status === 'cancelled' && currentOrder.payment_status === 'paid' && currentOrder.payment_id) {
      try {
        console.log(`Processing refund for cancelled order ${orderId}, payment ${currentOrder.payment_id}`);
        
        // Call payment refund API
        const refundResponse = await fetch('http://localhost:5001/api/payments/refund', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: currentOrder.payment_id,
            orderId: orderId,
            amount: Math.round(currentOrder.total_price * 100), // Convert to paise
            reason: `Order cancelled by vendor: ${reason || 'No reason provided'}`
          })
        });

        const refundResult = await refundResponse.json();
        
        if (refundResult.success) {
          console.log(`Refund processed successfully: ${refundResult.refund.id}`);
        } else {
          console.error('Refund processing failed:', refundResult.error);
          // Note: Order is still cancelled but refund failed - needs manual processing
        }
      } catch (refundError) {
        console.error('Refund API call error:', refundError);
        // Don't fail the cancellation for refund errors - manual processing required
      }
    }

    // PAYMENT ESCROW RELEASE: When vendor accepts order and payment is confirmed
    if (status === 'accepted' && currentOrder.payment_status === 'paid' && currentOrder.payment_id) {
      try {
        console.log(`Releasing payment escrow for order ${orderId} to vendor ${vendorId}`);
        
        // Calculate platform fee (5%) and vendor amount
        const platformFeePercentage = 5;
        const totalAmount = currentOrder.total_price;
        const platformFee = (totalAmount * platformFeePercentage) / 100;
        const vendorAmount = totalAmount - platformFee;

        // Create vendor payment distribution record
        const { data: distributionData, error: distributionError } = await supabase
          .from('vendor_payment_distributions')
          .insert({
            order_id: orderId,
            vendor_id: vendorId,
            razorpay_payment_id: currentOrder.payment_id,
            vendor_upi_id: vendorData.upi_id || 'pending_setup',
            amount: totalAmount,
            platform_fee: platformFee,
            vendor_amount: vendorAmount,
            transfer_status: 'pending' // Will be processed by payment service
          })
          .select()
          .single();

        if (distributionError) {
          console.error('Payment distribution creation error:', distributionError);
          // Don't fail the order status update for payment distribution errors
        } else {
          console.log('Payment distribution created:', distributionData);
          
          // TODO: Integrate with actual payment transfer API (Razorpay transfers)
          // For now, mark as processing
          await supabase
            .from('vendor_payment_distributions')
            .update({
              transfer_status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', distributionData.id);
        }
      } catch (paymentError) {
        console.error('Payment escrow release error:', paymentError);
        // Don't fail the order status update for payment errors
      }
    }

    res.json({
      success: true,
      data,
      message: status === 'accepted' && currentOrder.payment_status === 'paid' 
        ? 'Order accepted and payment released to vendor' 
        : 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get vendor menu items
router.get('/menu', async (req, res) => {
  try {
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';

    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('category', { ascending: true });

    if (error) {
      console.error('Menu fetch error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data: menuItems || []
    });

  } catch (error) {
    console.error('Vendor menu error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new menu item
router.post('/menu', async (req, res) => {
  try {
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';
    const menuItem = { ...req.body, vendor_id: vendorId };

    const { data, error } = await supabase
      .from('menu_items')
      .insert(menuItem)
      .select()
      .single();

    if (error) {
      console.error('Menu item creation error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Menu item created successfully'
    });

  } catch (error) {
    console.error('Menu item creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update menu item
router.put('/menu/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';
    const updateData = { ...req.body, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (error) {
      console.error('Menu item update error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    res.json({
      success: true,
      data,
      message: 'Menu item updated successfully'
    });

  } catch (error) {
    console.error('Menu item update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete menu item
router.delete('/menu/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';

    const { data, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (error) {
      console.error('Menu item deletion error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Menu item deletion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get vendor settings
router.get('/settings', async (req, res) => {
  try {
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (error) {
      console.error('Vendor settings fetch error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data: vendor || {}
    });

  } catch (error) {
    console.error('Vendor settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update vendor settings
router.put('/settings', async (req, res) => {
  try {
    const vendorId = req.query.vendorId || 'cc39f219-6a6a-4089-b198-ebd30d510e67';
    const settings = { ...req.body, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('vendors')
      .upsert({ id: vendorId, ...settings })
      .select()
      .single();

    if (error) {
      console.error('Vendor settings update error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Vendor settings update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
