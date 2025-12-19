/**
 * End-to-End Encryption Utility using WebCrypto API
 *
 * This module provides hybrid encryption (RSA + AES) for secure messaging:
 * 1. Generate RSA key pair (public/private) for each user
 * 2. Store private key in browser's IndexedDB (never leaves the browser)
 * 3. Store public key in HashiCorp Vault via backend
 * 4. Encrypt messages with AES (fast for large data)
 * 5. Encrypt AES key with recipient's RSA public key
 * 6. Decrypt AES key with own RSA private key
 * 7. Decrypt message with AES key
 */

const ENCRYPTION_CONFIG = {
  RSA_KEY_SIZE: 4096,
  AES_KEY_SIZE: 256,
  RSA_ALGORITHM: {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  AES_ALGORITHM: {
    name: 'AES-GCM',
    length: 256,
  },
};

/**
 * IndexedDB wrapper for storing private keys
 */
class KeyStorage {
  constructor() {
    this.dbName = 'SecureMessagingDB';
    this.dbVersion = 1;
    this.storeName = 'keys';
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async savePrivateKey(userId, privateKey) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(privateKey, `user-${userId}-private`);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPrivateKey(userId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(`user-${userId}-private`);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async hasPrivateKey(userId) {
    try {
      const key = await this.getPrivateKey(userId);
      return key !== undefined;
    } catch (err) {
      return false;
    }
  }

  async deletePrivateKey(userId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(`user-${userId}-private`);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const keyStorage = new KeyStorage();

/**
 * Generate RSA key pair for encryption
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      ENCRYPTION_CONFIG.RSA_ALGORITHM,
      true, // extractable
      ['encrypt', 'decrypt']
    );

    console.log('✓ Generated RSA key pair');
    return keyPair;
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw new Error('Failed to generate encryption keys');
  }
}

/**
 * Export public key to JWK format (for sending to server/Vault)
 * @param {CryptoKey} publicKey
 * @returns {Promise<Object>}
 */
export async function exportPublicKey(publicKey) {
  try {
    const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
    return jwk;
  } catch (error) {
    console.error('Error exporting public key:', error);
    throw new Error('Failed to export public key');
  }
}

/**
 * Import public key from JWK format
 * @param {Object} jwk
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(jwk) {
  try {
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      ENCRYPTION_CONFIG.RSA_ALGORITHM,
      true,
      ['encrypt']
    );
    return publicKey;
  } catch (error) {
    console.error('Error importing public key:', error);
    throw new Error('Failed to import public key');
  }
}

/**
 * Save private key to IndexedDB
 * @param {number} userId
 * @param {CryptoKey} privateKey
 */
export async function savePrivateKey(userId, privateKey) {
  try {
    await keyStorage.savePrivateKey(userId, privateKey);
    console.log(`✓ Saved private key for user ${userId} to IndexedDB`);
  } catch (error) {
    console.error('Error saving private key:', error);
    throw new Error('Failed to save private key');
  }
}

/**
 * Load private key from IndexedDB
 * @param {number} userId
 * @returns {Promise<CryptoKey|null>}
 */
export async function loadPrivateKey(userId) {
  try {
    const privateKey = await keyStorage.getPrivateKey(userId);
    if (privateKey) {
      console.log(`✓ Loaded private key for user ${userId} from IndexedDB`);
    }
    return privateKey;
  } catch (error) {
    console.error('Error loading private key:', error);
    return null;
  }
}

/**
 * Check if user has a private key stored
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
export async function hasPrivateKey(userId) {
  return await keyStorage.hasPrivateKey(userId);
}

/**
 * Encrypt a message using hybrid encryption (AES + RSA)
 * @param {string} message - Plain text message
 * @param {CryptoKey} recipientPublicKey - Recipient's RSA public key
 * @returns {Promise<{encryptedContent: string, encryptedKey: string, iv: string}>}
 */
export async function encryptMessage(message, recipientPublicKey) {
  try {
    // 1. Generate a random AES key for this message
    const aesKey = await window.crypto.subtle.generateKey(
      ENCRYPTION_CONFIG.AES_ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Generate random IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 3. Encrypt the message with AES
    const encodedMessage = new TextEncoder().encode(message);
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      encodedMessage
    );

    // 4. Export the AES key
    const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // 5. Encrypt the AES key with recipient's RSA public key
    const encryptedAesKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      recipientPublicKey,
      exportedAesKey
    );

    // 6. Convert to base64 for transmission
    return {
      encryptedContent: arrayBufferToBase64(encryptedContent),
      encryptedKey: arrayBufferToBase64(encryptedAesKey),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using hybrid decryption (RSA + AES)
 * @param {string} encryptedContent - Base64 encrypted message
 * @param {string} encryptedKey - Base64 encrypted AES key
 * @param {string} ivBase64 - Base64 initialization vector
 * @param {CryptoKey} privateKey - Own RSA private key
 * @returns {Promise<string>} - Decrypted plain text message
 */
export async function decryptMessage(encryptedContent, encryptedKey, ivBase64, privateKey) {
  try {
    // 1. Convert from base64
    const encryptedContentBuffer = base64ToArrayBuffer(encryptedContent);
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
    const iv = base64ToArrayBuffer(ivBase64);

    // 2. Decrypt the AES key with own RSA private key
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedKeyBuffer
    );

    // 3. Import the AES key
    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      ENCRYPTION_CONFIG.AES_ALGORITHM,
      false,
      ['decrypt']
    );

    // 4. Decrypt the message with AES
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      encryptedContentBuffer
    );

    // 5. Decode to string
    const message = new TextDecoder().decode(decryptedContent);
    return message;
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Initialize encryption for a user
 * Generates key pair if not exists, stores private key locally, sends public key to Vault
 * @param {number} userId
 * @param {Function} uploadPublicKeyFn - Function to upload public key to server
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export async function initializeEncryption(userId, uploadPublicKeyFn) {
  try {
    console.log(`Initializing encryption for user ${userId}...`);

    // Check if user already has a private key
    const existingPrivateKey = await loadPrivateKey(userId);

    if (existingPrivateKey) {
      console.log('✓ User already has encryption keys');
      // TODO: We need to also retrieve the public key, but for now we'll regenerate
      // In production, you'd want to export and store both
      return { privateKey: existingPrivateKey, publicKey: null };
    }

    // Generate new key pair
    console.log('Generating new key pair...');
    const keyPair = await generateKeyPair();

    // Save private key to IndexedDB (stays in browser)
    await savePrivateKey(userId, keyPair.privateKey);

    // Export public key to JWK
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);

    // Upload public key to Vault via backend
    await uploadPublicKeyFn(publicKeyJwk);

    console.log('✓ Encryption initialized successfully');

    return keyPair;
  } catch (error) {
    console.error('Error initializing encryption:', error);
    throw error;
  }
}

export default {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  savePrivateKey,
  loadPrivateKey,
  hasPrivateKey,
  encryptMessage,
  decryptMessage,
  initializeEncryption,
};
