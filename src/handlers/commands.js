const { config } = require('../config/config');
const logger = require('../utils/logger');
const verificationService = require('../services/verification');

// Store user sessions for multi-step verification
const userSessions = new Map();

function setupCommands(bot) {
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('verify', handleVerify);
  bot.command('status', handleStatus);
  bot.command('update', handleUpdate);
  
  // Handle text messages for signature submission
  bot.on('text', handleTextMessage);
}

async function handleStart(ctx) {
  const welcomeText = `
Welcome to ${config.telegram.projectName} NFT Verification Bot! 🎉

This bot verifies your NFT ownership and grants access to exclusive Telegram groups.

Commands:
/verify - Start the verification process
/status - Check your verification status
/help - Show this help message

To get started, use /verify to connect your wallet.
`;
  
  await ctx.reply(welcomeText);
  logger.info('User started bot', { userId: ctx.from.id, username: ctx.from.username });
}

async function handleHelp(ctx) {
  const helpText = `
${config.telegram.botName} Help 📖

Available commands:
/start - Show welcome message
/verify - Verify your NFT ownership
/status - Check your current verification status
/update - Refresh group membership (admin only)
/help - Show this help message

Verification Process:
1. Use /verify to start
2. Sign a message with your Keplr wallet
3. Send the signature back to the bot
4. Bot verifies your NFT ownership
5. You're added to the exclusive group!

Need assistance? Contact the project admins.
`;
  
  await ctx.reply(helpText);
}

async function handleVerify(ctx) {
  const telegramUserId = ctx.from.id.toString();
  
  try {
    // Check if user is already verified
    const status = await verificationService.getVerificationStatus(telegramUserId);
    if (status.verified) {
      await ctx.reply(`✅ You are already verified!\n\n${status.message}\n\nVerified on: ${new Date(status.verificationDate).toLocaleDateString()}`);
      return;
    }
    
    // Start new verification
    const challenge = await verificationService.startVerification(telegramUserId, {
      username: ctx.from.username,
      first_name: ctx.from.first_name
    });
    
    // Store session for signature submission
    userSessions.set(telegramUserId, {
      challengeId: challenge.challengeId,
      step: 'awaiting_signature',
      expiresAt: challenge.expiryDate
    });
    
    const instructionText = `🔐 **Wallet Verification Process**

**Step 1:** Copy the challenge message below:

\`\`\`
${challenge.challengeMessage}
\`\`\`

**Step 2:** Open your Keplr wallet

**Step 3:** Go to "Sign" or "Sign Arbitrary Data"

**Step 4:** Paste the challenge message and sign with your Secret Network account

**Step 5:** Copy the complete signature response and send it back to this bot

⏰ This challenge expires in ${config.security.challengeExpiryMinutes} minutes.

📋 **Important:** Make sure you're connected to Secret Network in Keplr!`;
    
    await ctx.reply(instructionText, { parse_mode: 'Markdown' });
    
  } catch (error) {
    logger.error('Verification command failed', { error, userId: ctx.from.id });
    await ctx.reply(`❌ Verification failed: ${error.message}`);
  }
}

