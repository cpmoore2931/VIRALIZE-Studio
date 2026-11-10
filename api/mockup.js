/*
 * /api/mockup — product mockup photos through Treg (Nano Banana Pro, about $0.03 each).
 *
 *   POST { prompt, size }  start a 2K image (size 3:4 default; 2:3 for Pinterest pins) → { id }
 *   GET  ?id=task_…        check progress         → { status: 'processing' | 'done' | 'failed', url }
 *   GET  ?img=<url>        same-origin copy of a finished image (so the app can save a thumbnail
 *                          and offer a download); only the image host Treg returns is allowed.
 * All calls need the X-App-Passcode header (or k= in the query for the image proxy).
 */
const { treg, guard, readBody } = require('./_treg');
const IMG_HOSTS = /(^|\.)deepytb\.com$/;

module.exports = async function handler(req, res) {
  if (!guard(req, res)) return;
  try {
    if (req.method === 'POST') {
      const b = readBody(req);
      const prompt = String(b.prompt || '').trim().slice(0, 3000);
      const size = ['3:4', '2:3', '1:1', '4:5', '9:16'].includes(b.size) ? b.size : '3:4';
      if (prompt.length < 20) return res.status(400).json({ error: 'prompt', message: 'The photo description is too short.' });
      const { json, cost } = await treg('reapi.image-gen.gemini-3-pro-image', { body: { model: 'gemini-3-pro-image-preview', prompt, size, resolution: '2K' } });
      return res.status(200).json({ id: json && json.id, cost });
    }
    const { id, img } = req.query || {};
    if (id) {
      const { json } = await treg('reapi.tasks.get', { query: { id: String(id) } });
      const st = json && json.status;
      const url = json && json.output && json.output.image_urls && json.output.image_urls[0];
      return res.status(200).json({ status: st === 'completed' ? 'done' : st === 'failed' ? 'failed' : 'processing', url: url || null, error: json && json.error });
    }
    if (img) {
      let u;
      try { u = new URL(String(img)); } catch (e) { return res.status(400).json({ error: 'img' }); }
      if (u.protocol !== 'https:' || !IMG_HOSTS.test(u.hostname)) return res.status(400).json({ error: 'img', message: 'That image host is not allowed.' });
      const r = await fetch(u.toString());
      if (!r.ok) return res.status(502).json({ error: 'img', message: `Image fetch failed (${r.status}).` });
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=86400');
      if (req.query.download) res.setHeader('Content-Disposition', `attachment; filename="${String(req.query.download).replace(/[^\w.-]+/g, '-')}.jpg"`);
      return res.status(200).send(buf);
    }
    return res.status(400).json({ error: 'request', message: 'Send POST {prompt}, or GET ?id= or ?img=.' });
  } catch (e) {
    return res.status(e.status === 402 ? 402 : 502).json({ error: e.status === 402 ? 'balance' : 'upstream', message: e.message });
  }
};
