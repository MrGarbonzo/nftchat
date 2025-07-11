const { user, challenge, rateLimit, audit } = require('../database/models');
const { generateChallenge, parseKeplrResponse, verifySignature } = require('../utils/crypto');
const secretNetwork = require('./secretNetwork');
const logger = require('../utils/logger');
const { config } = require('../config/config');

class VerificationService {
  
  /**
   * Start the verification process for a user
   * @param {string} telegramUserId - Telegram user ID
   * @param {object} userData - User data from Telegram
   * @returns {object} Challenge information
   */
  async startVerification(telegramUserId, userData = {}) {
    try {
      // Check rate limits
      const canProceed = await rateLimit.checkLimit(telegramUserId, 'verify_start');
      if (!canProceed) {
        throw new Error('Rate limit exceeded. Please wait before trying again.');
      }
      
      // Record the action
      await rateLimit.recordAction(telegramUserId, 'verify_start');
      
      // Clean up any expired challenges
      await challenge.cleanupExpired();
      
      // Generate new challenge
      const challengeData = generateChallenge(telegramUserId);
      const stored = await challenge.create(telegramUserId);
      
      // Log the action
      await audit.log(telegramUserId, 'verification_started', JSON.stringify({
        username: userData.username,
        first_name: userData.first_name
      }));
      
      logger.info('Verification started', { 
        telegramUserId, 
        challengeId: stored.challengeId 
      });
      
      return {
        challengeId: stored.challengeId,
        challengeMessage: stored.challengeMessage,
        expiryDate: stored.expiryDate
      };
      
    } catch (error) {
      logger.error('Failed to start verification', { error, telegramUserId });
      throw error;
    }
  }
  
  /**
   * Complete verification with Keplr signature
   * @param {string} telegramUserId - Telegram user ID
   * @param {string} challengeId - Challenge ID from start verification
   * @param {string} signatureResponse - JSON response from Keplr
   * @param {object} userData - User data from Telegram
   * @returns {object} Verification result
   */
  async completeVerification(telegramUserId, challengeId, signatureResponse, userData = {}) {
    try {
      // Check rate limits
      const canProceed = await rateLimit.checkLimit(telegramUserId, 'verify_complete');
      if (!canProceed) {
        throw new Error('Rate limit exceeded. Please wait before trying again.');
      }
      
      // Record the action
      await rateLimit.recordAction(telegramUserId, 'verify_complete');
      
      // Find and validate challenge
      const challengeData = await challenge.findValid(challengeId);
      if (!challengeData) {
        throw new Error('Invalid or expired challenge. Please start verification again with /verify');
      }
      
      // Parse Keplr response
      let parsedSignature;
      try {
        parsedSignature = parseKeplrResponse(signatureResponse);
      } catch (error) {
        await audit.log(telegramUserId, 'verification_failed', 'Invalid signature format');
        throw new Error('Invalid signature format. Please copy the complete response from Keplr.');
      }
      
      // Verify signature
      const verification = await verifySignature(
        challengeData.challenge_message,
        parsedSignature.signature,
        parsedSignature.pubKey
      );
      
      if (!verification.isValid) {
        await audit.log(telegramUserId, 'verification_failed', 'Invalid signature');
        throw new Error('Signature verification failed. Please ensure you signed the correct message with the right account.');
      }
      
      // Mark challenge as used
      await challenge.markUsed(challengeId);
      
      // Check if wallet is already associated with another user
      const existingUser = await user.findByWalletAddress(verification.address);
      if (existingUser && existingUser.telegram_user_id !== telegramUserId) {
        await audit.log(telegramUserId, 'verification_failed', `Wallet already linked to user ${existingUser.telegram_user_id}`);
        throw new Error('This wallet is already linked to another Telegram account.');
      }
      
      // Check NFT ownership
      let ownershipResult;
      try {
        ownershipResult = await secretNetwork.checkNFTOwnership(verification.address);
      } catch (error) {
        logger.error('NFT ownership check failed', { error, walletAddress: verification.address });
        throw new Error('Unable to verify NFT ownership. Please try again later.');
      }
      
      if (!ownershipResult.hasNFT) {
        await audit.log(telegramUserId, 'verification_failed', `No NFTs found for wallet ${verification.address}`);
        
        if (ownershipResult.requiresViewingKey) {
          throw new Error('This collection requires a viewing key for verification. Please contact support for assistance.');
        }
        
        throw new Error(`No ${config.telegram.projectName} NFTs found in wallet ${verification.address}`);
      }
      
      // Create or update user
      await user.create(telegramUserId, verification.address, userData);
      
      // Log successful verification
      await audit.log(telegramUserId, 'verification_completed', JSON.stringify({
        wallet_address: verification.address,
        username: userData.username,
        nft_count: ownershipResult.tokenCount
      }));
      
      logger.info('Verification completed', {
        telegramUserId,
        walletAddress: verification.address,
        nftCount: ownershipResult.tokenCount
      });
      
      return {
        success: true,
        walletAddress: verification.address,
        nftCount: ownershipResult.tokenCount,
        message: `Wallet successfully verified! Found ${ownershipResult.tokenCount} ${config.telegram.projectName} NFT${ownershipResult.tokenCount === 1 ? '' : 's'}. You can now access exclusive features.`
      };
      
    } catch (error) {
      logger.error('Verification failed', { error, telegramUserId });
      await audit.log(telegramUserId, 'verification_error', error.message);
      throw error;
    }
  }
  
