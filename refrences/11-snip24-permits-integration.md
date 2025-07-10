# SNIP-24 Permits Integration Guide

*Modern authentication method for Secret Network - successor to viewing keys*

## Why Permits Over Viewing Keys

### **Advantages of Permits:**
- ✅ **Free gas** - No transaction required to create
- ✅ **Better UX** - Generated locally by wallet
- ✅ **More secure** - Cannot be intercepted during creation
- ✅ **No storage needed** - No sensitive data to store in bot database
- ✅ **Revocable** - Users can revoke permits without bot involvement
- ✅ **Standard compliant** - SNIP-24 specification

### **Why Not Viewing Keys:**
- ❌ Require gas to create/set
- ❌ Must be stored securely by bot  
- ❌ Less user-friendly creation process
- ❌ Harder to revoke/manage

---

## How Permits Work

### **Concept:**
Permits are **dummy transactions signed by a wallet** that prove the signer owns a specific address without requiring gas or on-chain storage.

### **Process Flow:**
1. **User creates permit** - Signs a standard message with Keplr
2. **Bot receives permit** - Gets the signed permit data
3. **Bot validates permit** - Checks signature and extracts wallet address
4. **Bot queries contract** - Uses permit to authenticate NFT ownership queries

---

## Permit Structure

### **Permit Object Format:**
```javascript
const permit = {
  params: {
    permit_name: "panthers_nft_access",
    allowed_tokens: ["secret1..."], // Panthers contract address
    chain_id: "secret-4",
    permissions: ["owner"] // What the permit allows
  },
  signature: {
    pub_key: {
      type: "tendermint/PubKeySecp256k1",
      value: "base64_encoded_public_key"
    },
    signature: "base64_encoded_signature"
  }
};
```

### **Permit Parameters:**
```javascript
const PERMIT_PARAMS = {
  permit_name: "panthers_nft_access",     // Unique identifier
  allowed_tokens: [PANTHERS_CONTRACT_ADDRESS], // Which contracts this permit works for
  chain_id: "secret-4",                  // Network identifier
  permissions: ["owner"]                 // What access level this grants
};
```

---

## Implementation for Panthers Bot

### **1. Permit Generation (User Side)**
```javascript
// User signs this standard message format with Keplr
const permitMessage = {
  permit_name: "panthers_nft_access",
  allowed_tokens: [PANTHERS_CONTRACT_ADDRESS],
  chain_id: "secret-4", 
  permissions: ["owner"]
};

// User signs with Keplr:
// 1. Keplr detects this is a permit
// 2. User approves signing
// 3. Returns signed permit object
```

