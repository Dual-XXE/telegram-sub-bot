const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = process.env.BASE_URL;

const PLANS = {
  basic: {
    name: '📦 Basic Plan',
    price: 1000,
    priceKobo: 100000,
    duration: '7 days',
    features: [
      '✅ Access to basic content',
      '✅ 7 days access',
      '✅ Email support'
    ]
  },
  pro: {
    name: '⭐ Pro Plan',
    price: 2500,
    priceKobo: 250000,
    duration: '30 days',
    features: [
      '✅ Access to ALL content',
      '✅ 30 days access',
      '✅ Priority support',
      '✅ Exclusive updates'
    ]
  },
  premium: {
    name: '👑 Premium Plan',
    price: 5000,
    priceKobo: 500000,
    duration: '90 days',
    features: [
      '✅ Access to ALL content',
      '✅ 90 days access',
      '✅ VIP support',
      '✅ Exclusive updates',
      '✅ Early access to new features',
      '✅ 1-on-1 consultation'
    ]
  }
};

async function initializePayment(email, plan, telegramId) {
  try {
    const planData = PLANS[plan];
    if (!planData) {
      throw new Error('Invalid plan selected');
    }

    const reference = `SUB_${telegramId}_${plan}_${Date.now()}`;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        amount: planData.priceKobo,
        reference: reference,
        callback_url: `${BASE_URL}/payment/callback`,
        metadata: {
          telegramId: telegramId,
          plan: plan,
          custom_fields: [
            {
              display_name: 'Telegram ID',
              variable_name: 'telegram_id',
              value: telegramId.toString()
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: plan
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status) {
      console.log(`💰 Payment initialized: ${reference}`);
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference
      };
    } else {
      throw new Error('Payment initialization failed');
    }
  } catch (error) {
    console.error('❌ Payment Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifyPayment(reference) {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      console.log(`✅ Payment verified: ${reference}`);
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        error: 'Payment not successful'
      };
    }
  } catch (error) {
    console.error('❌ Verification Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  PLANS,
  initializePayment,
  verifyPayment
};
