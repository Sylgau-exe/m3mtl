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

  // Reject placeholder images
  if (garment_image.includes('placehold.co') || garment_image.includes('placeholder')) {
    return res.status(400).json({ 
      error: "L'image du produit est un placeholder. L'essayage virtuel necessite une vraie photo du vetement.",
      code: 'PLACEHOLDER_IMAGE'
    });
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + FASHN_API_KEY
    };

    // FASHN accepts both URLs and base64 data URIs
    console.log('FASHN try-on:', {
      model: model_image.startsWith('data:') ? 'base64(' + Math.round(model_image.length/1024) + 'KB)' : 'url',
      garment: garment_image.startsWith('data:') ? 'base64(' + Math.round(garment_image.length/1024) + 'KB)' : garment_image.substring(0, 80)
    });

    // 1. Submit prediction
    const runRes = await fetch(FASHN_BASE + '/run', {
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

    const runData = await runRes.json();
    if (!runRes.ok) {
      console.error('FASHN run error:', runRes.status, JSON.stringify(runData));
      return res.status(500).json({ error: 'FASHN: ' + (runData.message || runData.error || runRes.status), detail: runData });
    }

    const predictionId = runData.id;
    if (!predictionId) {
      return res.status(500).json({ error: 'No prediction ID', detail: runData });
    }
    console.log('Prediction ID:', predictionId);

    // 2. Poll for completion (max 60s)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(FASHN_BASE + '/status/' + predictionId, { headers });
      const statusData = await statusRes.json();
      console.log('Poll ' + (i+1) + ': ' + statusData.status);

      if (statusData.status === 'completed') {
        const outputUrl = statusData.output && statusData.output[0];
        if (!outputUrl) return res.status(500).json({ error: 'No output image' });

        if (product_id) {
          try { const sql = getSQL(); await sql`UPDATE products SET view_count = view_count + 1 WHERE id = ${product_id}`; } catch(e) {}
        }
        return res.status(200).json({ success: true, image_url: outputUrl, prediction_id: predictionId });
      }

      if (statusData.status === 'failed') {
        const errMsg = statusData.error ? (statusData.error.message || statusData.error.name || JSON.stringify(statusData.error)) : 'Unknown';
        console.error('FASHN failed:', errMsg);
        return res.status(500).json({ error: 'Try-on generation failed: ' + errMsg });
      }
    }

    return res.status(408).json({ error: 'Timeout after 60s', prediction_id: predictionId });
  } catch (error) {
    console.error('Try-on error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
  maxDuration: 60,
};
