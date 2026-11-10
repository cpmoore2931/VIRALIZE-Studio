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
      else if (state.tab === 'sell') { const o = $('#listingOut'); if (o) o.textContent = listingText(P()); }
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
      <section class="group">
        <div class="group-head"><h3 class="group-title">Listing copy</h3>
          <button type="button" class="btn small" id="copyListing">Copy</button></div>
        <pre class="listing" id="listingOut">${esc(listingText(p))}</pre>
        <p class="hint">Paste into Gumroad, Etsy, Payhip, Stan or your own site. Updates as you edit.</p>
      </section>`;
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
    if (e.target.id === 'copyListing') { copy(listingText(p), 'Listing copied'); return; }

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
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
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
    addProject(prod);
    closeModal();
    toast(rename ? `Started "${rename}" from the ${t.product.kind} starter. Tailor the pages to fit.` : 'New product created');
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
  const titleCase = s => String(s).replace(/\b[a-z]/g, c => c.toUpperCase());
  function makeButtons(kw) {
    const t = closestStarter(kw);
    return `<button type="button" class="btn small primary" data-make="${t ? esc(t.key) : 'blank'}" data-rename="${esc(titleCase(kw))}">${t ? `Make with ${esc(t.product.kind)}` : 'Start blank'}</button>`;
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
          <p class="hint">Type any idea. Viralize checks Google demand and Etsy competition live through Treg (about 2¢ per search).</p></div>
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
    el.addEventListener('click', ev => {
      const r = ev.target.closest('[data-research]'); if (r) { run(r.dataset.research); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      const rc = ev.target.closest('[data-recent]'); if (rc) { run(rc.dataset.recent); return; }
      const rf = ev.target.closest('[data-refresh]'); if (rf) { run(rf.dataset.refresh, true); return; }
    });
    shell(); bind();
    setTimeout(() => { const i = $('#researchQ', el); if (i) i.focus(); }, 60);
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
      body.addEventListener('click', e => {
        const f = e.target.closest('[data-tf]');
        if (f) { filter = f.dataset.tf; draw(body); return; }
        const m = e.target.closest('[data-make]');
        if (m) startTemplate(m.dataset.make, m.dataset.rename);
      });
      $('#trendSort', body).addEventListener('change', e => { sort = e.target.value; draw(body); });
    });
  }

  function newModal() {
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
      <div class="tpl-tools">
        <input type="search" id="tplSearch" placeholder="Search ${Folio.templates.length} starters, e.g. planner, budget, wall art" aria-label="Search starters">
        <div class="chips">${cats.map(c => `<button type="button" class="chip${c === 'Trending' ? ' chip--hot' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      </div>
      <div id="tplGroups"></div>`, body => {
      draw(body);
      $('#tplSearch', body).addEventListener('input', e => { q = e.target.value; draw(body); });
      body.addEventListener('click', e => {
        const c = e.target.closest('[data-cat]');
        if (c) { cat = c.dataset.cat; draw(body); return; }
        const b = e.target.closest('[data-tpl]');
        if (b) startTemplate(b.dataset.tpl);
      });
      setTimeout(() => { const i = $('#tplSearch'); if (i) i.focus(); }, 50);
    });
  }

  function projectsModal() {
    const rows = Object.values(state.store.projects).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    openModal('Your products', `
      <ul class="proj-list">${rows.map(r => `<li data-pid="${r.id}" class="${r.id === state.store.current ? 'current' : ''}">
        <span class="proj-meta"><strong>${esc(Folio.applyTokens(r).title || 'Untitled')}</strong>
        <small>${esc(r.kind || '')} · ${esc(Folio.themes[r.theme].name)} · edited ${new Date(r.updated || Date.now()).toLocaleDateString()}</small></span>
        <span class="proj-actions">
          <button type="button" class="btn small" data-pact="open">Open</button>
          <button type="button" class="btn ghost small" data-pact="dup">Duplicate</button>
          <button type="button" class="btn ghost small danger" data-pact="del"${rows.length < 2 ? ' disabled' : ''}>Delete</button>
        </span></li>`).join('')}</ul>
      <div class="modal-foot">
        <button type="button" class="btn" id="dlJson">Download .json backup</button>
        <label class="btn ghost file-btn">Import .json file<input type="file" id="importFile" accept=".json,application/json"></label>
      </div>
      <p class="hint">Products are saved automatically in this browser. Download a backup to move them to another device.</p>`, body => {
      body.addEventListener('click', e => {
        const btn = e.target.closest('[data-pact]');
        if (btn) {
          const id = btn.closest('li').dataset.pid;
          const act = btn.dataset.pact;
          if (act === 'open') { state.store.current = id; state.openBlocks.clear(); resetHistory(); save(); refreshAll(); closeModal(); }
          if (act === 'dup') { const c = JSON.parse(JSON.stringify(state.store.projects[id])); c.title += ' (copy)'; addProject(c); closeModal(); toast('Duplicated'); }
          if (act === 'del') {
            if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = 'Confirm delete'; return; }
            delete state.store.projects[id];
            if (state.store.current === id) state.store.current = Object.keys(state.store.projects)[0];
            save(); refreshAll(); projectsModal(); toast('Deleted');
          }
        }
        if (e.target.id === 'dlJson') download(`${slug(P().title)}.json`, JSON.stringify(P(), null, 2));
      });
      $('#importFile', body).addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => { if (applyJson(r.result, true)) closeModal(); };
        r.readAsText(f);
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
