# Low-Level Build Plan for Panthers NFT Telegram Bot

*Detailed step-by-step implementation guide with specific technical tasks*

## Phase 1: Project Foundation

### 1.1 Environment Setup
- [ ] Create new Node.js project (`npm init`)
- [ ] Install core dependencies:
  - `telegraf` (Telegram bot framework)
  - `secretjs` (Secret Network client)
  - `sqlite3` (database for development)
  - `@keplr-wallet/cosmos` (signature verification)
  - `dotenv` (environment variables)
- [ ] Create folder structure:
  ```
  /src
    /handlers (bot command handlers)
    /services (Secret Network, database)
    /utils (signature verification, helpers)
  /config
  /migrations
  ```

### 1.2 Configuration System
- [ ] Create `.env` file for secrets
- [ ] Set up environment variables:
  - `TELEGRAM_BOT_TOKEN`
  - `SECRET_NETWORK_URL`
  - `PANTHERS_CONTRACT_ADDRESS` 
  - `PANTHERS_CONTRACT_CODE_HASH`
  - `DATABASE_URL`
- [ ] Create config loader module

### 1.3 Database Setup
- [ ] Create SQLite database file
- [ ] Write SQL migration for `verified_users` table
- [ ] Create database connection module
- [ ] Write basic CRUD functions:
  - `addVerifiedUser(telegramId, walletAddress)`
  - `getVerifiedUser(telegramId)`
  - `getAllVerifiedUsers()`
  - `removeVerifiedUser(telegramId)`

---

## Phase 2: Basic Bot Framework

### 2.1 Telegram Bot Core
- [ ] Initialize Telegraf bot instance
- [ ] Set up command middleware
- [ ] Create basic command handlers:
  - `/start` - Welcome message
  - `/help` - Instructions
  - `/verify` - Start verification process
  - `/update` - Trigger ownership refresh
  - `/status` - Check verification status

### 2.2 Bot Message Flow
- [ ] Design conversation state management
- [ ] Handle command responses and user input
- [ ] Implement error message formatting
- [ ] Add logging for bot interactions

### 2.3 Testing Framework
- [ ] Test bot locally with BotFather token
- [ ] Verify command routing works
- [ ] Test database operations
- [ ] Ensure bot responds to all commands

---

## Phase 3: Secret Network Integration

### 3.1 SecretJS Client Setup
- [ ] Create Secret Network client instance
- [ ] Configure for testnet initially
- [ ] Test basic connection to Secret Network
- [ ] Handle network connection errors

### 3.2 Contract Query Functions
- [ ] Build query wrapper function
- [ ] Implement specific queries:
  - `getUserTokens(walletAddress)` - Get user's NFT list
  - `getTokenOwner(tokenId)` - Check specific token ownership
  - `getContractConfig()` - Check privacy settings
- [ ] Add query result caching (5 minute cache)
- [ ] Handle common query errors

### 3.3 Ownership Verification Logic
- [ ] Create `verifyNFTOwnership(walletAddress)` function
- [ ] Handle both public/private ownership scenarios
- [ ] Return structured response:
  ```
  {
    hasNFT: boolean,
    tokenCount: number,
    error: string | null
  }
  ```

---

## Phase 4: Keplr Wallet Integration

### 4.1 Challenge Generation
- [ ] Create unique challenge message generator
- [ ] Include timestamp and random elements
- [ ] Store challenges temporarily (in-memory for now)
- [ ] Implement challenge expiration (15 minutes)

### 4.2 Signature Verification
- [ ] Build signature verification function
- [ ] Extract wallet address from signature
- [ ] Validate signature against original challenge
- [ ] Handle verification errors gracefully

### 4.3 User Flow Implementation
- [ ] `/verify` command logic:
  1. Generate challenge
  2. Send signing instructions to user
  3. Wait for signature response
  4. Verify signature
  5. Check NFT ownership
  6. Store verification or show error

---

## Phase 5: Complete Verification Flow

### 5.1 End-to-End Verification
- [ ] Link all components together:
  - Challenge → Signature → Verification → NFT Check → Database Storage
- [ ] Handle verification success:
  - Store in database
  - Send success message
  - (Group invitation in next phase)
- [ ] Handle verification failures:
  - Clear error messages
  - Retry mechanisms
  - Help guidance

### 5.2 Status Checking
- [ ] Implement `/status` command:
  - Check if user is verified
  - Show wallet address if verified
  - Show verification date
  - Show last ownership check date

### 5.3 Update Mechanism Foundation
- [ ] Implement `/update` command basic structure:
  - Get all verified users from database
  - Check each user's current NFT ownership
  - Remove users who no longer own NFTs
  - Update last_checked_date for valid users

