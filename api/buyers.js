/*
 * /api/buyers — what real buyers say about an idea, through Treg (about 1.5¢ per search).
 *
 *   POST { q }  →  { q, reddit: [...], tiktok: [...], summary: { pains, wants, hooks, angles }, cost, at }
 *
 *   scrapecreators.reddit.search.posts   Reddit posts from the last year (~0.2¢)
 *   tikhub.tiktok.search.videos          TikTok videos with views and saves (~0.1¢)
 *   Claude (via _treg.claude)            turns the posts into pain points, wants and video hooks (~1¢)
 * If the summary step fails, the posts still come back.
 */
const { treg, guard, readBody, claude, parseJson } = require('./_treg');

const s = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

async function reddit(q) {
  const { json, cost } = await treg('scrapecreators.reddit.search.posts', { query: { query: q, sort: 'relevance', timeframe: 'year', trim: 'true' } });
  const posts = ((json && json.posts) || []).filter(p => p && p.title && !p.over_18).map(p => ({
    title: s(p.title, 200), text: s(p.selftext, 320), sub: s(p.subreddit, 40), score: p.score || 0, comments: p.num_comments || 0,
    url: p.url && /^https:\/\/(www\.)?reddit\.com\//.test(p.url) ? p.url : `https://www.reddit.com${p.permalink || ''}`, at: (p.created_utc || p.created || 0) * 1000
  }));
  posts.sort((a, b) => (b.comments + b.score) - (a.comments + a.score));
  return { posts: posts.slice(0, 15), cost };
}

async function tiktok(q) {
  const { json, cost } = await treg('tikhub.tiktok.search.videos', { query: { keyword: q, count: 12, region: 'US' } });
  const items = (json && json.data && json.data.search_item_list) || [];
  const vids = items.map(x => x && x.aweme_info).filter(Boolean).map(v => {
    const st = v.statistics || {};
    const user = v.author && v.author.unique_id;
    return {
      text: s(v.desc, 220), views: st.play_count || 0, likes: st.digg_count || 0, saves: st.collect_count || 0, comments: st.comment_count || 0,
      author: s(user, 40), url: user ? `https://www.tiktok.com/@${user}/video/${v.aweme_id}` : '', at: (v.create_time || 0) * 1000,
      cover: (v.video && v.video.cover && v.video.cover.url_list && v.video.cover.url_list[0]) || ''
    };
  }).filter(v => v.text);
  vids.sort((a, b) => b.views - a.views);
  return { videos: vids.slice(0, 10), cost };
}

async function summarize(q, posts, videos) {
  const lines = [
    ...posts.slice(0, 12).map(p => `Reddit r/${p.sub} (${p.comments} comments): ${p.title}. ${s(p.text, 160)}`),
    ...videos.slice(0, 8).map(v => `TikTok (${v.views} views, ${v.saves} saves): ${s(v.text, 150)}`)
  ];
  const { text, cost } = await claude({
    system: 'You find buyer pain points for people who make printable digital products. Reply with ONLY one JSON object, no code fences. Use plain words a buyer would say. Base everything on the posts given; do not invent statistics.',
    context: [
      'Reply shape: {"pains":["5 short pain points, 4-10 words each"],"wants":["5 things buyers wish existed or ask for"],"hooks":["5 TikTok or Reels opening lines under 12 words that speak to these pains"],"angles":["3 printable product ideas that solve them, 3-7 words each"]}',
      `Posts about "${s(q, 80)}":`,
      lines.join('\n')
    ],
    prompt: `Summarize what buyers of "${s(q, 80)}" struggle with and want.`,
    maxTokens: 700,
    temperature: 0.4
  });
  const j = parseJson(text);
  const list = (v, n) => (Array.isArray(v) ? v : []).map(x => s(x, 140)).filter(Boolean).slice(0, n);
  return { summary: { pains: list(j.pains, 6), wants: list(j.wants, 6), hooks: list(j.hooks, 6), angles: list(j.angles, 4) }, cost };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!guard(req, res)) return;
  const q = s(readBody(req).q, 80).toLowerCase();
  if (q.length < 3) return res.status(400).json({ error: 'q', message: 'Type at least 3 letters.' });
  const warnings = [];
  const [r, t] = await Promise.allSettled([reddit(q), tiktok(q)]);
  if (r.status === 'rejected' && t.status === 'rejected') {
    const e = r.reason || {};
    return res.status(e.status === 402 ? 402 : 502).json({ error: e.status === 402 ? 'balance' : 'upstream', message: e.message || 'Reddit and TikTok did not answer.' });
  }
  const posts = r.status === 'fulfilled' ? r.value.posts : (warnings.push('Reddit did not answer.'), []);
  const videos = t.status === 'fulfilled' ? t.value.videos : (warnings.push('TikTok did not answer.'), []);
  let cost = (r.value ? r.value.cost : 0) + (t.value ? t.value.cost : 0);
  let summary = null;
  if (posts.length + videos.length >= 3) {
    try { const sm = await summarize(q, posts, videos); summary = sm.summary; cost += sm.cost || 0; }
    catch (e) { warnings.push('The summary step failed; the posts are below.'); }
  }
  return res.status(200).json({ q, reddit: posts, tiktok: videos, summary, cost: Math.round(cost * 10000) / 10000, warnings, at: new Date().toISOString() });
};
