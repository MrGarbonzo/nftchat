# Keplr Wallet Integration Guide

*How to integrate Keplr wallet with Telegram bot for Secret Network*

## Keplr Message Signing Process

### 1. Challenge Generation
```javascript
// Bot generates unique challenge
function generateChallenge(telegramUserId) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `Panthers NFT Verification
User: ${telegramUserId}
Challenge: ${randomBytes}
Timestamp: ${timestamp}`;
}
```

### 2. User Signs Challenge in Keplr

**User Steps:**
1. Copy challenge text from bot
2. Open Keplr wallet
3. Go to "Sign" or "Sign Arbitrary Data"
4. Paste challenge message
5. Sign with Secret Network account
6. Copy signature back to bot

**Keplr Signing Response Format:**
```json
{
  "signature": "base64_encoded_signature",
  "pub_key": {
    "type": "tendermint/PubKeySecp256k1", 
    "value": "base64_encoded_public_key"
  }
}
```

### 3. Signature Verification

**Extract Wallet Address:**
```javascript
import { verifyADR36Amino } from "@keplr-wallet/cosmos";

function verifySignature(challenge, signature, pubKey) {
  // Verify signature is valid
  const isValid = verifyADR36Amino(
    "secret", // Secret Network prefix
    challenge,
    signature,
    pubKey
  );
  
  if (isValid) {
    // Extract bech32 address from public key
    const address = pubKeyToBech32Address(pubKey, "secret");
    return address;
  }
  
  return null;
}
```

## Important Notes

### Message Format Requirements:
- Use plain text (not JSON)
- Keep message human-readable
- Include timestamp to prevent replay attacks
- Include unique identifier per verification

### Error Scenarios:
1. **Wrong network selected** → User must use Secret Network
2. **Invalid signature format** → User may have corrupted copy/paste
3. **Expired challenge** → Generate new challenge
4. **Network mismatch** → Ensure Secret Network is selected

## Keplr Integration Libraries

### Required Dependencies:
```json
{
  "@keplr-wallet/cosmos": "^0.12.x",
  "@cosmjs/crypto": "^0.31.x", 
  "@cosmjs/encoding": "^0.31.x"
}
```

### Alternative: SecretJS Integration
```javascript
import { SecretNetworkClient } from "secretjs";

// For signature verification
const client = new SecretNetworkClient({
  url: "https://lcd.secret.express",
  chainId: "secret-4"
});
```

## User Experience Considerations

### Clear Instructions:
```
🔐 WALLET VERIFICATION STEPS:

1. Copy this message: [CHALLENGE_TEXT]
2. Open Keplr wallet
3. Click "Sign" → "Sign Arbitrary Data"  
4. Paste the message
5. Make sure "Secret Network" is selected
6. Sign the message
7. Copy the signature and send it back here

Need help? Type /help for detailed guide
```

### Common User Issues:
- **Wrong chain selected** → Provide chain switching instructions
- **Keplr not installed** → Link to installation guide
- **Mobile vs Desktop** → Different Keplr UX instructions

## Security Best Practices

### Challenge Requirements:
- 15-minute expiration
- One-time use only
- Include anti-replay elements
- Store challenge hash (not full text)

### Signature Validation:
- Verify against original challenge
- Check timestamp validity
- Confirm Secret Network derivation
- Rate limit verification attempts

## Testing Checklist

### Functional Tests:
- [ ] Valid signature acceptance
- [ ] Invalid signature rejection
- [ ] Expired challenge handling
- [ ] Network mismatch detection
- [ ] Replay attack prevention

### User Experience Tests:
- [ ] Clear error messages
- [ ] Step-by-step guidance
- [ ] Multiple attempt handling
- [ ] Help documentation access
