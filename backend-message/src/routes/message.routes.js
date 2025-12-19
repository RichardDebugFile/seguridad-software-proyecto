import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { getUserPublicKey, storeUserPublicKey } from '../config/vault.js';

const router = express.Router();

// ========== Store User's Public Key ==========
router.post('/keys', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        error: 'Missing required field: publicKey (JWK format)',
      });
    }

    // Validate JWK format
    if (!publicKey.kty || !publicKey.n || !publicKey.e) {
      return res.status(400).json({
        error: 'Invalid public key format. Must be RSA JWK with kty, n, and e fields',
      });
    }

    // Store public key in Vault
    await storeUserPublicKey(userId, publicKey);

    res.status(201).json({
      message: 'Public key stored successfully',
      userId,
    });
  } catch (error) {
    console.error('Error storing public key:', error);
    res.status(500).json({ error: 'Error storing public key' });
  }
});

// ========== Get Public Key for a User ==========
router.get('/keys/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get public key from Vault
    const publicKey = await getUserPublicKey(userId);

    if (!publicKey) {
      return res.status(404).json({
        error: 'User has no public key registered',
        message: 'User must generate and register their key pair first',
      });
    }

    res.json({
      userId: parseInt(userId),
      publicKey,
    });
  } catch (error) {
    console.error('Error getting public key:', error);
    res.status(500).json({ error: 'Error retrieving public key' });
  }
});

// ========== Send Message (Encrypted) ==========
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { receiver_id, encrypted_content, encrypted_key, iv } = req.body;
    const sender_id = req.user.id;

    // Validation
    if (!receiver_id || !encrypted_content || !encrypted_key || !iv) {
      return res.status(400).json({
        error: 'Missing required fields: receiver_id, encrypted_content, encrypted_key, iv',
      });
    }

    // Cannot send message to yourself
    if (sender_id === parseInt(receiver_id)) {
      return res.status(400).json({
        error: 'Cannot send message to yourself',
      });
    }

    // Insert encrypted message into database
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, encrypted_content, encrypted_key, iv)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender_id, receiver_id, created_at`,
      [sender_id, receiver_id, encrypted_content, encrypted_key, iv]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

// ========== Get Messages (Encrypted) ==========
router.get('/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { withUserId } = req.query;

    let query;
    let params;

    if (withUserId) {
      // Get conversation with specific user
      query = `
        SELECT id, sender_id, receiver_id, encrypted_content, encrypted_key, iv, created_at, read_at
        FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC
      `;
      params = [userId, withUserId];
    } else {
      // Get all messages where user is sender or receiver
      query = `
        SELECT id, sender_id, receiver_id, encrypted_content, encrypted_key, iv, created_at, read_at
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    res.json({
      messages: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Error retrieving messages' });
  }
});

// ========== Mark Message as Read ==========
router.patch('/messages/:messageId/read', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Only receiver can mark message as read
    const result = await pool.query(
      `UPDATE messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND receiver_id = $2 AND read_at IS NULL
       RETURNING id, read_at`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Message not found or already read',
      });
    }

    res.json({
      message: 'Message marked as read',
      messageId: result.rows[0].id,
      readAt: result.rows[0].read_at,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Error updating message' });
  }
});

// ========== Get Unread Message Count ==========
router.get('/messages/unread/count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({
      unreadCount: parseInt(result.rows[0].unread_count),
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Error retrieving unread count' });
  }
});

// ========== Get List of Conversations ==========
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get distinct users that current user has conversed with
    // Along with the latest message timestamp
    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
         other_user_id,
         MAX(created_at) as last_message_at,
         COUNT(CASE WHEN receiver_id = $1 AND read_at IS NULL THEN 1 END) as unread_count
       FROM (
         SELECT
           CASE
             WHEN sender_id = $1 THEN receiver_id
             ELSE sender_id
           END as other_user_id,
           created_at,
           receiver_id,
           read_at
         FROM messages
         WHERE sender_id = $1 OR receiver_id = $1
       ) conversations
       GROUP BY other_user_id
       ORDER BY other_user_id, last_message_at DESC`,
      [userId]
    );

    res.json({
      conversations: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Error retrieving conversations' });
  }
});

// ========== Delete Message ==========
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Only sender can delete their own messages
    const result = await pool.query(
      `DELETE FROM messages
       WHERE id = $1 AND sender_id = $2
       RETURNING id`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Message not found or unauthorized',
      });
    }

    res.json({
      message: 'Message deleted successfully',
      messageId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Error deleting message' });
  }
});

export default router;
