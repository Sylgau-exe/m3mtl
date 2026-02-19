// lib/db.js - Database helper for M3 Style
import { neon } from '@neondatabase/serverless';

function getSQL() {
  const sql = neon(process.env.POSTGRES_URL);
  // Wrap to match @vercel/postgres interface: returns { rows: [...] }
  return async function(strings, ...values) {
    const rows = await sql(strings, ...values);
    return { rows };
  };
}

export { getSQL };

export const UserDB = {
  async create(email, passwordHash, name) {
    const sql = getSQL();
    const result = await sql`
      INSERT INTO users (email, password_hash, name, auth_provider)
      VALUES (${email}, ${passwordHash}, ${name}, 'email')
      RETURNING *
    `;
    return result.rows[0];
  },

  async createGoogleUser(email, name, googleId) {
    const sql = getSQL();
    const result = await sql`
      INSERT INTO users (email, name, google_id, auth_provider, email_verified)
      VALUES (${email}, ${name}, ${googleId}, 'google', true)
      RETURNING *
    `;
    return result.rows[0];
  },

  async linkGoogleAccount(userId, googleId) {
    const sql = getSQL();
    const result = await sql`
      UPDATE users SET google_id = ${googleId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async findByEmail(email) {
    const sql = getSQL();
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result.rows[0] || null;
  },

  async findById(id) {
    const sql = getSQL();
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async setResetToken(email, token, expiresAt) {
    const sql = getSQL();
    const result = await sql`
      UPDATE users SET
        reset_token = ${token},
        reset_token_expires = ${expiresAt},
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING *
    `;
    return result.rows[0];
  },

  async findByResetToken(token) {
    const sql = getSQL();
    const result = await sql`
      SELECT * FROM users 
      WHERE reset_token = ${token} 
        AND reset_token_expires > CURRENT_TIMESTAMP
    `;
    return result.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const sql = getSQL();
    const result = await sql`
      UPDATE users SET
        password_hash = ${passwordHash},
        reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  }
};
