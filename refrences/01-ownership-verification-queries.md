# SNIP-721 Ownership Verification Queries

*Critical queries for Telegram bot to verify NFT ownership*

## Key Queries for Bot Implementation

### 1. Check if Address Owns Any Panthers NFTs

**Query: `tokens`**
```json
{
  "tokens": {
    "owner": "secret1addresstocheckfor",
    "viewer": "secret1botaddress", 
    "viewing_key": "users_viewing_key",
    "limit": 50
  }
}
```

**Response:**
```json
{
  "token_list": {
    "tokens": ["panther_001", "panther_042", "panther_123"]
  }
}
```

**Use Case:** Check if user owns any Panthers NFTs during `/verify` command

---

### 2. Get Detailed Token Information

**Query: `nft_dossier`**
```json
{
  "nft_dossier": {
    "token_id": "panther_001",
    "viewer": {
      "address": "secret1useraddress",
      "viewing_key": "users_viewing_key"
    }
  }
}
```

**Response includes:**
- Owner address
- Public/private metadata
- Transfer permissions
- Ownership privacy settings

**Use Case:** Get complete token details for verification

---

### 3. Simple Ownership Check

**Query: `owner_of`**
```json
{
  "owner_of": {
    "token_id": "panther_001",
    "viewer": {
      "address": "secret1queryingaddress",
      "viewing_key": "viewing_key"
    }
  }
}
```

**Response:**
```json
{
  "owner_of": {
    "owner": "secret1actualowner",
    "approvals": []
  }
}
```

**Use Case:** Quick check if specific token is owned by expected address

---

## Authentication Requirements

### Privacy Settings Impact:

1. **If `public_owner: true`** → Can query without viewing key
2. **If `public_owner: false`** → Must have user's viewing key or permit

### Bot Implementation Strategy:

**Option A: Viewing Keys (Traditional)**
- User provides viewing key during verification
- Bot stores: `{telegram_id, wallet_address, viewing_key}`
- Bot can query ownership anytime

**Option B: Permits (Recommended)**
- User creates permit for each verification
- No sensitive data stored
- More privacy-preserving

---

## Error Handling

**Common Errors:**
- `"Viewing key not found"` → User hasn't set viewing key
- `"Unauthorized"` → Wrong viewing key provided
- `"Token not found"` → Invalid token ID
- `"Private ownership"` → Need authentication to view

**Bot Logic:**
```
1. Try query without authentication first
2. If unauthorized, request viewing key/permit
3. Handle viewing key creation if needed
```

---

## Contract Configuration Considerations

For Panthers NFT contract, recommend:
- `public_token_supply: true` → Bot can see all token IDs
- `public_owner: false` → Maintain privacy by default
- Users can make ownership public if desired
