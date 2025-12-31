import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from './config/passport.js';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== Middleware ==========
app.use(helmet());

// CRÍTICO: Prevenir cache del navegador en todas las respuestas
// Esto evita que el botón retroceder muestre páginas protegidas después del logout
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration - Required for Keycloak redirect flow
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes (sufficient for OAuth flow)
    },
  })
);

// CORS Configuration - permitir ambos frontends
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174'
    ],
    credentials: true,
  })
);

// Rate Limiting - Solo para rutas críticas (login/register)
// No aplicar a /auth/me ya que se llama frecuentemente para validación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Más permisivo en desarrollo
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
  skip: (req) => {
    // No aplicar rate limiting a rutas de validación
    return req.path === '/me' || req.path === '/refresh';
  }
});
app.use('/auth', authLimiter);

// Passport initialization
app.use(passport.initialize());

// ========== Routes ==========
app.get('/', (req, res) => {
  res.json({
    message: 'API de Autenticación Segura',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        google: '/auth/google',
        register: '/auth/register',
        login: '/auth/login',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        me: '/auth/me',
      },
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);

// ========== Error Handler ==========
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ========== Start Server ==========
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Servidor backend iniciado exitosamente');
      console.log('='.repeat(50));
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configurado' : 'No configurado'}`);
      console.log(`🔑 Keycloak: ${process.env.KEYCLOAK_CLIENT_ID ? 'Configurado' : 'No configurado'}`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('✗ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
