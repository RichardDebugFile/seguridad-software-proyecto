import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../utils/api';
import { messageService } from '../utils/messageApi';
import {
  initializeEncryption,
  loadPrivateKey,
  importPublicKey,
  encryptMessage,
  decryptMessage,
  hasPrivateKey,
} from '../utils/encryption';

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encryptionReady, setEncryptionReady] = useState(false);

  // Chat state
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data.user);

      // Initialize encryption for this user
      await setupEncryption(response.data.user.id);

      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    }
  };

  const setupEncryption = async (userId) => {
    try {
      console.log('Setting up encryption...');

      // Check if user already has a key pair
      const hasKey = await hasPrivateKey(userId);

      if (!hasKey) {
        console.log('Generating new encryption keys...');
        // Initialize encryption (generates keys, stores private key, uploads public key)
        await initializeEncryption(userId, async (publicKeyJwk) => {
          await messageService.uploadPublicKey(publicKeyJwk);
        });
      }

      setEncryptionReady(true);
      console.log('✓ Encryption ready');
    } catch (error) {
      console.error('Error setting up encryption:', error);
      setError('Failed to initialize encryption. Please refresh the page.');
    }
  };

  const loadMessages = async () => {
    if (!recipientId) return;

    try {
      const response = await messageService.getMessages(recipientId);
      const encryptedMessages = response.data.messages;

      // Decrypt messages
      const privateKey = await loadPrivateKey(user.id);
      if (!privateKey) {
        setError('Private key not found. Please refresh the page.');
        return;
      }

      const decryptedMessages = [];

      for (const msg of encryptedMessages) {
        try {
          let decryptedText;

          // Only decrypt messages we received
          if (msg.receiver_id === user.id) {
            decryptedText = await decryptMessage(
              msg.encrypted_content,
              msg.encrypted_key,
              msg.iv,
              privateKey
            );
          } else {
            // For sent messages, check if we have it in localStorage cache
            const cachedMessage = localStorage.getItem(`sent-msg-${msg.id}`);
            if (cachedMessage) {
              decryptedText = cachedMessage;
            } else {
              // If not cached, we can't read it (encrypted with recipient's key)
              decryptedText = '[Message sent - encrypted for recipient]';
            }
          }

          decryptedMessages.push({
            ...msg,
            decryptedContent: decryptedText,
            isMine: msg.sender_id === user.id,
          });
        } catch (decryptError) {
          console.error('Error decrypting message:', decryptError);
          decryptedMessages.push({
            ...msg,
            decryptedContent: '[Decryption failed]',
            isMine: msg.sender_id === user.id,
          });
        }
      }

      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !recipientId) {
      setError('Please enter recipient ID and message');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Get recipient's public key from Vault
      const response = await messageService.getPublicKey(recipientId);
      const recipientPublicKeyJwk = response.data.publicKey;

      // Import recipient's public key
      const recipientPublicKey = await importPublicKey(recipientPublicKeyJwk);

      // Encrypt the message
      const encrypted = await encryptMessage(message, recipientPublicKey);

      // Send encrypted message
      const sendResponse = await messageService.sendMessage({
        receiver_id: parseInt(recipientId),
        encrypted_content: encrypted.encryptedContent,
        encrypted_key: encrypted.encryptedKey,
        iv: encrypted.iv,
      });

      // Cache the sent message in localStorage so we can read it later
      // This is a temporary solution - in production, you'd want dual encryption
      const messageId = sendResponse.data.messageId;
      localStorage.setItem(`sent-msg-${messageId}`, message);

      // Add to local messages
      setMessages(prev => [...prev, {
        id: messageId,
        sender_id: user.id,
        receiver_id: parseInt(recipientId),
        decryptedContent: message,
        created_at: sendResponse.data.createdAt,
        isMine: true,
      }]);

      setMessage('');
      console.log('✓ Message sent and encrypted successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.error || 'Failed to send message. Make sure the recipient has registered their encryption keys.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 hover:text-indigo-800"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">
                {encryptionReady ? '🔒 Encrypted' : '⚠️ Setting up encryption...'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔐 Secure Messaging (End-to-End Encrypted)
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!encryptionReady && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
              Setting up encryption keys... Please wait.
            </div>
          )}

          {/* Recipient Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient User ID
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="Enter user ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={loadMessages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                disabled={!recipientId}
              >
                Load Chat
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Current user ID: {user?.id}
            </p>
          </div>

          {/* Messages Display */}
          <div className="border border-gray-300 rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center mt-20">
                No messages yet. Send the first message!
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${msg.isMine ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-lg max-w-md ${
                      msg.isMine
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  >
                    <p className="text-sm">{msg.decryptedContent}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={!encryptionReady || sending}
            />
            <button
              type="submit"
              disabled={!encryptionReady || sending || !message.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send 🔒'}
            </button>
          </form>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🔐 How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Messages are encrypted end-to-end using RSA-4096 + AES-256-GCM</li>
              <li>• Your private key never leaves your browser (stored in IndexedDB)</li>
              <li>• Public keys are stored in HashiCorp Vault (external KMS)</li>
              <li>• The server cannot read your messages (zero-knowledge backend)</li>
              <li>• Each message uses a unique AES key encrypted with recipient's RSA public key</li>
              <li>• Sent messages are cached locally so you can read them (cleared on logout)</li>
            </ul>
          </div>

          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Note:</strong> Messages are encrypted with the recipient's public key.
              You can only read messages sent TO you (encrypted with your public key).
              Your sent messages are cached locally for viewing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
