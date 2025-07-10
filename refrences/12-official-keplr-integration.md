# Official Keplr Wallet Integration for Secret Network

*Authoritative guide based on Secret Network documentation*

## Keplr Integration Overview

Keplr is the recommended wallet for Secret Network with multiple signing methods available. For our Panthers NFT bot, we'll use **permit-based authentication** which doesn't require transaction signing, just message signing.

---

## Keplr Setup & Detection

### **1. Wallet Detection & Initialization**
```javascript
// Wait for Keplr to load in browser
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initializeKeplr() {
  // Wait for Keplr extension to load
  while (
    !window.keplr ||
    !window.getEnigmaUtils ||
    !window.getOfflineSigner
  ) {
    await sleep(50);
  }
  
  const CHAIN_ID = "secret-4"; // Mainnet
  
  // Request permission to interact with Secret Network
  await window.keplr.enable(CHAIN_ID);
  
  return true;
}
```

### **2. Get User's Secret Network Address**
```javascript
async function getKeplrAddress() {
  const CHAIN_ID = "secret-4";
  
  // Get offline signer (recommended method)
  const keplrOfflineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
  
  // Get accounts
  const [{ address: userAddress }] = await keplrOfflineSigner.getAccounts();
  
  return userAddress;
}
```

---

## Keplr Signing Methods

### **Recommended: getOfflineSigner() - For Modern Wallets**
```javascript
const keplrOfflineSigner = window.keplr.getOfflineSigner(CHAIN_ID);

// ✅ Efficient and supports all transaction types
// ❌ Doesn't support Ledger hardware wallets
// ❌ UI looks less polished in Keplr
```

### **Legacy: getOfflineSignerOnlyAmino() - For Ledger Support**
```javascript
const keplrOfflineSigner = window.keplr.getOfflineSignerOnlyAmino(CHAIN_ID);

// ✅ Clean UI in Keplr
// ✅ Supports Ledger hardware wallets
// ❌ Limited transaction type support
// ❌ Legacy method
```

### **Smart: getOfflineSignerAuto() - Best of Both**
```javascript
const keplrOfflineSigner = window.keplr.getOfflineSignerAuto(CHAIN_ID);

// ✅ Automatically chooses best method for user's wallet type
// ✅ Ledger users get Amino signer, others get standard signer
// ✅ Recommended for production apps
```

---

## SecretJS Client Setup with Keplr

### **Complete Client Initialization**
```javascript
import { SecretNetworkClient } from "secretjs";

async function createSecretClient() {
  // Initialize Keplr
  await initializeKeplr();
  
  const CHAIN_ID = "secret-4";
  const LCD_URL = "https://lcd.secret.express"; // Get latest from api-registry
  
  // Get signer and address
  const keplrOfflineSigner = window.keplr.getOfflineSignerAuto(CHAIN_ID);
  const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();
  
  // Create SecretJS client
  const secretjs = new SecretNetworkClient({
    url: LCD_URL,
    chainId: CHAIN_ID,
    wallet: keplrOfflineSigner,
    walletAddress: myAddress,
    encryptionUtils: window.keplr.getEnigmaUtils(CHAIN_ID), // Optional but recommended
  });
  
  return { secretjs, address: myAddress };
}
```

### **Encryption Utils Benefits**
```javascript
// Using encryptionUtils allows:
// ✅ Keplr manages encryption keys across sessions
// ✅ Query responses can be decrypted across browser sessions  
// ✅ Better user experience for repeated app usage
encryptionUtils: window.keplr.getEnigmaUtils(CHAIN_ID)
```

---

## Permit Signing with Keplr

### **Creating Permits (No Gas Required)**
```javascript
async function requestPermitFromUser() {
  try {
    await initializeKeplr();
    
    const CHAIN_ID = "secret-4";
    
    // Get user's address
    const keplrOfflineSigner = window.keplr.getOfflineSignerAuto(CHAIN_ID);
    const [{ address: userAddress }] = await keplrOfflineSigner.getAccounts();
    
    // Permit parameters
    const permitParams = {
      permit_name: "panthers_nft_access",
      allowed_tokens: [PANTHERS_CONTRACT_ADDRESS],
      chain_id: CHAIN_ID,
      permissions: ["owner"]
    };
    
    // Keplr automatically handles permit signing
    // User will see a permit approval dialog
    const permit = await window.keplr.signPermit(
      CHAIN_ID,
      userAddress,
      permitParams
    );
    
    return { success: true, permit, address: userAddress };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Error Handling & User Experience

### **Common Keplr Errors**
```javascript
const KEPLR_ERRORS = {
  NOT_INSTALLED: 'Keplr wallet is not installed',
  USER_REJECTED: 'User rejected the request',
  NETWORK_NOT_SUPPORTED: 'Secret Network not added to Keplr',
  ACCOUNT_NOT_FOUND: 'No Secret Network account found',
  SIGNING_REJECTED: 'User rejected signing request'
};

