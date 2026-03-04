require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cron = require('node-cron');

const { connectDB, activateSubscription, checkExpiredSubscriptions, User } = require('./database');
const { verifyPayment, PLANS } = require('./paystack');

connectDB();

const bot = require('./bot');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    bot: 'SubBot',
    description: 'Telegram Subscription Bot with Paystack Payments',
    version: '1.0.0'
  });
});

app.post('/webhook/paystack', async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.log('❌ Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log(`📨 Webhook received: ${event.event}`);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata;

      const telegramId = metadata?.telegramId || metadata?.custom_fields?.find(f => f.variable_name === 'telegram_id')?.value;
      const plan = metadata?.plan || metadata?.custom_fields?.find(f => f.variable_name === 'plan')?.value;

      if (!telegramId || !plan) {
        console.log('❌ Missing telegramId or plan in webhook metadata');
        return res.status(200).send('OK');
      }

      const verification = await verifyPayment(reference);
      
      if (verification.success) {
        const amount = data.amount / 100;
        const user = await activateSubscription(
          parseInt(telegramId),
          plan,
          reference,
          amount
        );

        const planData = PLANS[plan];
        bot.sendMessage(parseInt(telegramId), `
🎉 *Payment Successful!*

Your subscription has been activated!

${planData.name}
💰 Amount Paid: ₦${amount.toLocaleString()}
📅 Expires: ${user.subscriptionExpiry.toDateString()}
⏳ Duration: ${planData.duration}
🔖 Reference: \`${reference}\`

Tap /content to access your premium content now! 🚀
        `, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Access Content Now', callback_data: 'get_content' }],
              [{ text: '📊 View Status', callback_data: 'check_status' }]
            ]
          }
        });

        console.log(`✅ Payment processed: ${telegramId} -> ${plan} (₦${amount})`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook Error:', error.message);
    res.status(200).send('OK');
  }
});

app.get('/payment/callback', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Complete</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .card {
          background: white;
          color: #333;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .check { font-size: 64px; margin-bottom: 16px; }
        h1 { color: #27ae60; margin-bottom: 8px; }
        p { color: #666; line-height: 1.6; }
        .btn {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 32px;
          background: #0088cc;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your subscription has been activated. Go back to Telegram to access your premium content.</p>
        <a href="https://t.me/" class="btn">Back to Telegram</a>
      </div>
    </body>
    </html>
  `);
});

cron.schedule('0 * * * *', async () => {
  console.log('⏰ Checking expired subscriptions...');
  await checkExpiredSubscriptions();
});

cron.schedule('0 9 * * *', async () => {
  console.log('📧 Sending expiry warnings...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const expiringUsers = await User.find({
    subscriptionStatus: 'active',
    subscriptionExpiry: {
      $gte: new Date(),
      $lte: tomorrow
    }
  });

  for (const user of expiringUsers) {
    try {
      bot.sendMessage(user.telegramId, `
⚠️ *Subscription Expiring Soon!*

Your subscription expires tomorrow (${user.subscriptionExpiry.toDateString()}).

Renew now to keep your access:
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Renew Now', callback_data: 'show_plans' }]
          ]
        }
      });
    } catch (err) {}
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🤖 SubBot is LIVE!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📨 Webhook: ${process.env.BASE_URL}/webhook/paystack`);
  console.log(`========================================\n`);
});
