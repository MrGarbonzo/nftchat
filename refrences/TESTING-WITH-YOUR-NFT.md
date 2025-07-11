# Testing with Your Existing NFT

*Step-by-step guide to test the bot with an NFT you already own*

---

## 🎯 Overview

Before deploying for your new NFT project, test the bot with an existing Secret Network NFT you already own. This ensures everything works perfectly before going live.

---

## 📋 Prerequisites

### What You Need
- ✅ A Secret Network NFT you already own
- ✅ The wallet containing that NFT
- ✅ Access to create a Telegram bot and test group
- ✅ Basic command line access

### What We'll Test
- ✅ Wallet signature verification
- ✅ Secret Network connectivity
- ✅ NFT ownership detection
- ✅ Telegram bot responses
- ✅ Database operations

---

## 🔍 Step 1: Find Your NFT Details

### Method 1: Check Your Wallet
1. Open your Keplr/other Secret Network wallet
2. Go to transaction history
3. Find the NFT purchase/mint transaction
4. Copy the contract address from the transaction

### Method 2: Use Secret Network Explorer
1. Visit [secretnodes.com](https://secretnodes.com) or [mintscan.io](https://mintscan.io/secret)
2. Search for your NFT collection name
3. Find the contract details
4. Copy both contract address and code hash

### Method 3: Collection Documentation
Most NFT projects list their contract details in:
- Official website
- Discord announcements
- Documentation/GitBook
- Social media pinned posts

### What You're Looking For
```
Contract Address: secret1abc123... (42 characters starting with secret1)
Code Hash: abc123def456... (64 character hex string)
```

---

## 🔧 Step 2: Set Up Test Environment

### Configure Test Environment
1. **Copy the test template:**
   ```bash
   cp .env.test-nft .env
   ```

2. **Fill in your details:**
   ```env
   # Your test bot token from @BotFather
   BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   
   # Your NFT collection name (for display)
   PROJECT_NAME=My Test NFT Collection
   
   # Your test group ID (see instructions below)
   GROUP_ID=-1001234567890
   
   # YOUR NFT CONTRACT DETAILS (most important!)
   CONTRACT_ADDRESS=secret1your_nft_contract_here
   CONTRACT_CODE_HASH=your_64_char_code_hash_here
   ```

### Create Test Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command
3. Choose a test name like "MyNFTTestBot"
4. Copy the bot token

### Create Test Group
1. Create a new Telegram group
2. Add your test bot to the group
3. Make the bot an admin with these permissions:
   - ✅ Add new admins
   - ✅ Ban users
   - ✅ Delete messages (optional)

### Get Group ID
1. Send a message in your test group
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find your group ID (negative number like `-1001234567890`)
4. Add it to your `.env` file

---

## 🚀 Step 3: Run the Test

### Start the Bot
```bash
# Set up database
npm run migrate

# Start the bot in test mode
cp .env.test-nft .env
npm run dev
```

### Test the Verification Flow
1. **Start verification:**
   - Message your bot: `/start`
   - Then: `/verify`

2. **Sign the challenge:**
   - Copy the challenge message from the bot
   - Open Keplr wallet
   - Go to "Sign" → "Sign Arbitrary Data"
   - Paste the challenge and sign
   - Copy the complete signature response

3. **Complete verification:**
   - Send the signature back to the bot
   - Bot should verify your NFT ownership
   - You should be welcomed to the test group

### Test Other Commands
```bash
/status  # Check your verification status
/help    # View help information
/update  # Test the re-verification system
```

---

## ✅ Verification Checklist

### During Testing, Verify:
- [ ] Bot responds to `/start` command
- [ ] Challenge message is generated with `/verify`
- [ ] Keplr signature process works
- [ ] Bot recognizes your NFT ownership
- [ ] You receive success confirmation
- [ ] `/status` shows your verification details
- [ ] `/update` command works (re-checks ownership)
- [ ] Error messages are helpful if something fails

### Check These Logs:
```bash
# View bot logs
tail -f logs/test-bot.log

# Check for errors
grep ERROR logs/test-bot.log
```

---

## 🛠️ Troubleshooting

### Common Issues

#### "No NFTs found" Error
**Possible causes:**
- Wrong contract address
- Wrong code hash
- NFT requires viewing key
- Using wrong wallet

**Solutions:**
1. Double-check contract address and code hash
2. Verify you're using the correct wallet
3. Check if collection requires viewing keys

#### "Invalid signature format" Error
**Possible causes:**
- Incomplete copy/paste from Keplr
- Wrong network selected in Keplr
- Corrupted signature

**Solutions:**
1. Copy the COMPLETE response from Keplr
2. Ensure Secret Network is selected in Keplr
3. Try signing again

#### Bot Not Responding
**Possible causes:**
- Wrong bot token
- Bot not added to group
- Network connectivity issues

**Solutions:**
1. Verify bot token is correct
2. Ensure bot is admin in test group
3. Check internet connection and Secret Network status

#### "Contract query failed" Error
**Possible causes:**
- Invalid contract address
- Wrong code hash
- Secret Network maintenance
- Rate limiting

**Solutions:**
1. Verify contract details are exactly correct
2. Wait and try again (may be temporary)
3. Check Secret Network status

---

## 📊 Success Metrics

### You'll Know It's Working When:
- ✅ Bot responds to all commands
- ✅ Signature verification completes successfully
- ✅ Your NFT ownership is detected
- ✅ You're added to the test group
- ✅ Status command shows correct info
- ✅ Update command works without errors

### Performance Expectations:
- **Command response:** < 2 seconds
- **Signature verification:** < 10 seconds
- **NFT ownership check:** < 5 seconds
- **Database operations:** < 1 second

---

## 🔄 After Successful Testing

### Clean Up Test Environment
```bash
# Stop the test bot
Ctrl+C

# Switch back to main branch
git checkout main

# Your test branch remains for reference
git branch  # Should show 'test' branch exists
```

### Prepare for Production
1. Keep test configuration for reference
2. Document any issues encountered
3. Note your specific NFT's requirements
4. Prepare production environment file

### When Your NFT Launches
1. Create new branch: `git checkout -b project-yourname`
2. Update contract address to your new NFT
3. Update project name and branding
4. Deploy with confidence knowing it works!

---

## 📞 Getting Help

### If You're Stuck:
1. **Check the logs first:** `tail -f logs/test-bot.log`
2. **Verify configuration:** Run config validation
3. **Double-check contract details:** Use Secret Network explorer
4. **Test with different wallet:** If available

### Common Resources:
- **Secret Network Explorer:** [secretnodes.com](https://secretnodes.com)
- **Mintscan:** [mintscan.io/secret](https://mintscan.io/secret)
- **Secret Network Docs:** [docs.scrt.network](https://docs.scrt.network)
- **Keplr Support:** [help.keplr.app](https://help.keplr.app)

---

*Testing with your existing NFT ensures a smooth deployment when your new collection launches!*