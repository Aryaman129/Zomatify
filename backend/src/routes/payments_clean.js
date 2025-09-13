const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const razorpay = require('../utils/razorpay');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a new Razorpay order
router.post('/order', async (req, res) => {
  try {
    const { amount, orderReference, currency = 'INR' } = req.body || {};

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: orderReference || `order_${Date.now()}`,
      notes: req.body?.notes || {}
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: error.message || 'Failed to create Razorpay order' });
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

module.exports = router;
