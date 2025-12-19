import express from 'express';
import pool from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== Get All Tournaments ==========
// Anyone authenticated can view tournaments
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM tournaments
      ORDER BY created_at DESC
    `);

    res.json({
      tournaments: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Error al obtener torneos' });
  }
});

// ========== Get Tournament by ID ==========
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    const matchesResult = await pool.query(
      'SELECT * FROM matches WHERE tournament_id = $1 ORDER BY round, id',
      [id]
    );

    res.json({
      tournament: tournamentResult.rows[0],
      matches: matchesResult.rows
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Error al obtener torneo' });
  }
});

// ========== Create Tournament ==========
// Only admins can create tournaments
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, start_date, end_date, max_participants } = req.body;

    // Validation
    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['name', 'start_date', 'end_date']
      });
    }

    const result = await pool.query(
      `INSERT INTO tournaments (name, description, start_date, end_date, max_participants, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, start_date, end_date, max_participants || 16, req.user.sub]
    );

    res.status(201).json({
      message: 'Torneo creado exitosamente',
      tournament: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Error al crear torneo' });
  }
});

// ========== Update Tournament ==========
// Only admins can update tournaments
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, max_participants, status } = req.body;

    const result = await pool.query(
      `UPDATE tournaments
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           max_participants = COALESCE($5, max_participants),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, start_date, end_date, max_participants, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    res.json({
      message: 'Torneo actualizado exitosamente',
      tournament: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Error al actualizar torneo' });
  }
});

// ========== Delete Tournament ==========
// Only admins can delete tournaments
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tournaments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    res.json({
      message: 'Torneo eliminado exitosamente',
      tournament: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Error al eliminar torneo' });
  }
});

export default router;
