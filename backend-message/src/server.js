import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import messageRoutes from './routes/message.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' })); // Increased limit for encrypted data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Message Service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Message Service API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      publicKey: 'GET /api/keys/:userId',
      sendMessage: 'POST /api/messages',
      getMessages: 'GET /api/messages',
      getConversations: 'GET /api/conversations',
      markAsRead: 'PATCH /api/messages/:messageId/read',
      unreadCount: 'GET /api/messages/unread/count',
      deleteMessage: 'DELETE /api/messages/:messageId',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Message Service running on port ${PORT}`);
  console.log(`   - Health check: http://localhost:${PORT}/health`);
  console.log(`   - API endpoints: http://localhost:${PORT}/api`);
  console.log(`   - Environment: ${process.env.NODE_ENV}\n`);
});

export default app;

