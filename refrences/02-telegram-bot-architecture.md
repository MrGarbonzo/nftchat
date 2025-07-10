# Telegram Bot Architecture & User Flow

*Complete technical flow for Panthers NFT gated Telegram access*

## User Journey Overview

```
1. User buys/receives Panthers NFT
2. User DMs Panthers Bot
3. User connects Keplr wallet & signs verification
4. Bot verifies NFT ownership on Secret Network
5. Bot adds user to gated Telegram group
6. Access maintained until ownership changes + someone runs /update
```

## Technical Components

### 1. Telegram Bot Backend
- **Framework:** Node.js with `node-telegram-bot-api` or `telegraf`
- **Commands:**
  - `/start` - Introduction & instructions
  - `/verify` - Wallet connection & verification flow
  - `/update` - Re-check ownership (triggers global refresh)
  - `/status` - Check current verification status

### 2. Secret Network Integration
- **Library:** `secretjs` for Secret Network interaction
- **Queries:** SNIP-721 ownership verification
- **Network:** Secret Network mainnet/testnet

### 3. Wallet Authentication
- **Method:** Keplr arbitrary message signing
- **Flow:** Challenge-response verification
- **Storage:** Telegram ID ↔ Wallet address mapping

### 4. Database Schema
```
users_table:
- telegram_user_id (primary)
- wallet_address
- verification_date
- last_checked_date
- is_verified (boolean)

verification_challenges:
- challenge_id (primary)
- telegram_user_id
- challenge_message
- expiry_date
- used (boolean)
```

## Detailed User Flow

### Initial Verification (`/verify`)

1. **Bot generates unique challenge:**
   ```
   Challenge: "Verify Panthers NFT access - Challenge ID: abc123xyz"
   ```

2. **User signs with Keplr:**
   - User copies challenge message
   - Signs in Keplr using "Sign Arbitrary Data"
   - Pastes signature back to bot

3. **Bot verifies signature:**
   - Extracts wallet address from signature
   - Validates signature matches challenge
   - Queries Secret Network for NFT ownership

4. **Bot grants access:**
   - Adds user to gated Telegram group
   - Stores verification in database
   - Confirms success to user

### Ownership Updates (`/update`)

1. **Anyone can trigger update**
2. **Bot performs global check:**
   - Retrieves all verified users from database
   - For each user: re-verify current NFT ownership
   - Remove users who no longer own Panthers NFTs

3. **Database cleanup:**
   - Update verification status
   - Remove from Telegram group if needed

## Privacy Considerations

### Data Stored:
- ✅ Telegram User ID
- ✅ Wallet Address (public anyway)
- ✅ Verification timestamps
- ❌ Viewing Keys (avoid storing)
- ❌ Private Keys (never)
- ❌ Signatures (delete after verification)

### Security Measures:
- Challenge messages expire (15 minutes)
- Signature replay protection
- Rate limiting on verification attempts
- Encrypted database storage

## Error Handling

### Common Scenarios:
1. **Invalid signature** → "Please check your Keplr signing"
2. **No NFT found** → "No Panthers NFT detected in wallet"
3. **Already verified** → "Wallet already linked to another user"
4. **Network errors** → "Secret Network temporarily unavailable"

### Bot Responses:
- Clear error messages
- Step-by-step guidance
- Fallback instructions
- Support contact information

## Scalability Considerations

### Performance:
- Batch Secret Network queries when possible
- Cache recent verification results (5-10 minutes)
- Queue system for high verification volumes

### Reliability:
- Retry failed Secret Network queries
- Graceful degradation during network issues
- Health monitoring & alerting
