# Technical Specifications & Constants

*Exact technical details, addresses, and constants for implementation*

## Secret Network Configuration

### Network Details
```javascript
const NETWORKS = {
  MAINNET: {
    chainId: 'secret-4',
    lcd: 'https://lcd.secret.express',
    rpc: 'https://rpc.secret.express',
    alternative_lcd: 'https://1rpc.io/scrt-lcd'
  },
  TESTNET: {
    chainId: 'pulsar-3', 
    lcd: 'https://api.pulsar.scrttestnet.com',
    rpc: 'https://rpc.pulsar.scrttestnet.com'
  }
};
```

### Address Formats
```javascript
const ADDRESS_PATTERNS = {
  SECRET_ADDRESS: /^secret1[a-z0-9]{38}$/,
  CONTRACT_CODE_HASH: /^[a-f0-9]{64}$/,
  TELEGRAM_USER_ID: /^[0-9]+$/
};
```

## Panthers NFT Contract Specifications

### Contract Interface
```javascript
// PLACEHOLDER - Update with actual contract details when deployed
const PANTHERS_CONTRACT = {
  address: 'secret1...', // To be updated with actual contract address
  codeHash: 'abc123...', // To be updated with actual code hash
  name: 'Panthers NFT',
  symbol: 'PANTHER'
};

// Expected contract configuration
const EXPECTED_CONFIG = {
  public_token_supply: true,    // Bot can see total supply
  public_owner: false,          // Ownership private by default  
  enable_sealed_metadata: false, // No sealed metadata needed
  enable_burn: false,           // Burning not required
  minter_may_update_metadata: true,
  owner_may_update_metadata: false
};
```

### Query Messages
```javascript
const QUERY_MESSAGES = {
  GET_USER_TOKENS: (walletAddress, viewingKey = null) => ({
    tokens: {
      owner: walletAddress,
      limit: 1000,
      ...(viewingKey && { viewing_key: viewingKey })
    }
  }),
  
  GET_TOKEN_OWNER: (tokenId, walletAddress = null, viewingKey = null) => ({
    owner_of: {
      token_id: tokenId,
      ...(walletAddress && viewingKey && {
        viewer: {
          address: walletAddress,
          viewing_key: viewingKey
        }
      })
    }
  }),
  
  GET_CONTRACT_CONFIG: () => ({
    contract_config: {}
  }),
  
  GET_TOKEN_COUNT: () => ({
    num_tokens: {}
  })
};
```

## Telegram Bot Configuration

### Bot Commands
```javascript
const BOT_COMMANDS = [
  { command: 'start', description: 'Welcome message and instructions' },
  { command: 'help', description: 'Show detailed help and guidance' },
  { command: 'verify', description: 'Verify your Panthers NFT ownership' },
  { command: 'status', description: 'Check your verification status' },
  { command: 'update', description: 'Refresh all user verifications' }
];
```

### Message Templates
```javascript
const MESSAGES = {
  WELCOME: `🐆 Welcome to Panthers NFT Community!

To access our exclusive Telegram group, you need to verify ownership of a Panthers NFT.

Use /verify to start the verification process.
Use /help for detailed instructions.`,

  VERIFICATION_INSTRUCTIONS: (challenge) => `🔐 VERIFICATION STEPS:

1. Copy this exact message (including quotes):
"${challenge}"

2. Open your Keplr wallet
3. Go to "Sign" → "Sign Arbitrary Data"
4. Make sure "Secret Network" is selected
5. Paste the message and sign it
6. Copy the signature and send it back here

⏰ This challenge expires in 15 minutes.

Need help? Use /help for detailed guidance.`,

  VERIFICATION_SUCCESS: (walletAddress, tokenCount) => `✅ Verification Successful!

Wallet: ${walletAddress}
Panthers NFTs: ${tokenCount}

You've been added to the exclusive Panthers community group! Welcome aboard! 🐆`,

  VERIFICATION_FAILED: (reason) => `❌ Verification Failed

${reason}

Please try again with /verify or contact support if you need help.`,

  STATUS_VERIFIED: (walletAddress, verificationDate, tokenCount) => `✅ Verification Status: VERIFIED

Wallet: ${walletAddress}
Verified: ${verificationDate}
Panthers NFTs: ${tokenCount}
Access: Active`,

  STATUS_NOT_VERIFIED: `❌ Verification Status: NOT VERIFIED

You haven't verified your Panthers NFT ownership yet.
Use /verify to start the verification process.`,

  UPDATE_STARTED: `🔄 Starting verification update for all users...

This may take a few minutes. I'll let you know when it's complete.`,

  UPDATE_COMPLETED: (checked, removed) => `✅ Update Complete!

Users checked: ${checked}
Access removed: ${removed}

All verifications are now up to date.`
};
```

## Keplr Integration Specifications

### Signature Verification
```javascript
const SIGNATURE_CONFIG = {
  CHAIN_PREFIX: 'secret',
  SIGNATURE_TYPE: 'amino',
  HASH_ALGORITHM: 'sha256'
};

