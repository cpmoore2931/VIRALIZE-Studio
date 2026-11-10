/*
 * /api/write — AI writing through Treg (Claude Sonnet via DataForSEO, about 1¢ per call).
 *
 *   POST { mode: 'outline', idea, chapters, pains }       → { plan, cost }    plan the product (~10 s)
 *   POST { mode: 'chapter', plan, chapter, index, total } → { blocks, cost }  write one chapter (~15 s)
 *   POST { mode: 'listing', product, keywords }           → { listing, cost } Etsy title, 13 tags, description, Pinterest copy
 *
 * The app runs one outline call, then every chapter at the same time, so a whole product
 * takes about 30 seconds and costs about 10¢. Blocks are checked against an allow-list here;
 * the app checks them again against its own block registry.
 */
const { guard, readBody, claude, parseJson } = require('./_treg');

const THEMES = 'viralize (soft lavender, modern), editorial (classic serif), luxe (dark and gold), modern (bold, clean), soft (warm pastel), nordic (calm minimal), focus (high-contrast, simple), blush (pink, feminine), ledger (money, green), terminal (tech, dark)';
const BLOCKS = 'Block types: chapter{title,kicker,intro} paragraph{text} heading{text} bullets{title,items[]} checklist{title,items[]} callout{label,text} quote{text,cite} prompts{title,items[],lines} table{title,headers:"A | B | C",rows:["x | y | z"]} habit{title,habits[]} weekly{title,side[]} notes{title,style:lined|dotted|grid}. Each block is {"type":"...", ...fields}. Text supports **bold**; a blank line in text starts a new paragraph.';
const ALLOWED = new Set(['chapter', 'paragraph', 'heading', 'bullets', 'checklist', 'callout', 'quote', 'prompts', 'table', 'habit', 'weekly', 'notes']);
const STYLE = 'Premium printable products sold on Etsy. Specific numbers and real examples, short confident sentences, warm and expert. Every chapter includes something the buyer fills in or ticks. Never use placeholder text, lorem ipsum or brackets to fill in. Quotes must be real and correctly attributed, or skip them.';

const s = (v, n = 400) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
const arr = (v, n = 20, len = 300) => (Array.isArray(v) ? v : String(v || '').split('\n')).map(x => s(x, len)).filter(Boolean).slice(0, n);

async function outline(b) {
  const n = Math.max(3, Math.min(6, Number(b.chapters) || 4));
  const pains = arr(b.pains, 6, 120);
  const { text, cost } = await claude({
    system: `You plan ${STYLE} Reply with ONLY one JSON object, no code fences, no commentary.`,
    context: [
      `Reply shape: {"kind":"Planner|Ebook|Workbook|Guide|Tracker|Journal|Checklist","title":"short catchy title, 2-5 words","subtitle":"one line that states the result","theme":"theme key","listing":{"price":"number in USD","audience":"who it is for","promise":"one-sentence result"},"chapters":[{"title":"","kicker":"2-3 words","goal":"what this chapter gives the buyer and the worksheet it includes"}]}. Use exactly ${n} chapters.`,
      `Theme keys: ${THEMES}. Pick the one that fits the buyer. Price: printable planners and workbooks usually sell for 5 to 15 USD, deep guides 12 to 29.`,
      pains.length ? `Real buyer complaints from Reddit and TikTok to solve: ${pains.join('; ')}.` : ''
    ],
    prompt: `Plan the product: ${s(b.idea, 300)}`,
    maxTokens: 900
  });
  const j = parseJson(text);
  const chapters = (Array.isArray(j.chapters) ? j.chapters : []).slice(0, n).map(c => ({ title: s(c.title, 90), kicker: s(c.kicker, 30), goal: s(c.goal, 300) })).filter(c => c.title);
  if (!chapters.length) throw Object.assign(new Error('The plan came back empty. Try describing the idea in a few more words.'), { status: 502 });
  const L = j.listing || {};
  return {
    plan: {
      kind: s(j.kind, 30) || 'Workbook', title: s(j.title, 80), subtitle: s(j.subtitle, 140), theme: s(j.theme, 20).split(/\s/)[0],
      listing: { price: String(L.price || '').replace(/[^0-9.]/g, '').slice(0, 6), audience: s(L.audience, 160), promise: s(L.promise, 220) },
      chapters
    },
    cost
  };
}

function cleanBlock(x) {
  if (!x || !ALLOWED.has(x.type)) return null;
  const o = { type: x.type };
  ['title', 'kicker', 'label', 'cite', 'headers', 'style'].forEach(k => { if (x[k] != null) o[k] = s(x[k], 200); });
  ['text', 'intro'].forEach(k => { if (x[k] != null) o[k] = String(x[k]).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, 3000); });
  ['items', 'rows', 'habits', 'side'].forEach(k => { if (x[k] != null) o[k] = arr(x[k], 24, 400); });
  if (x.type === 'prompts') o.lines = Math.max(2, Math.min(8, Number(x.lines) || 4));
  if (x.type === 'notes' && !/^(lined|dotted|grid)$/.test(o.style || '')) o.style = 'lined';
  return o;
}

