import { getSQL } from '../../lib/db.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { image_base64 } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'Image required' });

  try {
    const sql = getSQL();

    // Get user profile for size estimation
    const profileResult = await sql`SELECT * FROM user_profiles WHERE user_id = ${user.id} LIMIT 1`;
    const profile = profileResult.rows[0] || null;

    // Build size context from profile
    let sizeHint = '';
    if (profile) {
      const parts = [];
      if (profile.height_cm) parts.push(`Taille: ${profile.height_cm}cm`);
      if (profile.weight_kg) parts.push(`Poids: ${profile.weight_kg}kg`);
      if (profile.chest_cm) parts.push(`Poitrine: ${profile.chest_cm}cm`);
      if (profile.waist_cm) parts.push(`Tour de taille: ${profile.waist_cm}cm`);
      if (profile.shoulder_cm) parts.push(`Épaules: ${profile.shoulder_cm}cm`);
      if (profile.inseam_cm) parts.push(`Entrejambe: ${profile.inseam_cm}cm`);
      if (profile.shoe_size) parts.push(`Pointure: ${profile.shoe_size}`);
      if (profile.body_type) parts.push(`Morphologie: ${profile.body_type}`);
      if (parts.length > 0) {
        sizeHint = `\n\nMensurations du propriétaire: ${parts.join(', ')}. Estime la taille du vêtement basé sur ces mensurations (ex: M, L, XL, 32, 42, etc.)`;
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
              text: `Analyse ce vêtement masculin et retourne UNIQUEMENT un objet JSON (sans markdown, sans backticks) avec ces champs:

{
  "name": "description courte en français (ex: Chemise bleue à rayures)",
  "category": "tops|bottoms|outerwear|shoes|suits|accessories",
  "subcategory": "type précis (ex: chemise, polo, jeans, blazer, derby, ceinture)",
  "color_primary": "couleur principale en français",
  "brand": "marque visible ou null si non visible",
  "material": "matériau estimé (ex: coton, laine, cuir, polyester)",
  "fit": "slim|regular|relaxed|oversized ou null",
  "pattern": "rayures|carreaux|pois|floral|geometrique|autre ou null si uni",
  "size": "taille estimée"
}${sizeHint}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return res.status(500).json({ error: 'AI analysis failed' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    
    // Parse JSON from response (strip any markdown fences just in case)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', cleaned);
      return res.status(500).json({ error: 'Could not parse AI response', raw: cleaned });
    }

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};
