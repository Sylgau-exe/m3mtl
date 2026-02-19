// api/products/index.js — Product catalog API
import { getSQL } from '../../lib/db.js';
import { getUserFromRequest, requireAuth, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getSQL();

  // GET — Public product listing with filters
  if (req.method === 'GET') {
    try {
      const { category, occasion, min, max, designer, featured, search, limit } = req.query;
      const maxResults = Math.min(parseInt(limit) || 50, 100);

      let query = `
        SELECT p.*, d.brand_name as designer_name, d.slug as designer_slug, d.logo_url as designer_logo
        FROM products p
        JOIN designers d ON p.designer_id = d.id
        WHERE p.status = 'active' AND p.in_stock = true AND d.status = 'active'
      `;
      const params = [];
      let paramIdx = 0;

      if (category) {
        paramIdx++;
        query += ` AND p.category = $${paramIdx}`;
        params.push(category);
      }
      if (occasion) {
        paramIdx++;
        query += ` AND $${paramIdx} = ANY(p.occasion)`;
        params.push(occasion);
      }
      if (min) {
        paramIdx++;
        query += ` AND p.price >= $${paramIdx}`;
        params.push(parseFloat(min));
      }
      if (max) {
        paramIdx++;
        query += ` AND p.price <= $${paramIdx}`;
        params.push(parseFloat(max));
      }
      if (designer) {
        paramIdx++;
        query += ` AND d.slug = $${paramIdx}`;
        params.push(designer);
      }
      if (featured === 'true') {
        query += ` AND p.featured = true`;
      }
      if (search) {
        paramIdx++;
        query += ` AND (p.name_fr ILIKE $${paramIdx} OR p.description_fr ILIKE $${paramIdx} OR d.brand_name ILIKE $${paramIdx})`;
        params.push('%' + search + '%');
      }

      query += ` ORDER BY p.featured DESC, p.ai_recommend_count DESC, p.created_at DESC`;
      paramIdx++;
      query += ` LIMIT $${paramIdx}`;
      params.push(maxResults);

      // Use raw neon query for dynamic params
      const neon = (await import('@neondatabase/serverless')).neon;
      const rawSql = neon(process.env.POSTGRES_URL);
      const products = await rawSql(query, params);

      return res.status(200).json({ products, count: products.length });

    } catch (error) {
      console.error('Products GET error:', error);
      return res.status(500).json({ error: 'Failed to load products' });
    }
  }

  // POST — Designer adds product
  if (req.method === 'POST') {
    const decoded = await requireAuth(req, res);
    if (!decoded) return;

    try {
      // Verify user is a designer
      const designerResult = await sql`SELECT id FROM designers WHERE user_id = ${decoded.userId} AND status = 'active'`;
      const designer = designerResult.rows[0];
      if (!designer) return res.status(403).json({ error: 'Designer account required' });

      const { name, name_fr, description_fr, category, subcategory, price, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images } = req.body;

      if (!name || !category || !price) {
        return res.status(400).json({ error: 'Name, category, and price are required' });
      }

      const result = await sql`
        INSERT INTO products (designer_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status)
        VALUES (${designer.id}, ${name}, ${name_fr || name}, ${description_fr || null}, ${category}, ${subcategory || null}, ${price}, 'CAD', ${color_primary || null}, ${pattern || null}, ${material || null}, ${fit || null}, ${available_sizes || null}, ${season || null}, ${occasion || null}, ${style_tags || null}, ${images || null}, 'active')
        RETURNING *
      `;

      return res.status(201).json({ product: result.rows[0] });

    } catch (error) {
      console.error('Products POST error:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
