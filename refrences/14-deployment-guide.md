# NFT Gating Bot - Deployment Guide

*Production deployment instructions for NFT projects*

## 🚀 Quick Deploy

### Prerequisites
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Telegram Group ID where you want to gate access
- SNIP-721 contract deployed on Secret Network
- Node.js 18+ installed
- Basic server/VPS access

---

## 📋 Step-by-Step Deployment

### 1. Create Project Branch
```bash
# Clone the base repository
git clone https://github.com/MrGarbonzo/nftchat.git
cd nftchat

# Create your project-specific branch
git checkout -b project-yourname

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy the environment template
cp .env.example .env

# Edit the configuration file
nano .env
```

**Required Environment Variables:**
```env
# Telegram Bot Configuration
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_NAME=Your NFT Gating Bot
PROJECT_NAME=Your NFT Project

# Telegram Group Configuration
GROUP_ID=-1001234567890
WELCOME_MESSAGE=Welcome! Your NFT ownership has been verified.

# Secret Network Configuration
NETWORK=mainnet
CONTRACT_ADDRESS=secret1your_nft_contract_address
CONTRACT_CODE_HASH=your_contract_code_hash

# Database Configuration
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/bot.db

# Security Configuration
CHALLENGE_EXPIRY_MINUTES=10
RATE_LIMIT_WINDOW_MINUTES=1
RATE_LIMIT_MAX_REQUESTS=5

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# Environment
NODE_ENV=production
```

### 3. Set Up Database
```bash
# Run database migrations
npm run migrate
```

### 4. Test Configuration
```bash
# Verify configuration is valid
node -e "
const { validateConfig } = require('./src/config/config');
try {
  validateConfig();
  console.log('✅ Configuration is valid!');
} catch (error) {
  console.log('❌ Configuration error:', error.message);
  process.exit(1);
}"
```

### 5. Deploy
```bash
# Start the bot
npm start

# Or with auto-restart (recommended for production)
npm install -g pm2
pm2 start src/index.js --name "nft-bot-yourproject"
pm2 save
pm2 startup
```

---

## 🔧 Configuration Details

### Getting Required Values

#### **Bot Token**
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command
3. Follow prompts to create your bot
4. Copy the token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### **Group ID**
1. Add your bot to the Telegram group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Find your group ID in the response (negative number like `-1001234567890`)

#### **Contract Details**
- **Contract Address**: Your deployed SNIP-721 contract address
- **Code Hash**: Use Secret Network explorer or deployment logs
- **Network**: Use `testnet` for testing, `mainnet` for production

### Optional Customization

#### **Custom Messages**
Edit these files for custom branding:
- `src/handlers/commands.js` - Bot responses and help text
- `.env` - Welcome messages and bot name

#### **Security Settings**
```env
# Adjust these based on your needs
CHALLENGE_EXPIRY_MINUTES=10    # How long verification challenges last
RATE_LIMIT_MAX_REQUESTS=5      # Max requests per time window
RATE_LIMIT_WINDOW_MINUTES=1    # Time window for rate limiting
```

---

## 🗄️ Database Options

### SQLite (Default - Simple Setup)
```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/bot.db
```

### PostgreSQL (Recommended for Production)
```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost/nftbot
```

---

## 🔒 Security Considerations

### Required Bot Permissions
Your Telegram bot needs these permissions in the group:
- ✅ **Add new admins** (to manage user access)
- ✅ **Ban users** (to remove access when NFTs are sold)
- ✅ **Delete messages** (optional, for cleanup)

### Environment Security
```bash
# Secure your .env file
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
```

### Firewall Setup
```bash
# Only allow necessary ports
ufw allow 22    # SSH
ufw allow 443   # HTTPS (if using webhooks)
ufw enable
```

---

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check if bot is running
pm2 status

# View logs
pm2 logs nft-bot-yourproject

# Monitor resource usage
pm2 monit
```

### Regular Maintenance
```bash
# Update user verifications (run weekly/monthly)
# This removes users who no longer own NFTs
# Can be automated via cron or done manually in Telegram with /update
```

### Backup Database
```bash
# Backup SQLite database
cp ./data/bot.db ./backups/bot-$(date +%Y%m%d).db

# For PostgreSQL
pg_dump nftbot > backup-$(date +%Y%m%d).sql
```

---

## 🚨 Troubleshooting

### Common Issues

#### **"Missing required configuration" Error**
- Check all required environment variables are set
- Verify `.env` file is in the correct location
- Run the configuration test command

#### **"Invalid signature format" Errors**
- Users must copy the COMPLETE response from Keplr
- Ensure users are connected to Secret Network in Keplr
- Check that contract address and code hash are correct

#### **"No NFTs found" Errors**
- Verify contract address is correct
- Check if contract requires viewing keys
- Test with a known NFT owner wallet

#### **Bot Not Responding**
```bash
# Check bot status
pm2 status

# Check logs for errors
pm2 logs nft-bot-yourproject --lines 50

# Restart if needed
pm2 restart nft-bot-yourproject
```

### Log Locations
- **Application logs**: `./logs/bot.log`
- **Error logs**: `./logs/error.log`
- **PM2 logs**: `~/.pm2/logs/`

---

## 🔄 Updates & Maintenance

### Updating Bot Code
```bash
# Pull latest changes from main branch
git fetch origin
git merge origin/main

# Test configuration still works
npm test

# Restart bot
pm2 restart nft-bot-yourproject
```

### Database Updates
```bash
# Run any new migrations
npm run migrate
```

---

## 🌐 Multiple Projects

### Managing Multiple NFT Projects
Each project should have its own branch and deployment:

```bash
# Project 1
git checkout -b project-cyberpunks
# Configure .env for cyberpunks
pm2 start src/index.js --name "nft-bot-cyberpunks"

# Project 2
git checkout -b project-apes
# Configure .env for apes  
pm2 start src/index.js --name "nft-bot-apes"
```

### Shared Infrastructure
- Use different databases per project
- Different log files per project
- Separate PM2 processes
- Different Telegram groups

---

## 📞 Support

### If You Need Help
1. **Check logs first**: Most issues show up in the logs
2. **Verify configuration**: Run the config test command
3. **Test with known good wallet**: Use a wallet you know owns NFTs
4. **Check Secret Network status**: Ensure network is operational

### Common Commands Reference
```bash
# Start bot
npm start

# Run tests
npm test

# Check configuration
npm run migrate

# View logs
tail -f logs/bot.log

# PM2 management
pm2 start|stop|restart|logs|monit
```

---

*This bot is production-ready and handles all aspects of NFT-gated Telegram access for Secret Network SNIP-721 collections.*