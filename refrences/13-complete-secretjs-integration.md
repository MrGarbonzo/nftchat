# Complete SecretJS Integration Guide

*Official SecretJS API documentation for Panthers NFT bot development*

## SecretJS Overview

SecretJS is the JavaScript SDK for interacting with Secret Network blockchain, written in TypeScript with full type definitions. It supports all possible message and transaction types, handles encryption/decryption for Secret Contracts, and works in Node.js, browsers, and React Native.

---

## Installation & Setup

### **Installation**
```bash
# Using npm
npm install secretjs

# Using yarn  
yarn add secretjs

# Direct browser usage
<script src="https://www.unpkg.com/secretjs/dist/browser.js" />
```

### **Basic Client Setup**
```javascript
import { SecretNetworkClient } from "secretjs";

// For queries only (readonly client)
const secretjs = new SecretNetworkClient({
  url: "https://lcd.secret.express", // Get from api-registry
  chainId: "secret-4", // mainnet
});

// For sending transactions (signer client)
import { Wallet } from "secretjs";

const wallet = new Wallet("your mnemonic words here");
const secretjs = new SecretNetworkClient({
  url: "https://lcd.secret.express",
  chainId: "secret-4", 
  wallet: wallet,
  walletAddress: wallet.address,
});
```

---

## Contract Querying (Critical for Panthers Bot)

### **Basic Contract Query Structure**
```javascript
// Query any Secret Contract
const response = await secretjs.query.compute.queryContract({
  contract_address: "secret1...",
  code_hash: "abc123...", // optional but way faster
  query: { your_query_message: {} }
});
```

### **Panthers NFT Ownership Queries**
```javascript
// Query user's NFT tokens
const getUserTokens = async (walletAddress) => {
  const response = await secretjs.query.compute.queryContract({
    contract_address: PANTHERS_CONTRACT_ADDRESS,
    code_hash: PANTHERS_CONTRACT_CODE_HASH, // way faster with this
    query: {
      tokens: {
        owner: walletAddress,
        limit: 1000
      }
    }
  });
  
  return response.token_list.tokens;
};

// Query specific token owner
const getTokenOwner = async (tokenId) => {
  const response = await secretjs.query.compute.queryContract({
    contract_address: PANTHERS_CONTRACT_ADDRESS,
    code_hash: PANTHERS_CONTRACT_CODE_HASH,
    query: {
      owner_of: {
        token_id: tokenId
      }
    }
  });
  
  return response.owner_of.owner;
};

// Query contract configuration
const getContractConfig = async () => {
  const response = await secretjs.query.compute.queryContract({
    contract_address: PANTHERS_CONTRACT_ADDRESS,
    code_hash: PANTHERS_CONTRACT_CODE_HASH,
    query: { contract_config: {} }
  });
  
  return response.contract_config;
};
```

### **Permit-Based Queries (Recommended)**
```javascript
// Query with permit authentication
const queryWithPermit = async (permit, query) => {
  const response = await secretjs.query.compute.queryContract({
    contract_address: PANTHERS_CONTRACT_ADDRESS,
    code_hash: PANTHERS_CONTRACT_CODE_HASH,
    query: {
      with_permit: {
        permit: permit,
        query: query
      }
    }
  });
  
  return response;
};

// Get user tokens using permit
const getUserTokensWithPermit = async (permit, walletAddress) => {
  return await queryWithPermit(permit, {
    tokens: {
      owner: walletAddress,
      limit: 1000
    }
  });
};
```

---

## Contract Information Queries

### **Get Contract Code Hash**
```javascript
// Get code hash from contract address (useful for verification)
const getCodeHash = async (contractAddress) => {
  const response = await secretjs.query.compute.codeHashByContractAddress({
    contract_address: contractAddress
  });
  
  return response.code_hash;
};
```

### **Get Contract Info**
```javascript
// Get contract metadata
const getContractInfo = async (contractAddress) => {
  const response = await secretjs.query.compute.contractInfo({
    contract_address: contractAddress
  });
  
  return response.contract_info;
};
```

---

## Network Information Queries

### **Node Status**
```javascript
// Check node status and latest block
const getNodeStatus = async () => {
  const status = await secretjs.query.tendermint.getNodeInfo();
  const latestBlock = await secretjs.query.tendermint.getLatestBlock();
  
  return {
    nodeInfo: status.node_info,
    blockHeight: latestBlock.block.header.height
  };
};
```

### **Account Information**
```javascript
// Get account details
const getAccountInfo = async (address) => {
  const account = await secretjs.query.auth.account({
    address: address
  });
  
  return {
    address: account.address,
    accountNumber: account.account_number,
    sequence: account.sequence
  };
};
```

### **Token Balances**
```javascript
// Get SCRT balance
const getBalance = async (address) => {
  const { balance } = await secretjs.query.bank.balance({
    address: address,
    denom: "uscrt"
  });
  
  return Number(balance.amount) / 1e6; // Convert to SCRT
};

// Get all balances
const getAllBalances = async (address) => {
  const response = await secretjs.query.bank.allBalances({
    address: address
  });
  
  return response.balances;
};
```

---

## Error Handling

### **Common Query Errors**
```javascript
const safeContractQuery = async (queryParams) => {
  try {
    const response = await secretjs.query.compute.queryContract(queryParams);
    return { success: true, data: response };
    
  } catch (error) {
    // Handle specific Secret Network errors
    if (error.message.includes('contract not found')) {
      return { success: false, error: 'CONTRACT_NOT_FOUND' };
    } else if (error.message.includes('Viewing key not found')) {
      return { success: false, error: 'VIEWING_KEY_REQUIRED' };
    } else if (error.message.includes('Unauthorized')) {
      return { success: false, error: 'UNAUTHORIZED' };
    } else if (error.message.includes('parsing error')) {
      return { success: false, error: 'INVALID_QUERY' };
    } else {
      return { success: false, error: 'NETWORK_ERROR', details: error.message };
    }
  }
};
```

