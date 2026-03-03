const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    default: ''
  },
  firstName: {
    type: String,
    default: ''
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'active', 'expired'],
    default: 'free'
  },
  currentPlan: {
    type: String,
    enum: ['none', 'basic', 'pro', 'premium'],
    default: 'none'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  payments: [{
    reference: String,
    amount: Number,
    plan: String,
    status: String,
    date: { type: Date, default: Date.now }
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

async function findOrCreateUser(telegramId, username, firstName) {
  let user = await User.findOne({ telegramId });
  if (!user) {
    user = await User.create({
      telegramId,
      username: username || '',
      firstName: firstName || ''
    });
    console.log(`👤 New user registered: ${firstName} (${telegramId})`);
  }
  return user;
}

async function activateSubscription(telegramId, plan, reference, amount) {
  const daysMap = { basic: 7, pro: 30, premium: 90 };
  const days = daysMap[plan] || 30;
  
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);

  const user = await User.findOneAndUpdate(
    { telegramId },
    {
      subscriptionStatus: 'active',
      currentPlan: plan,
      subscriptionExpiry: expiry,
      $push: {
        payments: {
          reference,
          amount,
          plan,
          status: 'success',
          date: new Date()
        }
      }
    },
    { new: true }
  );
  
  console.log(`💳 Subscription activated: ${telegramId} -> ${plan} (expires: ${expiry.toDateString()})`);
  return user;
}

async function checkExpiredSubscriptions() {
  const now = new Date();
  const result = await User.updateMany(
    {
      subscriptionStatus: 'active',
      subscriptionExpiry: { $lte: now }
    },
    {
      subscriptionStatus: 'expired',
      currentPlan: 'none'
    }
  );
  if (result.modifiedCount > 0) {
    console.log(`⏰ Expired ${result.modifiedCount} subscriptions`);
  }
  return result;
}

async function getStats() {
  const totalUsers = await User.countDocuments();
  const activeSubscribers = await User.countDocuments({ subscriptionStatus: 'active' });
  const expiredUsers = await User.countDocuments({ subscriptionStatus: 'expired' });
  const freeUsers = await User.countDocuments({ subscriptionStatus: 'free' });
  
  const revenueResult = await User.aggregate([
    { $unwind: '$payments' },
    { $match: { 'payments.status': 'success' } },
    { $group: { _id: null, total: { $sum: '$payments.amount' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  return { totalUsers, activeSubscribers, expiredUsers, freeUsers, totalRevenue };
}

async function getAllUsers() {
  return await User.find({}, 'telegramId firstName subscriptionStatus');
}

async function getActiveSubscribers() {
  return await User.find({ subscriptionStatus: 'active' });
}

module.exports = {
  connectDB,
  User,
  findOrCreateUser,
  activateSubscription,
  checkExpiredSubscriptions,
  getStats,
  getAllUsers,
  getActiveSubscribers
};
