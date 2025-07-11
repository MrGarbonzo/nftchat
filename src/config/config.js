require('dotenv').config({ quiet: true });

const config = {
  telegram: {
    botToken: process.env.BOT_TOKEN,
    botName: process.env.BOT_NAME || 'NFT Gating Bot',
    projectName: process.env.PROJECT_NAME || 'NFT Project',
    groupId: process.env.GROUP_ID,
    welcomeMessage: process.env.WELCOME_MESSAGE || 'Welcome! Your NFT ownership has been verified.'
  },
  
  secretNetwork: {
    network: process.env.NETWORK || 'testnet',
    contractAddress: process.env.CONTRACT_ADDRESS,
    contractCodeHash: process.env.CONTRACT_CODE_HASH,
    
    networks: {
      mainnet: {
        chainId: 'secret-4',
        lcd: 'https://lcd.secret.express',
        rpc: 'https://rpc.secret.express',
      },
      testnet: {
        chainId: 'pulsar-3',
        lcd: 'https://api.pulsar.scrttestnet.com',
        rpc: 'https://rpc.pulsar.scrttestnet.com'
      }
    }
  },
  
  database: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    path: process.env.DATABASE_PATH || './data/bot.db'
  },
  
  security: {
    challengeExpiryMinutes: parseInt(process.env.CHALLENGE_EXPIRY_MINUTES) || 10,
    rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 1,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/bot.log'
  },
  
  environment: process.env.NODE_ENV || 'development'
};

function validateConfig() {
  const required = [
    'telegram.botToken',
    'telegram.groupId',
    'secretNetwork.contractAddress',
    'secretNetwork.contractCodeHash'
  ];
  
  const missing = [];
  for (const path of required) {
    const keys = path.split('.');
    let value = config;
    for (const key of keys) {
      value = value[key];
    }
    if (!value) {
      missing.push(path);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

module.exports = { config, validateConfig };