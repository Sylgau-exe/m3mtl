// api/tryon/generate.js — FASHN Virtual Try-On integration
import { requireAuth, cors } from '../../lib/auth.js';
import { getSQL } from '../../lib/db.js';

const FASHN_BASE = 'https://api.fashn.ai/v1';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  const { model_image, garment_image, product_id } = req.body;
  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'model_image and garment_image are required' });
  }

  const FASHN_API_KEY = process.env.FASHN_API_KEY;
  if (!FASHN_API_KEY) {
    return res.status(500).json({ error: 'FASHN API key not configured' });
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FASHN_API_KEY}`
    };

    // 1. Submit prediction
    console.log('Submitting FASHN try-on prediction...');
    const runRes = await fetch(`${FASHN_BASE}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: model_image,
          garment_image: garment_image
        }
      })
    });

    if (!runRes.ok) {
      const errBody = await runRes.text();
      console.error('FASHN run error:', runRes.status, errBody);
      return res.status(500).json({ error: 'FASHN submission failed: ' + runRes.status });
    }

    const runData = await runRes.json();
    const predictionId = runData.id;
    console.log('FASHN prediction ID:', predictionId);

    // 2. Poll for completion (max 60 seconds)
    const maxPolls = 30;
    const pollInterval = 2000; // 2 seconds
    
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(`${FASHN_BASE}/status/${predictionId}`, { headers });
      const statusData = await statusRes.json();

      console.log(`Poll ${i + 1}: status=${statusData.status}`);

      if (statusData.status === 'completed') {
        const outputUrl = statusData.output?.[0];
        if (!outputUrl) {
          return res.status(500).json({ error: 'No output image returned' });
        }

        // Track recommendation if product_id provided
        if (product_id) {
          try {
            const sql = getSQL();
            await sql`UPDATE products SET view_count = view_count + 1 WHERE id = ${product_id}`;
          } catch(e) {}
        }

        return res.status(200).json({
          success: true,
          image_url: outputUrl,
          prediction_id: predictionId
        });
      }

      if (statusData.status === 'failed') {
        console.error('FASHN prediction failed:', statusData.error);
        return res.status(500).json({
          error: 'Try-on generation failed',
          detail: statusData.error?.message || 'Unknown error'
        });
      }
    }

    // Timeout
    return res.status(408).json({ error: 'Try-on generation timed out', prediction_id: predictionId });

  } catch (error) {
    console.error('Try-on error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
  maxDuration: 60, // Allow 60s for Vercel function
};
