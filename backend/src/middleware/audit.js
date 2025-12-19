import pool from '../config/database.js';

export async function logAuthEvent(data) {
  const {
    userId = null,
    provider,
    action,
    success,
    ipAddress,
    userAgent,
    errorMessage = null,
    metadata = null,
  } = data;

  try {
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, provider, action, success, ip_address, user_agent, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        provider,
        action,
        success,
        ipAddress,
        userAgent,
        errorMessage,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
}

export function getClientInfo(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}
