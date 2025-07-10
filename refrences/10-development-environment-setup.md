# Development Environment Setup Guide

*Complete setup instructions for developers using Claude Code*

## Prerequisites Checklist

### Required Software
- [ ] **Node.js** (v18+ recommended) - https://nodejs.org/
- [ ] **Git** - https://git-scm.com/
- [ ] **VSCode** (recommended) - https://code.visualstudio.com/
- [ ] **Keplr Wallet** (for testing) - https://keplr.app/

### Required Accounts & Tokens
- [ ] **Telegram Account** 
- [ ] **Telegram Bot Token** (from @BotFather)
- [ ] **Secret Network Testnet Tokens** (from faucet)
- [ ] **Panthers NFT Contract Details** (address & code hash)

## Step-by-Step Setup

### 1. Create Telegram Bot
```bash
# Message @BotFather on Telegram:
/start
/newbot
# Follow prompts to create bot
# Save the bot token
```

### 2. Set Up Telegram Group
```bash
# 1. Create a new Telegram group
# 2. Add your bot to the group
# 3. Make bot an administrator with these permissions:
#    - Can invite users
#    - Can restrict members
#    - Can delete messages (optional)
# 4. Get the group chat ID (use @userinfobot)
```

### 3. Get Secret Network Testnet Tokens
```bash
# Visit: https://faucet.pulsar.scrttestnet.com/
# Connect Keplr wallet
# Request testnet tokens (SCRT)
```

### 4. Project Initialization
```bash
# Create project directory
mkdir panthers-nft-bot
cd panthers-nft-bot

# Initialize git repository
git init

# Create basic project structure
mkdir -p src/{config,database,services,handlers,utils}
mkdir -p tests/{unit,integration}
mkdir migrations

# Initialize package.json
npm init -y
```

### 5. Install Dependencies
```bash
# Core dependencies
npm install telegraf secretjs @keplr-wallet/cosmos @cosmjs/crypto sqlite3 dotenv

# Development dependencies  
npm install --save-dev nodemon jest eslint prettier

# Optional but recommended
npm install winston express-rate-limit helmet
```

### 6. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values:
# TELEGRAM_BOT_TOKEN=your_bot_token
# TELEGRAM_GROUP_CHAT_ID=your_group_id  
# SECRET_NETWORK_URL=https://api.pulsar.scrttestnet.com
# PANTHERS_CONTRACT_ADDRESS=secret1...
# PANTHERS_CONTRACT_CODE_HASH=abc123...
```

## Development Tools Configuration

### VSCode Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss", 
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-node-debug2"
  ]
}
```

### ESLint Configuration (.eslintrc.js)
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error'
  }
};
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "migrate": "node src/database/migrate.js"
  }
}
```

## Testing Setup

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ]
};
```

### Test Setup File (tests/setup.js)
```javascript
// Global test setup
require('dotenv').config({ path: '.env.test' });

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Test database setup
beforeEach(() => {
  // Clear test database
});

afterEach(() => {
  // Cleanup after tests
});
```

## Development Workflow

### 1. Start Development Server
```bash
# Terminal 1: Start the bot in development mode
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Lint and format on save
npm run lint:fix && npm run format
```

### 2. Testing Checklist
```bash
# Before committing code:
- [ ] npm run lint (no errors)
- [ ] npm run test (all tests pass)
- [ ] npm run format (code formatted)
- [ ] Test basic bot commands manually
- [ ] Verify environment variables are set
```

### 3. Git Workflow
```bash
# Create feature branch
git checkout -b feature/verification-system

# Commit changes
git add .
git commit -m "feat: add signature verification"

# Push to remote
git push origin feature/verification-system
```

## Database Setup

### Development Database (SQLite)
```bash
# Database will be created automatically on first run
# Located at: ./panthers.db (as per .env)

# Run migrations
npm run migrate

# Verify database
sqlite3 panthers.db ".tables"
```

### Production Database (PostgreSQL)
```bash
# Install PostgreSQL
# Ubuntu: sudo apt install postgresql
# macOS: brew install postgresql
# Windows: Download from postgresql.org

# Create database
createdb panthers_nft_bot

# Update .env for production:
# DATABASE_URL=postgresql://user:password@localhost/panthers_nft_bot
# DATABASE_TYPE=postgresql
```

## Debugging Setup

### VSCode Debug Configuration (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Bot",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging Setup
```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

## Troubleshooting Common Issues

### Bot Token Issues
```bash
# Test bot token validity:
curl -X GET "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"

# Should return bot information if token is valid
```

### Secret Network Connection Issues
```bash
# Test Secret Network connection:
curl https://api.pulsar.scrttestnet.com/node_info

# Should return network information
```

### Keplr Integration Issues
```javascript
// Test signature verification:
const { verifyADR36Amino } = require('@keplr-wallet/cosmos');

// Test with known good signature
const isValid = verifyADR36Amino(
  'secret',
  'test message', 
  testSignature,
  testPublicKey
);
console.log('Signature valid:', isValid);
```

### Database Connection Issues
```bash
# SQLite: Check file permissions and path
ls -la panthers.db

# PostgreSQL: Test connection
psql postgresql://user:password@localhost/panthers_nft_bot -c "SELECT 1;"
```

## Production Deployment Checklist

### Security
- [ ] All secrets in environment variables (not code)
- [ ] Database connection encrypted
- [ ] Rate limiting implemented
- [ ] Input validation on all user inputs
- [ ] Error messages don't leak sensitive info

### Performance  
- [ ] Database indexes created
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Memory usage monitored

### Monitoring
- [ ] Application logging configured
- [ ] Error tracking setup (e.g., Sentry)
- [ ] Health check endpoints
- [ ] Uptime monitoring

### Backup & Recovery
- [ ] Database backup strategy
- [ ] Configuration backup
- [ ] Deployment rollback plan
- [ ] Data recovery procedures

This setup guide provides everything needed to get a development environment running quickly and efficiently for Claude Code to implement the Panthers NFT bot.
