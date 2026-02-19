import { getSQL } from '../../lib/db.js';
const sql = getSQL();
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Auth required' });
  const userId = decoded.userId;

  // GET - retrieve profile
  if (req.method === 'GET') {
    try {
      const result = await sql`SELECT * FROM user_profiles WHERE user_id = ${userId}`;
      return res.status(200).json({ profile: result.rows[0] || null });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - create or update profile
  if (req.method === 'POST') {
    try {
      const {
        height_cm, weight_kg, chest_cm, waist_cm, hips_cm, inseam_cm,
        shoulder_cm, neck_cm, arm_length_cm, shoe_size, shoe_system,
        body_type, style_preferences, preferred_colors, avoid_colors,
        preferred_fit, budget_min, budget_max
      } = req.body;

      // Check if profile exists
      const existing = await sql`SELECT id FROM user_profiles WHERE user_id = ${userId}`;

      let result;
      if (existing.rows.length > 0) {
        result = await sql`
          UPDATE user_profiles SET
            height_cm = ${height_cm || null},
            weight_kg = ${weight_kg || null},
            chest_cm = ${chest_cm || null},
            waist_cm = ${waist_cm || null},
            hips_cm = ${hips_cm || null},
            inseam_cm = ${inseam_cm || null},
            shoulder_cm = ${shoulder_cm || null},
            neck_cm = ${neck_cm || null},
            arm_length_cm = ${arm_length_cm || null},
            shoe_size = ${shoe_size || null},
            shoe_system = ${shoe_system || 'US'},
            body_type = ${body_type || null},
            style_preferences = ${style_preferences || null},
            preferred_colors = ${preferred_colors || null},
            avoid_colors = ${avoid_colors || null},
            preferred_fit = ${preferred_fit || null},
            budget_min = ${budget_min || 0},
            budget_max = ${budget_max || 500},
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
          RETURNING *
        `;
      } else {
        result = await sql`
          INSERT INTO user_profiles (
            user_id, height_cm, weight_kg, chest_cm, waist_cm, hips_cm, inseam_cm,
            shoulder_cm, neck_cm, arm_length_cm, shoe_size, shoe_system,
            body_type, style_preferences, preferred_colors, avoid_colors,
            preferred_fit, budget_min, budget_max
          ) VALUES (
            ${userId}, ${height_cm || null}, ${weight_kg || null}, ${chest_cm || null},
            ${waist_cm || null}, ${hips_cm || null}, ${inseam_cm || null},
            ${shoulder_cm || null}, ${neck_cm || null}, ${arm_length_cm || null},
            ${shoe_size || null}, ${shoe_system || 'US'}, ${body_type || null},
            ${style_preferences || null}, ${preferred_colors || null}, ${avoid_colors || null},
            ${preferred_fit || null}, ${budget_min || 0}, ${budget_max || 500}
          ) RETURNING *
        `;
      }

      return res.status(200).json({ profile: result.rows[0] });
    } catch (error) {
      console.error('Save profile error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