async function handleStatus(ctx) {
  const telegramUserId = ctx.from.id.toString();
  
  try {
    const status = await verificationService.getVerificationStatus(telegramUserId);
    
    if (status.verified) {
      const statusText = `✅ **Verification Status: VERIFIED**

👤 **User:** ${ctx.from.first_name} ${ctx.from.last_name || ''}
👛 **Wallet:** \`${status.walletAddress}\`
📅 **Verified:** ${new Date(status.verificationDate).toLocaleDateString()}
🔄 **Last Checked:** ${new Date(status.lastChecked).toLocaleDateString()}

🎉 You have access to all ${config.telegram.projectName} features!`;
      
      await ctx.reply(statusText, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`❌ **Verification Status: NOT VERIFIED**

${status.message}

Use /verify to start the verification process.`, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    logger.error('Status command failed', { error, userId: ctx.from.id });
    await ctx.reply('❌ Unable to check verification status. Please try again later.');
  }
}

async function handleUpdate(ctx) {
  const telegramUserId = ctx.from.id.toString();
  
  try {
    await ctx.reply('🔄 Starting verification update for all users...\nThis may take a few moments.');
    
    const results = await verificationService.reVerifyAllUsers();
    
    const updateText = `✅ **Verification Update Complete**

📊 **Results:**
• Total users checked: ${results.total}
• Still verified: ${results.stillValid} ✅
• Verification revoked: ${results.revoked} ❌
• Errors: ${results.errors} ⚠️

${results.revoked > 0 ? `\n⚠️ ${results.revoked} user(s) no longer own ${config.telegram.projectName} NFTs and have been removed from verified status.` : ''}

${results.errors > 0 ? `\n⚠️ ${results.errors} user(s) could not be checked due to errors.` : ''}

All users with valid NFT ownership remain verified.`;
    
    await ctx.reply(updateText, { parse_mode: 'Markdown' });
    
    logger.info('Update command completed', { 
      userId: ctx.from.id,
      results: {
        total: results.total,
        stillValid: results.stillValid,
        revoked: results.revoked,
        errors: results.errors
      }
    });
    
  } catch (error) {
    logger.error('Update command failed', { error, userId: ctx.from.id });
    await ctx.reply('❌ Update failed. Please try again later or contact support.');
  }
}

async function handleTextMessage(ctx) {
  // Skip if message is a command
  if (ctx.message.text.startsWith('/')) {
    return;
  }
  
  const telegramUserId = ctx.from.id.toString();
  const session = userSessions.get(telegramUserId);
  
  // Check if user has an active session
  if (!session) {
    return; // Ignore text messages when no verification in progress
  }
  
  // Check if session expired
  if (new Date() > new Date(session.expiresAt)) {
    userSessions.delete(telegramUserId);
    await ctx.reply('⏰ Verification session expired. Please start again with /verify');
    return;
  }
  
  // Handle signature submission
  if (session.step === 'awaiting_signature') {
    try {
      await ctx.reply('🔄 Verifying signature...');
      
      const result = await verificationService.completeVerification(
        telegramUserId,
        session.challengeId,
        ctx.message.text,
        {
          username: ctx.from.username,
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name
        }
      );
      
      // Clear session
      userSessions.delete(telegramUserId);
      
      if (result.success) {
        const successText = `🎉 **Verification Successful!**

✅ Wallet verified: \`${result.walletAddress}\`

${config.telegram.welcomeMessage}

You can now use /status to check your verification details.`;
        
        await ctx.reply(successText, { parse_mode: 'Markdown' });
      }
      
    } catch (error) {
      logger.error('Signature verification failed', { error, userId: ctx.from.id });
      
      let errorMessage = '❌ Verification failed: ';
      if (error.message.includes('Invalid signature format')) {
        errorMessage += `${error.message}

Please make sure to copy the COMPLETE response from Keplr, which should look like:
\`\`\`
{
  "signature": "...",
  "pub_key": {
    "type": "tendermint/PubKeySecp256k1",
    "value": "..."
  }
}
\`\`\`

You can try again with /verify`;
      } else {
        errorMessage += error.message;
      }
      
      await ctx.reply(errorMessage, { parse_mode: 'Markdown' });
      
      // Keep session active for retry unless it's a fatal error
      if (!error.message.includes('expired') && !error.message.includes('already linked')) {
        // Allow retry
        return;
      }
      
      // Clear session for fatal errors
      userSessions.delete(telegramUserId);
    }
  }
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = new Date();
  for (const [userId, session] of userSessions.entries()) {
    if (now > new Date(session.expiresAt)) {
      userSessions.delete(userId);
      logger.info('Cleaned up expired session', { userId });
    }
  }
}, 60000); // Check every minute

module.exports = { setupCommands };