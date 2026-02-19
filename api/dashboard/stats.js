import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Auth required' });

  try {
    const userId = decoded.userId;

    let wardrobe_count = 0, looks_count = 0, conversation_count = 0, saved_count = 0, has_profile = false;

    try {
      const w = await sql`SELECT COUNT(*) as c FROM wardrobe_items WHERE user_id = ${userId}`;
      wardrobe_count = parseInt(w.rows[0].c);
    } catch(e) {}

    try {
      const l = await sql`SELECT COUNT(*) as c FROM looks WHERE user_id = ${userId}`;
      looks_count = parseInt(l.rows[0].c);
    } catch(e) {}

    try {
      const c = await sql`SELECT COUNT(*) as c FROM stylist_conversations WHERE user_id = ${userId}`;
      conversation_count = parseInt(c.rows[0].c);
    } catch(e) {}

    try {
      const s = await sql`SELECT COUNT(*) as c FROM saved_products WHERE user_id = ${userId}`;
      saved_count = parseInt(s.rows[0].c);
    } catch(e) {}

    try {
      const p = await sql`SELECT id FROM user_profiles WHERE user_id = ${userId} AND chest_cm IS NOT NULL`;
      has_profile = p.rows.length > 0;
    } catch(e) {}

    return res.status(200).json({
      wardrobe_count,
      looks_count,
      conversation_count,
      saved_count,
      has_profile
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
