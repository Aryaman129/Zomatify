const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const razorpay = require('../utils/razorpay');

// Debug: Log environment variables
console.log('🔍 Payments route - Environment variables:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');

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

console.log('✅ Payments route - Supabase client initialized successfully');

// Debug endpoint to check actual credential values (masked)
router.get('/debug-credentials', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  return res.json({
    key_id_present: !!keyId,
    key_secret_present: !!keySecret,
    key_id_length: keyId ? keyId.length : 0,
    key_secret_length: keySecret ? keySecret.length : 0,
    key_id_preview: keyId ? `${keyId.substring(0, 4)}***${keyId.substring(keyId.length - 4)}` : 'MISSING',
    key_secret_preview: keySecret ? `${keySecret.substring(0, 4)}***${keySecret.substring(keySecret.length - 4)}` : 'MISSING',
    key_id_starts_with_test: keyId ? keyId.startsWith('rzp_test_') : false
  });
});

// Test Razorpay credentials directly
router.get('/test-credentials', async (req, res) => {
  try {
    const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: `test_${Date.now()}`
      })
    });
    
    const data = await response.json();
    
    return res.json({
      status: response.status,
      success: response.ok,
      data: data,
      credentials_test: 'Direct API call'
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Test Razorpay API connectivity
router.get('/test-api', async (req, res) => {
  try {
    const testRazorpay = require('../utils/razorpay');
    
    // Try to create a test order with minimum amount
    const options = {
      amount: 100, // ₹1.00
      currency: 'INR',
      receipt: `test_${Date.now()}`,
    };
    
    console.log('Testing Razorpay order creation with options:', options);
    const order = await testRazorpay.orders.create(options);
    
    return res.json({
      status: 'success',
      message: 'Razorpay API test successful',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay API test failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error stringified:', JSON.stringify(error, null, 2));
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Unknown error',
      description: error.description || 'No description',
      field: error.field || 'No field',
      source: error.source || 'No source',
      step: error.step || 'No step',
      reason: error.reason || 'No reason',
      code: error.code || 'No code',
      statusCode: error.statusCode || 'No status code',
      errorString: String(error)
    });
  }
});

// Test Razorpay initialization
router.get('/test-init', async (req, res) => {
  try {
    const testRazorpay = require('../utils/razorpay');
    const instance = testRazorpay.instance;
    return res.json({
      status: 'success',
      message: 'Razorpay initialized successfully',
      keyId: process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint to check environment variables
router.get('/debug', (req, res) => {
  return res.json({
    razorpay_key_id: process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing',
    razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing',
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Create a new Razorpay order
router.post('/order', async (req, res) => {
  try {
    const { amount, orderReference, currency = 'INR' } = req.body || {};
    
    console.log('Payment order request:', { amount, orderReference, currency });

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: orderReference || `order_${Date.now()}`,
      notes: req.body?.notes || {}
    };
    
    console.log('Razorpay order options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('Razorpay order created:', order);

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    return res.status(500).json({ 
      error: error.message || 'Failed to create Razorpay order',
      details: error.type || 'Unknown error'
    });
  }
});

// Verify Razorpay payment signature
router.post('/verify', async (req, res) => {
  try {
    const { paymentId, orderId, signature } = req.body || {};

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({ error: 'Missing verification parameters' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Missing Razorpay secret' });
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${orderId}|${paymentId}`);
    const expected = hmac.digest('hex');

    const verified = expected === signature;
    return res.status(200).json({ verified });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

// Vendor payment distribution endpoint
router.post('/distribute-vendor-payment', async (req, res) => {
  try {
    const { orderId, vendorId, razorpayPaymentId, amount } = req.body;

    if (!orderId || !vendorId || !razorpayPaymentId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get vendor UPI details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('upi_id, business_name, payment_details')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor?.upi_id) {
      return res.status(404).json({
        success: false,
        error: 'Vendor UPI ID not found'
      });
    }

    // Calculate platform fee (5%)
    const platformFee = (amount * 5) / 100;
    const vendorAmount = amount - platformFee;

    // Create payment distribution record
    const { data: distribution, error: distributionError } = await supabase
      .from('vendor_payment_distributions')
      .insert({
        order_id: orderId,
        vendor_id: vendorId,
        razorpay_payment_id: razorpayPaymentId,
        vendor_upi_id: vendor.upi_id,
        amount: amount,
        platform_fee: platformFee,
        vendor_amount: vendorAmount,
        transfer_status: 'pending'
      })
      .select()
      .single();

    if (distributionError) {
      throw distributionError;
    }

    // In a real implementation, you would use Razorpay's Transfer API here
    // For now, we'll simulate the transfer process

    // Simulate transfer to vendor UPI
    try {
      // This is where you would call Razorpay Transfer API
      // const transferResponse = await razorpay.transfers.create({
      //   account: vendor.razorpay_account_id,
      //   amount: vendorAmount * 100, // Amount in paisa
      //   currency: 'INR',
      //   notes: {
      //     order_id: orderId,
      //     vendor_id: vendorId
      //   }
      // });

      // For demo purposes, mark as completed
      await supabase
        .from('vendor_payment_distributions')
        .update({
          transfer_status: 'completed',
          transferred_at: new Date().toISOString(),
          transfer_response: {
            simulated: true,
            vendor_upi: vendor.upi_id,
            amount: vendorAmount,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', distribution.id);

      res.json({
        success: true,
        data: {
          distribution_id: distribution.id,
          vendor_amount: vendorAmount,
          platform_fee: platformFee,
          transfer_status: 'completed',
          vendor_upi: vendor.upi_id
        }
      });

    } catch (transferError) {
      // Mark transfer as failed
      await supabase
        .from('vendor_payment_distributions')
        .update({
          transfer_status: 'failed',
          transfer_response: {
            error: transferError.message,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', distribution.id);

      res.status(500).json({
        success: false,
        error: 'Transfer to vendor failed',
        details: transferError.message
      });
    }

  } catch (error) {
    console.error('Vendor payment distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Webhook endpoint for Razorpay payment confirmations
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!secret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    // Handle payment success
    if (event === 'payment.captured') {
      // Update order status in database
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: paymentEntity.id,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', paymentEntity.order_id);

      console.log('Payment captured:', paymentEntity.id);
    }

    // Handle payment failure
    if (event === 'payment.failed') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', paymentEntity.order_id);

      console.log('Payment failed:', paymentEntity.id);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Process refund for cancelled orders
router.post('/refund', async (req, res) => {
  try {
    const { paymentId, orderId, amount, reason = 'Order cancelled by vendor' } = req.body;

    if (!paymentId || !orderId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment ID and Order ID are required' 
      });
    }

    // Fetch payment details from Razorpay to validate
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (!payment || payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        error: 'Payment not found or not eligible for refund'
      });
    }

    // Calculate refund amount (use payment amount if not specified)
    const refundAmount = amount || payment.amount;

    // Create refund via Razorpay API
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundAmount,
      notes: {
        reason,
        order_id: orderId,
        refund_type: 'vendor_cancellation'
      }
    });

    // Update order payment status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        refund_id: refund.id,
        refund_amount: refundAmount / 100, // Convert back to rupees
        refund_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Database update error after refund:', updateError);
      // Note: Refund was processed but database wasn't updated
    }

    console.log(`Refund processed: ${refund.id} for order ${orderId}`);

    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount / 100,
        status: refund.status,
        order_id: orderId,
        payment_id: paymentId
      },
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process refund' 
    });
  }
});

module.exports = router;