### **Network Error Handling**
```javascript
const withRetry = async (queryFunction, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFunction();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

---

## Helper Functions

### **Address Validation**
```javascript
import { validateAddress } from "secretjs";

// Validate Secret Network address
const isValidSecretAddress = (address) => {
  try {
    validateAddress(address);
    return true;
  } catch (error) {
    return false;
  }
};
```

### **Coin/Token Utilities**
```javascript
import { stringToCoins, stringToCoin, coinsFromString, coinFromString } from "secretjs";

// Convert string to coins
const coins = stringToCoins("1000000uscrt,500000uatom");
// Returns: [{amount:"1000000",denom:"uscrt"}, {amount:"500000",denom:"uatom"}]

// Convert string to single coin
const coin = stringToCoin("1000000uscrt");
// Returns: {amount:"1000000",denom:"uscrt"}
```

### **Key Conversion Utilities**
```javascript
import { pubkeyToAddress, base64PubkeyToAddress } from "secretjs";

// Convert public key to address
const addressFromPubkey = pubkeyToAddress(pubkeyBytes);

// Convert base64 public key to address  
const addressFromBase64Pubkey = base64PubkeyToAddress(base64Pubkey);
```

---

## Bot Integration Patterns

### **Panthers NFT Verification Service**
```javascript
class PanthersVerificationService {
  constructor(secretClient, contractAddress, contractCodeHash) {
    this.secretjs = secretClient;
    this.contractAddress = contractAddress;
    this.contractCodeHash = contractCodeHash;
  }
  
  async verifyNFTOwnership(walletAddress, permit = null) {
    try {
      let tokens;
      
      if (permit) {
        // Use permit-based query (recommended)
        tokens = await this.queryWithPermit(permit, {
          tokens: { owner: walletAddress, limit: 1000 }
        });
      } else {
        // Try direct query (works if ownership is public)
        const response = await this.secretjs.query.compute.queryContract({
          contract_address: this.contractAddress,
          code_hash: this.contractCodeHash,
          query: { tokens: { owner: walletAddress, limit: 1000 } }
        });
        tokens = response.token_list.tokens;
      }
      
      return {
        hasNFT: tokens.length > 0,
        tokenCount: tokens.length,
        tokenIds: tokens,
        walletAddress: walletAddress
      };
      
    } catch (error) {
      return {
        hasNFT: false,
        error: this.parseError(error),
        walletAddress: walletAddress
      };
    }
  }
  
  async queryWithPermit(permit, query) {
    const response = await this.secretjs.query.compute.queryContract({
      contract_address: this.contractAddress,
      code_hash: this.contractCodeHash,
      query: {
        with_permit: { permit, query }
      }
    });
    
    return response.tokens || response.token_list?.tokens || [];
  }
  
  parseError(error) {
    if (error.message.includes('Viewing key not found')) {
      return 'VIEWING_KEY_REQUIRED';
    } else if (error.message.includes('Unauthorized')) {
      return 'UNAUTHORIZED';
    } else if (error.message.includes('not found')) {
      return 'CONTRACT_NOT_FOUND';
    } else {
      return 'NETWORK_ERROR';
    }
  }
}
```

### **Batch User Verification**
```javascript
const batchVerifyUsers = async (users) => {
  const results = [];
  const batchSize = 10; // Process 10 users at a time
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    
    const batchPromises = batch.map(user => 
      verificationService.verifyNFTOwnership(user.walletAddress, user.permit)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : { hasNFT: false, error: 'TIMEOUT' }
    ));
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};
```

---

## Performance Optimization

### **Query Caching**
```javascript
class QueryCache {
  constructor(ttlMs = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  
  async getOrFetch(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage
const queryCache = new QueryCache();

const getCachedTokens = async (walletAddress) => {
  return await queryCache.getOrFetch(
    `tokens_${walletAddress}`,
    () => getUserTokens(walletAddress)
  );
};
```

### **Connection Pooling**
```javascript
// Create multiple client instances for load balancing
const endpoints = [
  "https://lcd.secret.express",
  "https://1rpc.io/scrt-lcd"
];

const clients = endpoints.map(url => new SecretNetworkClient({
  url,
  chainId: "secret-4"
}));

let currentClientIndex = 0;

const getClient = () => {
  const client = clients[currentClientIndex];
  currentClientIndex = (currentClientIndex + 1) % clients.length;
  return client;
};
```

---

## Configuration Constants

### **Network Configuration**
```javascript
const NETWORK_CONFIG = {
  MAINNET: {
    chainId: "secret-4",
    lcdEndpoints: [
      "https://lcd.secret.express",
      "https://1rpc.io/scrt-lcd"
    ]
  },
  TESTNET: {
    chainId: "pulsar-3", 
    lcdEndpoints: [
      "https://api.pulsar.scrttestnet.com"
    ]
  }
};

const PANTHERS_CONFIG = {
  CONTRACT_ADDRESS: "secret1...", // Update with actual address
  CONTRACT_CODE_HASH: "abc123...", // Update with actual hash
  QUERIES: {
    TOKENS: "tokens",
    OWNER_OF: "owner_of", 
    CONTRACT_CONFIG: "contract_config",
    TOKEN_INFO: "token_info"
  }
};
```

This comprehensive SecretJS guide provides everything needed for the Panthers NFT bot implementation, based on the official SecretJS documentation you provided.
