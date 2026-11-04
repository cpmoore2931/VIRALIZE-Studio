/*
 * TRAINING & SALES BLOCKS — for software / CRM training guides and SOPs.
 *
 * Adds to Folio.blocks: steps, screenshot, faq, video, cta
 * QR codes use the qrcode-generator library (loaded in index.html). If it is
 * missing, blocks still render, just without the QR code.
 */
window.Folio = window.Folio || {};

(function () {
  const { esc, inline, paras, list } = Folio.util;

  Folio.qr = function (text, cls) {
    if (!text || typeof window.qrcode !== 'function') return '';
    try {
      const q = window.qrcode(0, 'M');
      q.addData(/^https?:\/\//i.test(text) ? text : `https://${text}`);
      q.make();
      return `<span class="qr ${cls || ''}">${q.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</span>`;
    } catch (e) { return ''; }
  };
  const href = u => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

  Object.assign(Folio.blocks, {
    steps: {
      label: 'How-to steps',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Task (e.g. "Add a new contact")', kind: 'text' },
        { key: 'path', label: 'Where to click (separate with > ), e.g. Contacts > Add Contact', kind: 'text' },
        { key: 'items', label: 'Steps (one per line)', kind: 'list' },
        { key: 'result', label: 'How they know it worked (optional)', kind: 'text' }
      ],
      defaults: { title: 'Do the thing', path: 'Settings > Section', items: ['Click the button', 'Fill in the form', 'Click Save'], result: '' },
      summary: b => b.title,
      render(b) {
        const crumbs = String(b.path || '').split(/\s*[>›»]\s*/).filter(Boolean);
        return `<div class="steps">
          <div class="steps-head"><span class="steps-tag">How to</span><h3 class="h3">${inline(b.title)}</h3></div>
          ${crumbs.length ? `<div class="crumbs">${crumbs.map(c => `<span class="crumb">${inline(c)}</span>`).join('<span class="crumb-sep" aria-hidden="true">›</span>')}</div>` : ''}
          <ol class="step-list">${list(b.items).map(s => `<li><span>${inline(s)}</span></li>`).join('')}</ol>
          ${b.result ? `<div class="step-result"><span class="step-check" aria-hidden="true">✓</span>${inline(b.result)}</div>` : ''}
        </div>`;
      }
    },

    screenshot: {
      label: 'Screenshot with callouts',
      layout: 'flow',
      fields: [
        { key: 'image', label: 'Screenshot', kind: 'image', max: 1600 },
        { key: 'caption', label: 'Caption', kind: 'text' },
        { key: 'markers', label: 'Numbered callouts, one per line: across% down% | label (e.g. 12 40 | Contacts menu)', kind: 'list' }
      ],
      defaults: { image: '', caption: '', markers: ['10 30 | Left menu', '60 12 | Search bar'] },
      summary: b => b.caption || (b.image ? 'Screenshot' : 'No image yet'),
      render(b) {
        const marks = list(b.markers).map(m => {
          const [pos, ...label] = m.split('|');
          const [x, y] = pos.trim().split(/[\s,]+/).map(Number);
          return { x, y, label: label.join('|').trim() };
        }).filter(m => Number.isFinite(m.x) && Number.isFinite(m.y));
        return `<figure class="shot">
          <div class="shot-frame"><div class="shot-bar" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="shot-img">${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.caption || 'Screenshot')}">` : '<div class="shot-empty">Upload a screenshot in the editor</div>'}
            ${marks.map((m, i) => `<span class="pin" style="left:${Math.min(98, Math.max(2, m.x))}%;top:${Math.min(96, Math.max(4, m.y))}%">${i + 1}</span>`).join('')}</div>
          </div>
          ${marks.some(m => m.label) ? `<ol class="pin-key">${marks.map((m, i) => `<li><span class="pin pin--key">${i + 1}</span>${inline(m.label)}</li>`).join('')}</ol>` : ''}
          ${b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : ''}
        </figure>`;
      }
    },

    faq: {
      label: 'FAQ',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title', kind: 'text' },
        { key: 'items', label: 'One per line: Question | Answer', kind: 'list' }
      ],
      defaults: { title: 'Frequently asked questions', items: ['How long does it take? | About 20 minutes.'] },
      summary: b => `${list(b.items).length} questions`,
      render(b) {
        return `<div class="faq">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}
          <dl>${list(b.items).map(l => { const [q, ...a] = l.split('|'); return `<div class="faq-item"><dt>${inline(q.trim())}</dt><dd>${inline(a.join('|').trim())}</dd></div>`; }).join('')}</dl></div>`;
      }
    },

    video: {
      label: 'Video / link with QR code',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title', kind: 'text' },
        { key: 'url', label: 'Link (Loom, YouTube, help article…)', kind: 'text' },
        { key: 'note', label: 'Description', kind: 'textarea' },
        { key: 'length', label: 'Length (optional, e.g. 4 min)', kind: 'text' }
      ],
      defaults: { title: 'Watch the walkthrough', url: '', note: 'Scan the code with your phone camera or click the link.', length: '' },
      summary: b => b.title,
      render(b) {
        return `<div class="video-card">
          ${b.url ? Folio.qr(b.url) : '<span class="qr qr--empty">Add a link</span>'}
          <div class="video-body"><div class="video-tag">▶ Video${b.length ? ` · ${esc(b.length)}` : ''}</div>
            <h3 class="h3">${inline(b.title)}</h3>${paras(b.note)}
            ${b.url ? `<a class="video-url" href="${esc(href(b.url))}">${esc(b.url)}</a>` : ''}</div>
        </div>`;
      }
    },

    cta: {
      label: 'Call to action',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Headline', kind: 'text' },
        { key: 'text', label: 'Text', kind: 'textarea' },
        { key: 'button', label: 'Button text', kind: 'text' },
        { key: 'url', label: 'Link', kind: 'text' }
      ],
      defaults: { title: 'Want this done for you?', text: 'Book a free 15-minute call.', button: 'Book a call', url: '' },
      summary: b => b.title,
      render(b) {
        return `<aside class="cta">
          <div class="cta-body"><h3 class="h3">${inline(b.title)}</h3>${paras(b.text)}
            ${b.button ? `<a class="cta-btn" href="${esc(b.url ? href(b.url) : '#')}">${esc(b.button)} →</a>` : ''}
            ${b.url ? `<div class="cta-url">${esc(b.url)}</div>` : ''}</div>
          ${b.url ? Folio.qr(b.url, 'qr--cta') : ''}
        </aside>`;
      }
    }
  });
})();