const CHALLENGE_CONFIG = {
  EXPIRY_MINUTES: 15,
  MIN_ENTROPY_BYTES: 16,
  INCLUDE_TIMESTAMP: true,
  INCLUDE_USER_ID: true
};
```

### Challenge Message Format
```javascript
const generateChallengeMessage = (telegramUserId, timestamp, entropy) => {
  return `Panthers NFT Verification Challenge

User ID: ${telegramUserId}
Timestamp: ${timestamp}
Random: ${entropy}

By signing this message, you verify ownership of your Panthers NFT for Telegram group access.`;
};
```

## Database Schema Details

### Table Definitions
```sql
-- Production schema with indexes and constraints
CREATE TABLE verified_users (
    telegram_user_id BIGINT PRIMARY KEY,
    telegram_username VARCHAR(255),
    wallet_address VARCHAR(45) NOT NULL,
    verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    token_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_wallet UNIQUE(wallet_address),
    CONSTRAINT valid_wallet_format CHECK(wallet_address LIKE 'secret1%'),
    CONSTRAINT positive_token_count CHECK(token_count >= 0)
);

CREATE INDEX idx_wallet_address ON verified_users(wallet_address);
CREATE INDEX idx_verification_date ON verified_users(verification_date);
CREATE INDEX idx_last_checked ON verified_users(last_checked_date);
CREATE INDEX idx_is_active ON verified_users(is_active);

-- Optional: Audit log table for tracking changes
CREATE TABLE verification_log (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'VERIFIED', 'REMOVED', 'UPDATED'
    wallet_address VARCHAR(45),
    token_count INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);
```

## Rate Limiting & Performance

### Rate Limits
```javascript
const RATE_LIMITS = {
  VERIFICATION_ATTEMPTS: {
    max: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many verification attempts. Please wait 15 minutes.'
  },
  
  SECRET_NETWORK_QUERIES: {
    max: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded for blockchain queries.'
  },
  
  UPDATE_COMMAND: {
    max: 1,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'Update command can only be used once every 5 minutes.'
  }
};
```

### Cache Configuration
```javascript
const CACHE_CONFIG = {
  NFT_OWNERSHIP: {
    duration: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
  },
  
  CONTRACT_CONFIG: {
    duration: 60 * 60 * 1000, // 1 hour
    maxSize: 1
  },
  
  CHALLENGE_STORE: {
    duration: 15 * 60 * 1000, // 15 minutes
    maxSize: 500
  }
};
```

## Error Codes & HTTP Status Mapping

### Application Error Codes
```javascript
const ERROR_CODES = {
  // Validation Errors (4xx equivalent)
  INVALID_SIGNATURE: 'E001',
  INVALID_WALLET_ADDRESS: 'E002', 
  CHALLENGE_EXPIRED: 'E003',
  ALREADY_VERIFIED: 'E004',
  NO_NFT_FOUND: 'E005',
  
  // Network Errors (5xx equivalent)
  SECRET_NETWORK_ERROR: 'E101',
  DATABASE_ERROR: 'E102',
  TELEGRAM_API_ERROR: 'E103',
  
  // Authentication Errors
  VIEWING_KEY_REQUIRED: 'E201',
  INVALID_VIEWING_KEY: 'E202',
  UNAUTHORIZED_ACCESS: 'E203',
  
  // System Errors
  CONFIGURATION_ERROR: 'E301',
  RATE_LIMIT_EXCEEDED: 'E302',
  INTERNAL_ERROR: 'E999'
};
```

## Security Configuration

### Cryptographic Settings
```javascript
const SECURITY_CONFIG = {
  SIGNATURE_ALGORITHMS: ['secp256k1'],
  HASH_FUNCTIONS: ['sha256'],
  ENCODING: 'base64',
  
  // Challenge generation
  ENTROPY_SOURCES: ['crypto.randomBytes', 'timestamp', 'user_id'],
  MIN_CHALLENGE_LENGTH: 100,
  MAX_CHALLENGE_LENGTH: 500,
  
  // Database encryption (if implemented)
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_DERIVATION: 'pbkdf2'
};
```

## Monitoring & Health Checks

### Health Check Endpoints
```javascript
const HEALTH_CHECKS = {
  DATABASE: 'SELECT 1',
  SECRET_NETWORK: 'GET /node_info',
  TELEGRAM_API: 'GET /getMe',
  
  THRESHOLDS: {
    RESPONSE_TIME_MS: 5000,
    ERROR_RATE_PERCENT: 5,
    UPTIME_PERCENT: 99
  }
};
```

### Metrics to Track
```javascript
const METRICS = {
  COUNTERS: [
    'verification_attempts_total',
    'verification_success_total', 
    'verification_failures_total',
    'nft_queries_total',
    'telegram_messages_total'
  ],
  
  HISTOGRAMS: [
    'verification_duration_seconds',
    'nft_query_duration_seconds',
    'database_query_duration_seconds'
  ],
  
  GAUGES: [
    'verified_users_count',
    'active_telegram_sessions',
    'pending_challenges_count'
  ]
};
```

This specifications file provides Claude Code with:
- ✅ **Exact network configurations** and endpoints
- ✅ **Complete message templates** for user interactions  
- ✅ **Database schema** with constraints and indexes
- ✅ **Rate limiting configurations** for production
- ✅ **Error codes** for consistent error handling
- ✅ **Security settings** for cryptographic operations
- ✅ **Monitoring specifications** for production deployment

All constants and configurations are clearly defined and ready for implementation.
