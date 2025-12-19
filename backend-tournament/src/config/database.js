import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✓ Connected to Tournament database');
});

pool.on('error', (err) => {
  console.error('✗ Database error:', err);
});

// Initialize tournament database schema
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('Initializing tournament database schema...');

    // Create tournaments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        max_participants INTEGER DEFAULT 16,
        status VARCHAR(50) DEFAULT 'upcoming',
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create matches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        player1_id INTEGER,
        player2_id INTEGER,
        winner_id INTEGER,
        score VARCHAR(50),
        match_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
      CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
      CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
    `);

    console.log('✓ Tournament database schema initialized');
  } catch (error) {
    console.error('✗ Error initializing tournament database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
