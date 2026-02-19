import { getSQL } from '../../lib/db.js';
const sql = getSQL();
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Auth required' });
  const userId = decoded.userId;

  // GET - list wardrobe items
  if (req.method === 'GET') {
    try {
      const { category, favorite } = req.query;
      let result;
      if (category) {
        result = await sql`
          SELECT * FROM wardrobe_items 
          WHERE user_id = ${userId} AND category = ${category}
          ORDER BY created_at DESC
        `;
      } else if (favorite === 'true') {
        result = await sql`
          SELECT * FROM wardrobe_items 
          WHERE user_id = ${userId} AND is_favorite = true
          ORDER BY created_at DESC
        `;
      } else {
        result = await sql`
          SELECT * FROM wardrobe_items 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
      }
      return res.status(200).json({ items: result.rows });
    } catch (error) {
      console.error('Get wardrobe error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - add wardrobe item
  if (req.method === 'POST') {
    try {
      const {
        name, category, subcategory, color_primary, color_secondary,
        pattern, material, brand, size, fit, season, occasion,
        ai_tags, ai_description, image_url, condition
      } = req.body;

      if (!category) return res.status(400).json({ error: 'Category is required' });

      const result = await sql`
        INSERT INTO wardrobe_items (
          user_id, name, category, subcategory, color_primary, color_secondary,
          pattern, material, brand, size, fit, season, occasion,
          ai_tags, ai_description, image_url, condition
        ) VALUES (
          ${userId}, ${name || null}, ${category}, ${subcategory || null},
          ${color_primary || null}, ${color_secondary || null},
          ${pattern || null}, ${material || null}, ${brand || null},
          ${size || null}, ${fit || null}, ${season || null}, ${occasion || null},
          ${ai_tags || null}, ${ai_description || null}, ${image_url || null},
          ${condition || 'good'}
        ) RETURNING *
      `;

      return res.status(201).json({ item: result.rows[0] });
    } catch (error) {
      console.error('Add wardrobe error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PUT - update wardrobe item
  if (req.method === 'PUT') {
    try {
      const { id, ...fields } = req.body;
      if (!id) return res.status(400).json({ error: 'Item ID required' });

      // Verify ownership
      const check = await sql`SELECT id FROM wardrobe_items WHERE id = ${id} AND user_id = ${userId}`;
      if (check.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

      const result = await sql`
        UPDATE wardrobe_items SET
          name = COALESCE(${fields.name || null}, name),
          category = COALESCE(${fields.category || null}, category),
          subcategory = COALESCE(${fields.subcategory || null}, subcategory),
          color_primary = COALESCE(${fields.color_primary || null}, color_primary),
          color_secondary = COALESCE(${fields.color_secondary || null}, color_secondary),
          pattern = COALESCE(${fields.pattern || null}, pattern),
          material = COALESCE(${fields.material || null}, material),
          brand = COALESCE(${fields.brand || null}, brand),
          size = COALESCE(${fields.size || null}, size),
          fit = COALESCE(${fields.fit || null}, fit),
          is_favorite = COALESCE(${fields.is_favorite}, is_favorite),
          condition = COALESCE(${fields.condition || null}, condition),
          image_url = COALESCE(${fields.image_url || null}, image_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;

      return res.status(200).json({ item: result.rows[0] });
    } catch (error) {
      console.error('Update wardrobe error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE - remove wardrobe item
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Item ID required' });

      await sql`DELETE FROM wardrobe_items WHERE id = ${id} AND user_id = ${userId}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete wardrobe error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
