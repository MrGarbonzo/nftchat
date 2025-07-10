# Secret Network Integration

*Connecting to Secret Network and querying SNIP-721 contracts*

## SecretJS Setup

### Installation & Basic Client
```javascript
import { SecretNetworkClient } from "secretjs";

// Initialize client for Secret Network mainnet
const client = new SecretNetworkClient({
  url: "https://lcd.secret.express", // or "https://1rpc.io/scrt-lcd"
  chainId: "secret-4"
});

// For testnet:
const testnetClient = new SecretNetworkClient({
  url: "https://api.pulsar.scrttestnet.com",
  chainId: "pulsar-3"
});
```

### Contract Interaction Setup
```javascript
const panthersContractAddress = "secret1..."; // Your Panthers NFT contract
const contractCodeHash = "abc123..."; // Your contract's code hash

// Generic query function
async function queryContract(queryMsg) {
  try {
    const response = await client.query.compute.queryContract({
      contract_address: panthersContractAddress,
      code_hash: contractCodeHash,
      query: queryMsg
    });
    return response;
  } catch (error) {
    console.error("Query failed:", error);
    throw error;
  }
}
```

## NFT Ownership Queries

### 1. Check User's Token Count
```javascript
async function getUserTokenCount(walletAddress, viewingKey = null) {
  const query = {
    tokens: {
      owner: walletAddress,
      limit: 1000 // Max tokens to check
    }
  };
  
  // Add authentication if needed
  if (viewingKey) {
    query.tokens.viewing_key = viewingKey;
  }
  
  const response = await queryContract(query);
  return response.token_list.tokens.length;
}
```

### 2. Get All User's Tokens
```javascript
async function getUserTokens(walletAddress, viewingKey = null) {
  const query = {
    tokens: {
      owner: walletAddress,
      limit: 1000
    }
  };
  
  if (viewingKey) {
    query.tokens.viewing_key = viewingKey;
  }
  
  const response = await queryContract(query);
  return response.token_list.tokens;
}
```

### 3. Check Specific Token Ownership
```javascript
async function getTokenOwner(tokenId, viewingKey = null) {
  const query = {
    owner_of: {
      token_id: tokenId
    }
  };
  
  if (viewingKey) {
    query.owner_of.viewer = {
      address: walletAddress,
      viewing_key: viewingKey
    };
  }
  
  const response = await queryContract(query);
  return response.owner_of.owner;
}
```

## Contract Information Queries

### Get Contract Configuration
```javascript
async function getContractConfig() {
  const response = await queryContract({
    contract_config: {}
  });
  
  return {
    ownerIsPublic: response.contract_config.owner_is_public,
    tokenSupplyIsPublic: response.contract_config.token_supply_is_public,
    // ... other config values
  };
}
```

### Get Total Token Supply
```javascript
async function getTotalSupply() {
  const response = await queryContract({
    num_tokens: {}
  });
  return response.num_tokens.count;
}
```

## Error Handling

### Common Query Errors
```javascript
async function safeQuery(queryMsg) {
  try {
    return await queryContract(queryMsg);
  } catch (error) {
    if (error.message.includes("Viewing key not found")) {
      return { error: "VIEWING_KEY_REQUIRED" };
    } else if (error.message.includes("Unauthorized")) {
      return { error: "INVALID_VIEWING_KEY" };
    } else if (error.message.includes("not found")) {
      return { error: "TOKEN_NOT_FOUND" };
    } else {
      return { error: "NETWORK_ERROR", details: error.message };
    }
  }
}
```

### Bot Integration Example
```javascript
async function verifyNFTOwnership(walletAddress, viewingKey = null) {
  try {
    // First try without viewing key (if public ownership)
    let tokens = await getUserTokens(walletAddress);
    
    if (tokens.error === "VIEWING_KEY_REQUIRED" && viewingKey) {
      // Retry with viewing key
      tokens = await getUserTokens(walletAddress, viewingKey);
    }
    
    if (tokens.error) {
      return { 
        hasNFT: false, 
        error: tokens.error,
        requiresViewingKey: tokens.error === "VIEWING_KEY_REQUIRED"
      };
    }
    
    return {
      hasNFT: tokens.length > 0,
      tokenCount: tokens.length,
      tokenIds: tokens
    };
    
  } catch (error) {
    return { 
      hasNFT: false, 
      error: "NETWORK_ERROR",
      details: error.message 
    };
  }
}
```

## Network Configuration

### RPC Endpoints
**Mainnet:**
- LCD: `https://lcd.secret.express`
- RPC: `https://rpc.secret.express`
- Alternative: `https://1rpc.io/scrt-lcd`

**Testnet (Pulsar):**
- LCD: `https://api.pulsar.scrttestnet.com`
- RPC: `https://rpc.pulsar.scrttestnet.com`

### Chain IDs
- Mainnet: `secret-4`
- Testnet: `pulsar-3`

## Performance Optimization

### Query Batching
```javascript
async function batchVerifyUsers(userWallets) {
  const promises = userWallets.map(wallet => 
    verifyNFTOwnership(wallet.address, wallet.viewingKey)
  );
  
  // Process in chunks to avoid rate limits
  const chunkSize = 10;
  const results = [];
  
  for (let i = 0; i < promises.length; i += chunkSize) {
    const chunk = promises.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk);
    results.push(...chunkResults);
    
    // Small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
```

### Caching Strategy
```javascript
const verificationCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedVerification(walletAddress) {
  const cached = verificationCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  return null;
}

function setCachedVerification(walletAddress, result) {
  verificationCache.set(walletAddress, {
    result,
    timestamp: Date.now()
  });
}
```
