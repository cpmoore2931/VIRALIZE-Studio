/*
 * Shared server helpers for the api/ functions (files starting with "_" are not routes on Vercel).
 * treg(id, {body, query, method})  calls https://treg.to/call/<id> with the server-side TREG_TOKEN.
 * guard(req, res)                    checks TREG_TOKEN is set and the X-App-Passcode header matches APP_PASSCODE.
 */
const TREG = 'https://treg.to/call/';

async function treg(id, opts = {}) {
  const token = process.env.TREG_TOKEN;
  const qs = opts.query ? '?' + new URLSearchParams(opts.query).toString() : '';
  const method = opts.method || (opts.body !== undefined ? 'POST' : 'GET');
  const r = await fetch(TREG + id + qs, {
    method,
    headers: Object.assign({ 'X-Treg-Token': token }, opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
  const cost = Number(r.headers.get('x-treg-cost-micro') || 0) / 1e6;
  if (!r.ok) {
    const msg = (json && (json.detail || json.error || json.message)) || text.slice(0, 200);
    const err = new Error(`${id}: ${r.status} ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    err.status = r.status;
    throw err;
  }
  return { json, cost };
}

/* Returns true if the request may continue; otherwise it has already answered. */
function guard(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.TREG_TOKEN) {
    res.status(503).json({ error: 'setup', message: 'Add TREG_TOKEN in Vercel → Settings → Environment Variables, then redeploy.' });
    return false;
  }
  const pass = process.env.APP_PASSCODE;
  const sent = req.headers['x-app-passcode'] || (req.query && req.query.k);
  if (pass && sent !== pass) {
    res.status(401).json({ error: 'passcode', message: 'Wrong or missing passcode.' });
    return false;
  }
  return true;
}

function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  return body || {};
}

module.exports = { treg, guard, readBody };
