const TelegramBot = require('node-telegram-bot-api');
const { findOrCreateUser, User, getStats, getAllUsers, getActiveSubscribers } = require('./database');
const { PLANS, initializePayment } = require('./paystack');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
console.log('🤖 Bot is running...');

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || 0;

function getStatusEmoji(status) {
  switch (status) {
    case 'active': return '✅';
    case 'expired': return '⏰';
    case 'free': return '🆓';
    default: return '❓';
  }
}

// ============ /start COMMAND ============
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await findOrCreateUser(
    msg.from.id,
    msg.from.username,
    msg.from.first_name
  );

  const welcomeMessage = `
🎉 *Welcome to SubBot, ${msg.from.first_name}!*

I'm your subscription management assistant. I help you access premium content through simple and secure payments.

Here's what I can do for you:

📋 /subscribe — View subscription plans
💳 /pay — Make a payment
📊 /status — Check your subscription
🎬 /content — Access premium content
❓ /help — See all commands

Your current status: ${getStatusEmoji(user.subscriptionStatus)} *${user.subscriptionStatus.toUpperCase()}*

Ready to get started? Tap /subscribe to see our plans! 🚀
  `;

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 View Plans', callback_data: 'show_plans' }],
        [{ text: '📊 My Status', callback_data: 'check_status' }],
        [{ text: '❓ Help', callback_data: 'show_help' }]
      ]
    }
  });
});

// ============ /subscribe COMMAND ============
bot.onText(/\/subscribe/, async (msg) => {
  sendPlans(msg.chat.id);
});

function sendPlans(chatId) {
  const plansMessage = `
📋 *Subscription Plans*

Choose the plan that works best for you:

${PLANS.basic.name}
💰 Price: ₦${PLANS.basic.price.toLocaleString()}
⏰ Duration: ${PLANS.basic.duration}
${PLANS.basic.features.join('\n')}

${PLANS.pro.name}
💰 Price: ₦${PLANS.pro.price.toLocaleString()}
⏰ Duration: ${PLANS.pro.duration}
${PLANS.pro.features.join('\n')}

${PLANS.premium.name}
💰 Price: ₦${PLANS.premium.price.toLocaleString()}
⏰ Duration: ${PLANS.premium.duration}
${PLANS.premium.features.join('\n')}

Tap a button below to subscribe! 👇
  `;

  bot.sendMessage(chatId, plansMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: `📦 Basic — ₦${PLANS.basic.price.toLocaleString()}`, callback_data: 'plan_basic' }],
        [{ text: `⭐ Pro — ₦${PLANS.pro.price.toLocaleString()}`, callback_data: 'plan_pro' }],
        [{ text: `👑 Premium — ₦${PLANS.premium.price.toLocaleString()}`, callback_data: 'plan_premium' }]
      ]
    }
  });
}

// ============ /pay COMMAND ============
bot.onText(/\/pay/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '📋 Please select a plan first:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: `📦 Basic — ₦${PLANS.basic.price.toLocaleString()}`, callback_data: 'plan_basic' }],
        [{ text: `⭐ Pro — ₦${PLANS.pro.price.toLocaleString()}`, callback_data: 'plan_pro' }],
        [{ text: `👑 Premium — ₦${PLANS.premium.price.toLocaleString()}`, callback_data: 'plan_premium' }]
      ]
    }
  });
});

// ============ /status COMMAND ============
bot.onText(/\/status/, async (msg) => {
  sendStatus(msg.chat.id, msg.from.id);
});

async function sendStatus(chatId, telegramId) {
  const user = await User.findOne({ telegramId });
  
  if (!user) {
    bot.sendMessage(chatId, '❌ User not found. Please /start the bot first.');
    return;
  }

  let statusMessage = `
📊 *Your Subscription Status*

👤 Name: ${user.firstName}
${getStatusEmoji(user.subscriptionStatus)} Status: *${user.subscriptionStatus.toUpperCase()}*
`;

  if (user.subscriptionStatus === 'active') {
    const daysLeft = Math.ceil((user.subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24));
    statusMessage += `
📦 Plan: *${user.currentPlan.toUpperCase()}*
📅 Expires: ${user.subscriptionExpiry.toDateString()}
⏳ Days Left: *${daysLeft} days*

Enjoy your premium content! Tap /content to access it.
    `;
  } else if (user.subscriptionStatus === 'expired') {
    statusMessage += `
⏰ Your subscription has expired.
Tap /subscribe to renew and get back access! 🔄
    `;
  } else {
    statusMessage += `
You don't have an active subscription yet.
Tap /subscribe to get started! 🚀
    `;
  }

  statusMessage += `\n💳 Total Payments: ${user.payments.length}`;

  bot.sendMessage(chatId, statusMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: user.subscriptionStatus === 'active'
        ? [[{ text: '🎬 Access Content', callback_data: 'get_content' }]]
        : [[{ text: '📋 Subscribe Now', callback_data: 'show_plans' }]]
    }
  });
}

// ============ /content COMMAND ============
bot.onText(/\/content/, async (msg) => {
  sendContent(msg.chat.id, msg.from.id);
});

