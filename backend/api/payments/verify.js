const crypto = require('crypto');

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
    
    console.log('Payment verification:', {
      paymentId,
      orderId,
      signature,
      expected,
      verified
    });

    return res.status(200).json({ verified });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ 
      error: error.message || 'Payment verification failed'
    });
  }
}