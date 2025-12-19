import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import tournamentRoutes from './routes/tournament.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Frontend Usuario
    'http://localhost:5174', // Frontend Admin
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/tournaments', tournamentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'Tournament Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log('\n==================================================');
      console.log('🏆 Tournament Service iniciado exitosamente');
      console.log('==================================================');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log('==================================================\n');
    });
  } catch (error) {
    console.error('Failed to start Tournament Service:', error);
    process.exit(1);
  }
}

startServer();
