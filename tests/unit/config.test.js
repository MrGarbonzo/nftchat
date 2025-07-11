const { config, validateConfig } = require('../../src/config/config');

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('config object', () => {
    test('should load configuration from environment variables', () => {
      expect(config.telegram.botToken).toBe('mock_bot_token_123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
      expect(config.telegram.projectName).toBe('Test NFT Project');
      expect(config.secretNetwork.network).toBe('testnet');
      expect(config.secretNetwork.contractAddress).toBe('secret1mockcontractaddress1234567890abcdef');
    });

    test('should use default values when env vars not set', () => {
      delete process.env.BOT_NAME;
      delete process.env.LOG_LEVEL;
      
      const { config: newConfig } = require('../../src/config/config');
      
      expect(newConfig.telegram.botName).toBe('NFT Gating Bot');
      expect(newConfig.logging.level).toBe('info');
    });

    test('should parse numeric environment variables', () => {
      expect(config.security.challengeExpiryMinutes).toBe(5);
      expect(config.security.rateLimitMaxRequests).toBe(10);
      expect(typeof config.security.challengeExpiryMinutes).toBe('number');
    });

    test('should have correct network configurations', () => {
      expect(config.secretNetwork.networks.mainnet.chainId).toBe('secret-4');
      expect(config.secretNetwork.networks.testnet.chainId).toBe('pulsar-3');
      expect(config.secretNetwork.networks.mainnet.lcd).toContain('https://');
    });
  });

  describe('validateConfig', () => {
    test('should pass validation with all required fields', () => {
      expect(() => validateConfig()).not.toThrow();
    });

    test('should throw error when bot token is missing', () => {
      delete process.env.BOT_TOKEN;
      jest.resetModules();
      
      const { validateConfig: newValidate } = require('../../src/config/config');
      
      expect(() => newValidate()).toThrow('Missing required configuration: telegram.botToken');
    });

    test('should throw error when multiple required fields are missing', () => {
      delete process.env.BOT_TOKEN;
      delete process.env.GROUP_ID;
      delete process.env.CONTRACT_ADDRESS;
      jest.resetModules();
      
      const { validateConfig: newValidate } = require('../../src/config/config');
      
      expect(() => newValidate()).toThrow(/telegram.botToken.*telegram.groupId.*secretNetwork.contractAddress/);
    });

    test('should throw error when contract code hash is missing', () => {
      delete process.env.CONTRACT_CODE_HASH;
      jest.resetModules();
      
      const { validateConfig: newValidate } = require('../../src/config/config');
      
      expect(() => newValidate()).toThrow('Missing required configuration: secretNetwork.contractCodeHash');
    });
  });
});