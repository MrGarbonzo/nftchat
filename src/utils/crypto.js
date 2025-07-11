const crypto = require('crypto');
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto');
const { fromBase64, toBase64, fromHex } = require('@cosmjs/encoding');
const { bech32 } = require('bech32');
const secp256k1 = require('secp256k1');
const { config } = require('../config/config');
const logger = require('./logger');

/**
 * Generate a unique challenge for wallet verification
 * @param {string} telegramUserId - Telegram user ID
 * @returns {object} Challenge object with id and message
 */
function generateChallenge(telegramUserId) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const challengeId = crypto.randomBytes(16).toString('hex');
  
  const challengeMessage = `${config.telegram.projectName} NFT Verification
User: ${telegramUserId}
Challenge: ${randomBytes}
Timestamp: ${timestamp}
Network: ${config.secretNetwork.network}`;

  return {
    challengeId,
    challengeMessage,
    timestamp
  };
}

/**
 * Convert public key to bech32 address
 * @param {Uint8Array} pubKey - Public key bytes
 * @param {string} prefix - Address prefix (e.g., 'secret')
 * @returns {string} Bech32 encoded address
 */
function pubKeyToBech32Address(pubKey, prefix = 'secret') {
  try {
    // Hash the public key
    const hash = sha256(pubKey);
    // Take first 20 bytes
    const address = hash.slice(0, 20);
    // Convert to bech32
    const words = bech32.toWords(address);
    return bech32.encode(prefix, words);
  } catch (error) {
    logger.error('Failed to convert pubkey to address', { error });
    throw error;
  }
}

/**
 * Verify a signed message and extract the signer's address
 * @param {string} challengeMessage - The original challenge message
 * @param {string} signatureBase64 - Base64 encoded signature
 * @param {string} pubKeyBase64 - Base64 encoded public key
 * @returns {object} { isValid: boolean, address: string }
 */
async function verifySignature(challengeMessage, signatureBase64, pubKeyBase64) {
  try {
    // Decode from base64
    const signature = fromBase64(signatureBase64);
    const pubKey = fromBase64(pubKeyBase64);
    
    // Create message hash
    const messageBytes = new TextEncoder().encode(challengeMessage);
    const messageHash = sha256(messageBytes);
    
    // Verify signature
    const isValid = secp256k1.ecdsaVerify(signature, messageHash, pubKey);
    
    if (!isValid) {
      return { isValid: false, address: null };
    }
    
    // Extract address from public key
    const address = pubKeyToBech32Address(pubKey);
    
    return {
      isValid: true,
      address
    };
  } catch (error) {
    logger.error('Signature verification failed', { error });
    return { isValid: false, address: null };
  }
}

/**
 * Parse Keplr signature response
 * Expected format:
 * {
 *   "signature": "base64_signature",
 *   "pub_key": {
 *     "type": "tendermint/PubKeySecp256k1",
 *     "value": "base64_pubkey"
 *   }
 * }
 * @param {string} responseText - JSON string from user
 * @returns {object} Parsed signature data
 */
function parseKeplrResponse(responseText) {
  try {
    const response = JSON.parse(responseText);
    
    if (!response.signature || !response.pub_key || !response.pub_key.value) {
      throw new Error('Invalid Keplr response format');
    }
    
    return {
      signature: response.signature,
      pubKey: response.pub_key.value,
      type: response.pub_key.type
    };
  } catch (error) {
    logger.error('Failed to parse Keplr response', { error });
    throw new Error('Invalid signature format. Please copy the entire response from Keplr.');
  }
}

/**
 * Verify ADR-36 amino signed message (Keplr standard)
 * This is a simplified version - full implementation would handle amino encoding
 * @param {string} prefix - Chain prefix
 * @param {string} message - Original message
 * @param {string} signatureBase64 - Base64 signature
 * @param {string} pubKeyBase64 - Base64 public key
 * @returns {boolean} Whether signature is valid
 */
async function verifyADR36Amino(prefix, message, signatureBase64, pubKeyBase64) {
  try {
    // For Keplr ADR-36, the message is wrapped in a specific format
    // This is a simplified verification - production should use full ADR-36 spec
    const wrappedMessage = `\x19${prefix} Signed Message:\n${message.length}${message}`;
    
    const signature = fromBase64(signatureBase64);
    const pubKey = fromBase64(pubKeyBase64);
    
    const messageBytes = new TextEncoder().encode(wrappedMessage);
    const messageHash = sha256(messageBytes);
    
    return secp256k1.ecdsaVerify(signature, messageHash, pubKey);
  } catch (error) {
    logger.error('ADR-36 verification failed', { error });
    return false;
  }
}

module.exports = {
  generateChallenge,
  verifySignature,
  parseKeplrResponse,
  pubKeyToBech32Address,
  verifyADR36Amino
};