### **2. Permit Validation (Bot Side)**
```javascript
// Bot validates permit and extracts wallet address
async function validatePermit(permit) {
  try {
    // Check permit applies to Panthers contract
    if (!permit.params.allowed_tokens.includes(PANTHERS_CONTRACT_ADDRESS)) {
      throw new Error('Permit not valid for Panthers contract');
    }
    
    // Extract wallet address from permit signature
    const walletAddress = extractAddressFromPermit(permit);
    
    // Permit is valid, use for queries
    return { valid: true, address: walletAddress };
    
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### **3. Using Permits for NFT Queries**
```javascript
// Query Panthers NFT ownership using permit authentication
async function queryWithPermit(permit) {
  const query = {
    with_permit: {
      permit: permit,
      query: {
        tokens: {
          owner: walletAddress, // Extracted from permit
          limit: 1000
        }
      }
    }
  };
  
  const response = await secretClient.query.compute.queryContract({
    contract_address: PANTHERS_CONTRACT_ADDRESS,
    code_hash: PANTHERS_CONTRACT_CODE_HASH,
    query: query
  });
  
  return response.tokens;
}
```

---

## Bot Integration Workflow

### **User Verification Flow with Permits:**

1. **User runs `/verify` command**
2. **Bot requests permit creation:**
   ```
   🔐 PERMIT VERIFICATION STEPS:
   
   1. Open Keplr wallet
   2. Go to "Sign" → "Sign Permit" 
   3. Approve the Panthers NFT access permit
   4. Copy the permit data and send it back here
   
   This permit allows checking your NFT ownership without gas costs!
   ```

3. **User creates permit in Keplr:**
   - Keplr automatically formats permit message
   - User approves signing
   - User copies permit JSON and sends to bot

4. **Bot validates and uses permit:**
   - Validates permit signature
   - Extracts wallet address
   - Queries NFT ownership using permit
   - Stores verification result (but NOT the permit itself)

### **Database Storage:**
```sql
-- Store verification result, NOT the permit
CREATE TABLE verified_users (
    telegram_user_id BIGINT PRIMARY KEY,
    wallet_address VARCHAR(45) NOT NULL,
    verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- No permit data stored - permits are used once for verification
);
```

---

## Permit Message Templates

### **User Instructions:**
```javascript
const PERMIT_INSTRUCTIONS = `🔐 PERMIT VERIFICATION:

1. Open Keplr wallet
2. Look for "Sign Permit" or "Sign Message" 
3. You should see a permit for "Panthers NFT Access"
4. Approve the permit signing
5. Copy the permit data and send it back here

✨ This is free (no gas required) and more secure than viewing keys!

Need help? The permit should show:
- Permit Name: panthers_nft_access  
- Contract: ${PANTHERS_CONTRACT_ADDRESS}
- Permissions: owner`;
```

### **Permit Request Format:**
```javascript
// What bot sends to user to copy into Keplr
const permitRequest = {
  permit_name: "panthers_nft_access",
  allowed_tokens: [PANTHERS_CONTRACT_ADDRESS],
  chain_id: "secret-4",
  permissions: ["owner"]
};
```

---

## Error Handling

### **Common Permit Errors:**
```javascript
const PERMIT_ERRORS = {
  INVALID_SIGNATURE: "Permit signature is invalid",
  WRONG_CONTRACT: "Permit not valid for Panthers contract", 
  REVOKED_PERMIT: "This permit has been revoked",
  EXPIRED_PERMIT: "Permit has expired",
  MALFORMED_PERMIT: "Permit format is incorrect",
  NETWORK_MISMATCH: "Permit is for wrong network"
};
```

### **Error Handling Logic:**
```javascript
async function handlePermitVerification(permitData) {
  try {
    // Parse permit JSON
    const permit = JSON.parse(permitData);
    
    // Validate permit structure
    if (!permit.params || !permit.signature) {
      return { error: PERMIT_ERRORS.MALFORMED_PERMIT };
    }
    
    // Validate permit
    const validation = await validatePermit(permit);
    if (!validation.valid) {
      return { error: validation.error };
    }
    
    // Query NFT ownership
    const tokens = await queryWithPermit(permit);
    
    return {
      success: true,
      walletAddress: validation.address,
      tokenCount: tokens.length,
      hasNFT: tokens.length > 0
    };
    
  } catch (error) {
    return { error: `Permit verification failed: ${error.message}` };
  }
}
```

---

## Security Considerations

### **Permit Security:**
- ✅ **No sensitive data storage** - Bot never stores permits
- ✅ **Time-limited usage** - Permits used once for verification
- ✅ **User controlled** - Users can revoke permits anytime
- ✅ **Contract-specific** - Permits only work for specified contracts

### **Best Practices:**
1. **Never store permits** - Use once and discard
2. **Validate all permit fields** - Check contract address, permissions, etc.
3. **Handle revoked permits** - Users may revoke access
4. **Clear error messages** - Help users understand permit issues

---

## Permit vs Viewing Key Comparison

| Feature | Permits (SNIP-24) | Viewing Keys |
|---------|-------------------|--------------|
| **Gas Cost** | Free ✅ | Requires gas ❌ |
| **User Experience** | Simple signing ✅ | Complex setup ❌ |
| **Bot Storage** | Nothing to store ✅ | Must store keys ❌ |
| **Security** | Very secure ✅ | Moderate ⚠️ |
| **Revocation** | User controlled ✅ | Bot dependent ❌ |
| **Standard** | SNIP-24 compliant ✅ | Legacy method ❌ |

---

## Implementation Checklist

### **Bot Setup:**
- [ ] Add permit validation logic
- [ ] Create permit request templates
- [ ] Implement permit-based queries
- [ ] Add permit error handling
- [ ] Test with Panthers contract

### **User Experience:**
- [ ] Clear permit instructions
- [ ] Keplr integration guidance  
- [ ] Error message improvements
- [ ] Help documentation
- [ ] Mobile wallet support

### **Security:**
- [ ] Never store permit data
- [ ] Validate all permit fields
- [ ] Handle revoked permits
- [ ] Rate limit permit attempts
- [ ] Audit permit validation logic

**Permits are the modern, user-friendly way to handle Secret Network authentication. They eliminate gas costs, improve security, and provide better UX compared to viewing keys.**
