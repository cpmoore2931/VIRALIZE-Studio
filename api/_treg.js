/*
 * Shared server helpers for the api/ functions (files starting with "_" are not routes on Vercel).
 * treg(id, {body, query, method})  calls https://treg.to/call/<id> with the server-side TREG_TOKEN.
 * guard(req, res)                    checks TREG_TOKEN is set and the X-App-Passcode header matches APP_PASSCODE.
 * claude({system, context, prompt})  asks Claude through Treg (DataForSEO's live Claude endpoint, ~1¢ a call).
 * parseJson(text)                    pulls the JSON object or array out of a model reply.
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

/*
 * The Claude endpoint takes short pieces: system ≤ 500 chars, prompt ≤ 500 chars, and up to
 * 10 earlier messages of ≤ 500 chars each. Longer context is split into user/ai pairs ("OK").
 */
const CLAUDE = 'dataforseo.x.ai-optimization-claude-llm-responses-live';
const cut = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
function chunks(texts) {
  const out = [];
  texts.filter(Boolean).forEach(t => {
    let rest = String(t).replace(/[ \t]+/g, ' ').trim();
    while (rest) {
      let piece = rest.slice(0, 490);
      if (rest.length > 490) { const sp = piece.lastIndexOf(' '); if (sp > 300) piece = piece.slice(0, sp); }
      out.push({ role: 'user', message: piece }, { role: 'ai', message: 'OK' });
      rest = rest.slice(piece.length).trim();
    }
  });
  return out.slice(0, 10);
}
async function claude({ system, context = [], prompt, maxTokens = 1200, temperature = 0.7 }) {
  const { json, cost } = await treg(CLAUDE, {
    body: [{ model_name: 'claude-sonnet-4-5', max_output_tokens: maxTokens, temperature, system_message: cut(system, 500), message_chain: chunks(context), user_prompt: cut(prompt, 500) }]
  });
  const task = json && json.tasks && json.tasks[0];
  if (!task || task.status_code !== 20000) {
    const err = new Error((task && task.status_message) || (json && json.status_message) || 'The writer did not answer.');
    err.status = 502; throw err;
  }
  const items = (task.result && task.result[0] && task.result[0].items) || [];
  const text = items.flatMap(i => i.sections || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
  return { text, cost: task.cost || cost };
}
function parseJson(text) {
  const s = String(text || '').replace(/```(?:json)?/g, '');
  const a = s.search(/[[{]/);
  if (a < 0) throw Object.assign(new Error('The writer replied without JSON. Try again.'), { status: 502 });
  const close = s[a] === '[' ? ']' : '}';
  const b = s.lastIndexOf(close);
  try { return JSON.parse(s.slice(a, b + 1)); }
  catch (e) { throw Object.assign(new Error('The writer was cut off mid-answer. Try again.'), { status: 502 }); }
}

module.exports = { treg, guard, readBody, claude, parseJson };