  /**
   * Check verification status for a user
   * @param {string} telegramUserId - Telegram user ID
   * @returns {object} Verification status
   */
  async getVerificationStatus(telegramUserId) {
    try {
      const userData = await user.findByTelegramId(telegramUserId);
      
      if (!userData) {
        return {
          verified: false,
          message: 'Not verified. Use /verify to start the verification process.'
        };
      }
      
      if (!userData.is_verified) {
        return {
          verified: false,
          walletAddress: userData.wallet_address,
          message: 'Verification incomplete. Please complete the verification process.'
        };
      }
      
      return {
        verified: true,
        walletAddress: userData.wallet_address,
        verificationDate: userData.verification_date,
        lastChecked: userData.last_checked_date,
        message: `Verified with wallet: ${userData.wallet_address}`
      };
      
    } catch (error) {
      logger.error('Failed to check verification status', { error, telegramUserId });
      throw error;
    }
  }
  
  /**
   * Revoke verification for a user
   * @param {string} telegramUserId - Telegram user ID
   * @returns {boolean} Success status
   */
  async revokeVerification(telegramUserId) {
    try {
      const userData = await user.findByTelegramId(telegramUserId);
      if (!userData) {
        return false;
      }
      
      await user.updateVerificationStatus(telegramUserId, false);
      await audit.log(telegramUserId, 'verification_revoked', `Wallet: ${userData.wallet_address}`);
      
      logger.info('Verification revoked', { telegramUserId, walletAddress: userData.wallet_address });
      return true;
      
    } catch (error) {
      logger.error('Failed to revoke verification', { error, telegramUserId });
      throw error;
    }
  }
  
  /**
   * Get all verified users (admin function)
   * @returns {Array} List of verified users
   */
  async getAllVerified() {
    try {
      return await user.getAllVerifiedUsers();
    } catch (error) {
      logger.error('Failed to get verified users', { error });
      throw error;
    }
  }
  
  /**
   * Re-verify all users' NFT ownership (admin function)
   * @returns {object} Re-verification results
   */
  async reVerifyAllUsers() {
    try {
      const verifiedUsers = await user.getAllVerifiedUsers();
      const results = {
        total: verifiedUsers.length,
        stillValid: 0,
        revoked: 0,
        errors: 0,
        details: []
      };
      
      logger.info('Starting re-verification of all users', { totalUsers: verifiedUsers.length });
      
      for (const userData of verifiedUsers) {
        try {
          const ownershipResult = await secretNetwork.checkNFTOwnership(userData.wallet_address);
          
          if (ownershipResult.hasNFT) {
            // Still has NFTs - update last checked date
            await user.updateVerificationStatus(userData.telegram_user_id, true);
            results.stillValid++;
            
            results.details.push({
              telegramUserId: userData.telegram_user_id,
              walletAddress: userData.wallet_address,
              status: 'valid',
              nftCount: ownershipResult.tokenCount
            });
            
          } else {
            // No longer has NFTs - revoke verification
            await user.updateVerificationStatus(userData.telegram_user_id, false);
            results.revoked++;
            
            await audit.log(userData.telegram_user_id, 'verification_revoked_update', 
              `No NFTs found during update check`);
            
            results.details.push({
              telegramUserId: userData.telegram_user_id,
              walletAddress: userData.wallet_address,
              status: 'revoked',
              reason: 'No NFTs found'
            });
          }
          
        } catch (error) {
          results.errors++;
          logger.error('Re-verification failed for user', { 
            error, 
            telegramUserId: userData.telegram_user_id,
            walletAddress: userData.wallet_address 
          });
          
          results.details.push({
            telegramUserId: userData.telegram_user_id,
            walletAddress: userData.wallet_address,
            status: 'error',
            error: error.message
          });
        }
      }
      
      await audit.log('system', 'bulk_reverification_completed', JSON.stringify({
        total: results.total,
        stillValid: results.stillValid,
        revoked: results.revoked,
        errors: results.errors
      }));
      
      logger.info('Re-verification completed', results);
      return results;
      
    } catch (error) {
      logger.error('Re-verification process failed', { error });
      throw error;
    }
  }
}

module.exports = new VerificationService();