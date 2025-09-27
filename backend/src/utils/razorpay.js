const Razorpay = require('razorpay');

let razorpay = null;

function initializeRazorpay() {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables');
    }

    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// Export both the instance getter and the initialization function
module.exports = {
  get instance() {
    return initializeRazorpay();
  },
  orders: {
    create: function(options) {
      return initializeRazorpay().orders.create(options);
    }
  },
  payments: {
    fetch: function(paymentId) {
      return initializeRazorpay().payments.fetch(paymentId);
    }
  }
};


