/*
 * RENDER — turns a product object into printable pages (HTML string).
 *
 * Page order: cover → table of contents (optional) → blocks.
 * Page-splitting rules come from each block's `layout` in blocks.js.
 * All styling lives in css/product.css and uses the theme variables set here.
 */
window.Folio = window.Folio || {};

Folio.themeVars = function (p) {
  const t = Folio.themes[p.theme] || Folio.themes.editorial;
  const accent = p.accent || t.accent;
  const size = Folio.paperSizes[p.paper] || Folio.paperSizes.letter;
  return [
    `--p-display:${t.display}`, `--p-body:${t.body}`,
    `--p-paper:${t.paper}`, `--p-ink:${t.ink}`, `--p-muted:${t.muted}`,
    `--p-rule:${t.rule}`, `--p-accent:${accent}`,
    `--p-cover-bg:${p.cover === 'full' && p.accent ? accent : t.coverBg}`,
    `--p-cover-ink:${t.coverInk}`,
    `--p-up:${t.up || '#1E9E6A'}`, `--p-down:${t.down || '#D9483B'}`,
    `--p-mono:${t.mono || "'IBM Plex Mono', ui-monospace, Menlo, monospace"}`,
    `--p-display-stretch:${t.displayStretch || '100%'}`, `--p-display-case:${t.displayCase || 'none'}`,
    `--p-glow-a:${t.glowA || 'color-mix(in srgb, ' + accent + ' 22%, transparent)'}`,
    `--p-glow-b:${t.glowB || 'color-mix(in srgb, ' + accent + ' 12%, transparent)'}`,
    `--page-w:${size.w}`, `--page-h:${size.h}`
  ].join(';');
};

Folio.render = function (p) {
  const { esc, inline } = Folio.util;
  const pages = [];
  let current = null;

  const open = (cls) => { current = { cls, html: '' }; pages.push(current); return current; };

  /* Cover */
  pages.push({
    cls: `cover cover--${esc(p.cover || 'classic')}`,
    bare: true,
    html: `<div class="cover-inner">
      <div class="cover-top">${esc(p.kind || '')}</div>
      <div class="cover-mid">
        <h1 class="cover-title">${inline(p.title || 'Untitled')}</h1>
        ${p.subtitle ? `<p class="cover-sub">${inline(p.subtitle)}</p>` : ''}
      </div>
      <div class="cover-bottom">
        <span>${esc(p.author || '')}</span>
        <span>${esc([p.brand, p.year].filter(Boolean).join(' · '))}</span>
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
    if (def.layout === 'chapter') open('content');
    else if (def.layout === 'page') { open(`content full ${b.type}-page`); current.html += def.render(b, ctx); current = null; return; }
    else if (!current) open('content');
    current.html += `<div class="blk blk-${b.type}" data-id="${esc(b.id || '')}">${def.render(b, ctx)}</div>`;
  });

  /* Assemble with running footers */
  let n = 0;
  return pages.filter(pg => pg.bare || pg.html.trim()).map(pg => {
    if (pg.bare) return `<section class="page ${pg.cls}">${pg.html}</section>`;
    n++;
    return `<section class="page ${pg.cls}"><div class="page-body">${pg.html}</div>
      <footer class="folio"><span>${esc(p.title || '')}</span><span>${n}</span></footer></section>`;
  }).join('');
};

/* Rough page count used by the listing and quality checks. */
Folio.pageCount = function (p) {
  const div = document.createElement('div');
  div.innerHTML = Folio.render(p);
  return div.querySelectorAll('.page').length;
};