async function handleKeplrError(error) {
  if (error.message.includes('Request rejected')) {
    return KEPLR_ERRORS.USER_REJECTED;
  } else if (error.message.includes('not found')) {
    return KEPLR_ERRORS.ACCOUNT_NOT_FOUND;
  } else if (!window.keplr) {
    return KEPLR_ERRORS.NOT_INSTALLED;
  } else {
    return `Keplr error: ${error.message}`;
  }
}
```

### **User-Friendly Instructions**
```javascript
const KEPLR_INSTRUCTIONS = {
  INSTALL: `🦊 Install Keplr Wallet:
  
1. Go to https://keplr.app
2. Install the browser extension
3. Create or import your Secret Network account
4. Return here and try again`,

  SETUP_ACCOUNT: `🔑 Set up Secret Network:
  
1. Open Keplr extension
2. Add Secret Network if not already added
3. Make sure you have a Secret Network account
4. Try the verification again`,

  PERMIT_HELP: `📝 Creating a Permit:
  
1. Keplr will show a "Sign Permit" dialog
2. Review the permit details:
   - Name: panthers_nft_access
   - Contract: ${PANTHERS_CONTRACT_ADDRESS}
   - Permissions: owner
3. Click "Approve" to create the permit
4. This is free (no gas required)!`
};
```

---

## Bot Integration Workflow

### **Complete Verification Flow**
```javascript
async function verifyWithKeplr() {
  try {
    // Step 1: Check if Keplr is available
    if (!window.keplr) {
      return {
        success: false,
        error: KEPLR_ERRORS.NOT_INSTALLED,
        instruction: KEPLR_INSTRUCTIONS.INSTALL
      };
    }
    
    // Step 2: Initialize and get user address
    const { address } = await createSecretClient();
    
    // Step 3: Request permit creation
    const permitResult = await requestPermitFromUser();
    
    if (!permitResult.success) {
      return {
        success: false,
        error: permitResult.error,
        instruction: KEPLR_INSTRUCTIONS.PERMIT_HELP
      };
    }
    
    // Step 4: Validate permit and check NFT ownership
    const verification = await validatePermitAndCheckNFT(permitResult.permit);
    
    return {
      success: verification.hasNFT,
      address: address,
      tokenCount: verification.tokenCount,
      permit: permitResult.permit // Send to bot for verification
    };
    
  } catch (error) {
    const errorMessage = await handleKeplrError(error);
    return {
      success: false,
      error: errorMessage
    };
  }
}
```

---

## Alternative Wallets (Keplr API Compatible)

### **Fina Wallet (Mobile)**
```javascript
// Fina implements Keplr API - same code works!
// Mobile deep linking support:
const urlSearchParams = new URLSearchParams();
urlSearchParams.append("network", "secret-4");
urlSearchParams.append("url", window.location.href);
window.open(`fina://wllet/dapps?${urlSearchParams.toString()}`, "_blank");
```

### **StarShell Wallet**
```javascript
// StarShell overrides window.keplr - same code works!
// User needs to disable Keplr extension first
```

### **Leap Cosmos Wallet**
```javascript
// Similar to Keplr but uses window.leap
const leapOfflineSigner = window.leap.getOfflineSigner(CHAIN_ID);
const secretjs = new SecretNetworkClient({
  // ... same setup but with leap signer
  encryptionUtils: window.leap.getEnigmaUtils(CHAIN_ID),
});
```

---

## Testing & Development

### **Development Environment**
```javascript
// For testnet development
const TESTNET_CONFIG = {
  chainId: "pulsar-3",
  url: "https://api.pulsar.scrttestnet.com"
};

// For production
const MAINNET_CONFIG = {
  chainId: "secret-4", 
  url: "https://lcd.secret.express"
};
```

### **Testing Checklist**
- [ ] Keplr extension installed and configured
- [ ] Secret Network added to Keplr
- [ ] Test account with Secret Network address
- [ ] Testnet SCRT tokens for testing (if needed)
- [ ] Test permit creation and validation
- [ ] Test error scenarios (user rejection, etc.)

---

## Security Best Practices

### **Client-Side Security**
```javascript
// ✅ Always validate permits on backend
// ✅ Never trust client-side wallet data
// ✅ Use HTTPS for all communications
// ❌ Never store permits or sensitive data
// ❌ Don't trust wallet addresses without verification
```

### **Permit Validation**
```javascript
// Always validate permits server-side
async function validatePermitServerSide(permit) {
  // 1. Check permit structure
  // 2. Verify signature cryptographically  
  // 3. Extract and validate wallet address
  // 4. Check permit hasn't been revoked
  // 5. Verify contract address matches
}
```

This guide provides the official, tested methods for Keplr integration with Secret Network, specifically adapted for permit-based authentication in our Panthers NFT bot.
