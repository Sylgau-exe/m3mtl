export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({ 
    status: 'ok', 
    service: 'M3 Style',
    timestamp: new Date().toISOString()
  });
}
