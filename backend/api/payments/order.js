const Razorpay = require('razorpay');

// Initialize Razorpay instance
function initializeRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, orderReference, currency = 'INR' } = req.body || {};
    
    console.log('Payment order request:', { amount, orderReference, currency });

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const razorpay = initializeRazorpay();

    const options = {
      amount: Math.round(Number(amount) * 100), // Convert to paise
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
}