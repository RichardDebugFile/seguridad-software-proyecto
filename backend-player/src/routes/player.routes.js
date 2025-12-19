import express from 'express';
import pool from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== Get All Players ==========
// Anyone authenticated can view players
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM players
      WHERE is_active = true
      ORDER BY ranking DESC, name ASC
    `);

    res.json({
      players: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Error al obtener jugadores' });
  }
});

// ========== Get Player by ID ==========
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const playerResult = await pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    const statsResult = await pool.query(
      'SELECT * FROM player_statistics WHERE player_id = $1',
      [id]
    );

    res.json({
      player: playerResult.rows[0],
      statistics: statsResult.rows
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Error al obtener jugador' });
  }
});

// ========== Create Player ==========
// Only admins can create players
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, country, ranking, bio } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['name', 'email']
      });
    }

    const result = await pool.query(
      `INSERT INTO players (name, email, country, ranking, bio)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, country, ranking || 0, bio]
    );

    res.status(201).json({
      message: 'Jugador creado exitosamente',
      player: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Error al crear jugador' });
  }
});

// ========== Update Player ==========
// Only admins can update players
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, country, ranking, wins, losses, bio, avatar_url, is_active } = req.body;

    const result = await pool.query(
      `UPDATE players
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           country = COALESCE($3, country),
           ranking = COALESCE($4, ranking),
           wins = COALESCE($5, wins),
           losses = COALESCE($6, losses),
           bio = COALESCE($7, bio),
           avatar_url = COALESCE($8, avatar_url),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, email, country, ranking, wins, losses, bio, avatar_url, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    res.json({
      message: 'Jugador actualizado exitosamente',
      player: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Error al actualizar jugador' });
  }
});

// ========== Delete Player ==========
// Only admins can delete players (soft delete)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE players SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    res.json({
      message: 'Jugador desactivado exitosamente',
      player: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Error al eliminar jugador' });
  }
});

export default router;
