import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    provider: user.provider,
    roles: user.roles || [], // Include roles in JWT payload
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
}

export async function saveRefreshToken(userId, refreshToken) {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const expiresAt = new Date(decoded.exp * 1000);

  // Revocar tokens antiguos del usuario antes de insertar uno nuevo
  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
    [userId]
  );

  // Insertar el nuevo token
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, expiresAt]
  );
}

export async function verifyRefreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid refresh token');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export async function revokeRefreshToken(refreshToken) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [
    refreshToken,
  ]);
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to check if user has admin role
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requiere rol de administrador para acceder a este recurso'
    });
  }
  next();
}

// Middleware to check if user has specific role
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Se requiere rol '${role}' para acceder a este recurso`
      });
    }
    next();
  };
}
