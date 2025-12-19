import express from 'express';
import passport from '../config/passport.js';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import {
  generateTokens,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../middleware/auth.js';
import { logAuthEvent, getClientInfo } from '../middleware/audit.js';

const router = express.Router();

// ========== Google OAuth Routes ==========
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = generateTokens(req.user);
      await saveRefreshToken(req.user.id, refreshToken);

      const clientInfo = getClientInfo(req);
      await logAuthEvent({
        userId: req.user.id,
        provider: 'google',
        action: 'login',
        success: true,
        ...clientInfo,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
    }
  }
);

// ========== Keycloak OAuth Routes ==========
router.get(
  '/keycloak',
  passport.authenticate('keycloak', { scope: ['openid', 'profile', 'email'] })
);

router.get(
  '/keycloak/callback',
  passport.authenticate('keycloak', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=keycloak_auth_failed` }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = generateTokens(req.user);
      await saveRefreshToken(req.user.id, refreshToken);

      const clientInfo = getClientInfo(req);
      await logAuthEvent({
        userId: req.user.id,
        provider: 'keycloak',
        action: 'login',
        success: true,
        ...clientInfo,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error('Keycloak callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
    }
  }
);

// ========== Local Authentication Routes ==========
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users (email, username, password_hash, provider)
       VALUES ($1, $2, $3, $4) RETURNING id, email, username, provider, created_at`,
      [email, username || email.split('@')[0], passwordHash, 'local']
    );

    const clientInfo = getClientInfo(req);
    await logAuthEvent({
      userId: newUser.rows[0].id,
      provider: 'local',
      action: 'register',
      success: true,
      ...clientInfo,
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Error en autenticación' });
    }

    if (!user) {
      const clientInfo = getClientInfo(req);
      await logAuthEvent({
        provider: 'local',
        action: 'login',
        success: false,
        errorMessage: info.message,
        ...clientInfo,
      });

      return res.status(401).json({ error: info.message });
    }

    try {
      const { accessToken, refreshToken } = generateTokens(user);
      await saveRefreshToken(user.id, refreshToken);

      const clientInfo = getClientInfo(req);
      await logAuthEvent({
        userId: user.id,
        provider: 'local',
        action: 'login',
        success: true,
        ...clientInfo,
      });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          provider: user.provider,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  })(req, res, next);
});

// ========== Token Refresh Route ==========
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = await verifyRefreshToken(refreshToken);

    // Get user
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [
      decoded.sub,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Revoke old token and save new one
    await revokeRefreshToken(refreshToken);
    await saveRefreshToken(user.id, newRefreshToken);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// ========== Logout Route ==========
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// ========== Get Current User Route ==========
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      provider: req.user.provider,
      displayName: req.user.display_name,
      pictureUrl: req.user.picture_url,
    },
  });
});

export default router;
