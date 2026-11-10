/*
 * APP — editor UI, saving, modals, export.
 *
 * Data flow:  state.product  →  Folio.render()  →  preview
 *             editor inputs  →  update state.product  →  save + re-render preview
 * Projects and brand kits are saved in the browser (localStorage key "folio.v1").
 * Undo/redo keeps up to 60 snapshots of the current product.
 */
(function () {
  const { esc, uid, list } = Folio.util;
  const $ = (s, r = document) => r.querySelector(s);
  const STORE_KEY = 'folio.v1';

  const state = {
    store: { projects: {}, brands: {}, current: null },
    tab: 'design',
    openBlocks: new Set(),
    lastBid: null,
    undo: [], redo: [], lastCheckpoint: 0
  };
  const P = () => state.store.projects[state.store.current];

  /* ---------- storage ---------- */
  function readStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.projects && s.projects[s.current]) return s;
      }
    } catch (e) { /* storage blocked: start fresh */ }
    return null;
  }
  let saveTimer;
  function save() {
    P().updated = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state.store)); }
      catch (e) { toast('Browser storage is full. Download a .json backup, then delete old products or large images.'); }
    }, 250);
  }

  /* ---------- undo / redo ---------- */
  function checkpoint(force) {
    const now = Date.now();
    if (force || now - state.lastCheckpoint > 900) {
      state.undo.push(snapshot());
      if (state.undo.length > 60) state.undo.shift();
      state.redo = [];
    }
    state.lastCheckpoint = now;
    syncHistory();
  }
  function travel(from, to) {
    if (!from.length) return;
    to.push(snapshot());
    const snap = JSON.parse(from.pop());
    state.store.projects[snap.p.id] = snap.p;
    state.store.current = snap.p.id;
    state.store.brands = snap.brands;
    Folio.brands = state.store.brands;
    state.lastCheckpoint = 0;
    save(); refreshAll(); syncHistory();
  }
  /* A snapshot holds the product and the brand kits, since brand edits change the product too. */
  function snapshot() { return JSON.stringify({ p: P(), brands: state.store.brands }); }
  function syncHistory() {
    $('#btnUndo').disabled = !state.undo.length;
    $('#btnRedo').disabled = !state.redo.length;
  }
  function resetHistory() { state.undo = []; state.redo = []; syncHistory(); }

  /* ---------- brands ---------- */
  function ensureBrand(presetKey) {
    const found = Object.values(state.store.brands).find(b => b.preset === presetKey);
    if (found) return found.id;
    const b = Object.assign(JSON.parse(JSON.stringify(Folio.brandPresets[presetKey] || Folio.brandPresets.blank)), { id: uid(), preset: presetKey });
    state.store.brands[b.id] = b;
    return b.id;
  }
  const B = () => state.store.brands[P().brandId];

  function normalize(p) {
    const tpl = Folio.templates.find(t => t.key === 'blank').product;
    const out = Object.assign({}, JSON.parse(JSON.stringify(tpl)), p);
    out.listing = Object.assign({}, tpl.listing, p.listing || {});
    out.blocks = (Array.isArray(p.blocks) ? p.blocks : []).filter(b => b && Folio.blocks[b.type])
      .map(b => Object.assign({}, Folio.blocks[b.type].defaults, b, { id: b.id || uid() }));
    if (!Folio.themes[out.theme]) out.theme = 'editorial';
    if (!Folio.coverStyles[out.cover]) out.cover = 'classic';
    if (!Folio.paperSizes[out.paper]) out.paper = 'letter';
    out.id = out.id || uid();
    return out;
  }

  function addProject(p) {
    if (p.brandPreset && !p.brandId) p.brandId = ensureBrand(p.brandPreset);
    const prod = normalize(Object.assign({}, p, { id: uid(), created: Date.now() }));
    resetHistory();
    state.store.projects[prod.id] = prod;
    state.store.current = prod.id;
    state.openBlocks.clear();
    save();
    refreshAll();
  }

  /* ---------- preview ---------- */
  let previewTimer;
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 120);
  }
  function renderPreview() {
    const p = P();
    $('#stageInner').innerHTML = `<div class="doc" id="doc" style="${Folio.themeVars(p)}">${Folio.render(p)}</div>`;
    fitPreview();
    $('#projectName').textContent = Folio.applyTokens(p).title || 'Untitled product';
    updateScore();
  }
  function fitPreview() {
    const doc = $('#doc');
    if (!doc) return;
    const pageW = P().paper === 'a4' ? 794 : 816;
    const avail = $('#stage').clientWidth - 48;
    doc.style.zoom = Math.min(1, Math.max(0.3, avail / pageW)).toFixed(3);
  }
  function updateScore() {
    const q = Folio.quality(P());
    const pill = $('#scorePill');
    pill.textContent = q.score;
    pill.dataset.level = q.score >= 85 ? 'good' : q.score >= 60 ? 'ok' : 'low';
    if (state.tab === 'quality' || state.tab === 'sell') {
      const keepFocus = document.activeElement && $('#panelBody').contains(document.activeElement);
      if (!keepFocus) renderPanel();
      else if (state.tab === 'sell') { const o = $('#listingOut'); if (o) o.textContent = descriptionText(P()); }
    }
  }

  /* ---------- form helpers ---------- */
  function field(f, value, path) {
    const id = `f-${path}`;
    let input;
    if (f.kind === 'textarea' || f.kind === 'list') {
      const v = f.kind === 'list' ? list(value).join('\n') : (value || '');
      input = `<textarea id="${id}" data-path="${path}" data-kind="${f.kind}" rows="${f.kind === 'list' ? 5 : 4}">${esc(v)}</textarea>`;
    } else if (f.kind === 'select') {
      const opts = f.options === 'brandFonts'
        ? Object.fromEntries(Object.entries(Folio.brandFonts).map(([k, v]) => [k, v.name])) : f.options;
      input = `<select id="${id}" data-path="${path}">${Object.entries(opts).map(([k, l]) =>
        `<option value="${k}"${k === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    } else if (f.kind === 'color') {
      input = `<span class="color-row"><input type="color" id="${id}" data-path="${path}" value="${esc(value || '#000000')}"><code>${esc(value || '')}</code></span>`;
    } else if (f.kind === 'image') {
      return `<div class="field"><span>${esc(f.label)}</span>
        <div class="img-field">${value ? `<img src="${esc(value)}" alt="">` : '<span class="img-empty">No image</span>'}
          <span class="img-actions"><label class="btn small file-btn">${value ? 'Replace' : 'Upload'}<input type="file" accept="image/*" id="${id}" data-path="${path}" data-kind="image" data-max="${f.max || 1200}"></label>
          ${value ? `<button type="button" class="btn ghost small" data-act="clear-image" data-path="${path}">Remove</button>` : ''}</span></div></div>`;
    } else if (f.kind === 'checkbox') {
      return `<label class="check" for="${id}"><input type="checkbox" id="${id}" data-path="${path}" data-kind="checkbox"${value ? ' checked' : ''}> ${esc(f.label)}</label>`;
    } else {
      input = `<input id="${id}" type="${f.kind === 'number' ? 'number' : 'text'}" data-path="${path}" value="${esc(value == null ? '' : value)}">`;
    }
    return `<label class="field" for="${id}"><span>${esc(f.label)}</span>${input}</label>`;
  }

  function setPath(path, raw, kind) {
    const p = P();
    const parts = path.split('.');
    let obj = p;
    if (parts[0] === 'brand') { obj = B(); parts.shift(); }
    else if (parts[0] === 'b') {
      obj = p.blocks.find(b => b.id === parts[1]);
      parts.splice(0, 2);
    }
    while (parts.length > 1) obj = obj[parts.shift()];
    const key = parts[0];
    obj[key] = kind === 'list' ? list(raw) : kind === 'checkbox' ? raw : raw;
  }

  /* ---------- panel tabs ---------- */
  function renderPanel() {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === state.tab));
    const body = $('#panelBody');
    body.innerHTML = ({ design: designTab, content: contentTab, brand: brandTab, sell: sellTab, quality: qualityTab })[state.tab]();
  }

  function designTab() {
    const p = P();
    const themes = Object.entries(Folio.themes).map(([k, t]) => `
      <button type="button" class="theme-card${p.theme === k ? ' on' : ''}" data-theme-key="${k}">
        <span class="swatch" style="background:${t.coverBg};color:${t.coverInk};font-family:${t.display}">Aa</span>
        <span class="theme-meta"><strong>${esc(t.name)}</strong><small>${esc(t.note)}</small></span>
        <span class="dot" style="background:${t.accent}"></span>
      </button>`).join('');
    const theme = Folio.themes[p.theme];
    return `
      <section class="group">
        <h3 class="group-title">Product</h3>
        ${field({ label: 'Product type (shown on cover)', kind: 'text' }, p.kind, 'kind')}
        ${field({ label: 'Title', kind: 'text' }, p.title, 'title')}
        ${field({ label: 'Subtitle / promise', kind: 'textarea' }, p.subtitle, 'subtitle')}
        <div class="row2">
          ${field({ label: 'Author', kind: 'text' }, p.author, 'author')}
          ${field({ label: 'Brand / shop', kind: 'text' }, p.brand, 'brand')}
        </div>
        ${field({ label: 'Year', kind: 'text' }, p.year, 'year')}
      </section>
      <section class="group">
        <h3 class="group-title">Look</h3>
        <div class="theme-list">${themes}</div>
        <div class="row2">
          <label class="field" for="f-accent"><span>Accent color</span>
            <span class="color-row"><input type="color" id="f-accent" data-path="accent" value="${esc(p.accent || theme.accent)}">
            <button type="button" class="btn ghost small" id="resetAccent">Theme default</button></span></label>
          ${field({ label: 'Cover', kind: 'select', options: Folio.coverStyles }, p.cover, 'cover')}
        </div>
        ${field({ label: 'Paper size', kind: 'select', options: Object.fromEntries(Object.entries(Folio.paperSizes).map(([k, v]) => [k, v.name])) }, p.paper, 'paper')}
        ${field({ label: 'Include cover page', kind: 'checkbox' }, p.showCover !== false, 'showCover')}
        ${field({ label: 'Include table of contents', kind: 'checkbox' }, p.toc !== false, 'toc')}
        ${field({ label: 'Watermark on inside pages (e.g. SAMPLE for a free preview; leave empty for none)', kind: 'text' }, p.watermark || '', 'watermark')}
      </section>`;
  }

  function brandTab() {
    const p = P();
    const brands = Object.values(state.store.brands);
    const b = B();
    const presetBtns = Object.entries(Folio.brandPresets).map(([k, v]) =>
      `<button type="button" class="btn small" data-new-brand="${k}">${k === 'blank' ? '+ New blank brand' : `${brands.some(x => x.preset === k) ? 'Use' : '+'} ${esc(v.name)}`}</button>`).join('');
    const tokens = ['platform', 'brand', 'login', 'website', 'email', 'phone'].map(t => `<button type="button" class="token" data-token="{{${t}}}">{{${t}}}</button>`).join('');
    return `
      <section class="group">
        <h3 class="group-title">White label</h3>
        <p class="hint">Put your client's or your own brand on this product: logo, colors, fonts and contact details. Save a brand once and reuse it on any product.</p>
        <label class="field" for="brandPick"><span>Brand on this product</span>
          <select id="brandPick"><option value="">No brand (use the theme)</option>
          ${brands.map(x => `<option value="${x.id}"${x.id === p.brandId ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        <div class="btn-row">${presetBtns}</div>
      </section>
      ${b ? `<section class="group">
        <div class="group-head"><h3 class="group-title">Edit ${esc(b.name)}</h3>
          <button type="button" class="btn ghost small danger" id="delBrand">Delete brand</button></div>
        <p class="hint">Changes apply to every product that uses this brand.</p>
        ${Folio.brandFields.map(f => field(f, b[f.key], `brand.${f.key}`)).join('')}
      </section>` : ''}
      <section class="group">
        <h3 class="group-title">Placeholders</h3>
        <p class="hint">Type these anywhere in your text. They fill in from the brand, so one guide can be rebranded for any client. Click to copy.</p>
        <div class="tokens">${tokens}</div>
      </section>`;
  }

  function contentTab() {
    const p = P();
    const cards = p.blocks.map((b, i) => {
      const def = Folio.blocks[b.type];
      const open = state.openBlocks.has(b.id);
      return `<div class="bcard${open ? ' open' : ''}${b.type === 'chapter' ? ' is-chapter' : ''}" data-bid="${b.id}">
        <div class="bcard-head">
          <button type="button" class="bcard-toggle" data-act="toggle" aria-expanded="${open}">
            <span class="btype">${esc(def.label)}</span>
            <span class="bsum">${esc(def.summary(b) || '')}</span>
          </button>
          <span class="bcard-tools">
            <button type="button" class="tool" data-act="up" aria-label="Move up"${i === 0 ? ' disabled' : ''}>↑</button>
            <button type="button" class="tool" data-act="down" aria-label="Move down"${i === p.blocks.length - 1 ? ' disabled' : ''}>↓</button>
          </span>
        </div>
        ${open ? `<div class="bcard-body">
          ${def.fields.map(f => field(f, b[f.key], `b.${b.id}.${f.key}`)).join('') || '<p class="hint">No settings. This block starts a new page.</p>'}
          <div class="bcard-actions">
            <button type="button" class="btn ghost small" data-act="dup">Duplicate</button>
            <button type="button" class="btn ghost small danger" data-act="del">Delete</button>
          </div></div>` : ''}
      </div>`;
    }).join('');
    const opts = Object.entries(Folio.blocks).map(([k, d]) => `<option value="${k}">${esc(d.label)}</option>`).join('');
    return `
      <p class="hint">Click any block in the preview to jump to it. Text supports **bold**, *italic* and placeholders like {{platform}} (see Brand).</p>
      <div class="blist">${cards || '<p class="empty">No blocks yet. Add your first chapter below.</p>'}</div>
      <div class="add-row">
        <select id="addType" aria-label="Block type">${opts}</select>
        <button type="button" class="btn primary" id="addBlock">Add block</button>
      </div>
      <p class="hint add-hint">${state.lastBid && p.blocks.some(b => b.id === state.lastBid) ? 'New blocks go below the block you opened last.' : 'New blocks go at the end.'}</p>`;
  }

  function listingText(raw) {
    const p = Folio.applyTokens(raw);
    const L = p.listing || {};
    const s = Folio.stats(p);
    const chapters = p.blocks.filter(b => b.type === 'chapter').map(b => `• ${b.title}`);
    const count = t => p.blocks.filter(b => b.type === t).length;
    const extras = [
      count('checklist') && `${count('checklist')} checklist${count('checklist') > 1 ? 's' : ''}`,
      count('prompts') && `${count('prompts')} guided worksheet${count('prompts') > 1 ? 's' : ''}`,
      count('weekly') && `${count('weekly')} weekly planner spread${count('weekly') > 1 ? 's' : ''}`,
      count('habit') && 'a monthly habit tracker',
      count('table') && `${count('table')} reference table${count('table') > 1 ? 's' : ''}`,
      count('notes') && `${count('notes')} notes page${count('notes') > 1 ? 's' : ''}`,
      count('steps') && `${count('steps')} step-by-step walkthrough${count('steps') > 1 ? 's' : ''}`,
      count('screenshot') && `${count('screenshot')} annotated screenshot${count('screenshot') > 1 ? 's' : ''}`,
      count('video') && `${count('video')} video lesson${count('video') > 1 ? 's' : ''} (scan the QR code)`,
      count('candles') && `${count('candles')} candlestick chart${count('candles') > 1 ? 's' : ''}`,
      count('journal') && `${count('journal')} trade journal page${count('journal') > 1 ? 's' : ''}`
    ].filter(Boolean);
    const paper = Folio.paperSizes[p.paper].name.split(' (')[0];
    const price = String(L.price || '').trim();
    return [
      `${p.title}${p.subtitle ? ` — ${p.subtitle}` : ''}`,
      '',
      L.promise || '',
      '',
      L.audience ? `Made for ${L.audience}.` : '',
      '',
      chapters.length ? 'WHAT\'S INSIDE' : '',
      ...chapters,
      extras.length ? `Plus ${extras.join(', ')}.` : '',
      '',
      'THE DETAILS',
      `• ${s.pages}-page printable PDF (${paper})`,
      '• Instant download, print at home or use on a tablet',
      p.author ? `• Created by ${p.author}${p.brand ? `, ${p.brand}` : ''}` : '',
      '',
      price ? (Number(price) === 0 ? 'Free download.' : `Price: $${price}`) : ''
    ].filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0)).join('\n').trim();
  }

  /* ---------- Etsy listing kit: title, 13 tags, price check ---------- */
  const cleanTag = t => String(t || '').toLowerCase().replace(/[^a-z0-9 &'-]/g, ' ').replace(/\s+/g, ' ').trim();
  function researchFor(p) {
    const t = Folio.applyTokens(p);
    return researchMatch(`${t.title} ${t.subtitle || ''} ${t.kind || ''} ${p.idea || ''} ${(p.listing || {}).audience || ''}`);
  }
  function autoEtsy(p) {
    const t = Folio.applyTokens(p);
    const r = researchFor(p);
    const kind = cleanTag(t.kind || 'printable');
    const ideas = r ? [r.q, ...(r.ideas || []).slice().sort((a, b) => b.score - a.score).map(i => i.kw)] : [];
    /* Two-word phrases from the idea the product was written from (or its subtitle). */
    const src = String(p.idea || t.subtitle || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const pairs = src.slice(0, -1).map((w, i) => [w, src[i + 1]]).filter(([a, b]) => !STOP.has(a) && !STOP.has(b) && a.length > 2 && b.length > 2).map(x => x.join(' '));
    const cands = [...ideas, ...pairs, `${kind} printable`, `printable ${kind}`, `${kind} template`, `${kind} pdf`, 'digital download', 'instant download', 'printable pdf', `${new Date().getFullYear() + (new Date().getMonth() > 8 ? 1 : 0)} ${kind}`];
    const tags = [];
    cands.map(cleanTag).forEach(c => { if (c && c.length <= 20 && c.length > 3 && !tags.includes(c) && tags.length < 13) tags.push(c); });
    const parts = [t.title, `${t.kind || 'Printable'} Printable PDF`, ...ideas.slice(0, 3).map(titleCase), 'Instant Download'];
    let title = '';
    parts.filter(Boolean).forEach(x => { const next = title ? `${title} | ${x}` : x; if (next.length <= 140 && !title.toLowerCase().includes(String(x).toLowerCase())) title = next; });
    return { title, tags, r };
  }
  function etsyKit(p) {
    const auto = autoEtsy(p);
    const E = (p.listing && p.listing.etsy) || null;
    if (!E) return Object.assign({ ai: false }, auto);
    const tags = (E.tags || []).slice(0, 13);
    auto.tags.forEach(x => { if (tags.length < 13 && !tags.includes(x)) tags.push(x); });
    return { ai: true, at: E.at, title: E.title || auto.title, tags, r: auto.r, description: E.description, pinTitle: E.pinTitle, pinDescription: E.pinDescription };
  }
  function descriptionText(p) { const E = p.listing && p.listing.etsy; return E && E.description ? Folio.applyTokens(p).listing.etsy.description : listingText(p); }
  function pinCopy(p) {
    const t = Folio.applyTokens(p);
    const k = etsyKit(p);
    return {
      title: k.pinTitle || `${t.title}${t.subtitle ? `: ${t.subtitle}` : ''}`.slice(0, 100),
      text: k.pinDescription || `${(t.listing && t.listing.promise) || ''} ${t.kind || 'Printable'} PDF, instant download, print at home or use on a tablet. ${k.tags.slice(0, 4).join(', ')}.`.trim()
    };
  }
  function etsySection(p) {
    const k = etsyKit(p);
    const r = k.r;
    const job = state.jobs.find(j => j.kind === 'listing');
    const price = Number(String(p.listing.price || '').replace(/[^0-9.]/g, '')) || 0;
    const e = r && r.etsy && r.etsy.medianPrice ? r.etsy : null;
    const a = r && r.amazon && r.amazon.medianPrice ? r.amazon : null;
    const priceNote = e ? `Similar Etsy listings sell for about <b>$${e.medianPrice.toFixed(2)}</b> (${e.bestsellers} of ${e.count} are Bestsellers)${a ? `, Amazon about <b>$${a.medianPrice.toFixed(2)}</b>` : ''}. ${price ? (price > e.medianPrice * 1.4 ? 'Your price is well above that: make the extra value obvious in photo 1.' : price < e.medianPrice * 0.6 ? 'Your price is far below that: you can likely charge more.' : 'Your price is in the normal range.') : 'Start near that price until you have reviews.'}` : '';
    const ago = t => { const h = (Date.now() - t) / 36e5; return h < 1 ? 'just now' : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)} days ago`; };
    return `
      <section class="group etsy-kit">
        <div class="group-head"><h3 class="group-title">Etsy listing kit</h3>
          <button type="button" class="btn small" id="aiListing"${job ? ' disabled' : ''}>${k.ai ? 'Rewrite with AI' : 'Write with AI'} <span class="hint">~1¢</span></button></div>
        <p class="hint">${k.ai ? `Written by AI ${ago(k.at)}. <button type="button" class="linkbtn" id="resetEtsy">Use the automatic version</button>` : r ? `Built from your research on “${esc(r.q)}”.` : 'Tip: research this idea in Trends first to get tags people really search and a price check.'}</p>
        ${job ? `<div class="media-job"><span class="spinner" aria-hidden="true"></span>${esc(job.label)}…</div>` : ''}
        <div class="kit-row"><span class="label">Title <small class="${k.title.length > 140 ? 'down' : ''}">${k.title.length}/140</small></span><button type="button" class="btn small" data-copy-kit="title">Copy</button></div>
        <p class="kit-title">${esc(k.title)}</p>
        <div class="kit-row"><span class="label">Tags <small>${k.tags.length}/13</small></span><button type="button" class="btn small" data-copy-kit="tags">Copy all</button></div>
        <div class="kit-tags">${k.tags.map(x => `<span class="kit-tag">${esc(x)}<small>${x.length}</small></span>`).join('')}</div>
        ${priceNote ? `<p class="kit-price">${priceNote}</p>` : ''}
      </section>`;
  }
  async function makeListing() {
    const pid = state.store.current;
    const p = P();
    const t = Folio.applyTokens(p);
    const r = researchFor(p);
    const inside = [...t.blocks.filter(b => b.type === 'chapter').map(b => b.title), ...new Set(t.blocks.map(b => INSIDE[b.type]).filter(Boolean))];
    const keywords = r ? [r.q, ...(r.ideas || []).slice().sort((a, b) => b.score - a.score).map(i => i.kw)].slice(0, 20) : [];
    const job = startJob('listing', 'Writing your Etsy listing');
    try {
      const d = await api('api/write', { method: 'POST', body: { mode: 'listing', keywords, product: { title: t.title, subtitle: t.subtitle, kind: t.kind, audience: t.listing.audience, promise: t.listing.promise, pages: Folio.stats(p).pages, paper: Folio.paperSizes[p.paper].name, inside } } });
      const prod = state.store.projects[pid];
      prod.listing.etsy = Object.assign({ at: Date.now() }, d.listing);
      save();
      endJob(job, 'Etsy listing written');
    } catch (err) { endJob(job, mediaError(err)); }
  }

  function sellTab() {
    const p = P();
    const L = p.listing;
    return `
      <section class="group">
        <h3 class="group-title">Listing details</h3>
        <div class="row2">
          ${field({ label: 'Price (USD)', kind: 'text' }, L.price, 'listing.price')}
          ${field({ label: 'Where you sell', kind: 'text' }, L.platform, 'listing.platform')}
        </div>
        ${field({ label: 'Who it is for', kind: 'text' }, L.audience, 'listing.audience')}
        ${field({ label: 'One-sentence promise', kind: 'textarea' }, L.promise, 'listing.promise')}
      </section>
      ${etsySection(p)}
      <section class="group">
        <div class="group-head"><h3 class="group-title">Description</h3>
          <button type="button" class="btn small" id="copyListing">Copy</button></div>
        <pre class="listing" id="listingOut">${esc(descriptionText(p))}</pre>
        <p class="hint">Paste into Etsy, Gumroad, Payhip, Stan or your own site. ${L.etsy && L.etsy.description ? 'Written by AI; edit the product and use “Rewrite with AI” to refresh it.' : 'Updates as you edit.'}</p>
      </section>
      ${mediaSections(p)}`;
  }

  function qualityTab() {
    const q = Folio.quality(P());
    const level = q.score >= 85 ? 'Ready to sell' : q.score >= 60 ? 'Almost there' : 'Needs work';
    return `
      <section class="group quality-head">
        <div class="big-score" data-level="${q.score >= 85 ? 'good' : q.score >= 60 ? 'ok' : 'low'}">${q.score}</div>
        <div><strong>${level}</strong><p class="hint">${q.stats.pages} page${q.stats.pages === 1 ? "" : "s"} · ${q.stats.chapters} chapter${q.stats.chapters === 1 ? "" : "s"} · ${q.stats.actionable} interactive section${q.stats.actionable === 1 ? "" : "s"}</p></div>
      </section>
      <ul class="checks">${q.checks.map(c => `<li class="${c.ok ? 'ok' : 'no'}">
        <span class="mark" aria-hidden="true">${c.ok ? '✓' : '!'}</span>
        <span><strong>${esc(c.label)}</strong>${c.ok ? '' : `<small>${esc(c.tip)}</small>`}</span></li>`).join('')}</ul>`;
  }

  /* ---------- panel events ---------- */
  function onPanelInput(e) {
    const el = e.target;
    const mediaKeys = { mockStyle: 'style', mockNotes: 'notes', audioChapter: 'chapter', audioSpeed: 'speed', pinHead: 'pinHead', pinLook: 'pinLook' };
    if (mediaKeys[el.id]) { state.media[mediaKeys[el.id]] = el.value; if (el.id === 'audioChapter') renderPanel(); return; }
    if (!el.dataset.path || el.type === 'file') return;
    const kind = el.dataset.kind;
    checkpoint();
    setPath(el.dataset.path, kind === 'checkbox' ? el.checked : el.value, kind);
    if (el.type === 'color' && el.nextElementSibling && el.nextElementSibling.tagName === 'CODE') el.nextElementSibling.textContent = el.value;
    save();
    schedulePreview();
    const card = el.closest('.bcard');
    if (card) {
      const b = P().blocks.find(x => x.id === card.dataset.bid);
      card.querySelector('.bsum').textContent = Folio.blocks[b.type].summary(b) || '';
    }
  }

  /* Read an uploaded image, shrink it, and store it as a data URL. */
  function onImageFile(el) {
    const f = el.files && el.files[0];
    if (!f) return;
    const max = Number(el.dataset.max) || 1200;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const png = /png|svg|gif|webp/.test(f.type) && max <= 800;
        checkpoint(true);
        setPath(el.dataset.path, c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.86));
        save(); renderPanel(); renderPreview(); toast('Image added');
      };
      img.onerror = () => toast('That file could not be read as an image.');
      img.src = r.result;
    };
    r.readAsDataURL(f);
  }

  function onPanelClick(e) {
    const p = P();
    const themeBtn = e.target.closest('[data-theme-key]');
    if (themeBtn) { checkpoint(true); p.theme = themeBtn.dataset.themeKey; p.accent = ''; save(); renderPanel(); renderPreview(); return; }
    if (e.target.id === 'resetAccent') { checkpoint(true); p.accent = ''; save(); renderPanel(); renderPreview(); return; }
    const nb = e.target.closest('[data-new-brand]');
    if (nb) {
      checkpoint(true);
      const key = nb.dataset.newBrand;
      const id = key === 'blank' ? null : Object.values(state.store.brands).find(x => x.preset === key)?.id;
      p.brandId = id || (() => { const b = Object.assign(JSON.parse(JSON.stringify(Folio.brandPresets[key])), { id: uid(), preset: key === 'blank' ? undefined : key }); state.store.brands[b.id] = b; return b.id; })();
      save(); renderPanel(); renderPreview(); toast(id ? 'Brand applied' : 'Brand created');
      return;
    }
    if (e.target.id === 'delBrand') {
      if (e.target.dataset.confirm !== '1') { e.target.dataset.confirm = '1'; e.target.textContent = 'Click again to delete'; return; }
      const id = p.brandId;
      delete state.store.brands[id];
      Object.values(state.store.projects).forEach(x => { if (x.brandId === id) x.brandId = ''; });
      save(); renderPanel(); renderPreview(); toast('Brand deleted');
      return;
    }
    const tok = e.target.closest('[data-token]');
    if (tok) { copy(tok.dataset.token, `Copied ${tok.dataset.token}`); return; }
    const clr = e.target.closest('[data-act="clear-image"]');
    if (clr) { checkpoint(true); setPath(clr.dataset.path, ''); save(); renderPanel(); renderPreview(); return; }
    if (e.target.id === 'addBlock') {
      checkpoint(true);
      const type = $('#addType').value;
      const b = Object.assign({ type, id: uid() }, JSON.parse(JSON.stringify(Folio.blocks[type].defaults)));
      const at = p.blocks.findIndex(x => x.id === state.lastBid);
      if (at >= 0) p.blocks.splice(at + 1, 0, b); else p.blocks.push(b);
      state.openBlocks.add(b.id);
      state.lastBid = b.id;
      save(); renderPanel(); renderPreview();
      const card = document.querySelector(`[data-bid="${b.id}"]`);
      if (card) card.scrollIntoView({ block: 'center' });
      return;
    }
    if (e.target.id === 'copyListing') { copy(descriptionText(p), 'Description copied'); return; }
    if (e.target.closest('#aiListing')) { makeListing(); return; }
    if (e.target.id === 'resetEtsy') { checkpoint(true); delete p.listing.etsy; save(); renderPanel(); toast('Back to the automatic title and tags'); return; }
    const ck = e.target.closest('[data-copy-kit]');
    if (ck) { const k = etsyKit(p); copy(ck.dataset.copyKit === 'title' ? k.title : k.tags.join(', '), ck.dataset.copyKit === 'title' ? 'Title copied' : 'Tags copied (paste them into Etsy\'s tag box)'); return; }
    if (e.target.closest('#copyPin')) { const c = pinCopy(p); copy(`${c.title}\n\n${c.text}`, 'Pin title and description copied'); return; }
    if (e.target.id === 'makePin') { makePin(); return; }
    if (e.target.id === 'makeThumb') { thumbModal(); return; }
    if (e.target.id === 'makeMockup') { makeMockup(); return; }
    if (e.target.id === 'makeAudio') { makeAudio(); return; }
    if (e.target.id === 'savePass') { store.set(PASS_KEY, $('#passSet').value.trim()); toast('Passcode saved on this device'); renderPanel(); return; }
    const mv = e.target.closest('[data-mk-video]');
    if (mv) { const m = (p.mockups || []).find(x => x.id === mv.dataset.mkVideo); if (m) makeVideo(m); return; }
    const del = e.target.closest('[data-mk-del],[data-vid-del],[data-aud-del],[data-pin-del]');
    if (del) {
      const [key, id] = del.dataset.mkDel ? ['mockups', del.dataset.mkDel] : del.dataset.vidDel ? ['videos', del.dataset.vidDel] : del.dataset.pinDel ? ['pins', del.dataset.pinDel] : ['audio', del.dataset.audDel];
      p[key] = (p[key] || []).filter(x => x.id !== id); save(); renderPanel(); return;
    }

    const actBtn = e.target.closest('[data-act]');
    const card = e.target.closest('.bcard');
    if (!actBtn || !card) return;
    const id = card.dataset.bid;
    const i = p.blocks.findIndex(b => b.id === id);
    const act = actBtn.dataset.act;
    if (act === 'toggle') {
      if (state.openBlocks.has(id)) state.openBlocks.delete(id); else { state.openBlocks.add(id); state.lastBid = id; }
      renderPanel(); return;
    }
    if (act !== 'del' || actBtn.dataset.confirm === '1') checkpoint(true);
    if (act === 'up' && i > 0) [p.blocks[i - 1], p.blocks[i]] = [p.blocks[i], p.blocks[i - 1]];
    if (act === 'down' && i < p.blocks.length - 1) [p.blocks[i + 1], p.blocks[i]] = [p.blocks[i], p.blocks[i + 1]];
    if (act === 'dup') {
      const copyB = Object.assign(JSON.parse(JSON.stringify(p.blocks[i])), { id: uid() });
      p.blocks.splice(i + 1, 0, copyB); state.openBlocks.add(copyB.id);
    }
    if (act === 'del') {
      if (actBtn.dataset.confirm !== '1') { actBtn.dataset.confirm = '1'; actBtn.textContent = 'Click again to delete'; return; }
      p.blocks.splice(i, 1);
    }
    save(); renderPanel(); renderPreview();
  }

  /* ---------- modals ---------- */
  function openModal(title, html, onReady) {
    $('#modalTitle').textContent = title;
    /* A fresh body each time: listeners added by an earlier dialog must not fire again. */
    const old = $('#modalBody');
    const fresh = old.cloneNode(false);
    old.replaceWith(fresh);
    fresh.innerHTML = html;
    $('#modal').hidden = false;
    document.querySelector('.modal').scrollTop = 0;
    if (onReady) onReady($('#modalBody'));
  }
  function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; document.querySelector('.modal').classList.remove('modal--wide'); }

  /* ---------- trends (data in js/trends.js) ---------- */
  const TRENDS = (Folio.trends && Folio.trends.items) || [];
  const trendFor = key => TRENDS.filter(x => x.template === key).sort((a, b) => b.score - a.score)[0] || null;
  const fmtNum = n => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const latest = x => x.series[x.series.length - 1];
  const latestMonth = x => MON[(x.months[x.months.length - 1] || 1) - 1];
  const STATUS = { rising: 'Rising', season: 'Peak season ahead', steady: 'Steady', cooling: 'Cooling' };
  function trendBadge(x) {
    if (!x) return '';
    if (x.status === 'rising') return `<span class="tbadge tbadge--rising">Rising +${x.change}%</span>`;
    if (x.status === 'season') return `<span class="tbadge tbadge--season">Peaks in ${esc(x.peak)}</span>`;
    return '';
  }
  function sparkline(series, w = 120, h = 34) {
    const max = Math.max(...series, 1), min = Math.min(...series);
    const pts = series.map((v, i) => [i / (series.length - 1) * (w - 6) + 3, h - 4 - (v - min) / ((max - min) || 1) * (h - 10)]);
    const line = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
    const last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
      <polygon points="3,${h} ${line} ${w - 3},${h}" class="spark-area"/><polyline points="${line}" class="spark-line"/>
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6" class="spark-dot"/></svg>`;
  }
  function startTemplate(key, rename) {
    const t = Folio.templates.find(x => x.key === key);
    if (!t) return;
    const prod = JSON.parse(JSON.stringify(t.product));
    if (rename) { prod.title = rename; prod.kind = rename; }
    prod.from = key;
    addProject(prod);
    closeModal();
    toast(rename ? `Started "${rename}" from the ${t.product.kind} starter. Tailor the pages to fit.` : 'New product created');
  }

  /* ---------- media: mockups, promo videos, audio (server: api/*.js → Treg) ---------- */
  state.jobs = [];
  state.media = { style: 'desk', notes: '', chapter: 0, speed: '1' };
  const MOCK_STYLES = {
    desk: 'on a styled wooden desk with a coffee cup, a pen and a small plant, soft daylight',
    cozy: 'on a cozy bed with white linen, a mug of tea and a knit blanket, warm morning light',
    flatlay: 'top-down flat lay on white marble with gold clips, a pen and fresh flowers',
    ipad: 'shown on an iPad screen with an Apple Pencil, next to a printed copy, on a bright minimalist desk',
    wall: 'framed and hanging on a light wall in a styled living room, above a linen sofa',
    cards: 'as a printed card deck in a small box with cards fanned out on linen',
    kitchen: 'on a bright kitchen counter with fresh ingredients and a linen towel',
    office: 'on a modern office desk next to a laptop with a dashboard on screen, a phone and a coffee'
  };
  const MOCK_LABELS = { desk: 'Styled desk', cozy: 'Cozy bed', flatlay: 'Marble flat lay', ipad: 'iPad + print', wall: 'Framed on a wall', cards: 'Card deck', kitchen: 'Kitchen counter', office: 'Office + laptop' };
  const INSIDE = {
    weekly: 'a weekly planner spread', monthly: 'a monthly calendar page', yearly: 'a year-at-a-glance calendar', habit: 'a habit tracker grid',
    adhdday: 'a daily planner page with a highlighted top-priority box', checklist: 'checklists with tick boxes', prompts: 'journaling prompts with writing lines',
    table: 'neat tables', candles: 'candlestick charts', patterns: 'candlestick pattern cards', mealplan: 'a weekly meal plan grid', recipe: 'recipe cards',
    cards: 'printable cards', savings: 'a savings challenge grid', journal: 'a log table', steps: 'step-by-step instructions', screenshot: 'annotated screenshots',
    coloring: 'detailed coloring pages', wallart: 'a typographic art print', floral: 'floral art prints', paper: 'patterned paper sheets', labels: 'printed labels'
  };

  function mockupPrompt(p, style, notes) {
    const t = Folio.applyTokens(p);
    const th = Folio.themes[p.theme] || Folio.themes.editorial;
    const brand = Folio.brandOf(p);
    const accent = p.accent || (brand && brand.primary) || th.accent;
    const coverBg = brand && brand.dark && p.cover === 'full' ? brand.dark : th.coverBg;
    const accentFor = String(accent).toLowerCase() === String(coverBg).toLowerCase() ? (th.coverInk || th.paper) : accent;
    const kinds = [...new Set((p.blocks || []).map(b => INSIDE[b.type]).filter(Boolean))].slice(0, 3);
    const printable = p.showCover === false;
    const subject = printable
      ? `a printable ${t.kind || 'digital product'} called "${t.title}", showing ${kinds.join(', ') || 'its pages'} in ${accent} and ${th.paper} tones`
      : `a printed ${t.kind || 'book'} titled "${t.title}". The cover is professionally designed: background color ${coverBg}, accents in ${accentFor}, a tasteful illustration that fits the topic, and the title "${t.title}" in clear, well-designed typography${t.subtitle ? ` with a small subtitle line` : ''}${brand && brand.name ? ` and the brand name "${brand.name}"` : ''}. Beside it, the product lies open showing ${kinds.join(', ') || 'its inside pages'}`;
    return `Photorealistic Etsy best-seller product photo of ${subject}. Scene: ${MOCK_STYLES[style] || MOCK_STYLES.desk}. ${notes ? notes.trim().replace(/\.?$/, '.') + ' ' : ''}Commercial product photography, rich detail, sharp focus on the product, all visible text spelled exactly as written, no watermark, no other text, no logos.`;
  }

  function chapterTexts(p) {
    const t = Folio.applyTokens(p);
    const clean = s => String(s || '').replace(/\*\*?|__/g, '').replace(/\s+/g, ' ').trim();
    const out = [];
    let cur = null;
    (t.blocks || []).forEach(b => {
      if (b.type === 'chapter') { cur = { title: clean(b.title), parts: [clean(b.title) + '.', clean(b.intro)] }; out.push(cur); return; }
      if (!cur) { cur = { title: clean(t.title), parts: [clean(t.title) + '.'] }; out.push(cur); }
      const L = v => list(v).map(clean);
      if (b.type === 'paragraph') cur.parts.push(clean(b.text));
      else if (b.type === 'heading') cur.parts.push(clean(b.text) + '.');
      else if (b.type === 'bullets' || b.type === 'checklist') { if (b.title) cur.parts.push(clean(b.title) + '.'); cur.parts.push(L(b.items).join('. ') + '.'); }
      else if (b.type === 'callout') cur.parts.push(`${clean(b.label)}: ${clean(b.text)}`);
      else if (b.type === 'quote') cur.parts.push(`"${clean(b.text)}"${b.cite ? ` ${clean(b.cite)}.` : ''}`);
      else if (b.type === 'prompts') { cur.parts.push(clean(b.title) + '.'); cur.parts.push(L(b.items).join(' ')); }
      else if (b.type === 'steps') { cur.parts.push(`How to ${clean(b.title)}.`); cur.parts.push(L(b.items).map((s, i) => `Step ${i + 1}: ${s}`).join(' ')); }
      else if (b.type === 'faq') L(b.items).forEach(l => { const [q, a] = l.split('|'); cur.parts.push(`${clean(q)} ${clean(a)}`); });
    });
    return out.map(c => ({ title: c.title, text: c.parts.filter(Boolean).join('\n\n') })).filter(c => c.text.length > 40);
  }

  function mediaError(err) {
    if (err.status === 0) return 'AI writing, photos, videos and audio run on your live site (studio.tryviralize.com).';
    if (err.status === 401) return 'Enter your passcode under "Research and media settings" below.';
    if (err.status === 503 || err.status === 404) return 'One-time setup needed: add TREG_TOKEN and APP_PASSCODE in Vercel, then redeploy. Open Trends for step-by-step help.';
    if (err.status === 402) return 'Your Treg balance is empty. Top up at treg.to.';
    return err.message || 'That did not work. Try again in a moment.';
  }
  async function api(path, opts = {}) {
    if (location.protocol === 'file:') throw Object.assign(new Error('offline'), { status: 0 });
    const res = await fetch(path, {
      method: opts.method || 'GET',
      headers: Object.assign({ 'X-App-Passcode': store.get(PASS_KEY, '') }, opts.body ? { 'Content-Type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || `Error ${res.status}`), { status: res.status, data });
    return data;
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function pollUntilDone(path, id, every = 5000, tries = 72) {
    for (let i = 0; i < tries; i++) {
      await wait(every);
      const s = await api(`${path}?id=${encodeURIComponent(id)}`);
      if (s.status === 'done' && s.url) return s.url;
      if (s.status === 'failed') throw new Error(s.error ? String(s.error).slice(0, 160) : 'The generator could not finish this one.');
    }
    throw new Error('This is taking longer than usual. Try again in a few minutes.');
  }
  const proxied = (url, download) => `api/mockup?img=${encodeURIComponent(url)}&k=${encodeURIComponent(store.get(PASS_KEY, ''))}${download ? `&download=${encodeURIComponent(download)}` : ''}`;
  function thumbOf(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); const k = 480 / img.width;
        c.width = 480; c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        try { resolve(c.toDataURL('image/jpeg', 0.82)); } catch (e) { resolve(''); }
      };
      img.onerror = () => resolve('');
      img.src = proxied(url);
    });
  }
  function startJob(kind, label) { const j = { kind, label, id: uid(), at: Date.now() }; state.jobs.push(j); if (state.tab === 'sell') renderPanel(); return j; }
  function endJob(j, msg) { state.jobs = state.jobs.filter(x => x !== j); if (msg) toast(msg); if (state.tab === 'sell') renderPanel(); }

  async function makeMockup() {
    const pid = state.store.current;
    const p = P();
    const prompt = mockupPrompt(p, state.media.style, state.media.notes);
    const job = startJob('mockup', `${MOCK_LABELS[state.media.style] || 'Photo'} photo`);
    try {
      const { id } = await api('api/mockup', { method: 'POST', body: { prompt } });
      const url = await pollUntilDone('api/mockup', id);
      const thumb = await thumbOf(url);
      const prod = state.store.projects[pid];
      prod.mockups = [{ id: uid(), src: url, thumb, style: state.media.style, at: Date.now() }, ...(prod.mockups || [])].slice(0, 8);
      save();
      endJob(job, 'Mockup photo ready');
    } catch (err) { endJob(job, mediaError(err)); }
  }

  const PIN_LOOKS = {
    bold: ['Bold color banner', 'The top third is a solid band in the accent color with the headline in large white type; below it, a photorealistic styled photo of the product on a desk'],
    minimal: ['Minimal and airy', 'An airy cream background with plenty of white space, the headline at the top in elegant dark type, and the product photographed below on linen with soft shadows'],
    collage: ['Page collage', 'The headline at the top on a light background; below it, three or four inside pages of the product fanned out and overlapping like a collage'],
    ipad: ['Tablet + print', 'The headline at the top; below it, the product shown on an iPad screen with an Apple Pencil, next to printed pages on a bright desk']
  };
  function pinHeadline(p) {
    const t = Folio.applyTokens(p);
    const promise = String((t.listing && t.listing.promise) || '').replace(/\.$/, '');
    return state.media.pinHead || (promise && promise.length <= 60 ? promise : t.title);
  }
  function pinPrompt(p, look, headline) {
    const t = Folio.applyTokens(p);
    const th = Folio.themes[p.theme] || Folio.themes.editorial;
    const brand = Folio.brandOf(p);
    const accent = p.accent || (brand && brand.primary) || th.accent;
    const kinds = [...new Set((p.blocks || []).map(b => INSIDE[b.type]).filter(Boolean))].slice(0, 3);
    return `Vertical 2:3 Pinterest pin graphic advertising a printable digital product: a ${t.kind || 'printable'} titled "${t.title}" showing ${kinds.join(', ') || 'its inside pages'}. Layout: ${(PIN_LOOKS[look] || PIN_LOOKS.bold)[1]}. The headline reads exactly "${headline}" in large, bold, highly legible modern sans-serif type. A small rounded label near the bottom reads exactly "INSTANT DOWNLOAD". Color palette: ${accent} with ${th.paper} and soft neutrals. Professional Pinterest marketing design for an Etsy shop, crisp and high contrast, all text spelled exactly as written, no other text, no watermark, no logos.`;
  }
  async function makePin() {
    const pid = state.store.current;
    const p = P();
    const look = state.media.pinLook || 'bold';
    const headline = String(pinHeadline(p)).slice(0, 80);
    const job = startJob('pin', `${PIN_LOOKS[look][0]} pin`);
    try {
      const { id } = await api('api/mockup', { method: 'POST', body: { prompt: pinPrompt(p, look, headline), size: '2:3' } });
      const url = await pollUntilDone('api/mockup', id);
      const thumb = await thumbOf(url);
      const prod = state.store.projects[pid];
      prod.pins = [{ id: uid(), src: url, thumb, look, headline, at: Date.now() }, ...(prod.pins || [])].slice(0, 8);
      save();
      endJob(job, 'Pin ready');
    } catch (err) { endJob(job, mediaError(err)); }
  }

  /* YouTube thumbnail maker (js/thumbnail.js). Settings are saved on the product as p.yt. */
  function thumbModal() {
    const pid = state.store.current;
    const p = P();
    const t = Folio.applyTokens(p);
    const images = [];
    (p.mockups || []).forEach((m, i) => {
      const fresh = Date.now() - m.at < 6.5 * 864e5;
      images.push({ key: m.id, label: `Mockup photo ${i + 1} (${MOCK_LABELS[m.style] || 'photo'})`, srcs: [fresh ? proxied(m.src) : '', m.thumb].filter(Boolean) });
    });
    const tpl = Folio.templates.find(x => x.key === p.from);
    if (tpl && tpl.image) images.push({ key: 'starter', label: 'Starter product photo', srcs: [tpl.image] });
    const words = String(t.title || '').split(/\s+/).filter(Boolean);
    const half = Math.ceil(words.length / 2);
    const price = String((p.listing && p.listing.price) || '').replace(/[^0-9.]/g, '');
    const defaults = words.length <= 2 ? { line1: t.title, line2: t.kind || '' } : { line1: words.slice(0, half).join(' '), line2: words.slice(half).join(' ') };
    defaults.label = price && Number(price) > 0 ? `$${price} printable` : 'Free printable';
    openModal('YouTube thumbnail', '<div id="ytMount"></div>', body => {
      body.closest('.modal').classList.add('modal--wide');
      Folio.thumb.mount($('#ytMount', body), {
        product: p, images, toast,
        settings: Object.assign(defaults, p.yt || {}),
        onChange: s => { const prod = state.store.projects[pid]; if (prod) { prod.yt = s; save(); } }
      });
    });
  }

  async function makeVideo(m) {
    const pid = state.store.current;
    if (Date.now() - m.at > 6.5 * 864e5) { toast('That photo link has expired. Make a fresh mockup first.'); return; }
    const job = startJob('video', 'Promo video');
    try {
      const { id } = await api('api/video', { method: 'POST', body: { image: m.src, prompt: 'Slow, steady camera push-in toward the product cover, keeping the cover centered and fully in frame the whole time. Soft natural light, subtle gentle movement in the background only. Keep all text unchanged and legible.' } });
      const url = await pollUntilDone('api/video', id, 5000, 90);
      const prod = state.store.projects[pid];
      prod.videos = [{ id: uid(), url, thumb: m.thumb, at: Date.now() }, ...(prod.videos || [])].slice(0, 6);
      save();
      endJob(job, 'Promo video ready. Download it within an hour.');
    } catch (err) { endJob(job, mediaError(err)); }
  }

  async function makeAudio() {
    const pid = state.store.current;
    const ch = chapterTexts(P())[Number(state.media.chapter) || 0];
    if (!ch) { toast('Add some text to narrate first.'); return; }
    const job = startJob('audio', `Audio: ${ch.title}`);
    try {
      const r = await api('api/audio', { method: 'POST', body: { text: ch.text, speed: Number(state.media.speed) || 1 } });
      const prod = state.store.projects[pid];
      prod.audio = [{ id: uid(), title: ch.title, url: r.url, chars: r.chars, at: Date.now() }, ...(prod.audio || [])].slice(0, 12);
      save();
      endJob(job, 'Narration ready. Download it within 24 hours.');
    } catch (err) { endJob(job, mediaError(err)); }
  }

  function mediaSections(p) {
    const ago = t => { const h = (Date.now() - t) / 36e5; return h < 1 ? 'just now' : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)} days ago`; };
    const jobs = kind => state.jobs.filter(j => j.kind === kind).map(j => `<div class="media-job"><span class="spinner" aria-hidden="true"></span>${esc(j.label)}… <small>started ${ago(j.at)}</small></div>`).join('');
    const chapters = chapterTexts(p);
    const ci = Math.min(Number(state.media.chapter) || 0, Math.max(chapters.length - 1, 0));
    const est = chapters[ci] ? Math.max(0.01, chapters[ci].text.length / 10000) : 0;
    const fileName = slug(Folio.applyTokens(p).title);
    return `
      <section class="group media">
        <div class="group-head"><h3 class="group-title">Product photos</h3><span class="hint">about $0.03 each</span></div>
        <p class="hint">A listing-ready mockup of this product with its real title and colors.</p>
        <div class="row2">
          <label class="field" for="mockStyle"><span>Scene</span><select id="mockStyle">${Object.entries(MOCK_LABELS).map(([k, l]) => `<option value="${k}"${k === state.media.style ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field" for="mockNotes"><span>Extra details (optional)</span><input type="text" id="mockNotes" value="${esc(state.media.notes)}" placeholder="e.g. pink peonies, autumn mood"></label>
        </div>
        <button type="button" class="btn primary" id="makeMockup">Make a mockup photo</button>
        ${jobs('mockup')}
        ${(p.mockups || []).length ? `<div class="mock-grid">${p.mockups.map(m => `<figure class="mock">
          ${m.thumb ? `<img src="${esc(m.thumb)}" alt="Mockup photo">` : '<span class="mock-empty">Preview unavailable</span>'}
          <figcaption><small>${esc(MOCK_LABELS[m.style] || '')} · ${ago(m.at)}</small>
            <span class="mock-acts">${Date.now() - m.at < 6.5 * 864e5 ? `<a class="btn small" href="${esc(proxied(m.src, fileName))}" download>Download full size</a><button type="button" class="btn small" data-mk-video="${esc(m.id)}">Make video (~$0.18)</button>` : '<small>Full-size link expired</small>'}
            <button type="button" class="btn ghost small danger" data-mk-del="${esc(m.id)}">Remove</button></span></figcaption></figure>`).join('')}</div>
          <p class="hint">Full-size downloads stay available for 7 days after each photo is made.</p>` : ''}
      </section>
      <section class="group media">
        <div class="group-head"><h3 class="group-title">Pinterest pins</h3><span class="hint">about $0.03 each</span></div>
        <p class="hint">Tall 2:3 pins with a headline that send Pinterest buyers to your listing. Pin 3 to 5 different looks per product.</p>
        <div class="row2">
          <label class="field" for="pinHead"><span>Headline on the pin</span><input type="text" id="pinHead" maxlength="80" value="${esc(pinHeadline(p))}"></label>
          <label class="field" for="pinLook"><span>Look</span><select id="pinLook">${Object.entries(PIN_LOOKS).map(([k, v]) => `<option value="${k}"${k === (state.media.pinLook || 'bold') ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></label>
        </div>
        <button type="button" class="btn primary" id="makePin">Make a pin</button>
        ${jobs('pin')}
        ${(p.pins || []).length ? `<div class="mock-grid mock-grid--pin">${p.pins.map(m => `<figure class="mock">
          ${m.thumb ? `<img src="${esc(m.thumb)}" alt="Pinterest pin">` : '<span class="mock-empty">Preview unavailable</span>'}
          <figcaption><small>${esc((PIN_LOOKS[m.look] || [''])[0])} · ${ago(m.at)}</small>
            <span class="mock-acts">${Date.now() - m.at < 6.5 * 864e5 ? `<a class="btn small" href="${esc(proxied(m.src, fileName + '-pin'))}" download>Download</a>` : '<small>Full-size link expired</small>'}
            <button type="button" class="btn ghost small danger" data-pin-del="${esc(m.id)}">Remove</button></span></figcaption></figure>`).join('')}</div>` : ''}
        <div class="kit-row"><span class="label">Pin title and description</span><button type="button" class="btn small" id="copyPin">Copy</button></div>
        <pre class="listing pin-copy">${esc(pinCopy(p).title)}

${esc(pinCopy(p).text)}</pre>
      </section>
      <section class="group media">
        <div class="group-head"><h3 class="group-title">YouTube thumbnail</h3><span class="hint">free</span></div>
        <p class="hint">Upload a photo of you pointing. Viralize removes the background and builds a 1280×720 thumbnail with big text and this product, in the Viralize look.</p>
        <button type="button" class="btn primary" id="makeThumb">Make a YouTube thumbnail</button>
      </section>
      <section class="group media">
        <div class="group-head"><h3 class="group-title">Promo videos</h3><span class="hint">about $0.18 each, 5 s vertical</span></div>
        <p class="hint">For TikTok, Reels and Pins. Use "Make video" on any photo above.</p>
        ${jobs('video')}
        ${(p.videos || []).map(v => `<div class="vid">${Date.now() - v.at < 55 * 6e4 ? `<video src="${esc(v.url)}" controls playsinline muted loop poster="${esc(v.thumb || '')}"></video>
          <span><a class="btn small" href="${esc(v.url)}" target="_blank" rel="noopener">Open to save</a><small>Made ${ago(v.at)}. The link expires about an hour after it is made.</small></span>` : `<span class="hint">Video from ${ago(v.at)}: its link has expired.</span>`}
          <button type="button" class="btn ghost small danger" data-vid-del="${esc(v.id)}">Remove</button></div>`).join('')}
      </section>
      <section class="group media">
        <div class="group-head"><h3 class="group-title">Audio edition</h3><span class="hint">$1 per 10,000 characters</span></div>
        <p class="hint">Narrate a chapter in a natural voice and sell it as a bonus audio version.</p>
        ${chapters.length ? `<div class="row2">
          <label class="field" for="audioChapter"><span>Chapter</span><select id="audioChapter">${chapters.map((c, i) => `<option value="${i}"${i === ci ? ' selected' : ''}>${esc(c.title)} (${c.text.length.toLocaleString()} chars)</option>`).join('')}</select></label>
          <label class="field" for="audioSpeed"><span>Pace</span><select id="audioSpeed">${[['0.9', 'Relaxed'], ['1', 'Natural'], ['1.1', 'Brisk']].map(([v, l]) => `<option value="${v}"${v === state.media.speed ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <button type="button" class="btn primary" id="makeAudio"${chapters[ci] && chapters[ci].text.length > 9500 ? ' disabled' : ''}>Narrate this chapter (about $${est.toFixed(2)})</button>
        ${chapters[ci] && chapters[ci].text.length > 9500 ? '<p class="hint">This chapter is over the 9,500-character limit for one recording. Split it with another chapter block.</p>' : ''}` : '<p class="hint">Add chapters with text to create an audio edition.</p>'}
        ${jobs('audio')}
        ${(p.audio || []).map(a => `<div class="aud"><strong>${esc(a.title)}</strong>${Date.now() - a.at < 23 * 36e5 ? `<audio src="${esc(a.url)}" controls preload="none"></audio><a class="btn small" href="${esc(a.url)}" target="_blank" rel="noopener">Open to save</a>` : '<span class="hint">Link expired after 24 hours.</span>'}<button type="button" class="btn ghost small danger" data-aud-del="${esc(a.id)}">Remove</button></div>`).join('')}
      </section>
      <details class="group media-settings"${store.get(PASS_KEY, '') ? '' : ' open'}>
        <summary class="group-title">Research and media settings</summary>
        <p class="hint">Photos, videos, audio and research run through Treg on your server. Enter the APP_PASSCODE you set in Vercel.</p>
        <div class="research-form"><input type="password" id="passSet" placeholder="Passcode" value="${esc(store.get(PASS_KEY, ''))}" autocomplete="current-password" aria-label="Passcode"><button type="button" class="btn" id="savePass">Save</button></div>
      </details>`;
  }

  /* ---------- AI writer (server: api/write.js → Treg → Claude) ---------- */
  const STOP = new Set(['for', 'and', 'the', 'with', 'printable', 'template', 'pdf', 'digital', 'of', 'to', 'my', 'best', 'cute', 'simple', 'your', 'that', 'this', 'who', 'from', 'into']);
  const sig = t => String(t || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
  /* The saved research (Trends) that best matches some text, or null. need = a field it must have. */
  function researchMatch(text, need) {
    const words = sig(text);
    let best = null, bs = 0;
    store.get(RESEARCH_KEY, []).forEach(r => {
      if (need && !r[need]) return;
      const w = sig(r.q);
      if (!w.length) return;
      const sc = w.filter(x => words.includes(x)).length / w.length;
      if (sc > bs) { bs = sc; best = r; }
    });
    return bs >= 0.5 ? best : null;
  }
  /* Keep only known block types and fields, with the right value shapes. */
  function cleanAiBlocks(list) {
    return (list || []).filter(b => b && Folio.blocks[b.type]).map(b => {
      const o = { type: b.type };
      Folio.blocks[b.type].fields.forEach(f => {
        const v = b[f.key];
        if (v == null) return;
        if (f.kind === 'list') o[f.key] = (Array.isArray(v) ? v : String(v).split('\n')).map(x => String(x).trim()).filter(Boolean);
        else if (f.kind === 'number') { const n = Number(v); if (isFinite(n)) o[f.key] = n; }
        else if (f.kind === 'select') { if (f.options && f.options[v]) o[f.key] = v; }
        else if (f.kind !== 'image' && f.kind !== 'checkbox') o[f.key] = String(v);
      });
      return o;
    });
  }
  /* Plan once, then write every chapter at the same time. About 6¢ and 30–60 seconds. */
  async function writeProduct(idea, n, status) {
    const call = body => api('api/write', { method: 'POST', body });
    const retry = body => call(body).catch(e => (e.status === 401 || e.status === 402 || e.status === 0 || e.status === 503) ? Promise.reject(e) : wait(1500).then(() => call(body)));
    const buyers = researchMatch(idea, 'buyers');
    const sum = buyers && buyers.buyers.summary;
    const pains = sum ? [...(sum.pains || []), ...(sum.wants || [])].slice(0, 6) : [];
    status('Planning your product…', 0, 0);
    const o = await retry({ mode: 'outline', idea, chapters: n, pains });
    const plan = o.plan;
    let cost = o.cost || 0, done = 0;
    const total = plan.chapters.length;
    status(`Writing “${plan.title}”…`, 0, total);
    const ctx = { title: plan.title, subtitle: plan.subtitle, kind: plan.kind, audience: plan.listing.audience, promise: plan.listing.promise };
    const others = plan.chapters.map(c => c.title);
    const res = await Promise.allSettled(plan.chapters.map((chapter, index) =>
      retry({ mode: 'chapter', plan: ctx, chapter, index, total, others }).then(r => { done++; status(`Writing “${plan.title}”…`, done, total); return r; })));
    const blocks = [];
    let failed = 0;
    res.forEach((r, i) => {
      if (r.status === 'fulfilled') { blocks.push(...cleanAiBlocks(r.value.blocks)); cost += r.value.cost || 0; }
      else { failed++; const c = plan.chapters[i]; blocks.push({ type: 'chapter', title: c.title, kicker: c.kicker, intro: c.goal }); }
    });
    if (failed === total) throw res[0].reason;
    blocks.push({ type: 'notes', title: 'Notes', style: 'lined' });
    const last = Object.values(state.store.projects).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0] || {};
    const theme = Folio.themes[plan.theme] ? plan.theme : 'viralize';
    const keep = (v, ph) => (v && v !== ph ? v : '');
    return {
      failed, cost,
      prod: {
        kind: plan.kind, title: plan.title || titleCase(idea), subtitle: plan.subtitle, theme, accent: '', cover: theme === 'viralize' ? 'glow' : 'classic',
        paper: last.paper || 'letter', toc: true, author: keep(last.author, 'Your Name'), brand: keep(last.brand, 'Your Studio'), year: String(new Date().getFullYear()),
        listing: Object.assign({ platform: 'Etsy' }, plan.listing), blocks, idea, ai: true
      }
    };
  }
  function writeBox(prefill) {
    return `<section class="research ai-write" id="aiWrite">
        <div><h3 class="research-title">Write it for me</h3>
        <p class="hint">Describe the product. AI plans it and writes every chapter with real worksheets, ready for you to edit. About 6¢, under a minute.${researchMatch(prefill || '', 'buyers') ? ' It will use the buyer pain points from your research.' : ''}</p></div>
        <form class="research-form" id="writeForm">
          <input type="search" id="writeIdea" placeholder="e.g. ADHD budget planner for busy moms" aria-label="Product idea" maxlength="120" autocomplete="off" value="${esc(prefill || '')}">
          <select id="writeLen" aria-label="Length"><option value="3">Short · 3 chapters</option><option value="4" selected>Standard · 4</option><option value="6">Deep · 6</option></select>
          <button type="submit" class="btn primary" id="writeGo">Write it</button>
        </form>
        <div id="writeOut">${state.writing ? state.writeHtml || '' : ''}</div>
      </section>`;
  }
  async function startWriting(idea, n) {
    idea = String(idea || '').trim();
    if (idea.length < 4) { toast('Describe the product in a few words first.'); return; }
    if (state.writing) { toast('Already writing one. It opens when it is ready.'); return; }
    state.writing = true;
    const show = html => { state.writeHtml = html; const o = document.getElementById('writeOut'); if (o) o.innerHTML = html; };
    const status = (msg, d, t) => show(`<div class="research-loading"><span class="spinner" aria-hidden="true"></span>${esc(msg)}${t ? ` <small>${d} of ${t} chapters done</small>` : ''}</div>
      <div class="progress" aria-hidden="true"><span style="width:${t ? Math.max(12, Math.round(d / t * 100)) : 6}%"></span></div>`);
    try {
      const r = await writeProduct(idea, n, status);
      state.writing = false;
      if (document.getElementById('aiWrite')) closeModal();
      addProject(r.prod);
      toast(`Written: “${r.prod.title}”${r.cost ? ` for $${r.cost.toFixed(2)}` : ''}.${r.failed ? ` ${r.failed === 1 ? '1 chapter still needs' : `${r.failed} chapters still need`} writing (the outline is kept).` : ' Read it through and make it yours.'}`);
    } catch (err) {
      state.writing = false;
      show(`<div class="research-note"><strong>That did not work</strong><p>${esc(mediaError(err))}</p></div>`);
      if (!document.getElementById('writeOut')) toast(mediaError(err));
    }
  }

  /* ---------- live research (server: api/research.js → Treg) ---------- */
  const RESEARCH_KEY = 'folio.research';
  const PASS_KEY = 'folio.passcode';
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };
  /* Closest starter for an idea: the most shared meaningful words. */
  function closestStarter(idea) {
    const text = String(idea).toLowerCase();
    /* 1. Known trends already link to the right starter. */
    const known = TRENDS.filter(x => text.includes(x.kw) || x.kw.includes(text)).sort((a, b) => b.kw.length - a.kw.length)[0];
    const knownKey = known && (known.template || known.near);
    if (knownKey) return Folio.templates.find(t => t.key === knownKey);
    /* 2. Topic words that point at a starter. */
    const TOPICS = [[/teacher|lesson|homeschool|school|student|exam|revision|college|class/, 'study'], [/wedding|bridal|bride|engagement/, 'bride'],
      [/budget|money|debt|finance|cash|savings?|expense/, 'budget'], [/meal|recipe|grocery|food|kitchen|pantry/, 'mealprep'], [/clean|chore|tidy|declutter/, 'cleaning'],
      [/workout|fitness|gym|exercise|step/, 'fitness'], [/adhd|daily|to.?do|productiv/, 'adhdplanner'], [/business|client|crm|small biz|etsy seller|content/, 'work'],
      [/trading|stock|crypto|forex/, 'trading'], [/journal|gratitude|reflection|self.?care|mindful/, 'wellness'], [/wall art|poster|print\b|prints\b/, 'minimalart'],
      [/coloring|colouring/, 'coloring'], [/sticker|icon|highlight/, 'iconpack'], [/label/, 'labels'], [/travel|trip|vacation|packing/, 'project'], [/goal|vision|manifest/, 'goals']];
    const topic = TOPICS.find(([re]) => re.test(text));
    if (topic) return Folio.templates.find(t => t.key === topic[1]);
    /* 3. Fall back to shared words. */
    const stop = new Set(['for', 'and', 'the', 'with', 'printable', 'template', 'pdf', 'digital', 'a', 'of', 'to', 'my', 'best', 'cute', 'simple']);
    const words = String(idea).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !stop.has(w));
    let best = null, bestScore = 0;
    Folio.templates.forEach(t => {
      if (t.key === 'blank') return;
      const hay = `${t.key} ${t.product.kind} ${t.product.title} ${t.blurb}`.toLowerCase();
      const s = words.reduce((n, w) => n + (hay.includes(w) ? (String(t.product.kind).toLowerCase().includes(w) ? 2 : 1) : 0), 0);
      if (s > bestScore) { bestScore = s; best = t; }
    });
    return best;
  }
  const titleCase = s => String(s).replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/\b(Adhd|Pdf|Diy|Crm|Kdp|Seo|Ai|Svg)\b/g, m => m.toUpperCase());
  function makeButtons(kw) {
    const t = closestStarter(kw);
    return `<button type="button" class="btn small primary" data-write="${esc(kw)}">Write with AI</button><button type="button" class="btn small" data-make="${t ? esc(t.key) : 'blank'}" data-rename="${esc(titleCase(kw))}">${t ? `Use ${esc(t.product.kind)} starter` : 'Start blank'}</button>`;
  }

  /* "What buyers say": Reddit + TikTok posts and an AI summary (api/buyers.js). */
  function buyersHtml(r) {
    const b = r.buyers;
    if (!b) return `<article class="tcard buyers-cta">
        <div class="tcard-top"><strong>What buyers say</strong><span class="tpill">Reddit + TikTok</span></div>
        <p>Read real posts and videos about “${esc(r.q)}” and get the top pain points, wishes and video hooks to build into your product. About 1.5¢.</p>
        <button type="button" class="btn small primary" data-buyers="${esc(r.q)}">Find buyer pain points</button></article>`;
    const S = b.summary;
    const col = (t, l) => l && l.length ? `<div class="buy-col"><h5>${t}</h5><ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    const when = new Date(b.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return `<article class="tcard buyers">
        <div class="tcard-top"><strong>What buyers say about “${esc(r.q)}”</strong><span class="tpill tpill--rising">${b.reddit.length} Reddit posts · ${b.tiktok.length} TikToks</span></div>
        ${S ? `<div class="buy-cols">${col('Pain points', S.pains)}${col('What they want', S.wants)}
          ${S.hooks && S.hooks.length ? `<div class="buy-col"><h5>Video hooks</h5><ul>${S.hooks.map(h => `<li>${esc(h)} <button type="button" class="linkbtn" data-copy="${esc(h)}">Copy</button></li>`).join('')}</ul></div>` : ''}</div>
          ${S.angles && S.angles.length ? `<div class="chips buy-angles"><span class="hint">Product angles:</span>${S.angles.map(a => `<button type="button" class="chip" data-write="${esc(a)}" title="Write this with AI">${esc(a)}</button>`).join('')}</div>` : ''}` : ''}
        <div class="buy-src">
          <div><h5>Reddit</h5>${b.reddit.slice(0, 6).map(p => `<a class="buy-post" href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(p.title)}</b><small>r/${esc(p.sub)} · ${fmtNum(p.comments)} comments · ${fmtNum(p.score)} upvotes</small></a>`).join('') || '<p class="hint">No posts found.</p>'}</div>
          <div><h5>TikTok</h5>${b.tiktok.slice(0, 6).map(v => `<a class="buy-post" href="${esc(v.url)}" target="_blank" rel="noopener"><b>${esc(v.text)}</b><small>${fmtNum(v.views)} views · ${fmtNum(v.saves)} saves${v.author ? ` · @${esc(v.author)}` : ''}</small></a>`).join('') || '<p class="hint">No videos found.</p>'}</div>
        </div>
        <p class="hint">Checked ${esc(when)}${b.cost ? ` · cost $${b.cost.toFixed(3)}` : ''} · <button type="button" class="linkbtn" data-buyers="${esc(r.q)}">Check again</button>. “Write with AI” uses these pain points automatically.${b.warnings && b.warnings.length ? ` ${esc(b.warnings.join(' '))}` : ''}</p>
      </article>`;
  }

  function initResearch(el) {
    let current = null;
    const history = () => store.get(RESEARCH_KEY, []);
    const remember = r => { const h = history().filter(x => x.q !== r.q); h.unshift(r); store.set(RESEARCH_KEY, h.slice(0, 20)); };

    const shell = () => {
      const h = history();
      el.innerHTML = `
        <div class="research-head">
          <div><h3 class="research-title">Find a trending product</h3>
          <p class="hint">Type any idea. Viralize checks Google demand and Etsy competition plus Pinterest and Amazon, live through Treg (about 3¢ per search).</p></div>
        </div>
        <form class="research-form" id="researchForm">
          <input type="search" id="researchQ" placeholder="e.g. teacher planner, wedding seating chart, cozy coloring pages" aria-label="Product idea" maxlength="80" autocomplete="off">
          <button type="submit" class="btn primary" id="researchGo">Research</button>
        </form>
        ${h.length ? `<div class="chips research-recent"><span class="hint">Recent:</span>${h.map(x => `<button type="button" class="chip" data-recent="${esc(x.q)}">${esc(x.q)}</button>`).join('')}</div>` : ''}
        <div id="researchOut"></div>`;
    };
    const out = html => { $('#researchOut', el).innerHTML = html; };

    const renderResult = r => {
      current = r;
      const s = r.seed;
      const e = r.etsy;
      const when = new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      out(`
        <div class="verdict"><strong>${esc(titleCase(r.q))}</strong><span>${esc(r.verdict)}</span></div>
        <div class="research-grid">
          ${s ? `<article class="tcard">
            <div class="tcard-top"><strong>Google demand (US)</strong><span class="tpill tpill--${s.status}">${STATUS[s.status] || 'Steady'}</span></div>
            ${sparkline(s.series, 260, 54)}
            <div class="tcard-nums"><span><b>${fmtNum(s.latest)}</b> searches in ${esc(s.latestMonth)}</span><span class="${s.change >= 0 ? 'up' : 'down'}">${s.change >= 0 ? '+' : ''}${s.change}% in 3 mo</span></div>
            <p>${esc(s.why)} Peak month: ${esc(s.peak)}. Ads competition: ${esc(s.comp)}.</p>
            ${makeButtons(r.q)}
          </article>` : `<article class="tcard"><strong>Google demand</strong><p>No Google data for this exact phrase. Try a broader idea.</p>${makeButtons(r.q)}</article>`}
          ${e && e.count ? `<article class="tcard etsy-card">
            <div class="tcard-top"><strong>Etsy right now</strong><span class="tpill ${e.bestsellers <= 2 ? 'tpill--rising' : e.bestsellers >= 6 ? 'tpill--cooling' : 'tpill--season'}">${e.bestsellers <= 2 ? 'Open' : e.bestsellers >= 6 ? 'Crowded' : 'Competitive'}</span></div>
            <div class="etsy-stats"><div><b>${e.medianPrice ? '$' + e.medianPrice.toFixed(2) : '—'}</b><span>typical price</span></div><div><b>${e.bestsellers}/${e.count}</b><span>Bestsellers</span></div><div><b>${fmtNum(e.medianReviews)}</b><span>median reviews</span></div></div>
            <div class="etsy-list">${e.listings.slice(0, 6).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="etsy-item">${l.image ? `<img src="${esc(l.image)}" alt="" loading="lazy">` : '<span class="etsy-noimg"></span>'}<span><b>${esc(l.price || '')}</b>${l.bestseller ? ' <em>Bestseller</em>' : ''}<small>${esc(l.title || '')}</small></span></a>`).join('')}</div>
          </article>` : '<article class="tcard"><strong>Etsy</strong><p>No Etsy results came back for this search.</p></article>'}
        </div>
        ${r.pinterest || r.amazon ? `<div class="research-grid">
          ${r.pinterest && r.pinterest.count ? `<article class="tcard">
            <div class="tcard-top"><strong>Pinterest</strong><span class="tpill ${r.pinterest.recent30 >= 6 ? 'tpill--rising' : 'tpill--season'}">${r.pinterest.recent30} new pins in 30 days</span></div>
            <p>${r.pinterest.recent30 >= 6 ? 'Sellers are actively pinning this right now, so buyers are seeing it. Pin your mockups here.' : 'Few fresh pins: less competition for attention if you pin consistently.'}</p>
            <div class="pin-strip">${r.pinterest.pins.slice(0, 8).map(pn => `<a href="${esc(pn.url)}" target="_blank" rel="noopener" title="${esc(pn.text)}">${pn.image ? `<img src="${esc(pn.image)}" alt="" loading="lazy">` : ''}</a>`).join('')}</div>
          </article>` : ''}
          ${r.amazon && r.amazon.count ? `<article class="tcard">
            <div class="tcard-top"><strong>Amazon</strong><span class="tpill tpill--season">${fmtNum(r.amazon.total)} results</span></div>
            <div class="etsy-stats"><div><b>${r.amazon.medianPrice ? '$' + r.amazon.medianPrice.toFixed(2) : '—'}</b><span>typical price</span></div><div><b>${r.amazon.selling}/${r.amazon.count}</b><span>show recent sales</span></div><div><b>${r.amazon.products[0] ? fmtNum(r.amazon.products[0].ratings) : '—'}</b><span>top ratings</span></div></div>
            <div class="etsy-list">${r.amazon.products.slice(0, 4).map(a => `<a href="${esc(a.url)}" target="_blank" rel="noopener" class="etsy-item">${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : '<span class="etsy-noimg"></span>'}<span><b>${esc(a.price || '')}</b>${a.sales ? ` <em>${esc(a.sales)}</em>` : ''}<small>${esc(a.title)}</small></span></a>`).join('')}</div>
          </article>` : ''}
        </div>` : ''}
        <div class="research-buyers" id="buyersOut">${buyersHtml(r)}</div>
        ${r.ideas.length ? `<h4 class="research-sub">Related ideas people search <span class="hint">(${r.ideas.length}${r.skipped ? `, ${r.skipped} store-brand or "free" searches hidden` : ''})</span></h4>
        <div class="trend-table"><table><thead><tr><th>Idea</th><th>Last 12 months</th><th class="num">Latest month</th><th class="num">3-mo change</th><th>Peak</th><th>Status</th><th>Why</th><th></th></tr></thead><tbody>
          ${r.ideas.map(i => `<tr><td><strong>${esc(i.kw)}</strong><small>${esc(i.comp)} competition${i.intent ? ` · ${esc(i.intent)}` : ''}</small></td><td>${sparkline(i.series)}</td>
            <td class="num">${fmtNum(i.latest)}</td><td class="num ${i.change >= 0 ? 'up' : 'down'}">${i.change >= 0 ? '+' : ''}${i.change}%</td><td>${esc(i.peak)}</td>
            <td><span class="tpill tpill--${i.status}">${STATUS[i.status] || 'Steady'}</span></td><td class="why">${esc(i.why)}</td>
            <td class="acts"><button type="button" class="btn small" data-research="${esc(i.kw)}">Research</button>${makeButtons(i.kw)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
        ${r.alsoSearched && r.alsoSearched.length ? `<div class="chips research-also"><span class="hint">Also searched:</span>${r.alsoSearched.map(k => `<button type="button" class="chip" data-research="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : ''}
        <p class="hint research-foot">Checked ${esc(when)}${r.cost ? ` · cost $${r.cost.toFixed(3)}` : ''}${r.cached ? ' · saved result, no charge' : ''} · <button type="button" class="linkbtn" data-refresh="${esc(r.q)}">Refresh live</button>${r.warnings && r.warnings.length ? ` · ${esc(r.warnings.join(' '))}` : ''}</p>`);
    };

    const ask = (title, body) => out(`<div class="research-note"><strong>${title}</strong>${body}</div>`);

    async function run(q, force) {
      q = String(q || '').trim().toLowerCase();
      if (q.length < 3) { ask('Type a little more', '<p>Use at least 3 letters, like "habit tracker".</p>'); return; }
      $('#researchQ', el).value = q;
      const saved = history().find(x => x.q === q);
      if (saved && !force) { renderResult(Object.assign({}, saved, { cached: true })); return; }
      if (location.protocol === 'file:') {
        ask('Research runs on your live site', '<p>Open <b>studio.tryviralize.com</b> to search live. The trend snapshot below works everywhere.</p>');
        return;
      }
      out('<div class="research-loading"><span class="spinner" aria-hidden="true"></span>Checking Google and Etsy through Treg…</div>');
      $('#researchGo', el).disabled = true;
      try {
        const res = await fetch('api/research', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Passcode': store.get(PASS_KEY, '') }, body: JSON.stringify({ q }) });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          ask('Enter your research passcode', `<p>This keeps strangers from spending your Treg balance. Use the APP_PASSCODE you set in Vercel.</p>
            <form class="research-form" id="passForm"><input type="password" id="passIn" placeholder="Passcode" autocomplete="current-password" aria-label="Passcode"><button class="btn primary" type="submit">Save and search</button></form>`);
          $('#passForm', el).addEventListener('submit', ev => { ev.preventDefault(); store.set(PASS_KEY, $('#passIn', el).value); run(q, true); });
          setTimeout(() => { const p = $('#passIn', el); if (p) p.focus(); }, 30);
        } else if (res.status === 503 || res.status === 404) {
          ask('One-time setup needed', `<ol class="steps"><li>In your <b>Treg</b> dashboard (treg.to), create an API key.</li>
            <li>In <b>Vercel</b>, open the project, go to Settings, then Environment Variables. Add <code>TREG_TOKEN</code> with that key, and <code>APP_PASSCODE</code> with any phrase you choose.</li>
            <li>Redeploy (Deployments, then the ⋯ menu, then Redeploy) and search again.</li></ol>`);
        } else if (res.status === 402) {
          ask('Treg balance is empty', '<p>Top up at treg.to, then search again.</p>');
        } else if (!res.ok) {
          ask('That search did not go through', `<p>${esc(data.message || `Error ${res.status}`)}. Try again in a moment.</p>`);
        } else {
          const prev = history().find(x => x.q === q);
          if (prev && prev.buyers && !data.buyers) data.buyers = prev.buyers;
          remember(data); shell(); $('#researchQ', el).value = q; bind(); renderResult(data);
        }
      } catch (err) {
        ask('Could not reach the research server', '<p>Check your internet connection and try again.</p>');
      } finally {
        const b = $('#researchGo', el); if (b) b.disabled = false;
      }
    }

    function bind() {
      $('#researchForm', el).addEventListener('submit', ev => { ev.preventDefault(); run($('#researchQ', el).value); });
    }
    async function buyers(q) {
      const box = $('#buyersOut', el);
      if (!box || !current) return;
      box.innerHTML = '<div class="research-loading"><span class="spinner" aria-hidden="true"></span>Reading Reddit and TikTok, then summarizing… (about 20 seconds)</div>';
      try {
        const data = await api('api/buyers', { method: 'POST', body: { q } });
        const saved = Object.assign({}, current, { buyers: data });
        delete saved.cached;
        remember(saved);
        current = saved;
        box.innerHTML = buyersHtml(saved);
      } catch (err) {
        box.innerHTML = `<div class="research-note"><strong>Could not check buyers</strong><p>${esc(mediaError(err))}</p></div>`;
      }
    }
    el.addEventListener('click', ev => {
      const w = ev.target.closest('[data-write]'); if (w) { newModal(w.dataset.write); return; }
      const by = ev.target.closest('[data-buyers]'); if (by) { buyers(by.dataset.buyers); return; }
      const cp = ev.target.closest('[data-copy]'); if (cp) { copy(cp.dataset.copy, 'Hook copied'); return; }
      const r = ev.target.closest('[data-research]'); if (r) { run(r.dataset.research); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      const rc = ev.target.closest('[data-recent]'); if (rc) { run(rc.dataset.recent); return; }
      const rf = ev.target.closest('[data-refresh]'); if (rf) { run(rf.dataset.refresh, true); return; }
    });
    shell(); bind();
    setTimeout(() => { const i = $('#researchQ', el); if (i) i.focus(); }, 60);
  }

  /* TikTok trending hashtags this week (api/social.js). Cached for 12 hours. */
  function initTikTok(el) {
    const KEY = 'folio.tiktok';
    const draw = (data, note) => {
      const fresh = data && Date.now() - Date.parse(data.at) < 12 * 36e5;
      el.innerHTML = `<div class="group-head"><h3 class="group-title">Trending on TikTok this week (US)</h3>
          <button type="button" class="btn small" id="ttGo">${data ? (fresh ? 'Refresh' : 'Update') : 'Check TikTok'} <span class="hint">~1¢</span></button></div>
        ${note ? `<p class="hint">${esc(note)}</p>` : ''}
        ${data ? `<div class="tt-grid">${data.boards.filter(b => b.tags.length).map(b => `<div class="tt-board"><strong>${esc(b.label)}</strong>
          ${b.tags.map(t => `<div class="tt-tag"><span>#${esc(t.tag)}</span>${sparkline(t.curve.length > 1 ? t.curve : [0, 0], 70, 22)}<small>${fmtNum(t.views)} views · ${fmtNum(t.posts)} posts</small><button type="button" class="linkbtn" data-research="${esc(t.tag.replace(/([a-z])([A-Z])/g, '$1 $2'))}">Research</button></div>`).join('')}</div>`).join('')}</div>
          <p class="hint">Updated ${esc(new Date(data.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}. Use these as hooks and hashtags for your product videos.</p>`
        : '<p class="hint">See the hashtags rising this week in education, home, health, beauty and parenting. Use them in captions and to spot product ideas.</p>'}`;
    };
    draw(store.get(KEY, null));
    el.addEventListener('click', async e => {
      if (e.target.closest('#ttGo')) {
        e.target.closest('#ttGo').disabled = true;
        try { const d = await api('api/social'); store.set(KEY, d); draw(d); } catch (err) { draw(store.get(KEY, null), mediaError(err)); }
        return;
      }
      const r = e.target.closest('[data-research]');
      if (r) { const q = $('#researchQ'); if (q) { q.value = r.dataset.research; $('#researchForm').requestSubmit(); $('#research').scrollIntoView({ behavior: 'smooth' }); } }
    });
  }

  function trendsModal() {
    const meta = (Folio.trends && Folio.trends.meta) || {};
    let filter = 'all', sort = 'score';
    const action = x => x.template
      ? `<button type="button" class="btn small primary" data-make="${esc(x.template)}">Make this</button>`
      : x.near ? `<button type="button" class="btn small" data-make="${esc(x.near)}" data-rename="${esc(x.label)}">Start from ${esc((Folio.templates.find(t => t.key === x.near) || { product: { kind: '' } }).product.kind)}</button>`
        : '<span class="trend-idea">Idea for a new starter</span>';
    const pick = TRENDS.filter(x => x.status === 'rising' || x.status === 'season').slice(0, 6);
    const card = x => `<article class="tcard">
        <div class="tcard-top"><strong>${esc(x.label)}</strong><span class="tpill tpill--${x.status}">${STATUS[x.status]}</span></div>
        ${sparkline(x.series, 220, 46)}
        <div class="tcard-nums"><span><b>${fmtNum(latest(x))}</b> searches in ${latestMonth(x)}</span><span class="${x.change >= 0 ? 'up' : 'down'}">${x.change >= 0 ? '+' : ''}${x.change}% in 3 mo</span></div>
        <p>${esc(x.why)}</p>${action(x)}</article>`;
    const row = x => `<tr>
        <td><strong>${esc(x.label)}</strong><small>${esc(x.kw)}</small></td>
        <td>${sparkline(x.series)}</td>
        <td class="num">${fmtNum(latest(x))}<small>avg ${fmtNum(x.vol)}</small></td>
        <td class="num ${x.change >= 0 ? 'up' : 'down'}">${x.change >= 0 ? '+' : ''}${x.change}%</td>
        <td>${esc(x.peak)}</td>
        <td><span class="tpill tpill--${x.status}">${STATUS[x.status]}</span></td>
        <td class="cap">${esc(x.comp)}</td>
        <td>${action(x)}</td></tr>`;
    const draw = body => {
      let list = TRENDS.filter(x => filter === 'all' || (filter === 'app' ? !!x.template : filter === 'ideas' ? !x.template : x.status === filter));
      list = list.slice().sort((a, b) => sort === 'vol' ? latest(b) - latest(a) : sort === 'change' ? b.change - a.change : b.score - a.score);
      $('#trendRows', body).innerHTML = list.map(row).join('');
      body.querySelectorAll('[data-tf]').forEach(b => b.classList.toggle('on', b.dataset.tf === filter));
    };
    openModal('Market trends', `
      <section class="research" id="research"></section>
      <section class="group tiktok" id="tiktok"></section>
      <h3 class="group-title snap-title">Trend snapshot</h3>
      <p class="hint trend-meta">${esc(meta.source || '')} ${meta.range ? `Data: ${esc(meta.range)}.` : ''} Snapshot taken ${esc(meta.updated || '')}.</p>
      <section class="group"><h3 class="group-title">Make these now</h3><div class="tcards">${pick.map(card).join('')}</div></section>
      <section class="group">
        <div class="trend-tools">
          <div class="chips">${[['all', 'All'], ['rising', 'Rising'], ['season', 'Peak season ahead'], ['app', 'In the app'], ['ideas', 'New ideas']].map(([k, l]) => `<button type="button" class="chip" data-tf="${k}">${l}</button>`).join('')}</div>
          <label class="trend-sort">Sort by <select id="trendSort"><option value="score">Opportunity</option><option value="vol">Searches</option><option value="change">Growth</option></select></label>
        </div>
        <div class="trend-table"><table><thead><tr><th>Product</th><th>Last 12 months</th><th class="num">Searches (latest month)</th><th class="num">3-mo change</th><th>Peak</th><th>Status</th><th>Ads competition</th><th></th></tr></thead><tbody id="trendRows"></tbody></table></div>
      </section>`, body => {
      body.closest('.modal').classList.add('modal--wide');
      draw(body);
      initResearch($('#research', body));
      initTikTok($('#tiktok', body));
      body.addEventListener('click', e => {
        const f = e.target.closest('[data-tf]');
        if (f) { filter = f.dataset.tf; draw(body); return; }
        const m = e.target.closest('[data-make]');
        if (m) startTemplate(m.dataset.make, m.dataset.rename);
      });
      $('#trendSort', body).addEventListener('change', e => { sort = e.target.value; draw(body); });
    });
  }

  function newModal(prefill) {
    if (typeof prefill !== 'string') prefill = '';
    const ORDER = ['Planners', 'Mind & wellness', 'Health & fitness', 'Home & food', 'Business & money', 'Guides & ebooks', 'Art & paper', 'Start from scratch'];
    const rank = c => (ORDER.indexOf(c) + 1) || 99;
    const cats = ['All', ...(TRENDS.length ? ['Trending'] : []), ...[...new Set(Folio.templates.map(t => t.cat))].sort((a, b) => rank(a) - rank(b))];
    let cat = 'All', q = '';
    const card = t => {
      const th = Folio.themes[t.product.theme] || Folio.themes.editorial;
      const bp = t.product.brandPreset && Folio.brandPresets[t.product.brandPreset];
      const title = String(t.product.title).replace('{{platform}}', bp ? bp.platformName : 'your CRM');
      const tr = trendFor(t.key);
      const art = t.image
        ? `<span class="tpl-cover tpl-cover--img"><img src="${esc(t.image)}" alt="${esc(title)} product photo" loading="lazy">${trendBadge(tr)}</span>`
        : `<span class="tpl-cover" style="background:${bp ? bp.dark : th.coverBg};color:${bp ? '#fff' : th.coverInk};font-family:${th.display}">${esc(title)}${trendBadge(tr)}</span>`;
      return `<button type="button" class="tpl" data-tpl="${t.key}">${art}
        <strong>${esc(t.product.kind)}</strong><small>${tr && cat === 'Trending' ? `${fmtNum(latest(tr))} searches in ${latestMonth(tr)}. ${esc(tr.why)}` : esc(t.blurb)}</small></button>`;
    };
    const draw = body => {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      const match = t => words.every(w => `${t.product.kind} ${t.product.title} ${t.blurb} ${t.cat}`.toLowerCase().includes(w));
      let groups;
      if (cat === 'Trending') {
        const hot = Folio.templates.map(t => [t, trendFor(t.key)]).filter(([t, x]) => x && match(t)).sort((a, b) => b[1].score - a[1].score).map(([t]) => t);
        groups = hot.length ? [['Trending now, ranked by opportunity', hot]] : [];
      } else {
        groups = cats.filter(c => c !== 'All' && c !== 'Trending').map(c => [c, Folio.templates.filter(t => t.cat === c && (cat === 'All' || t.cat === cat) && match(t))]).filter(([, l]) => l.length);
      }
      $('#tplGroups', body).innerHTML = groups.length
        ? groups.map(([c, l]) => `<section class="tpl-group"><h3 class="group-title">${esc(c)} <span class="tpl-count">${l.length}</span></h3><div class="tpl-grid">${l.map(card).join('')}</div></section>`).join('')
        : '<p class="empty">No starters match. Try another word, or start from a blank product.</p>';
      body.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
    };
    openModal(`Start a new product`, `
      ${writeBox(prefill)}
      <h3 class="group-title snap-title">Or start from a ready-made starter</h3>
      <div class="tpl-tools">
        <input type="search" id="tplSearch" placeholder="Search ${Folio.templates.length} starters, e.g. planner, budget, wall art" aria-label="Search starters">
        <div class="chips">${cats.map(c => `<button type="button" class="chip${c === 'Trending' ? ' chip--hot' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      </div>
      <div id="tplGroups"></div>`, body => {
      draw(body);
      $('#writeForm', body).addEventListener('submit', ev => { ev.preventDefault(); startWriting($('#writeIdea', body).value, Number($('#writeLen', body).value)); });
      $('#tplSearch', body).addEventListener('input', e => { q = e.target.value; draw(body); });
      body.addEventListener('click', e => {
        const c = e.target.closest('[data-cat]');
        if (c) { cat = c.dataset.cat; draw(body); return; }
        const b = e.target.closest('[data-tpl]');
        if (b) startTemplate(b.dataset.tpl);
      });
      setTimeout(() => { const i = prefill ? $('#writeIdea') : $('#tplSearch'); if (i) i.focus(); }, 50);
    });
  }

  /* ---------- Projects: every product as a card with a live first-page thumbnail ---------- */
  const projCache = new Map();
  function projInfo(p) {
    const key = `${p.id}:${p.updated || 0}:${p.brandId || ''}`;
    let c = projCache.get(key);
    if (!c) {
      const q = Folio.quality(p);
      const box = document.createElement('div');
      box.innerHTML = Folio.render(p);
      const first = box.querySelector('.page');
      c = { score: q.score, pages: q.stats.pages, page: first ? first.outerHTML : '' };
      projCache.set(key, c);
    }
    return c;
  }
  const relTime = t => {
    if (!t) return 'a while ago';
    const m = (Date.now() - t) / 6e4;
    if (m < 1) return 'just now';
    if (m < 60) return `${Math.round(m)} min ago`;
    if (m < 48 * 60) return `${Math.round(m / 60)}h ago`;
    if (m < 60 * 24 * 30) return `${Math.round(m / 1440)} days ago`;
    return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const storageUsed = () => { try { return (localStorage.getItem(STORE_KEY) || '').length * 2; } catch (e) { return 0; } };

  function projectsModal() {
    const KIND = r => String(r.kind || 'Other').trim() || 'Other';
    let q = '', kind = 'All', sort = store.get('folio.projSort', 'edited');
    const all = () => Object.values(state.store.projects);
    const card = r => {
      const info = projInfo(r);
      const t = Folio.applyTokens(r);
      const lvl = info.score >= 85 ? 'good' : info.score >= 60 ? 'ok' : 'low';
      const photo = (r.mockups || []).find(m => m.thumb);
      const badges = [
        r.id === state.store.current && '<span class="pbadge pbadge--on">Editing now</span>',
        info.score >= 85 && '<span class="pbadge pbadge--good">Ready to sell</span>',
        r.ai && '<span class="pbadge">AI-written</span>',
        (r.mockups || []).length && `<span class="pbadge">${r.mockups.length} photo${r.mockups.length > 1 ? 's' : ''}</span>`,
        (r.pins || []).length && `<span class="pbadge">${r.pins.length} pin${r.pins.length > 1 ? 's' : ''}</span>`,
        (r.videos || []).length && `<span class="pbadge">${r.videos.length} video${r.videos.length > 1 ? 's' : ''}</span>`,
        r.listing && r.listing.etsy && '<span class="pbadge">Etsy listing</span>'
      ].filter(Boolean).join('');
      return `<article class="projcard${r.id === state.store.current ? ' current' : ''}" data-pid="${esc(r.id)}">
        <button type="button" class="projcard-thumb" data-pact="open" aria-label="Open ${esc(t.title || 'Untitled')}">
          ${photo ? `<img src="${esc(photo.thumb)}" alt="" loading="lazy">` : `<span class="projcard-page" data-paper="${esc(r.paper)}"><span class="doc" style="${Folio.themeVars(r)}">${info.page}</span></span>`}
          <span class="projcard-score" data-level="${lvl}" title="Quality score">${info.score}</span>
        </button>
        <div class="projcard-body">
          <strong class="projcard-title">${esc(t.title || 'Untitled')}</strong>
          <small>${esc(r.kind || 'Product')} · ${info.pages} page${info.pages === 1 ? '' : 's'} · ${esc(relTime(r.updated))}</small>
          ${badges ? `<div class="pbadges">${badges}</div>` : ''}
        </div>
        <div class="projcard-acts">
          <button type="button" class="btn small primary" data-pact="open">${r.id === state.store.current ? 'Keep editing' : 'Open'}</button>
          <span class="projcard-more">
            <button type="button" class="pact" data-pact="dup">Duplicate</button>
            <button type="button" class="pact" data-pact="rename">Rename</button>
            <button type="button" class="pact" data-pact="json" title="Download this product as a .json file">Save file</button>
            <button type="button" class="pact pact--del" data-pact="del"${all().length < 2 ? ' disabled title="You need at least one product"' : ''}>Delete</button>
          </span>
        </div>
      </article>`;
    };
    const draw = body => {
      const rows = all();
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      const list = rows.filter(r => (kind === 'All' || KIND(r) === kind) && words.every(w => `${r.title} ${r.subtitle || ''} ${r.kind || ''} ${r.idea || ''}`.toLowerCase().includes(w)));
      const by = {
        edited: (a, b) => (b.updated || 0) - (a.updated || 0),
        created: (a, b) => (b.created || 0) - (a.created || 0),
        name: (a, b) => String(a.title).localeCompare(String(b.title)),
        score: (a, b) => projInfo(b).score - projInfo(a).score,
        pages: (a, b) => projInfo(b).pages - projInfo(a).pages
      };
      list.sort(by[sort] || by.edited);
      const ready = rows.filter(r => projInfo(r).score >= 85).length;
      const pages = rows.reduce((n, r) => n + projInfo(r).pages, 0);
      $('#projStats', body).innerHTML = `<div><b>${rows.length}</b><span>product${rows.length === 1 ? '' : 's'}</span></div><div><b>${ready}</b><span>ready to sell</span></div><div><b>${pages.toLocaleString()}</b><span>pages made</span></div><div><b>${rows.reduce((n, r) => n + (r.mockups || []).length + (r.pins || []).length, 0)}</b><span>photos and pins</span></div>`;
      const kinds = [...rows.reduce((m, r) => m.set(KIND(r), (m.get(KIND(r)) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
      $('#projKinds', body).innerHTML = kinds.length > 1 ? [['All', rows.length], ...kinds].map(([k, n]) => `<button type="button" class="chip${k === kind ? ' on' : ''}" data-kind="${esc(k)}">${esc(k)} <span class="tpl-count">${n}</span></button>`).join('') : '';
      $('#projGrid', body).innerHTML = `<button type="button" class="projcard projcard--new" data-pact="new"><span class="projcard-plus" aria-hidden="true">+</span><strong>New product</strong><small>Write it with AI or start from ${Folio.templates.length} starters</small></button>`
        + (list.length ? list.map(card).join('') : '')
        + (!list.length ? '<p class="empty proj-empty">No products match. Try another word or pick “All”.</p>' : '');
      fitThumbs(body);
    };
    const fitThumbs = body => body.querySelectorAll('.projcard-page').forEach(el => {
      const doc = el.firstElementChild;
      const w = el.dataset.paper === 'a4' ? 794 : 816;
      if (doc && el.clientWidth) doc.style.transform = `scale(${el.clientWidth / w})`;
    });
    const used = storageUsed();
    openModal('Your products', `
      <div class="proj-stats" id="projStats"></div>
      <div class="proj-tools">
        <input type="search" id="projSearch" placeholder="Search your products" aria-label="Search your products">
        <label class="trend-sort">Sort by <select id="projSort">${[['edited', 'Last edited'], ['created', 'Newest'], ['name', 'Name A–Z'], ['score', 'Quality score'], ['pages', 'Most pages']].map(([k, l]) => `<option value="${k}"${k === sort ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <div class="chips" id="projKinds"></div>
      <div class="proj-grid" id="projGrid"></div>
      <div class="proj-foot">
        <div class="modal-foot">
          <button type="button" class="btn" id="dlAll">Back up everything (.json)</button>
          <label class="btn ghost file-btn">Import a .json file<input type="file" id="importFile" accept=".json,application/json"></label>
        </div>
        <p class="hint">Products save automatically in this browser${used ? ` (using ${(used / 1048576).toFixed(1)} MB of about 5 MB)` : ''}. Back up everything to move to another device or keep a safe copy. Import takes a single product or a full backup.</p>
      </div>`, body => {
      body.closest('.modal').classList.add('modal--wide');
      draw(body);
      const onResize = () => { if (!document.body.contains(body) || !$('#projGrid', body)) { window.removeEventListener('resize', onResize); return; } fitThumbs(body); };
      window.addEventListener('resize', onResize);
      $('#projSearch', body).addEventListener('input', e => { q = e.target.value; draw(body); });
      $('#projSort', body).addEventListener('change', e => { sort = e.target.value; store.set('folio.projSort', sort); draw(body); });
      body.addEventListener('click', e => {
        const kb = e.target.closest('[data-kind]');
        if (kb) { kind = kb.dataset.kind; draw(body); return; }
        if (e.target.id === 'dlAll') {
          download(`viralize-studio-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'viralize-studio', version: 1, exported: new Date().toISOString(), projects: all(), brands: state.store.brands }, null, 2));
          return;
        }
        const btn = e.target.closest('[data-pact]');
        if (!btn) return;
        const act = btn.dataset.pact;
        if (act === 'new') { newModal(); return; }
        const cardEl = btn.closest('[data-pid]');
        const id = cardEl.dataset.pid;
        const r = state.store.projects[id];
        if (act === 'open') { if (id !== state.store.current) { state.store.current = id; state.openBlocks.clear(); resetHistory(); save(); refreshAll(); } closeModal(); return; }
        if (act === 'dup') {
          const c = normalize(Object.assign(JSON.parse(JSON.stringify(r)), { id: uid(), title: `${r.title} (copy)`, created: Date.now(), updated: Date.now() }));
          state.store.projects[c.id] = c; save(); draw(body); toast('Duplicated');
          return;
        }
        if (act === 'json') { download(`${slug(Folio.applyTokens(r).title)}.json`, JSON.stringify(r, null, 2)); return; }
        if (act === 'rename') {
          const titleEl = cardEl.querySelector('.projcard-title');
          titleEl.outerHTML = `<input type="text" class="projcard-rename" value="${esc(r.title)}" aria-label="Product name" maxlength="120">`;
          const inp = cardEl.querySelector('.projcard-rename');
          inp.focus(); inp.select();
          let doneR = false;
          const finish = ok => {
            if (doneR) return; doneR = true;
            const v = inp.value.trim();
            if (ok && v && v !== r.title) {
              if (id === state.store.current) checkpoint(true);
              r.title = v; r.updated = Date.now();
              if (id === state.store.current) { save(); renderPreview(); } else save();
              toast('Renamed');
            }
            draw(body);
          };
          inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') finish(true); if (ev.key === 'Escape') { ev.stopPropagation(); finish(false); } });
          inp.addEventListener('blur', () => finish(true));
          return;
        }
        if (act === 'del') {
          if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = 'Click again to delete'; return; }
          delete state.store.projects[id];
          if (state.store.current === id) {
            state.store.current = all().sort((a, b) => (b.updated || 0) - (a.updated || 0))[0].id;
            state.openBlocks.clear(); resetHistory(); refreshAll();
          }
          save(); draw(body); toast('Deleted');
        }
      });
      $('#importFile', body).addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          let obj = null;
          try { obj = JSON.parse(rd.result); } catch (err) { /* applyJson reports it */ }
          if (obj && Array.isArray(obj.projects)) {
            Object.assign(state.store.brands, obj.brands || {});
            let n = 0;
            obj.projects.forEach(x => {
              if (!x || !Array.isArray(x.blocks)) return;
              const same = state.store.projects[x.id];
              if (same && JSON.stringify(same) === JSON.stringify(x)) return;
              const c = normalize(Object.assign({}, x, { id: same || !x.id ? uid() : x.id }));
              state.store.projects[c.id] = c; n++;
            });
            save(); draw(body); toast(n ? `Imported ${n} product${n > 1 ? 's' : ''}` : 'Everything in that backup is already here');
          } else if (applyJson(rd.result, true)) closeModal();
          e.target.value = '';
        };
        rd.readAsText(f);
      });
    });
  }

  function aiPrompt(p) {
    const blockDocs = Object.entries(Folio.blocks).map(([k, d]) =>
      `- "${k}" (${d.label}): ${d.fields.map(f => `${f.key}${f.kind === 'list' ? ' (array of strings)' : f.kind === 'number' ? ' (number)' : f.kind === 'select' ? ` (one of: ${Object.keys(f.options).join(', ')})` : ''}`).join(', ') || 'no fields'}`).join('\n');
    const clean = JSON.parse(JSON.stringify(p));
    delete clean.created; delete clean.updated;
    /* Images are too large for a chat; the AI sees a marker and we restore them on apply. */
    clean.blocks.forEach(b => { if (b.image) b.image = 'KEEP_IMAGE'; });
    return `You are an expert digital product creator and editor. Improve the product below so it feels premium and worth paying for: specific, practical, well-structured, warm and confident. Keep the same JSON shape.

RULES
- Reply with ONLY the complete JSON object, no commentary, no code fences.
- Keep "id" values that exist. New blocks may omit "id".
- Use only these block types and fields:
${blockDocs}
- Text fields support **bold** and *italic*. In "text" and "intro", a blank line starts a new paragraph.
- Themes: ${Object.keys(Folio.themes).join(', ')}. Covers: ${Object.keys(Folio.coverStyles).join(', ')}. Paper: ${Object.keys(Folio.paperSizes).join(', ')}.
- No placeholder text (no "lorem ipsum", "TODO", "Your Name" unless I left it).
- Leave "KEEP_IMAGE" values exactly as they are. Keep {{platform}}, {{brand}}, {{login}}, {{website}}, {{email}}, {{phone}} placeholders; they are filled in from the brand kit.

MY REQUEST
[Describe what you want changed, e.g. "Add two more chapters with worksheets" or "Rewrite in a friendlier voice".]

PRODUCT JSON
${JSON.stringify(clean, null, 2)}`;
  }

  function aiModal() {
    openModal('Edit with ChatGPT, Grok or any AI', `
      <ol class="steps">
        <li><strong>Copy the prompt.</strong> It includes your whole product and the rules the AI must follow.</li>
        <li><strong>Paste it into ChatGPT, Grok, Claude or Gemini.</strong> Replace the line under MY REQUEST with what you want.</li>
        <li><strong>Paste the AI's reply below</strong> and apply it. Your current version is kept as a copy first.</li>
      </ol>
      <div class="ai-cols">
        <div><div class="group-head"><span class="label">Prompt</span><button type="button" class="btn small primary" id="copyPrompt">Copy prompt</button></div>
        <textarea id="aiPromptText" readonly rows="10">${esc(aiPrompt(P()))}</textarea></div>
        <div><div class="group-head"><span class="label">AI reply (JSON)</span><button type="button" class="btn small primary" id="applyAI">Apply changes</button></div>
        <textarea id="aiReply" rows="10" placeholder='Paste the JSON here. It starts with { and ends with }'></textarea>
        <p class="error" id="aiError" hidden></p></div>
      </div>`, body => {
      $('#copyPrompt', body).addEventListener('click', () => copy($('#aiPromptText').value, 'Prompt copied', $('#aiPromptText')));
      $('#applyAI', body).addEventListener('click', () => {
        const ok = applyJson($('#aiReply').value, false);
        if (ok) closeModal();
      });
    });
  }

  /* Accepts a reply that may be wrapped in ``` fences or have text around it. */
  function applyJson(text, asNew) {
    const err = $('#aiError');
    try {
      const s = String(text);
      const start = s.indexOf('{'), end = s.lastIndexOf('}');
      if (start < 0 || end < start) throw new Error('No JSON object found. Make sure you pasted the whole reply.');
      const obj = JSON.parse(s.slice(start, end + 1));
      if (!Array.isArray(obj.blocks)) throw new Error('The JSON has no "blocks" list. Ask the AI to return the complete product.');
      const unknown = obj.blocks.filter(b => !Folio.blocks[b.type]).length;
      if (asNew) { addProject(obj); }
      else {
        const old = P();
        obj.blocks.forEach(b => {
          if (b.image === 'KEEP_IMAGE') { const o = old.blocks.find(x => x.id === b.id); b.image = o ? o.image : ''; }
        });
        if (!('brandId' in obj)) obj.brandId = old.brandId;
        checkpoint(true);
        const backup = JSON.parse(JSON.stringify(old));
        backup.id = uid(); backup.title = `${backup.title} (before AI edit)`;
        state.store.projects[backup.id] = backup;
        const keepId = P().id;
        const next = normalize(Object.assign({}, obj, { id: keepId, created: P().created }));
        state.store.projects[keepId] = next;
        save(); refreshAll();
      }
      toast(unknown ? `Applied. Skipped ${unknown} unknown block${unknown > 1 ? 's' : ''}.` : 'Changes applied');
      return true;
    } catch (e) {
      const msg = e instanceof SyntaxError ? 'That is not valid JSON. Ask the AI to reply with only the JSON object.' : e.message;
      if (err) { err.textContent = msg; err.hidden = false; } else toast(msg);
      return false;
    }
  }

  /* ---------- utilities ---------- */
  function slug(s) { return String(s || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product'; }
  function download(name, text) {
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name; document.body.appendChild(a); a.click(); a.remove();
      toast('Download started');
    } catch (e) { toast('Download blocked here. Use AI edit → Copy prompt to copy your JSON.'); }
  }
  function copy(text, msg, fallbackEl) {
    const done = () => toast(msg);
    try {
      navigator.clipboard.writeText(text).then(done, () => { if (fallbackEl) { fallbackEl.select(); toast('Press Ctrl/Cmd + C to copy'); } });
    } catch (e) { if (fallbackEl) fallbackEl.select(); }
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function exportPdf() {
    const size = Folio.paperSizes[P().paper];
    let s = $('#pageSizeStyle');
    if (!s) { s = document.createElement('style'); s.id = 'pageSizeStyle'; document.head.appendChild(s); }
    const paper = (Folio.themes[P().theme] || {}).paper || '#fff';
    /* Paper color behind overflow pages, so dark themes have no white strips. */
    s.textContent = `@page { size: ${size.w} ${size.h}; margin: 0; }
      @media print { html, body { background: ${paper} !important; } }`;
    toast('In the print dialog choose "Save as PDF", margins "None", and turn on "Background graphics".');
    setTimeout(() => window.print(), 400);
  }

  function refreshAll() { renderPanel(); renderPreview(); }

  /* ---------- boot ---------- */
  function boot() {
    const stored = readStore();
    if (stored) {
      state.store = stored;
      stored.brands = stored.brands || {};
      Object.keys(stored.projects).forEach(k => { stored.projects[k] = normalize(stored.projects[k]); });
    } else {
      const first = normalize(JSON.parse(JSON.stringify(Folio.templates[0].product)));
      state.store = { projects: { [first.id]: first }, brands: {}, current: first.id };
    }
    Folio.brands = state.store.brands;
    /* Starter brand kits are always available. */
    ['integrity', 'viralize'].forEach(ensureBrand);

    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { state.tab = t.dataset.tab; renderPanel(); }));
    $('#panelBody').addEventListener('input', onPanelInput);
    $('#panelBody').addEventListener('change', e => {
      if (e.target.type === 'file' && e.target.dataset.kind === 'image') return onImageFile(e.target);
      if (e.target.id === 'brandPick') { checkpoint(true); P().brandId = e.target.value; save(); renderPanel(); renderPreview(); return; }
      if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') onPanelInput(e);
    });
    $('#btnUndo').addEventListener('click', () => travel(state.undo, state.redo));
    $('#btnRedo').addEventListener('click', () => travel(state.redo, state.undo));
    document.addEventListener('keydown', e => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
      if (typing || !(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); travel(state.undo, state.redo); }
      if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); travel(state.redo, state.undo); }
    });
    $('#panelBody').addEventListener('click', onPanelClick);
    $('#btnNew').addEventListener('click', newModal);
    $('#btnProjects').addEventListener('click', projectsModal);
    $('#btnTrends').addEventListener('click', trendsModal);
    $('#btnAI').addEventListener('click', aiModal);
    $('#btnPdf').addEventListener('click', exportPdf);
    $('#modalClose').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
    window.addEventListener('resize', fitPreview);

    /* Click a block in the preview to edit it */
    $('#stage').addEventListener('click', e => {
      if (e.target.closest('a')) e.preventDefault();
      const blk = e.target.closest('[data-id]');
      if (!blk || !blk.dataset.id) return;
      state.tab = 'content'; state.openBlocks.add(blk.dataset.id); state.lastBid = blk.dataset.id;
      renderPanel(); setMobile('edit');
      const card = document.querySelector(`[data-bid="${blk.dataset.id}"]`);
      if (card) { card.scrollIntoView({ block: 'center', behavior: 'smooth' }); const f = card.querySelector('input,textarea'); if (f) f.focus({ preventScroll: true }); }
    });

    /* Phone: switch between editor and preview */
    function setMobile(v) {
      document.body.dataset.mobile = v;
      $('#mEdit').classList.toggle('on', v === 'edit');
      $('#mPreview').classList.toggle('on', v === 'preview');
      if (v === 'preview') fitPreview();
    }
    $('#mEdit').addEventListener('click', () => setMobile('edit'));
    $('#mPreview').addEventListener('click', () => setMobile('preview'));
    setMobile('edit');

    refreshAll();
  }

  boot();
})();
