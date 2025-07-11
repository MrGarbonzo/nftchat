const verificationService = require('../../src/services/verification');
const { user, challenge } = require('../../src/database/models');
const secretNetwork = require('../../src/services/secretNetwork');

// Mock Secret Network service
jest.mock('../../src/services/secretNetwork');

describe('Verification Service', () => {
  let testUserId;
  let testWallet;
  
  beforeEach(() => {
    testUserId = '123456789';
    testWallet = 'secret1testwalletaddress1234567890';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful NFT ownership by default
    secretNetwork.checkNFTOwnership.mockResolvedValue({
      hasNFT: true,
      tokenCount: 2,
      tokens: ['token1', 'token2']
    });
  });
  
  describe('startVerification', () => {
    test('should create challenge for new verification', async () => {
      const result = await verificationService.startVerification(testUserId, {
        username: 'testuser',
        first_name: 'Test'
      });
      
      expect(result).toHaveProperty('challengeId');
      expect(result).toHaveProperty('challengeMessage');
      expect(result).toHaveProperty('expiryDate');
      
      expect(result.challengeMessage).toContain('Test NFT Project');
      expect(result.challengeMessage).toContain(testUserId);
    });
    
    test('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      const { rateLimit } = require('../../src/database/models');
      jest.spyOn(rateLimit, 'checkLimit').mockResolvedValue(false);
      
      await expect(
        verificationService.startVerification(testUserId)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });
  
  describe('getVerificationStatus', () => {
    test('should return not verified for new user', async () => {
      const status = await verificationService.getVerificationStatus('newuser123');
      
      expect(status.verified).toBe(false);
      expect(status.message).toContain('Not verified');
    });
    
    test('should return verified status for existing user', async () => {
      // First create a verified user
      await user.create(testUserId, testWallet, { username: 'test' });
      
      const status = await verificationService.getVerificationStatus(testUserId);
      
      expect(status.verified).toBe(true);
      expect(status.walletAddress).toBe(testWallet);
    });
  });
  
  describe('NFT ownership integration', () => {
    test('should fail verification when no NFTs found', async () => {
      // Mock no NFT ownership
      secretNetwork.checkNFTOwnership.mockResolvedValue({
        hasNFT: false,
        tokenCount: 0,
        tokens: []
      });
      
      // Create challenge first
      const challengeData = await verificationService.startVerification(testUserId);
      
      // Mock signature verification success
      const crypto = require('../../src/utils/crypto');
      jest.spyOn(crypto, 'parseKeplrResponse').mockReturnValue({
        signature: 'mocksig',
        pubKey: 'mockpubkey'
      });
      jest.spyOn(crypto, 'verifySignature').mockResolvedValue({
        isValid: true,
        address: testWallet
      });
      
      await expect(
        verificationService.completeVerification(
          testUserId,
          challengeData.challengeId,
          'mock signature response'
        )
      ).rejects.toThrow('No Test NFT Project NFTs found');
    });
    
    test('should succeed verification when NFTs found', async () => {
      // Create challenge first
      const challengeData = await verificationService.startVerification(testUserId);
      
      // Mock signature verification success
      const crypto = require('../../src/utils/crypto');
      jest.spyOn(crypto, 'parseKeplrResponse').mockReturnValue({
        signature: 'mocksig',
        pubKey: 'mockpubkey'
      });
      jest.spyOn(crypto, 'verifySignature').mockResolvedValue({
        isValid: true,
        address: testWallet
      });
      
      const result = await verificationService.completeVerification(
        testUserId,
        challengeData.challengeId,
        'mock signature response',
        { username: 'test' }
      );
      
      expect(result.success).toBe(true);
      expect(result.walletAddress).toBe(testWallet);
      expect(result.nftCount).toBe(2);
      expect(result.message).toContain('2 Test NFT Project NFTs');
    });
  });
  
  describe('reVerifyAllUsers', () => {
    test('should re-verify all users correctly', async () => {
      // Create some test users
      await user.create('user1', 'secret1wallet1', { username: 'user1' });
      await user.create('user2', 'secret1wallet2', { username: 'user2' });
      
      // Mock different outcomes
      secretNetwork.checkNFTOwnership
        .mockResolvedValueOnce({ hasNFT: true, tokenCount: 1 }) // user1 still has NFT
        .mockResolvedValueOnce({ hasNFT: false, tokenCount: 0 }); // user2 lost NFT
      
      const results = await verificationService.reVerifyAllUsers();
      
      expect(results.total).toBe(2);
      expect(results.stillValid).toBe(1);
      expect(results.revoked).toBe(1);
      expect(results.errors).toBe(0);
      
      expect(results.details).toHaveLength(2);
      expect(results.details[0].status).toBe('valid');
      expect(results.details[1].status).toBe('revoked');
    });
    
    test('should handle errors during re-verification', async () => {
      await user.create('user1', 'secret1wallet1', { username: 'user1' });
      
      // Mock network error
      secretNetwork.checkNFTOwnership.mockRejectedValue(new Error('Network error'));
      
      const results = await verificationService.reVerifyAllUsers();
      
      expect(results.total).toBe(1);
      expect(results.errors).toBe(1);
      expect(results.details[0].status).toBe('error');
      expect(results.details[0].error).toBe('Network error');
    });
  });
});