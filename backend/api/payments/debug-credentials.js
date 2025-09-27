export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    return res.json({
      key_id_present: !!keyId,
      key_secret_present: !!keySecret,
      key_id_length: keyId ? keyId.length : 0,
      key_secret_length: keySecret ? keySecret.length : 0,
      key_id_preview: keyId ? `${keyId.substring(0, 4)}***${keyId.substring(keyId.length - 4)}` : 'MISSING',
      key_secret_preview: keySecret ? `${keySecret.substring(0, 4)}***${keySecret.substring(keySecret.length - 4)}` : 'MISSING',
      key_id_starts_with_test: keyId ? keyId.startsWith('rzp_test_') : false,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug-credentials:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}