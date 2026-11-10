/*
 * /api/research — live product research through Treg (runs on Vercel, not in the browser).
 *
 * POST { "q": "teacher planner" }  with header  X-App-Passcode: <APP_PASSCODE>
 *
 * Calls four Treg tools in parallel (about 3¢ in total):
 *   dataforseo.google.keywords.ideas      related ideas + 12 months of US Google searches (~$0.015)
 *   crawl4ai.etsy.search.products         Etsy listings for the idea (~$0.0002)
 *   scrapecreators.x.v1-pinterest-search  Pinterest pins for the idea (~$0.002)
 *   treg.amazon.search.products           Amazon products, prices and "bought in past month" (~$0.015)
 * and returns one tidy JSON answer for the Trends view.
 *
 * Settings (Vercel → Project → Settings → Environment Variables):
 *   TREG_TOKEN    your Treg API key (treg.to dashboard). Never put it in the browser code.
 *   APP_PASSCODE  any phrase you choose; the app asks for it once so strangers can't spend your balance.
 *
 * No npm packages: uses the global fetch in Vercel's Node runtime.
 */
const { treg: tregCall, guard, readBody } = require('./_treg');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/* Searches by people who won't buy a digital product from you. */
const SKIP = /\b(near me|nearby|walmart|target|amazon|aldi|costco|staples|barnes|dollar tree|michaels|reddit|free|word|excel|app|apps)\b/i;
const treg = (id, body) => tregCall(id, { body });
const tregGet = (id, query) => tregCall(id, { query });

/* One keyword_data object from DataForSEO → a compact row. */
function row(kd) {
  const info = (kd && kd.keyword_info) || {};
  const ms = (info.monthly_searches || []).slice().sort((a, b) => (a.year - b.year) || (a.month - b.month)).slice(-12);
  const series = ms.map(m => m.search_volume || 0);
  const trend = info.search_volume_trend || {};
  const comp = (info.competition_level || '').toLowerCase() || 'unknown';
  const vol = info.search_volume || 0;
  const latest = series.length ? series[series.length - 1] : vol;
  const avg = series.length ? series.reduce((s, v) => s + v, 0) / series.length : vol;
  const pk = series.length ? series.indexOf(Math.max(...series)) : -1;
  const peak = pk >= 0 ? MON[ms[pk].month - 1] : '';
  const peakX = avg ? Math.max(...series, 0) / avg : 1;
  const q = trend.quarterly == null ? 0 : trend.quarterly;
  const intent = (kd.search_intent_info && kd.search_intent_info.main_intent) || '';
  let status = 'steady';
  if (q >= 30) status = 'rising'; else if (q <= -30) status = 'cooling';
  const score = Math.log10(Math.max(latest, 10)) * 12 + Math.max(Math.min(q, 150), -60) * 0.12
    + ({ low: 10, medium: 5 }[comp] || 0) + (intent === 'transactional' || intent === 'commercial' ? 6 : 0);
  return {
    kw: kd.keyword, vol, latest, latestMonth: ms.length ? MON[ms[ms.length - 1].month - 1] : '',
    series, months: ms.map(m => m.month), change: q, yoy: trend.yearly, peak, peakX: Math.round(peakX * 10) / 10,
    comp, cpc: info.cpc || null, intent, status, score: Math.round(score * 10) / 10
  };
}

function why(r) {
  const parts = [];
  if (r.status === 'rising') parts.push(`Searches up ${r.change}% over the last three months.`);
  if (r.status === 'cooling') parts.push(`Down ${Math.abs(r.change)}% over three months; peaks in ${r.peak}.`);
  if (r.peakX >= 1.6 && r.status !== 'cooling') parts.push(`Peaks in ${r.peak} at ${r.peakX}× normal.`);
  if (r.comp === 'low') parts.push('Few advertisers compete for it.');
  if (r.intent === 'transactional' || r.intent === 'commercial') parts.push('People searching it are ready to buy.');
  if (!parts.length) parts.push(`About ${r.vol.toLocaleString('en-US')} searches a month.`);
  return parts.join(' ');
}