async function sendContent(chatId, telegramId) {
  const user = await User.findOne({ telegramId });

  if (!user || user.subscriptionStatus !== 'active') {
    bot.sendMessage(chatId, `
🔒 *Premium Content — Locked*

You need an active subscription to access premium content.

Tap /subscribe to get started!
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 View Plans', callback_data: 'show_plans' }]
        ]
      }
    });
    return;
  }

  const contentMessage = `
🎬 *Premium Content*

Welcome back, ${user.firstName}! Here's your exclusive content:

📚 *Latest Content:*

1️⃣ 🎥 Advanced Bot Development Guide
   [Watch Video](https://your-content-link.com/video1)

2️⃣ 📖 Payment Integration Masterclass
   [Read Article](https://your-content-link.com/article1)

3️⃣ 🛠️ Source Code & Templates
   [Download](https://your-content-link.com/download1)

4️⃣ 💡 Weekly Tips & Tricks
   [View Collection](https://your-content-link.com/tips)

5️⃣ 🎯 Exclusive Community Access
   [Join Group](https://t.me/your_private_group)

Your plan: *${user.currentPlan.toUpperCase()}*
Days remaining: *${Math.ceil((user.subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24))}*

New content is added weekly! 🔄
  `;

  bot.sendMessage(chatId, contentMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
}

// ============ /help COMMAND ============
bot.onText(/\/help/, async (msg) => {
  sendHelp(msg.chat.id);
});

function sendHelp(chatId) {
  const helpMessage = `
❓ *Bot Commands*

📋 /start — Start the bot & register
📋 /subscribe — View subscription plans
💳 /pay — Make a payment
📊 /status — Check subscription status
🎬 /content — Access premium content
❓ /help — Show this help message

💬 *Need support?* Contact @DUAL_XXE

🤖 Powered by SubBot
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

// ============ CALLBACK QUERIES ============
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  bot.answerCallbackQuery(query.id);

  if (data === 'show_plans') {
    sendPlans(chatId);
    return;
  }

  if (data === 'check_status') {
    sendStatus(chatId, query.from.id);
    return;
  }

  if (data === 'show_help') {
    sendHelp(chatId);
    return;
  }

  if (data === 'get_content') {
    sendContent(chatId, query.from.id);
    return;
  }

  if (data.startsWith('plan_')) {
    const plan = data.replace('plan_', '');
    const planData = PLANS[plan];

    if (!planData) {
      bot.sendMessage(chatId, '❌ Invalid plan. Please try again.');
      return;
    }

    bot.sendMessage(chatId, `
${planData.name} Selected! ✅

💰 Price: ₦${planData.price.toLocaleString()}
⏰ Duration: ${planData.duration}

To process your payment, please send your *email address*.

📧 Type your email below:
    `, { parse_mode: 'Markdown' });

    pendingPayments.set(query.from.id, plan);
    return;
  }
});

// ============ PENDING PAYMENTS ============
const pendingPayments = new Map();

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  if (pendingPayments.has(telegramId) && msg.text) {
    const email = msg.text.trim();
    const plan = pendingPayments.get(telegramId);

    if (!email.includes('@') || !email.includes('.')) {
      bot.sendMessage(chatId, '❌ That doesn\'t look like a valid email. Please try again:');
      return;
    }

    pendingPayments.delete(telegramId);

    bot.sendMessage(chatId, '⏳ Generating your payment link...');

    const result = await initializePayment(email, plan, telegramId);

    if (result.success) {
      const planData = PLANS[plan];
      bot.sendMessage(chatId, `
💳 *Payment Ready!*

${planData.name}
💰 Amount: ₦${planData.price.toLocaleString()}
📧 Email: ${email}
🔖 Reference: \`${result.reference}\`

Click the button below to complete your payment:
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Pay Now', url: result.authorizationUrl }],
            [{ text: '📋 Choose Different Plan', callback_data: 'show_plans' }]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, `
❌ *Payment Error*

Sorry, we couldn't generate a payment link. Please try again.

Error: ${result.error}

Tap /pay to try again.
      `, { parse_mode: 'Markdown' });
    }
  }
});

// ============ ADMIN COMMANDS ============

bot.onText(/\/stats/, async (msg) => {
  if (msg.from.id.toString() !== ADMIN_ID.toString()) {
    bot.sendMessage(msg.chat.id, '⛔ Admin only command.');
    return;
  }

  const stats = await getStats();

  bot.sendMessage(msg.chat.id, `
📊 *Bot Statistics*

👥 Total Users: *${stats.totalUsers}*
✅ Active Subscribers: *${stats.activeSubscribers}*
⏰ Expired: *${stats.expiredUsers}*
🆓 Free Users: *${stats.freeUsers}*
💰 Total Revenue: *₦${stats.totalRevenue.toLocaleString()}*

Last updated: ${new Date().toLocaleString()}
  `, { parse_mode: 'Markdown' });
});

bot.onText(/\/users/, async (msg) => {
  if (msg.from.id.toString() !== ADMIN_ID.toString()) {
    bot.sendMessage(msg.chat.id, '⛔ Admin only command.');
    return;
  }

  const users = await getAllUsers();
  const userList = users.slice(-20).map((u, i) => {
    return `${i + 1}. ${u.firstName || 'No name'} — ${getStatusEmoji(u.subscriptionStatus)} ${u.subscriptionStatus}`;
  }).join('\n');

  bot.sendMessage(msg.chat.id, `
👥 *Users (Last 20)*

${userList || 'No users yet.'}

Total: ${users.length} users
  `, { parse_mode: 'Markdown' });
});

bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  if (msg.from.id.toString() !== ADMIN_ID.toString()) {
    bot.sendMessage(msg.chat.id, '⛔ Admin only command.');
    return;
  }

  const broadcastText = match[1];
  const users = await getAllUsers();
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await bot.sendMessage(user.telegramId, `
📢 *Announcement*

${broadcastText}
      `, { parse_mode: 'Markdown' });
      sent++;
    } catch (err) {
      failed++;
    }
  }

  bot.sendMessage(msg.chat.id, `
📢 *Broadcast Complete*

✅ Sent: ${sent}
❌ Failed: ${failed}
👥 Total: ${users.length}
  `, { parse_mode: 'Markdown' });
});

module.exports = bot;
