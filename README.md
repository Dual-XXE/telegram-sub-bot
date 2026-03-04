# 🤖 SubBot — Telegram Subscription Management Bot

A production-ready Telegram bot for managing subscriptions, processing payments via Paystack, and delivering premium content to subscribers automatically.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Paystack](https://img.shields.io/badge/Paystack-00C3F7?style=flat&logo=paystack&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=flat&logo=telegram&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)

## 🌐 Live Demo

Bot is live and running 24/7 on Render:
- **Bot:** [@numa_sub_bot](https://t.me/numa_sub_bot)
- **Server:** [telegram-sub-bot-1.onrender.com](https://telegram-sub-bot-1.onrender.com)

---

## 📸 Screenshots

### Welcome & Registration
| /start Command | Subscription Plans |
|:---:|:---:|
| ![Start](https://github.com/user-attachments/assets/8154b198-4bd3-4c54-960a-c127c0d9b7fd) | ![Plans](https://github.com/user-attachments/assets/0dea2620-7048-4c74-b4b5-166be93c781c) |

### Payment Flow
| Plan Selection & Email | Payment Ready |
|:---:|:---:|
| ![Selection](https://github.com/user-attachments/assets/b29cc582-9c60-4909-9e00-01b2c6a85de4) | ![Payment](https://github.com/user-attachments/assets/a23c3e7d-82a7-4276-8ec5-d16b863cd672) |

### Payment Confirmation
| Payment Success | Callback Page |
|:---:|:---:|
| ![Success](https://github.com/user-attachments/assets/b608e9e8-e156-44eb-a8a2-eeeb6ca9e1f3) | ![Callback](https://github.com/user-attachments/assets/3fd73b6e-5869-4a90-8379-fc1fdca0cd06) |

### Subscription Active
| Active Status |
|:---:|
| ![Status](https://github.com/user-attachments/assets/4972054c-6d80-48d8-b26f-5be2f925b148) |

---

## ✨ Features

### User Features
- **Easy Registration** — Automatic user registration on `/start`
- **Subscription Plans** — Three tiers (Basic, Pro, Premium) with different durations
- **Secure Payments** — Paystack integration with automatic payment verification via webhooks
- **Premium Content** — Exclusive content delivery for active subscribers only
- **Status Tracking** — Real-time subscription status with expiry countdown
- **Expiry Notifications** — Automatic warnings before subscription expires

### Admin Features
- **Dashboard Stats** — Total users, active subscribers, revenue tracking
- **User Management** — View all users and their subscription status
- **Broadcast Messages** — Send announcements to all users at once
- **Auto-Expiry** — Scheduled cron job automatically expires overdue subscriptions

### Technical Features
- **Webhook Verification** — Secure Paystack webhook with SHA-512 signature validation
- **Scheduled Tasks** — Hourly expiry checks and daily notification reminders via node-cron
- **Payment Callback Page** — Custom HTML page after successful payment
- **Error Handling** — Comprehensive error handling throughout the application
- **24/7 Deployment** — Hosted on Render with automatic GitHub deploys

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js |
| Bot Framework | node-telegram-bot-api |
| Payment Gateway | Paystack API |
| Database | MongoDB + Mongoose |
| Server | Express.js |
| Scheduler | node-cron |
| HTTP Client | Axios |
| Deployment | Render |

---

## 💳 Payment Flow

```
User taps /subscribe
  → Selects plan (Basic ₦1,000 / Pro ₦2,500 / Premium ₦5,000)
  → Enters email address
  → Bot generates Paystack payment link
  → User completes payment on Paystack checkout
  → Paystack sends webhook to server
  → Server verifies payment with SHA-512 signature
  → Subscription activated in MongoDB
  → User receives confirmation message on Telegram
  → User can now access /content (premium content)
  → Cron job auto-expires subscription after plan duration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB database ([MongoDB Atlas](https://mongodb.com/atlas) free tier)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Paystack account ([Paystack Dashboard](https://dashboard.paystack.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Dual-xxe/telegram-sub-bot.git
cd telegram-sub-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your actual keys

# Start the bot
node index.js
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Telegram bot token from BotFather |
| `MONGODB_URI` | MongoDB connection string |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `PORT` | Server port (default: 3000) |
| `BASE_URL` | Your server URL for webhooks |
| `ADMIN_TELEGRAM_ID` | Your Telegram user ID for admin commands |

---

## 📁 Project Structure

```
telegram-sub-bot/
├── index.js          # Entry point, Express server, webhooks, cron jobs
├── bot.js            # Telegram bot commands and callback handlers
├── database.js       # MongoDB connection, User model, helper functions
├── paystack.js       # Paystack payment initialization and verification
├── package.json      # Dependencies and scripts
├── .env.example      # Environment variables template
├── .gitignore        # Git ignore rules
├── LICENSE           # MIT License
└── README.md         # Documentation
```

---

## 🤖 Bot Commands

| Command | Description | Access |
|---------|-------------|--------|
| `/start` | Register and see welcome message | All users |
| `/subscribe` | View subscription plans | All users |
| `/pay` | Start payment process | All users |
| `/status` | Check subscription status | All users |
| `/content` | Access premium content | Subscribers only |
| `/help` | View all commands | All users |
| `/stats` | View bot statistics | Admin only |
| `/users` | List all users | Admin only |
| `/broadcast [msg]` | Send message to all users | Admin only |

---

## 🔒 Security

- Paystack webhook signature verification (SHA-512 HMAC)
- Environment variables for all sensitive keys
- Input validation on user inputs
- Admin commands restricted by Telegram ID
- No sensitive data stored in code repository

---

## 📄 License

MIT License — feel free to use this project as a starting point for your own subscription bot.

---

## 👨‍💻 Author

**Ahmad** — Full-Stack Developer

- 🌐 Portfolio: [numapremiumai.store](https://numapremiumai.store)
- 💬 Telegram: [@DUAL_XXE](https://t.me/DUAL_XXE)
- 📧 Email: dualization01@gmail.com
- 💻 GitHub: [Dual-xxe](https://github.com/Dual-xxe)