function normalizeIdeas(body, q) {
  const res = body && body.tasks && body.tasks[0] && body.tasks[0].result && body.tasks[0].result[0];
  if (!res) return { seed: null, ideas: [], skipped: 0, alsoSearched: [] };
  const seen = new Set();
  const seedData = res.seed_keyword_data || (res.items || []).map(i => i.keyword_data).find(k => k && k.keyword === q);
  const seed = seedData ? Object.assign(row(seedData), {}) : null;
  if (seed) { seed.why = why(seed); seen.add(seed.kw); }
  let skipped = 0;
  const also = new Set();
  const ideas = [];
  (res.items || []).forEach(it => {
    (it.related_keywords || []).forEach(k => also.add(k));
    const kd = it.keyword_data;
    if (!kd || seen.has(kd.keyword)) return;
    seen.add(kd.keyword);
    if (SKIP.test(kd.keyword)) { skipped++; return; }
    const r = row(kd);
    if (!r.vol) return;
    r.why = why(r);
    ideas.push(r);
  });
  ideas.sort((a, b) => b.score - a.score);
  const alsoSearched = [...also].filter(k => !seen.has(k) && !SKIP.test(k)).slice(0, 16);
  return { seed, ideas: ideas.slice(0, 30), skipped, alsoSearched };
}

function normalizeEtsy(body) {
  const rows = (body && body.rows) || [];
  const uniq = [];
  const ids = new Set();
  rows.forEach(r => { if (!ids.has(r.listing_id)) { ids.add(r.listing_id); uniq.push(r); } });
  const prices = uniq.map(r => parseFloat(String(r.price || '').replace(/[^0-9.]/g, ''))).filter(n => n > 0).sort((a, b) => a - b);
  const median = prices.length ? (prices.length % 2 ? prices[(prices.length - 1) / 2] : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2) : null;
  const reviews = uniq.map(r => r.reviews || 0).sort((a, b) => a - b);
  return {
    count: uniq.length,
    medianPrice: median,
    priceRange: prices.length ? [prices[0], prices[prices.length - 1]] : null,
    bestsellers: uniq.filter(r => r.bestseller).length,
    medianReviews: reviews.length ? reviews[Math.floor(reviews.length / 2)] : 0,
    listings: uniq.slice(0, 8).map(r => ({
      title: r.title, price: r.price, url: r.url, image: r.image, rating: r.rating, reviews: r.reviews,
      bestseller: !!r.bestseller, shop: String(r.shop || '').split(/\s*:host|\s*\{/)[0].trim()
    }))
  };
}

function normalizePins(body) {
  const pins = (body && body.pins) || [];
  const now = Date.now();
  const recent = pins.filter(p => p.created_at && now - Date.parse(p.created_at) < 30 * 864e5).length;
  return {
    count: pins.length, recent30: recent,
    pins: pins.slice(0, 10).map(p => {
      const im = p.images || {};
      return { url: p.url, image: (im['236x'] || im['170x'] || im['474x'] || {}).url || '', text: String(p.description || '').trim().slice(0, 140),
        by: p.pinner ? (p.pinner.full_name || p.pinner.username || '') : '', followers: p.pinner ? p.pinner.follower_count || 0 : 0, created: p.created_at || '' };
    })
  };
}

function normalizeAmazon(body) {
  const list = (body && body.output && body.output.products) || [];
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : null; };
  const rows = list.map(p => ({
    title: p.product_title || p.title || '', price: p.product_price || p.price || '', priceN: num(p.product_price || p.price),
    rating: num(p.product_star_rating || p.rating), ratings: num(p.product_num_ratings || p.reviews) || 0,
    sales: p.sales_volume || '', bestseller: !!(p.is_best_seller), url: p.product_url || p.link || '', image: p.product_photo || p.thumbnail || ''
  })).filter(r => r.title);
  const prices = rows.map(r => r.priceN).filter(n => n > 0).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)] : null;
  return {
    count: rows.length, total: (body && body.output && body.output.count) || rows.length, medianPrice: median,
    selling: rows.filter(r => /bought/i.test(r.sales)).length,
    products: rows.slice().sort((a, b) => (b.sales ? 1 : 0) - (a.sales ? 1 : 0) || b.ratings - a.ratings).slice(0, 8)
  };
}

