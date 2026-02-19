// api/wardrobe/analyze.js - AI clothing photo analysis
import { requireAuth, cors } from '../../lib/auth.js';
import { getSQL } from '../../lib/db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  const { image_base64 } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'Image required' });

  try {
    const sql = getSQL();

    // Get user profile for size estimation
    let profile = null;
    try {
      const profileResult = await sql`SELECT * FROM user_profiles WHERE user_id = ${decoded.userId} LIMIT 1`;
      profile = profileResult.rows[0] || null;
    } catch (e) {
      console.log('Profile lookup skipped:', e.message);
    }

    // Build size context from profile
    let sizeHint = '';
    if (profile) {
      const parts = [];
      if (profile.height_cm) parts.push('Taille: ' + profile.height_cm + 'cm');
      if (profile.weight_kg) parts.push('Poids: ' + profile.weight_kg + 'kg');
      if (profile.chest_cm) parts.push('Poitrine: ' + profile.chest_cm + 'cm');
      if (profile.waist_cm) parts.push('Tour de taille: ' + profile.waist_cm + 'cm');
      if (profile.shoe_size) parts.push('Pointure: ' + profile.shoe_size);
      if (parts.length > 0) {
        sizeHint = '\n\nMensurations du proprietaire: ' + parts.join(', ') + '. Estime la taille du vetement.';
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    // Strip data URL prefix if present
    const base64Data = image_base64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Detect media type
    let mediaType = 'image/jpeg';
    if (image_base64.startsWith('data:image/png')) mediaType = 'image/png';
    else if (image_base64.startsWith('data:image/webp')) mediaType = 'image/webp';

    console.log('Calling Anthropic API, image size:', Math.round(base64Data.length / 1024) + 'KB');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data }
            },
            {
              type: 'text',
              text: 'Analyse ce vetement masculin et retourne UNIQUEMENT un objet JSON (sans markdown, sans backticks) avec ces champs:\n\n{"name": "description courte en francais", "category": "tops|bottoms|outerwear|shoes|suits|accessories", "subcategory": "type precis (blazer, chemise, jeans, etc.)", "color_primary": "couleur principale en francais", "brand": "marque visible ou null", "material": "materiau estime", "fit": "slim|regular|relaxed|oversized", "pattern": "rayures|carreaux|pois|floral|geometrique|autre ou null si uni", "size": "taille estimee"}' + sizeHint + '\n\nReponds UNIQUEMENT avec le JSON.'
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(500).json({ error: 'AI analysis failed: ' + response.status });
    }

    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : '';
    
    console.log('AI response:', text.substring(0, 200));

    // Parse JSON from response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', cleaned);
      return res.status(200).json({ error: 'Could not parse AI response', raw: cleaned });
    }

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};
