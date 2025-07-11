const { generateChallenge, parseKeplrResponse, pubKeyToBech32Address } = require('../../src/utils/crypto');
const { config } = require('../../src/config/config');

describe('Crypto Utilities', () => {
  
  describe('generateChallenge', () => {
    test('should generate a challenge with correct format', () => {
      const telegramUserId = '123456789';
      const challenge = generateChallenge(telegramUserId);
      
      expect(challenge).toHaveProperty('challengeId');
      expect(challenge).toHaveProperty('challengeMessage');
      expect(challenge).toHaveProperty('timestamp');
      
      expect(challenge.challengeId).toMatch(/^[a-f0-9]{32}$/);
      expect(challenge.challengeMessage).toContain(config.telegram.projectName);
      expect(challenge.challengeMessage).toContain(telegramUserId);
      expect(challenge.challengeMessage).toContain(config.secretNetwork.network);
      expect(typeof challenge.timestamp).toBe('number');
    });
    
    test('should generate unique challenges', () => {
      const challenge1 = generateChallenge('123');
      const challenge2 = generateChallenge('123');
      
      expect(challenge1.challengeId).not.toBe(challenge2.challengeId);
      expect(challenge1.challengeMessage).not.toBe(challenge2.challengeMessage);
    });
  });
  
  describe('parseKeplrResponse', () => {
    test('should parse valid Keplr response', () => {
      const validResponse = JSON.stringify({
        signature: 'base64signature',
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: 'base64pubkey'
        }
      });
      
      const parsed = parseKeplrResponse(validResponse);
      
      expect(parsed.signature).toBe('base64signature');
      expect(parsed.pubKey).toBe('base64pubkey');
      expect(parsed.type).toBe('tendermint/PubKeySecp256k1');
    });
    
    test('should throw error for invalid JSON', () => {
      expect(() => {
        parseKeplrResponse('invalid json');
      }).toThrow('Invalid signature format');
    });
    
    test('should throw error for missing signature', () => {
      const invalidResponse = JSON.stringify({
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: 'base64pubkey'
        }
      });
      
      expect(() => {
        parseKeplrResponse(invalidResponse);
      }).toThrow('Invalid signature format');
    });
    
    test('should throw error for missing pub_key', () => {
      const invalidResponse = JSON.stringify({
        signature: 'base64signature'
      });
      
      expect(() => {
        parseKeplrResponse(invalidResponse);
      }).toThrow('Invalid signature format');
    });
  });
  
  describe('pubKeyToBech32Address', () => {
    test('should convert public key to bech32 address', () => {
      // Test with a known public key (this is a dummy test key)
      const pubKey = new Uint8Array(33).fill(1); // Dummy 33-byte key
      
      const address = pubKeyToBech32Address(pubKey, 'secret');
      
      expect(address).toMatch(/^secret1[a-z0-9]{38}$/);
      expect(address.startsWith('secret1')).toBe(true);
    });
    
    test('should work with different prefixes', () => {
      const pubKey = new Uint8Array(33).fill(1);
      
      const secretAddress = pubKeyToBech32Address(pubKey, 'secret');
      const cosmosAddress = pubKeyToBech32Address(pubKey, 'cosmos');
      
      expect(secretAddress.startsWith('secret1')).toBe(true);
      expect(cosmosAddress.startsWith('cosmos1')).toBe(true);
      // Addresses should be different lengths due to different prefix lengths
      expect(secretAddress).not.toBe(cosmosAddress);
    });
  });
});