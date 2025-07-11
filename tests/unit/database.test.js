const Database = require('../../src/database/connection').constructor;
const { user, challenge, rateLimit, audit } = require('../../src/database/models');

describe('Database', () => {
  let db;

  beforeAll(async () => {
    // Create a fresh database instance for tests
    const { config } = require('../../src/config/config');
    const sqlite3 = require('sqlite3').verbose();
    const logger = require('../../src/utils/logger');
    
    db = {
      db: null,
      async connect() {
        return new Promise((resolve) => {
          this.db = new sqlite3.Database(':memory:', () => {
            resolve();
          });
        });
      },
      async run(sql, params = []) {
        return new Promise((resolve, reject) => {
          this.db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      async get(sql, params = []) {
        return new Promise((resolve, reject) => {
          this.db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      async all(sql, params = []) {
        return new Promise((resolve, reject) => {
          this.db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      async close() {
        return new Promise((resolve) => {
          if (this.db) {
            this.db.close(() => {
              this.db = null;
              resolve();
            });
          } else {
            resolve();
          }
        });
      }
    };
    
    // Replace the singleton with our test instance
    require('../../src/database/connection').connect = db.connect.bind(db);
    require('../../src/database/connection').run = db.run.bind(db);
    require('../../src/database/connection').get = db.get.bind(db);
    require('../../src/database/connection').all = db.all.bind(db);
    require('../../src/database/connection').close = db.close.bind(db);
    
    await db.connect();
    
    // Run migrations
    const fs = require('fs').promises;
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../../src/database/migrations');
    const sql = await fs.readFile(path.join(migrationsDir, '001_initial.sql'), 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    for (const statement of statements) {
      await db.run(statement);
    }
  });

  afterAll(async () => {
    await db.close();
  });

  describe('User Model', () => {
    const testUserId = '123456789';
    const testWallet = 'secret1testwalletaddress1234567890';

    afterEach(async () => {
      await db.run('DELETE FROM users');
    });

    test('should create a new user', async () => {
      await user.create(testUserId, testWallet, {
        username: 'testuser',
        first_name: 'Test'
      });

      const found = await user.findByTelegramId(testUserId);
      expect(found).toBeTruthy();
      expect(found.telegram_user_id).toBe(testUserId);
      expect(found.wallet_address).toBe(testWallet);
      expect(found.username).toBe('testuser');
      expect(found.is_verified).toBe(1);
    });

    test('should find user by wallet address', async () => {
      await user.create(testUserId, testWallet);
      
      const found = await user.findByWalletAddress(testWallet);
      expect(found).toBeTruthy();
      expect(found.telegram_user_id).toBe(testUserId);
    });

    test('should update verification status', async () => {
      await user.create(testUserId, testWallet);
      await user.updateVerificationStatus(testUserId, false);
      
      const found = await user.findByTelegramId(testUserId);
      expect(found.is_verified).toBe(0);
    });

    test('should get all verified users', async () => {
      await user.create('111', 'secret1aaa');
      await user.create('222', 'secret1bbb');
      await user.updateVerificationStatus('222', false);
      
      const verified = await user.getAllVerifiedUsers();
      expect(verified).toHaveLength(1);
      expect(verified[0].telegram_user_id).toBe('111');
    });

    test('should delete user', async () => {
      await user.create(testUserId, testWallet);
      await user.deleteUser(testUserId);
      
      const found = await user.findByTelegramId(testUserId);
      expect(found).toBeUndefined();
    });
  });

  describe('Challenge Model', () => {
    const testUserId = '987654321';

    afterEach(async () => {
      await db.run('DELETE FROM verification_challenges');
    });

    test('should create a challenge', async () => {
      const result = await challenge.create(testUserId);
      
      expect(result.challengeId).toBeTruthy();
      expect(result.challengeMessage).toContain('Test NFT Project');
      expect(result.challengeMessage).toContain(result.challengeId);
      expect(result.expiryDate).toBeInstanceOf(Date);
    });

    test('should find valid challenge', async () => {
      const created = await challenge.create(testUserId);
      
      const found = await challenge.findValid(created.challengeId);
      expect(found).toBeTruthy();
      expect(found.telegram_user_id).toBe(testUserId);
      expect(found.used).toBe(0);
    });

    test('should not find expired challenge', async () => {
      const challengeId = 'expired123';
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      await db.run(
        `INSERT INTO verification_challenges 
         (challenge_id, telegram_user_id, challenge_message, expiry_date) 
         VALUES (?, ?, ?, ?)`,
        [challengeId, testUserId, 'Test message', pastDate.toISOString()]
      );
      
      const found = await challenge.findValid(challengeId);
      expect(found).toBeUndefined();
    });

    test('should mark challenge as used', async () => {
      const created = await challenge.create(testUserId);
      await challenge.markUsed(created.challengeId);
      
      const found = await challenge.findValid(created.challengeId);
      expect(found).toBeUndefined(); // No longer valid after use
    });

    test('should cleanup expired challenges', async () => {
      // Create expired challenge
      const pastDate = new Date(Date.now() - 3600000);
      await db.run(
        `INSERT INTO verification_challenges 
         (challenge_id, telegram_user_id, challenge_message, expiry_date) 
         VALUES ('old1', ?, 'Old message', ?)`,
        [testUserId, pastDate.toISOString()]
      );
      
      // Create valid challenge
      await challenge.create(testUserId);
      
      await challenge.cleanupExpired();
      
      const all = await db.all('SELECT * FROM verification_challenges');
      expect(all).toHaveLength(1);
      expect(all[0].challenge_id).not.toBe('old1');
    });
  });

  describe('Rate Limit Model', () => {
    const testUserId = '555555555';

    afterEach(async () => {
      await db.run('DELETE FROM rate_limits');
    });

    test('should allow actions within rate limit', async () => {
      const allowed = await rateLimit.checkLimit(testUserId, 'verify');
      expect(allowed).toBe(true);
    });

    test('should record actions', async () => {
      await rateLimit.recordAction(testUserId, 'verify');
      await rateLimit.recordAction(testUserId, 'verify');
      
      const records = await db.all(
        'SELECT * FROM rate_limits WHERE telegram_user_id = ?',
        [testUserId]
      );
      expect(records).toHaveLength(2);
    });

    test('should enforce rate limits', async () => {
      // Record max allowed actions
      for (let i = 0; i < 10; i++) {
        await rateLimit.recordAction(testUserId, 'verify');
      }
      
      const allowed = await rateLimit.checkLimit(testUserId, 'verify');
      expect(allowed).toBe(false);
    });

    test('should allow actions after window expires', async () => {
      // Record old action
      const oldTime = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      await db.run(
        'INSERT INTO rate_limits (telegram_user_id, action, timestamp) VALUES (?, ?, ?)',
        [testUserId, 'verify', oldTime.toISOString()]
      );
      
      const allowed = await rateLimit.checkLimit(testUserId, 'verify');
      expect(allowed).toBe(true);
    });

    test('should cleanup old records', async () => {
      // Add old record
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      await db.run(
        'INSERT INTO rate_limits (telegram_user_id, action, timestamp) VALUES (?, ?, ?)',
        [testUserId, 'verify', oldTime.toISOString()]
      );
      
      // Add recent record
      await rateLimit.recordAction(testUserId, 'verify');
      
      await rateLimit.cleanup();
      
      const all = await db.all('SELECT * FROM rate_limits');
      expect(all).toHaveLength(1);
    });
  });

  describe('Audit Model', () => {
    const testUserId = '777777777';

    afterEach(async () => {
      await db.run('DELETE FROM audit_log');
    });

    test('should log actions', async () => {
      await audit.log(testUserId, 'verify_started', 'User initiated verification');
      
      const logs = await audit.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('verify_started');
      expect(logs[0].details).toBe('User initiated verification');
    });

    test('should get user-specific logs', async () => {
      await audit.log(testUserId, 'action1');
      await audit.log('999999999', 'action2');
      await audit.log(testUserId, 'action3');
      
      const userLogs = await audit.getUserLogs(testUserId);
      expect(userLogs).toHaveLength(2);
      expect(userLogs.every(log => log.telegram_user_id === testUserId)).toBe(true);
    });

    test('should respect log limits', async () => {
      for (let i = 0; i < 10; i++) {
        await audit.log(testUserId, `action${i}`);
      }
      
      const logs = await audit.getRecentLogs(5);
      expect(logs).toHaveLength(5);
    });
  });
});