function verdict(seed, etsy) {
  if (!seed) return 'Not enough Google data for this exact phrase. Try a broader idea.';
  let out = seed.latest >= 5000 ? 'Strong demand' : seed.latest >= 800 ? 'Solid demand' : 'Small niche';
  if (seed.status === 'rising') out += ' and rising';
  else if (seed.status === 'cooling') out += ` but cooling until it peaks again in ${seed.peak}`;
  out += '.';
  if (etsy && etsy.count) {
    const level = etsy.bestsellers <= 2 ? 'open' : etsy.bestsellers >= 6 ? 'crowded' : 'competitive';
    out += ` Etsy looks ${level}: ${etsy.bestsellers} of ${etsy.count} top listings are Bestsellers`;
    out += etsy.medianPrice ? `, typical price $${etsy.medianPrice.toFixed(2)}.` : '.';
  }
  return out;
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!guard(req, res)) return;
  const body = readBody(req);
  const q = String(body.q || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
  if (q.length < 3) return res.status(400).json({ error: 'query', message: 'Type a product idea with at least 3 letters.' });

  const [ideasR, etsyR, pinsR, amzR] = await Promise.allSettled([
    treg('dataforseo.google.keywords.ideas', [{ keyword: q, location_code: 2840, language_code: 'en', depth: 2, limit: 60, include_seed_keyword: true, ignore_synonyms: true }]),
    treg('crawl4ai.etsy.search.products', { query: q, limit: 48 }),
    tregGet('scrapecreators.x.v1-pinterest-search', { query: q, trim: 'true' }),
    treg('treg.amazon.search.products', { q, country: 'us' })
  ]);
  const all = [ideasR, etsyR, pinsR, amzR];
  if (all.every(r => r.status === 'rejected')) {
    const st = all.some(r => r.reason && r.reason.status === 402) ? 402 : 502;
    return res.status(st).json({ error: st === 402 ? 'balance' : 'upstream', message: st === 402 ? 'Your Treg balance is empty. Top up at treg.to.' : String(ideasR.reason.message) });
  }
  const ok = r => r.status === 'fulfilled';
  const g = ok(ideasR) ? normalizeIdeas(ideasR.value.json, q) : { seed: null, ideas: [], skipped: 0, alsoSearched: [] };
  const etsy = ok(etsyR) ? normalizeEtsy(etsyR.value.json) : null;
  const pinterest = ok(pinsR) ? normalizePins(pinsR.value.json) : null;
  const amazon = ok(amzR) ? normalizeAmazon(amzR.value.json) : null;
  const cost = all.reduce((s, r) => s + (ok(r) ? r.value.cost : 0), 0);
  const names = ['Google', 'Etsy', 'Pinterest', 'Amazon'];
  return res.status(200).json({
    q, at: new Date().toISOString(), seed: g.seed, ideas: g.ideas, skipped: g.skipped, alsoSearched: g.alsoSearched,
    etsy, pinterest, amazon, verdict: verdict(g.seed, etsy), cost: Math.round(cost * 10000) / 10000,
    warnings: all.map((r, i) => (r.status === 'rejected' ? `${names[i]} data unavailable.` : null)).filter(Boolean)
  });
}

module.exports = handler;
module.exports.normalizeIdeas = normalizeIdeas;
module.exports.normalizeEtsy = normalizeEtsy;
module.exports.verdict = verdict;
module.exports.normalizePins = normalizePins;
module.exports.normalizeAmazon = normalizeAmazon;
