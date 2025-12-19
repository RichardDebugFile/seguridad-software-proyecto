/**
 * Message Service API Client
 * Handles communication with the Message Service backend
 */

import axios from 'axios';

const MESSAGE_API_URL = 'http://localhost:3003';

const messageApi = axios.create({
  baseURL: MESSAGE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
messageApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
messageApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('http://localhost:3000/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return messageApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const messageService = {
  // ========== Key Management ==========

  /**
   * Upload public key to Vault
   * @param {Object} publicKeyJwk - Public key in JWK format
   */
  uploadPublicKey: (publicKeyJwk) =>
    messageApi.post('/api/keys', { publicKey: publicKeyJwk }),

  /**
   * Get public key for a user
   * @param {number} userId
   */
  getPublicKey: (userId) =>
    messageApi.get(`/api/keys/${userId}`),

  // ========== Messaging ==========

  /**
   * Send encrypted message
   * @param {Object} messageData
   * @param {number} messageData.receiver_id
   * @param {string} messageData.encrypted_content
   * @param {string} messageData.encrypted_key
   * @param {string} messageData.iv
   */
  sendMessage: (messageData) =>
    messageApi.post('/api/messages', messageData),

  /**
   * Get messages (optionally filtered by user)
   * @param {number|null} withUserId - Filter by conversation with this user
   */
  getMessages: (withUserId = null) => {
    const params = withUserId ? { withUserId } : {};
    return messageApi.get('/api/messages', { params });
  },

  /**
   * Get list of conversations
   */
  getConversations: () =>
    messageApi.get('/api/conversations'),

  /**
   * Mark message as read
   * @param {number} messageId
   */
  markAsRead: (messageId) =>
    messageApi.patch(`/api/messages/${messageId}/read`),

  /**
   * Get unread message count
   */
  getUnreadCount: () =>
    messageApi.get('/api/messages/unread/count'),

  /**
   * Delete message
   * @param {number} messageId
   */
  deleteMessage: (messageId) =>
    messageApi.delete(`/api/messages/${messageId}`),

  // ========== Health Check ==========

  /**
   * Check if Message Service is available
   */
  healthCheck: () =>
    messageApi.get('/health'),
};

export default messageApi;
