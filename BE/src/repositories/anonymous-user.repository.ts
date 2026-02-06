/**
 * Anonymous User Repository - Raw SQL
 */
import { pool } from '../db/index.js';

export interface AnonymousUserRow {
  id: string;
  session_id: string;
  created_at: Date;
  last_seen_at: Date;
}

export class AnonymousUserRepository {
  /**
   * Find or create anonymous user by session ID
   */
  async findOrCreateBySessionId(sessionId: string): Promise<AnonymousUserRow> {
    // Try to find existing user
    const findQuery = `SELECT * FROM anonymous_users WHERE session_id = $1`;
    const { rows: existingRows } = await pool.query<AnonymousUserRow>(findQuery, [sessionId]);
    
    if (existingRows[0]) {
      // Update last seen
      await this.updateLastSeen(sessionId);
      return existingRows[0];
    }

    // Create new user
    const createQuery = `
      INSERT INTO anonymous_users (session_id)
      VALUES ($1)
      RETURNING *
    `;
    
    const { rows: newRows } = await pool.query<AnonymousUserRow>(createQuery, [sessionId]);
    return newRows[0];
  }

  /**
   * Find by session ID
   */
  async findBySessionId(sessionId: string): Promise<AnonymousUserRow | null> {
    const query = `SELECT * FROM anonymous_users WHERE session_id = $1`;
    const { rows } = await pool.query<AnonymousUserRow>(query, [sessionId]);
    return rows[0] || null;
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(sessionId: string): Promise<void> {
    const query = `
      UPDATE anonymous_users 
      SET last_seen_at = NOW()
      WHERE session_id = $1
    `;
    await pool.query(query, [sessionId]);
  }
}

// Export singleton
export const anonymousUserRepository = new AnonymousUserRepository();
