import vault from 'node-vault';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Vault client
const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
  token: process.env.VAULT_TOKEN || 'dev-root-token',
});

// Test Vault connection
async function testVaultConnection() {
  try {
    const health = await vaultClient.health();
    console.log('✓ Connected to HashiCorp Vault');
    return true;
  } catch (err) {
    console.error('✗ Error connecting to Vault:', err.message);
    return false;
  }
}

// Initialize Vault KV engine for storing user keys
async function initVaultKV() {
  try {
    // Enable KV v2 secrets engine
    try {
      await vaultClient.mount({
        mount_point: 'user-keys',
        type: 'kv-v2',
        description: 'KV store for user encryption keys',
      });
      console.log('✓ KV secrets engine enabled in Vault');
    } catch (err) {
      // If already enabled, that's fine
      if (err.response?.statusCode !== 400) {
        throw err;
      }
      console.log('✓ KV secrets engine already enabled');
    }

    console.log('✓ Vault KV engine ready');
  } catch (err) {
    console.error('Error initializing Vault KV:', err.message);
  }
}

// Store user's public key in Vault
// The private key stays in the user's browser (WebCrypto)
async function storeUserPublicKey(userId, publicKeyJwk) {
  try {
    await vaultClient.write(`user-keys/data/user-${userId}`, {
      data: {
        publicKey: publicKeyJwk,
        createdAt: new Date().toISOString(),
      },
    });
    console.log(`✓ Stored public key for user ${userId}`);
    return true;
  } catch (err) {
    console.error(`Error storing public key for user ${userId}:`, err.message);
    throw err;
  }
}

// Get user's public key from Vault
async function getUserPublicKey(userId) {
  try {
    const response = await vaultClient.read(`user-keys/data/user-${userId}`);

    if (response.data && response.data.data && response.data.data.publicKey) {
      return response.data.data.publicKey;
    }

    // If key doesn't exist, return null (key will be generated on first use)
    return null;
  } catch (err) {
    if (err.response?.statusCode === 404) {
      // Key doesn't exist yet
      return null;
    }
    console.error(`Error getting public key for user ${userId}:`, err.message);
    throw err;
  }
}

// Check if user has a key pair registered
async function hasUserKeyPair(userId) {
  try {
    const publicKey = await getUserPublicKey(userId);
    return publicKey !== null;
  } catch (err) {
    return false;
  }
}

// Delete user's key (for testing/cleanup)
async function deleteUserKeys(userId) {
  try {
    await vaultClient.delete(`user-keys/metadata/user-${userId}`);
    console.log(`✓ Deleted keys for user ${userId}`);
    return true;
  } catch (err) {
    console.error(`Error deleting keys for user ${userId}:`, err.message);
    throw err;
  }
}

// List all users with stored keys (admin function)
async function listUsersWithKeys() {
  try {
    const response = await vaultClient.list('user-keys/metadata');

    if (response.data && response.data.keys) {
      return response.data.keys.map(key => {
        // Extract user ID from "user-123" format
        const match = key.match(/user-(\d+)/);
        return match ? parseInt(match[1]) : null;
      }).filter(id => id !== null);
    }

    return [];
  } catch (err) {
    if (err.response?.statusCode === 404) {
      return [];
    }
    console.error('Error listing users with keys:', err.message);
    throw err;
  }
}

// Initialize Vault on module load
testVaultConnection().then(connected => {
  if (connected) {
    initVaultKV();
  }
});

export default vaultClient;
export {
  testVaultConnection,
  initVaultKV,
  storeUserPublicKey,
  getUserPublicKey,
  hasUserKeyPair,
  deleteUserKeys,
  listUsersWithKeys,
};
