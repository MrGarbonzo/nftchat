# Code Implementation Templates

*Ready-to-use code structure templates for faster development*

## Project Structure Template

```
panthers-nft-bot/
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── index.js                 # Main entry point
│   ├── config/
│   │   └── config.js           # Environment configuration
│   ├── database/
│   │   ├── connection.js       # Database setup
│   │   ├── migrations/         # SQL migrations
│   │   └── models.js          # Database models/queries
│   ├── services/
│   │   ├── secretNetwork.js   # Secret Network client
│   │   ├── telegramBot.js     # Telegram bot setup
│   │   └── verification.js    # Verification logic
│   ├── handlers/
│   │   ├── commands.js        # Bot command handlers
│   │   └── middleware.js      # Bot middleware
│   └── utils/
│       ├── crypto.js          # Signature verification
│       ├── logger.js          # Logging utility
│       └── helpers.js         # General utilities
└── tests/
    ├── unit/
    └── integration/
```

## Package.json Template

```json
{
  "name": "panthers-nft-bot",
  "version": "1.0.0",
  "description": "Telegram bot for Panthers NFT gated access",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "lint": "eslint src/",
    "migrate": "node src/database/migrate.js"
  },
  "dependencies": {
    "telegraf": "^4.12.2",
    "secretjs": "^1.12.1",
    "@keplr-wallet/cosmos": "^0.12.29",
    "@cosmjs/crypto": "^0.31.3",
    "sqlite3": "^5.1.6",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "eslint": "^8.45.0"
  }
}
```

## Environment Variables Template (.env.example)

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_GROUP_CHAT_ID=your_group_chat_id_here

# Secret Network Configuration
SECRET_NETWORK_URL=https://lcd.secret.express
SECRET_NETWORK_CHAIN_ID=secret-4
PANTHERS_CONTRACT_ADDRESS=secret1...
PANTHERS_CONTRACT_CODE_HASH=abc123...

# Database Configuration
DATABASE_URL=./panthers.db
DATABASE_TYPE=sqlite

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
CHALLENGE_EXPIRY_MINUTES=15
CACHE_DURATION_MINUTES=5

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

## Database Migration Template

```sql
-- migrations/001_create_verified_users.sql
CREATE TABLE IF NOT EXISTS verified_users (
    telegram_user_id BIGINT PRIMARY KEY,
    wallet_address VARCHAR(45) NOT NULL UNIQUE,
    verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_address ON verified_users(wallet_address);
CREATE INDEX idx_verification_date ON verified_users(verification_date);
```

## Error Handling Template

```javascript
// Standard error response format
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR', 
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

const ErrorMessages = {
  INVALID_SIGNATURE: 'Invalid signature provided. Please try signing again.',
  NO_NFT_FOUND: 'No Panthers NFT found in your wallet.',
  NETWORK_UNAVAILABLE: 'Secret Network is temporarily unavailable. Please try again.',
  ALREADY_VERIFIED: 'This wallet is already verified with another account.',
  CHALLENGE_EXPIRED: 'Verification challenge has expired. Please start over.',
  BOT_PERMISSIONS: 'Bot lacks permissions to manage the group. Please contact admin.'
};
```

## API Response Template

```javascript
// Standard API response format
const createResponse = (success, data = null, error = null, message = null) => {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  };
};

// Success response
const successResponse = (data, message = 'Success') => {
  return createResponse(true, data, null, message);
};

// Error response  
const errorResponse = (error, message = 'An error occurred') => {
  return createResponse(false, null, error, message);
};
```

## Testing Template Structure

```javascript
// Test file template
describe('Verification Service', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('verifyNFTOwnership', () => {
    test('should return true for valid NFT owner', async () => {
      // Test implementation
    });

    test('should return false for non-owner', async () => {
      // Test implementation
    });

    test('should handle network errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

## Logging Configuration Template

```javascript
// Logger levels and format
const LogLevels = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug'
};

const LogCategories = {
  BOT: 'BOT',
  DATABASE: 'DATABASE', 
  VERIFICATION: 'VERIFICATION',
  SECRET_NETWORK: 'SECRET_NETWORK',
  SECURITY: 'SECURITY'
};
```

## Configuration Validation Template

```javascript
// Required environment variables
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'SECRET_NETWORK_URL',
  'PANTHERS_CONTRACT_ADDRESS',
  'PANTHERS_CONTRACT_CODE_HASH',
  'DATABASE_URL'
];

// Validation function template
function validateConfig() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## Common Function Signatures

```javascript
// Database functions
async function addVerifiedUser(telegramUserId, walletAddress)
async function getVerifiedUser(telegramUserId)
async function getAllVerifiedUsers()
async function removeVerifiedUser(telegramUserId)
async function updateLastChecked(telegramUserId)

// Secret Network functions
async function verifyNFTOwnership(walletAddress)
async function getUserTokens(walletAddress)
async function getContractConfig()

// Verification functions
async function generateChallenge(telegramUserId)
async function verifySignature(challenge, signature, publicKey)
async function extractWalletAddress(signature, publicKey)

// Bot functions
async function sendVerificationInstructions(ctx, challenge)
async function handleVerificationSuccess(ctx, walletAddress)
async function handleVerificationFailure(ctx, error)
async function inviteToGroup(telegramUserId)
async function removeFromGroup(telegramUserId)
```

## Git Configuration Template

```gitignore
# .gitignore
node_modules/
.env
*.log
.DS_Store
*.db
.nyc_output/
coverage/
dist/
build/
```

This template file provides Claude Code with:
- ✅ **Complete project structure** to follow
- ✅ **Package.json with exact dependencies** needed
- ✅ **Environment variable template** with all required configs
- ✅ **Database schema** ready to implement
- ✅ **Error handling patterns** for consistent responses
- ✅ **Function signatures** for all major components
- ✅ **Testing structure** to guide test implementation

Would you like me to create any additional template files or add more specific implementation details?

