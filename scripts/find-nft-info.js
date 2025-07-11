#!/usr/bin/env node

/**
 * NFT Contract Information Finder
 * 
 * This script helps you find contract details for your existing NFTs
 * by connecting to Secret Network and checking common collections.
 */

const { SecretNetworkClient } = require('secretjs');
const readline = require('readline');

// Common SNIP-721 collections on Secret Network
const KNOWN_COLLECTIONS = {
  'anons': {
    name: 'Anons',
    address: 'secret1nf30e4nk6pvmpj4lps4ym3hed47wz8fqky7h7r',
    codeHash: '57e03ea3e0b9f6b6ace5f01b6ed53b0cf79fe8845b9c5ca7a6d4b0e8e9c88c80'
  },
  'secret-badges': {
    name: 'Secret Badges',
    address: 'secret1k6hu0w9jaaj4qd8u7fme3dtj2kg37dg5x9m7td',
    codeHash: 'cf20aeb85f9e1e20d87ba3cc34d96bd3fe52bca8c1e4e8b8d71d7e1a7a7c4a9b'
  },
  'redacted-club': {
    name: 'Redacted Club',
    address: 'secret1g2g3j8g4g5j6g7j8g9j0g1g2g3j4g5j6g7j8g9',
    codeHash: 'abc123def456789012345678901234567890123456789012345678901234567890'
  }
  // Note: These are example addresses - update with real ones
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔍 NFT Contract Information Finder\n');
  console.log('This tool helps you find contract details for NFTs you own.\n');

  try {
    // Get wallet address
    const walletAddress = await question('Enter your Secret Network wallet address (secret1...): ');
    
    if (!walletAddress.startsWith('secret1') || walletAddress.length !== 45) {
      console.log('❌ Invalid wallet address format. Should be 45 characters starting with secret1');
      rl.close();
      return;
    }

    console.log('\n🔗 Connecting to Secret Network...');
    
    // Initialize Secret Network client
    const client = new SecretNetworkClient({
      url: 'https://lcd.secret.express',
      chainId: 'secret-4'
    });

    console.log('✅ Connected to Secret Network mainnet\n');

    // Check known collections
    console.log('🔍 Checking known NFT collections...\n');
    
    let foundNFTs = [];
    
    for (const [key, collection] of Object.entries(KNOWN_COLLECTIONS)) {
      try {
        console.log(`Checking ${collection.name}...`);
        
        const query = {
          tokens: {
            owner: walletAddress,
            limit: 10
          }
        };

        const response = await client.query.compute.queryContract({
          contract_address: collection.address,
          code_hash: collection.codeHash,
          query: query
        });

        if (response.token_list && response.token_list.tokens.length > 0) {
          foundNFTs.push({
            collection: collection.name,
            address: collection.address,
            codeHash: collection.codeHash,
            count: response.token_list.tokens.length,
            tokens: response.token_list.tokens.slice(0, 5) // Show first 5
          });
          console.log(`  ✅ Found ${response.token_list.tokens.length} NFT(s)`);
        } else {
          console.log(`  ❌ No NFTs found`);
        }
      } catch (error) {
        if (error.message.includes('viewing key')) {
          console.log(`  ⚠️  Collection requires viewing key`);
        } else if (error.message.includes('not found')) {
          console.log(`  ❌ No NFTs found`);
        } else {
          console.log(`  ❌ Error: ${error.message.slice(0, 50)}...`);
        }
      }
    }

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));

    if (foundNFTs.length === 0) {
      console.log('❌ No NFTs found in known collections.');
      console.log('\nPossible reasons:');
      console.log('• Your NFT is from a different collection');
      console.log('• The collection requires viewing keys');
      console.log('• Collection details in this script are outdated\n');
      
      console.log('📋 To find your NFT manually:');
      console.log('1. Check your wallet transaction history');
      console.log('2. Visit Secret Network explorer (secretnodes.com)');
      console.log('3. Check the NFT project\'s documentation');
      console.log('4. Ask in their Discord/Telegram for contract details\n');
    } else {
      console.log('✅ Found NFTs in these collections:\n');
      
      foundNFTs.forEach((nft, index) => {
        console.log(`${index + 1}. ${nft.collection}`);
        console.log(`   Contract Address: ${nft.address}`);
        console.log(`   Code Hash: ${nft.codeHash}`);
        console.log(`   Your NFTs: ${nft.count}`);
        if (nft.tokens.length > 0) {
          console.log(`   Token IDs: ${nft.tokens.slice(0, 3).join(', ')}${nft.tokens.length > 3 ? '...' : ''}`);
        }
        console.log('');
      });

      console.log('📋 To use in your bot:');
      console.log('1. Copy the contract address and code hash from above');
      console.log('2. Update your .env.test-nft file:');
      console.log('   CONTRACT_ADDRESS=<contract_address>');
      console.log('   CONTRACT_CODE_HASH=<code_hash>');
      console.log('3. Run: npm run test-nft\n');
    }

    // Option to manually test a contract
    const testCustom = await question('Do you want to test a specific contract address? (y/n): ');
    
    if (testCustom.toLowerCase() === 'y') {
      const customAddress = await question('Enter contract address: ');
      const customCodeHash = await question('Enter code hash: ');
      
      try {
        console.log('\n🔍 Testing custom contract...');
        
        const query = {
          tokens: {
            owner: walletAddress,
            limit: 10
          }
        };

        const response = await client.query.compute.queryContract({
          contract_address: customAddress,
          code_hash: customCodeHash,
          query: query
        });

        if (response.token_list && response.token_list.tokens.length > 0) {
          console.log(`✅ Success! Found ${response.token_list.tokens.length} NFT(s)`);
          console.log(`   Contract Address: ${customAddress}`);
          console.log(`   Code Hash: ${customCodeHash}`);
          console.log('\n📋 Add these to your .env.test-nft file!');
        } else {
          console.log('❌ No NFTs found in this contract');
        }
      } catch (error) {
        console.log(`❌ Error testing custom contract: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { KNOWN_COLLECTIONS };