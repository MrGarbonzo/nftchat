const db = require('./connection');
const crypto = require('crypto');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class UserModel {
  async create(telegramUserId, walletAddress, userData = {}) {
    const { username, first_name } = userData;
    
    await db.run(
      `INSERT OR REPLACE INTO users 
       (telegram_user_id, wallet_address, username, first_name, is_verified, updated_at) 
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [telegramUserId, walletAddress, username, first_name]
    );
    
    logger.info('User created/updated', { telegramUserId, walletAddress });
  }

  async findByTelegramId(telegramUserId) {
    return await db.get(
      'SELECT * FROM users WHERE telegram_user_id = ?',
      [telegramUserId]
    );
  }

  async findByWalletAddress(walletAddress) {
    return await db.get(
      'SELECT * FROM users WHERE wallet_address = ?',
      [walletAddress]
    );
  }

  async updateVerificationStatus(telegramUserId, isVerified) {
    await db.run(
      `UPDATE users 
       SET is_verified = ?, last_checked_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE telegram_user_id = ?`,
      [isVerified ? 1 : 0, telegramUserId]
    );
  }

  async getAllVerifiedUsers() {
    return await db.all(
      'SELECT * FROM users WHERE is_verified = 1'
    );
  }

  async deleteUser(telegramUserId) {
    await db.run(
      'DELETE FROM users WHERE telegram_user_id = ?',
      [telegramUserId]
    );
  }
}

class ChallengeModel {
  async create(telegramUserId) {
    const challengeId = crypto.randomBytes(16).toString('hex');
    const challengeMessage = `Verify ${config.telegram.projectName} NFT access - Challenge ID: ${challengeId}`;
    const expiryDate = new Date(Date.now() + config.security.challengeExpiryMinutes * 60 * 1000);
    
    await db.run(
      `INSERT INTO verification_challenges 
       (challenge_id, telegram_user_id, challenge_message, expiry_date) 
       VALUES (?, ?, ?, ?)`,
      [challengeId, telegramUserId, challengeMessage, expiryDate.toISOString()]
    );
    
    return {
      challengeId,
      challengeMessage,
      expiryDate
    };
  }

  async findValid(challengeId) {
    return await db.get(
      `SELECT * FROM verification_challenges 
       WHERE challenge_id = ? 
       AND expiry_date > datetime('now') 
       AND used = 0`,
      [challengeId]
    );
  }

  async markUsed(challengeId) {
    await db.run(
      `UPDATE verification_challenges 
       SET used = 1, used_at = CURRENT_TIMESTAMP 
       WHERE challenge_id = ?`,
      [challengeId]
    );
  }

  async cleanupExpired() {
    const result = await db.run(
      `DELETE FROM verification_challenges 
       WHERE expiry_date < datetime('now') 
       OR used = 1`
    );
    
    if (result.changes > 0) {
      logger.info('Cleaned up expired challenges', { count: result.changes });
    }
  }
}

class RateLimitModel {
  async checkLimit(telegramUserId, action) {
    const windowStart = new Date(Date.now() - config.security.rateLimitWindowMinutes * 60 * 1000);
    
    const count = await db.get(
      `SELECT COUNT(*) as count FROM rate_limits 
       WHERE telegram_user_id = ? 
       AND action = ? 
       AND timestamp > ?`,
      [telegramUserId, action, windowStart.toISOString()]
    );
    
    return count.count < config.security.rateLimitMaxRequests;
  }

  async recordAction(telegramUserId, action) {
    await db.run(
      'INSERT INTO rate_limits (telegram_user_id, action) VALUES (?, ?)',
      [telegramUserId, action]
    );
  }

  async cleanup() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    const result = await db.run(
      'DELETE FROM rate_limits WHERE timestamp < ?',
      [cutoff.toISOString()]
    );
    
    if (result.changes > 0) {
      logger.info('Cleaned up old rate limit records', { count: result.changes });
    }
  }
}

class AuditModel {
  async log(telegramUserId, action, details = null) {
    await db.run(
      'INSERT INTO audit_log (telegram_user_id, action, details) VALUES (?, ?, ?)',
      [telegramUserId, action, details]
    );
  }

  async getRecentLogs(limit = 100) {
    return await db.all(
      'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
  }

  async getUserLogs(telegramUserId, limit = 50) {
    return await db.all(
      'SELECT * FROM audit_log WHERE telegram_user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [telegramUserId, limit]
    );
  }
}

module.exports = {
  user: new UserModel(),
  challenge: new ChallengeModel(),
  rateLimit: new RateLimitModel(),
  audit: new AuditModel()
};