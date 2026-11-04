/*
 * QUALITY — scores a product against a "premium product" checklist.
 *
 * Each check: { label, weight, test(p, stats) → true/false, tip }.
 * Add or tune checks here; the Quality tab and score pill update automatically.
 */
window.Folio = window.Folio || {};

Folio.qualityChecks = [
  { label: 'Clear, specific title', weight: 10,
    test: p => (p.title || '').trim().length >= 6 && (p.title || '').length <= 60 && !/untitled/i.test(p.title),
    tip: 'Use 2–7 words that name the outcome, e.g. "The Quiet Money Method".' },
  { label: 'Subtitle states the promise', weight: 10,
    test: p => (p.subtitle || '').trim().split(/\s+/).length >= 6,
    tip: 'Say who it is for and what they get, in one sentence.' },
  { label: 'Author or brand on the cover', weight: 5,
    test: p => !!((p.author || '').trim() || (p.brand || '').trim()) && !/your (name|studio)/i.test(`${p.author} ${p.brand}`),
    tip: 'Replace "Your Name" with your real name or shop name.' },
  { label: 'At least 3 chapters or sections', weight: 10,
    test: (p, s) => s.chapters >= 3 || (s.pageBlocks >= 3),
    tip: 'Buyers judge value by structure. Break content into 3 or more chapters.' },
  { label: 'Every chapter has content', weight: 10,
    test: (p, s) => s.emptyChapters === 0,
    tip: 'A chapter heading followed directly by another chapter looks unfinished.' },
  { label: 'Something to do, not just read', weight: 15,
    test: (p, s) => s.actionable > 0,
    tip: 'Add a checklist, worksheet prompts, a table or a planner page.' },
  { label: 'Substantial (8+ pages)', weight: 10,
    test: (p, s) => s.pages >= 8,
    tip: 'Add worksheets, examples or notes pages so the product feels complete.' },
  { label: 'No placeholder text', weight: 15,
    test: (p, s) => !s.placeholder,
    tip: 'Remove text like "Start writing here", "lorem ipsum", "TODO" or "First point".' },
  { label: 'Listing: price and audience set', weight: 10,
    test: p => p.listing && String(p.listing.price).trim() !== '' && (p.listing.audience || '').trim().length > 5,
    tip: 'Fill in the Sell tab so your listing copy writes itself.' },
  { label: 'Listing: one-sentence promise', weight: 5,
    test: p => p.listing && (p.listing.promise || '').trim().length > 15,
    tip: 'Finish this: "After using this, you will…"' }
];

Folio.stats = function (p) {
  const blocks = p.blocks || [];
  const placeholderRe = /(lorem ipsum|start writing here|\btodo\b|first point|second point|write something useful|new chapter|section heading|first task)/i;
  let emptyChapters = 0;
  blocks.forEach((b, i) => {
    if (b.type === 'chapter') {
      const next = blocks[i + 1];
      if ((!next || next.type === 'chapter') && !(b.intro || '').trim()) emptyChapters++;
    }
  });
  const text = JSON.stringify(blocks);
  return {
    chapters: blocks.filter(b => b.type === 'chapter').length,
    pageBlocks: blocks.filter(b => Folio.blocks[b.type] && Folio.blocks[b.type].layout === 'page').length,
    actionable: blocks.filter(b => ['checklist', 'prompts', 'table', 'weekly', 'habit'].includes(b.type)).length,
    emptyChapters,
    placeholder: placeholderRe.test(text) || placeholderRe.test(p.title || ''),
    pages: Folio.pageCount(p),
    words: text.replace(/"[a-z]+":/g, ' ').split(/\s+/).length
  };
};

Folio.quality = function (p) {
  const s = Folio.stats(p);
  let got = 0, total = 0;
  const checks = Folio.qualityChecks.map(c => {
    const ok = !!c.test(p, s);
    total += c.weight; if (ok) got += c.weight;
    return { label: c.label, tip: c.tip, ok, weight: c.weight };
  });
  return { score: Math.round((got / total) * 100), checks, stats: s };
};