async function chapter(b) {
  const plan = b.plan || {};
  const ch = b.chapter || {};
  const total = Math.max(1, Math.min(8, Number(b.total) || 1));
  const i = Math.max(0, Math.min(total - 1, Number(b.index) || 0));
  const { text, cost } = await claude({
    system: `You write ${STYLE} Reply with ONLY a JSON array of blocks, no code fences, no commentary.`,
    context: [
      BLOCKS,
      `Product: "${s(plan.title, 80)}: ${s(plan.subtitle, 140)}" (${s(plan.kind, 30)}) for ${s(plan.audience, 160)}. Promise: ${s(plan.promise, 200)}. Chapter ${i + 1} of ${total}. The other chapters: ${arr(b.others, 8, 80).join('; ')}.`
    ],
    prompt: `Write chapter "${s(ch.title, 90)}" (kicker "${s(ch.kicker, 30)}"). Goal: ${s(ch.goal, 260)} Start with a chapter block, then 4 to 6 blocks, about 500 words. Include the worksheet itself as a table, checklist, prompts, habit or weekly block.`,
    maxTokens: 1700
  });
  const j = parseJson(text);
  const blocks = (Array.isArray(j) ? j : (j.blocks || [])).map(cleanBlock).filter(Boolean);
  if (!blocks.length) throw Object.assign(new Error('That chapter came back empty.'), { status: 502 });
  if (blocks[0].type !== 'chapter') blocks.unshift({ type: 'chapter', title: s(ch.title, 90), kicker: s(ch.kicker, 30), intro: '' });
  return { blocks, cost };
}

async function listing(b) {
  const p = b.product || {};
  const kws = arr(b.keywords, 20, 40);
  const { text, cost } = await claude({
    system: 'You are an Etsy SEO expert for printable digital products. Reply with ONLY one JSON object, no code fences, no commentary. Use the exact phrases buyers type. No emojis, no ALL CAPS, no claims you cannot back up.',
    context: [
      'Reply shape: {"title":"up to 140 characters, most important keyword phrase first, phrases separated by commas or |","tags":["exactly 13 tags, each 20 characters or fewer, lowercase, multi-word buyer phrases, no repeats of single words"],"description":"Etsy description: first 160 characters sell the result, then WHAT\'S INCLUDED bullets, HOW IT WORKS, and a note that it is a digital download with no physical item shipped. Plain text with line breaks.","pinTitle":"Pinterest pin title up to 100 characters","pinDescription":"Pinterest description up to 450 characters with 3 to 5 natural keywords"}',
      `Product: ${s(p.title, 90)}${p.subtitle ? ` — ${s(p.subtitle, 140)}` : ''} (${s(p.kind, 30)}). For: ${s(p.audience, 160)}. Promise: ${s(p.promise, 200)}. ${s(p.pages, 6)} pages, ${s(p.paper, 30)} PDF.`,
      `Inside: ${arr(p.inside, 14, 80).join('; ')}.`,
      kws.length ? `Phrases buyers search on Google right now (use the best as tags and in the title): ${kws.join(', ')}.` : ''
    ],
    prompt: 'Write the Etsy listing and Pinterest copy for this product.',
    maxTokens: 1300,
    temperature: 0.5
  });
  const j = parseJson(text);
  const tags = [...new Set(arr(j.tags, 20, 40).map(t => t.toLowerCase().replace(/[^a-z0-9 &'-]/g, '').trim()).filter(t => t && t.length <= 20))].slice(0, 13);
  return {
    listing: {
      title: s(j.title, 140), tags,
      description: String(j.description || '').replace(/\r/g, '').trim().slice(0, 4000),
      pinTitle: s(j.pinTitle, 100), pinDescription: s(j.pinDescription, 500)
    },
    cost
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!guard(req, res)) return;
  const b = readBody(req);
  try {
    if (b.mode === 'outline') {
      if (s(b.idea).length < 4) return res.status(400).json({ error: 'idea', message: 'Describe the product in a few words first.' });
      return res.status(200).json(await outline(b));
    }
    if (b.mode === 'chapter') return res.status(200).json(await chapter(b));
    if (b.mode === 'listing') return res.status(200).json(await listing(b));
    return res.status(400).json({ error: 'mode', message: 'mode must be outline, chapter or listing.' });
  } catch (e) {
    return res.status(e.status === 402 ? 402 : 502).json({ error: e.status === 402 ? 'balance' : 'upstream', message: e.message });
  }
};
