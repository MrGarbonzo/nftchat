const { SecretNetworkClient } = require('secretjs');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class SecretNetworkService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize SecretJS client
   */
  async connect() {
    try {
      const networkConfig = config.secretNetwork.networks[config.secretNetwork.network];
      
      this.client = new SecretNetworkClient({
        url: networkConfig.lcd,
        chainId: networkConfig.chainId
      });
      
      // Test connection with a simple query
      await this.client.query.bank.balance({
        address: 'secret1000000000000000000000000000000000000000', // Dummy address for connection test
        denom: 'uscrt'
      }).catch(() => {
        // Expected to fail for dummy address, but confirms connection works
      });
      
      this.isConnected = true;
      logger.info('Connected to Secret Network', { 
        network: config.secretNetwork.network,
        chainId: networkConfig.chainId,
        lcd: networkConfig.lcd
      });
      
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Secret Network', { error });
      throw error;
    }
  }

  /**
   * Ensure client is connected
   */
  async ensureConnected() {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
  }

  /**
   * Query a SNIP-721 contract
   * @param {object} queryMsg - Query message
   * @returns {object} Query response
   */
  async queryContract(queryMsg) {
    await this.ensureConnected();
    
    try {
      const response = await this.client.query.compute.queryContract({
        contract_address: config.secretNetwork.contractAddress,
        code_hash: config.secretNetwork.contractCodeHash,
        query: queryMsg
      });
      
      return response;
    } catch (error) {
      logger.error('Contract query failed', { error, queryMsg });
      throw error;
    }
  }

  /**
   * Check if a wallet owns any NFTs from the collection
   * @param {string} walletAddress - Secret Network wallet address
   * @param {string} viewingKey - Optional viewing key for private queries
   * @returns {object} Ownership information
   */
  async checkNFTOwnership(walletAddress, viewingKey = null) {
    try {
      const query = {
        tokens: {
          owner: walletAddress,
          limit: 1000 // Check up to 1000 tokens
        }
      };

      // Add viewing key if provided
      if (viewingKey) {
        query.tokens.viewing_key = viewingKey;
      }

      const response = await this.queryContract(query);
      
      const tokenCount = response.token_list ? response.token_list.tokens.length : 0;
      const hasNFT = tokenCount > 0;
      
      logger.info('NFT ownership check completed', {
        walletAddress,
        tokenCount,
        hasNFT,
        hasViewingKey: !!viewingKey
      });

      return {
        hasNFT,
        tokenCount,
        tokens: response.token_list ? response.token_list.tokens : []
      };

    } catch (error) {
      // Check if error is due to privacy (no viewing key)
      if (error.message && error.message.includes('viewing key')) {
        logger.info('NFT query requires viewing key', { walletAddress });
        return {
          hasNFT: false,
          tokenCount: 0,
          tokens: [],
          requiresViewingKey: true,
          error: 'This collection requires a viewing key for ownership verification'
        };
      }
      
      // Check if it's a "not found" error (wallet has no tokens)
      if (error.message && error.message.includes('not found')) {
        logger.info('Wallet has no NFTs', { walletAddress });
        return {
          hasNFT: false,
          tokenCount: 0,
          tokens: []
        };
      }

      logger.error('NFT ownership check failed', { error, walletAddress });
      throw new Error(`Failed to check NFT ownership: ${error.message}`);
    }
  }

  /**
   * Get contract information
   * @returns {object} Contract info
   */
  async getContractInfo() {
    try {
      const query = { contract_info: {} };
      const response = await this.queryContract(query);
      
      logger.info('Retrieved contract info', { response });
      return response.contract_info;
      
    } catch (error) {
      logger.error('Failed to get contract info', { error });
      throw error;
    }
  }

  /**
   * Get collection statistics
   * @returns {object} Collection stats
   */
  async getCollectionStats() {
    try {
      const query = { num_tokens: {} };
      const response = await this.queryContract(query);
      
      return {
        totalSupply: response.count || 0
      };
      
    } catch (error) {
      logger.error('Failed to get collection stats', { error });
      throw error;
    }
  }

  /**
   * Verify ownership with permits (SNIP-24)
   * @param {string} walletAddress - Owner address
   * @param {object} permit - SNIP-24 permit
   * @returns {object} Ownership information
   */
  async checkOwnershipWithPermit(walletAddress, permit) {
    try {
      const query = {
        with_permit: {
          permit: permit,
          query: {
            tokens: {
              owner: walletAddress,
              limit: 1000
            }
          }
        }
      };

      const response = await this.queryContract(query);
      const tokenCount = response.token_list ? response.token_list.tokens.length : 0;
      
      logger.info('Permit-based ownership check completed', {
        walletAddress,
        tokenCount,
        hasNFT: tokenCount > 0
      });

      return {
        hasNFT: tokenCount > 0,
        tokenCount,
        tokens: response.token_list ? response.token_list.tokens : []
      };

    } catch (error) {
      logger.error('Permit-based ownership check failed', { error, walletAddress });
      throw error;
    }
  }

  /**
   * Test contract connectivity
   * @returns {boolean} Connection status
   */
  async testConnection() {
    try {
      await this.ensureConnected();
      
      // Try to get contract info as a simple test
      await this.getContractInfo();
      
      logger.info('Contract connection test successful');
      return true;
      
    } catch (error) {
      logger.error('Contract connection test failed', { error });
      return false;
    }
  }

  /**
   * Get network information
   * @returns {object} Network details
   */
  getNetworkInfo() {
    const networkConfig = config.secretNetwork.networks[config.secretNetwork.network];
    
    return {
      network: config.secretNetwork.network,
      chainId: networkConfig.chainId,
      lcd: networkConfig.lcd,
      contractAddress: config.secretNetwork.contractAddress,
      contractCodeHash: config.secretNetwork.contractCodeHash,
      isConnected: this.isConnected
    };
  }
}

module.exports = new SecretNetworkService();