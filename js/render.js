/*
 * RENDER — turns a product object into printable pages (HTML string).
 *
 * Page order: cover → table of contents (optional) → blocks.
 * Page-splitting rules come from each block's `layout` in blocks.js.
 * A brand kit (js/brands.js), if the product has one, overrides colors, fonts,
 * logo and fills in {{tokens}}. All styling lives in css/product.css.
 */
window.Folio = window.Folio || {};

Folio.themeVars = function (p) {
  const t = Folio.themes[p.theme] || Folio.themes.editorial;
  const brand = Folio.brandOf ? Folio.brandOf(p) : null;
  const accent = p.accent || (brand && brand.primary) || t.accent;
  const size = Folio.paperSizes[p.paper] || Folio.paperSizes.letter;
  const hf = brand && Folio.brandFonts[brand.headingFont] && Folio.brandFonts[brand.headingFont].stack ? Folio.brandFonts[brand.headingFont] : null;
  const bf = brand && Folio.brandFonts[brand.bodyFont] && Folio.brandFonts[brand.bodyFont].stack ? Folio.brandFonts[brand.bodyFont] : null;
  let coverBg = p.cover === 'full' && p.accent ? accent : t.coverBg;
  let coverInk = t.coverInk;
  if (brand && brand.dark && (p.cover === 'full' || p.cover === 'frame')) { coverBg = brand.dark; coverInk = '#FFFFFF'; }
  return [
    `--p-display:${hf ? hf.stack : t.display}`, `--p-body:${bf ? bf.stack : t.body}`,
    `--p-display-weight:${hf ? hf.weight : 600}`,
    `--p-paper:${t.paper}`, `--p-ink:${t.ink}`, `--p-muted:${t.muted}`,
    `--p-rule:${t.rule}`, `--p-accent:${accent}`,
    `--p-accent-2:${(brand && brand.secondary) || accent}`,
    `--p-cover-bg:${coverBg}`, `--p-cover-ink:${coverInk}`,
    `--p-up:${t.up || '#1E9E6A'}`, `--p-down:${t.down || '#D9483B'}`,
    `--p-mono:${t.mono || "'IBM Plex Mono', ui-monospace, Menlo, monospace"}`,
    `--p-display-stretch:${hf ? (hf.stretch || '100%') : (t.displayStretch || '100%')}`,
    `--p-display-case:${hf ? 'none' : (t.displayCase || 'none')}`,
    `--p-glow-a:${brand ? `color-mix(in srgb, ${brand.primary} 26%, transparent)` : (t.glowA || 'color-mix(in srgb, ' + accent + ' 22%, transparent)')}`,
    `--p-glow-b:${brand ? `color-mix(in srgb, ${brand.secondary || brand.primary} 22%, transparent)` : (t.glowB || 'color-mix(in srgb, ' + accent + ' 12%, transparent)')}`,
    `--p-tint-1:${t.tint1 || `color-mix(in srgb, ${accent} 9%, ${t.paper})`}`,
    `--p-tint-2:${t.tint2 || `color-mix(in srgb, ${accent} 6%, ${t.paper})`}`,
    `--p-tint-3:${t.tint3 || `color-mix(in srgb, ${accent} 12%, ${t.paper})`}`,
    `--page-w:${size.w}`, `--page-h:${size.h}`
  ].join(';');
};

Folio.render = function (source) {
  const { esc, inline } = Folio.util;
  const brand = Folio.brandOf ? Folio.brandOf(source) : null;
  const p = Folio.applyTokens ? Folio.applyTokens(source) : source;
  const pages = [];
  let current = null;

  const open = (cls) => { current = { cls, html: '' }; pages.push(current); return current; };

  /* Cover */
  const showLogo = brand && brand.logo && brand.logoOnCover !== false;
  if (p.showCover !== false) pages.push({
    cls: `cover cover--${esc(p.cover || 'classic')}${showLogo ? ' has-logo' : ''}`,
    bare: true,
    html: `<div class="cover-inner">
      ${showLogo
        ? `<div class="cover-brand"><img class="cover-logo" src="${esc(brand.logo)}" alt="${esc(brand.name)}"><span class="cover-brand-text"><strong>${esc(brand.name)}</strong>${brand.tagline ? `<small>${esc(brand.tagline)}</small>` : ''}</span></div>`
        : ''}
      <div class="cover-top">${esc(p.kind || '')}</div>
      <div class="cover-mid">
        <h1 class="cover-title">${inline(p.title || 'Untitled')}</h1>
        ${p.subtitle ? `<p class="cover-sub">${inline(p.subtitle)}</p>` : ''}
      </div>
      <div class="cover-bottom">
        <span>${esc(p.author || (brand ? brand.name : ''))}</span>
        <span>${esc([brand ? (brand.website || brand.name) : p.brand, p.year].filter(Boolean).join(' · '))}</span>
      </div></div>`
  });

  /* Table of contents */
  const chapters = (p.blocks || []).filter(b => b.type === 'chapter');
  if (p.toc !== false && chapters.length >= 2) {
    pages.push({
      cls: 'toc',
      html: `<h2 class="page-title">Contents</h2><ol class="toc-list">${chapters.map((c, i) =>
        `<li><span class="toc-n">${String(i + 1).padStart(2, '0')}</span><span class="toc-t">${inline(c.title)}</span>${c.kicker ? `<span class="toc-k">${esc(c.kicker)}</span>` : ''}</li>`).join('')}</ol>`
    });
  }

  /* Blocks */
  const ctx = { chapter: 0, product: p };
  (p.blocks || []).forEach(b => {
    const def = Folio.blocks[b.type];
    if (!def) return;
    if (b.type === 'chapter') ctx.chapter++;
    const html = `<div class="blk blk-${b.type}" data-id="${esc(b.id || '')}">${def.render(b, ctx)}</div>`;
    if (def.layout === 'bare') { pages.push({ cls: `bare ${b.type}-page`, bare: true, html }); current = null; return; }
    if (def.layout === 'chapter') open('content');
    else if (def.layout === 'page') { open(`content full ${b.type}-page`); current.html += html; current = null; return; }
    else if (!current) open('content');
    current.html += html;
  });

  /* Assemble with running footers and optional watermark */
  const footLogo = brand && brand.logo && brand.logoInFooter !== false ? `<img class="folio-logo" src="${esc(brand.logo)}" alt="">` : '';
  const wm = (p.watermark || '').trim() ? `<div class="wm" aria-hidden="true"><span>${esc(p.watermark)}</span></div>` : '';
  let n = 0;
  return pages.filter(pg => pg.bare || pg.html.trim()).map(pg => {
    if (pg.bare) return `<section class="page ${pg.cls}">${pg.html}</section>`;
    n++;
    return `<section class="page ${pg.cls}">${wm}<div class="page-body">${pg.html}</div>
      <footer class="folio"><span class="folio-left">${footLogo}${esc(brand ? `${p.title} · ${brand.name}` : (p.title || ''))}</span><span>${n}</span></footer></section>`;
  }).join('');
};

/* Rough page count used by the listing and quality checks. */
Folio.pageCount = function (p) {
  const div = document.createElement('div');
  div.innerHTML = Folio.render(p);
  return div.querySelectorAll('.page').length;
};
