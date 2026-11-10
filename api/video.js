/*
 * /api/video — short vertical promo clip from a mockup photo, through Treg
 * (Seedance 1 Lite, 5 s at 720p 9:16 ≈ $0.18).
 *
 *   POST { image, prompt }  start → { id }
 *   GET  ?id=…              progress → { status: 'processing' | 'done' | 'failed', url }
 * The finished video link is temporary (about an hour): the app tells you to download it.
 */
const { treg, guard, readBody } = require('./_treg');

module.exports = async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method === 'POST') {
      const b = readBody(req);
      const image = String(b.image || '');
      if (!/^https:\/\//.test(image)) return res.status(400).json({ error: 'image', message: 'Make a mockup photo first; the video starts from it.' });
      const prompt = String(b.prompt || 'Slow, smooth camera push-in on the product, soft natural light, gentle movement, no text changes.').slice(0, 1200);
      const { json, cost } = await treg('replicate.video-gen.seedance-1-lite', { body: { input: { prompt, image, duration: 5, resolution: '720p', aspect_ratio: '9:16' } } });
      return res.status(200).json({ id: json && json.id, cost });
    }
    const id = req.query && req.query.id;
    if (!id) return res.status(400).json({ error: 'request', message: 'Send POST {image, prompt} or GET ?id=.' });
    const { json } = await treg('replicate.predictions.get', { query: { id: String(id) } });
    const st = json && json.status;
    const out = json && json.output;
    const url = Array.isArray(out) ? out[0] : out;
    return res.status(200).json({ status: st === 'succeeded' ? 'done' : (st === 'failed' || st === 'canceled') ? 'failed' : 'processing', url: url || null, error: json && json.error });
  } catch (e) {
    return res.status(e.status === 402 ? 402 : 502).json({ error: e.status === 402 ? 'balance' : 'upstream', message: e.message });
  }
};
