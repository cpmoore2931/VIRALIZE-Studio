/*
 * /api/social — TikTok trending hashtags this week (US), by industry, through Treg.
 * GET with header X-App-Passcode. About $0.001 per board, 7 boards ≈ $0.008.
 * Tool: anyapi.tiktok.trending_hashtags (top 3 per board is the cheap tier).
 */
const { treg, guard } = require('./_treg');

const BOARDS = [
  ['', 'All of TikTok'], ['education', 'Education'], ['household_products', 'Home & household'],
  ['health', 'Health'], ['beauty_personal_care', 'Beauty & self-care'], ['baby_kids_maternity', 'Baby & kids'],
  ['home_improvement', 'Home improvement']
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  if (!guard(req, res)) return;
  const results = await Promise.allSettled(BOARDS.map(([industry]) =>
    treg('anyapi.tiktok.trending_hashtags', { body: Object.assign({ limit: 3, period: 7, region: 'US' }, industry ? { industry } : {}) })));
  let cost = 0;
  const boards = results.map((r, i) => {
    if (r.status !== 'fulfilled') return { key: BOARDS[i][0], label: BOARDS[i][1], tags: [], error: true };
    cost += r.value.cost;
    const items = (((r.value.json || {}).output || {}).data || {}).items || [];
    return {
      key: BOARDS[i][0], label: BOARDS[i][1],
      tags: items.map(t => ({ tag: t.hashtag, rank: t.rank, posts: t.posts || 0, views: t.views || 0, curve: (t.popularity || []).map(p => Math.round(p.value || 0)) }))
    };
  });
  if (boards.every(b => b.error)) return res.status(502).json({ error: 'upstream', message: 'TikTok trends are unavailable right now.' });
  res.status(200).json({ at: new Date().toISOString(), boards, cost: Math.round(cost * 10000) / 10000 });
};