---

## Phase 6: Telegram Group Integration

### 6.1 Group Setup
- [ ] Create private Telegram group for Panthers holders
- [ ] Add bot to group as administrator
- [ ] Configure group permissions (only admins can add members)
- [ ] Test bot's group management permissions

### 6.2 Group Management Functions
- [ ] Implement `inviteUserToGroup(telegramId)` function
- [ ] Implement `removeUserFromGroup(telegramId)` function
- [ ] Handle group invitation errors
- [ ] Add group management to verification success flow

### 6.3 Complete Access Control
- [ ] Link verification success → automatic group invitation
- [ ] Link `/update` failures → automatic group removal
- [ ] Handle edge cases:
  - User already in group
  - User left group but still verified
  - Bot permissions issues

---

## Phase 7: Production Hardening

### 7.1 Error Handling & Resilience
- [ ] Comprehensive error handling for all functions
- [ ] Retry logic for network calls
- [ ] Graceful degradation when services are down
- [ ] Rate limiting for verification attempts

### 7.2 Security Enhancements
- [ ] Secure environment variable handling
- [ ] Input validation and sanitization
- [ ] Protection against common attacks
- [ ] Audit data storage practices

### 7.3 Performance Optimization
- [ ] Implement proper caching strategies
- [ ] Optimize database queries
- [ ] Batch process multiple user checks
- [ ] Monitor and log performance metrics

### 7.4 Deployment Preparation
- [ ] Switch to PostgreSQL for production
- [ ] Create deployment configuration
- [ ] Set up process management (PM2)
- [ ] Configure logging and monitoring
- [ ] Create backup/recovery procedures

---

## Testing Checkpoints

**After Phase 2:** Bot responds to all commands
**After Phase 3:** Can query Secret Network successfully  
**After Phase 4:** Can verify Keplr signatures
**After Phase 5:** Complete verification flow works
**After Phase 6:** Group management works end-to-end
**After Phase 7:** Production-ready system

---

## Estimated Timeline

### Development Schedule
- **Phases 1-2:** 3-4 days (Foundation & Bot Framework)
- **Phases 3-4:** 4-5 days (Secret Network & Keplr Integration)
- **Phases 5-6:** 4-5 days (Verification Flow & Group Management)
- **Phase 7:** 3-4 days (Production Hardening)

**Total: ~2-3 weeks** depending on complexity of issues encountered.

### Daily Breakdown Suggestion
**Week 1:**
- Days 1-2: Phase 1 (Project setup, database, config)
- Days 3-4: Phase 2 (Basic bot commands and framework)
- Day 5: Phase 3 start (Secret Network connection)

**Week 2:**
- Days 1-2: Phase 3 finish (Contract queries and ownership logic)
- Days 3-4: Phase 4 (Keplr integration and signature verification)
- Day 5: Phase 5 start (End-to-end verification flow)

**Week 3:**
- Days 1-2: Phase 5 finish (Complete verification system)
- Days 3-4: Phase 6 (Telegram group management)
- Day 5: Phase 7 start (Security and error handling)

**Week 4 (if needed):**
- Days 1-2: Phase 7 finish (Production hardening)
- Days 3-4: Testing and deployment
- Day 5: Buffer for issues and final polish

---

## Risk Mitigation Strategy

### High-Risk Tasks
1. **Keplr signature verification** - Complex cryptography, test thoroughly
2. **Secret Network queries** - Network dependency, implement retries
3. **Telegram group permissions** - Bot setup critical, verify early
4. **Database migrations** - Data integrity, backup before changes

### Fallback Plans
- **Secret Network issues** → Use cached results temporarily
- **Keplr integration problems** → Provide manual verification option
- **Group management failures** → Manual group management as backup
- **Database corruption** → Regular backups and recovery procedures

---

## Success Criteria

### Phase Completion Requirements
- **Phase 1:** All dependencies installed, database operational, config working
- **Phase 2:** Bot responds to all commands, basic conversation flow works
- **Phase 3:** Can successfully query Panthers NFT contract
- **Phase 4:** Can verify signatures and extract wallet addresses
- **Phase 5:** Complete verification flow works end-to-end
- **Phase 6:** Group management fully automated
- **Phase 7:** Production-ready with monitoring and error handling

### Final Acceptance Criteria
- [ ] User can verify once and maintain access
- [ ] `/update` command removes users who sold NFTs
- [ ] System handles 100+ concurrent users
- [ ] Error messages are clear and helpful
- [ ] No security vulnerabilities identified
- [ ] Production deployment successful
