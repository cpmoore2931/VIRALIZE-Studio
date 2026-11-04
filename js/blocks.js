/*
 * BLOCKS — the building pieces of every product.
 *
 * Each block type is one entry in Folio.blocks:
 *   label    : name shown in the editor
 *   layout   : 'flow'    → sits on the current page
 *              'chapter' → starts a new page, content continues after it
 *              'page'    → takes a whole page by itself
 *   fields   : the editor form. kind = text | textarea | list | number | select
 *              ('list' is edited one item per line and stored as an array)
 *   defaults : starting values for a new block
 *   summary  : short text shown on the collapsed editor card
 *   render   : (block, ctx) => HTML string. ctx has chapter numbers, etc.
 *
 * To add a new block type, add one entry here and (if needed) its CSS in
 * css/product.css. Nothing else has to change: the editor, the AI prompt
 * and the quality checker all read from this registry.
 */
window.Folio = window.Folio || {};

Folio.util = {
  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  /* Inline formatting: **bold** and *italic*. */
  inline(s) {
    return Folio.util.esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  },
  /* Blank line = new paragraph. */
  paras(s, cls) {
    return String(s || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      .map(p => `<p${cls ? ` class="${cls}"` : ''}>${Folio.util.inline(p).replace(/\n/g, '<br>')}</p>`).join('');
  },
  list(v) {
    if (Array.isArray(v)) return v.filter(x => String(x).trim());
    return String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
  },
  uid() {
    return Math.random().toString(36).slice(2, 10);
  }
};

(function () {
  const { esc, inline, paras, list } = Folio.util;

  Folio.blocks = {
    chapter: {
      label: 'Chapter',
      layout: 'chapter',
      fields: [
        { key: 'title', label: 'Chapter title', kind: 'text' },
        { key: 'kicker', label: 'Small label (optional)', kind: 'text' },
        { key: 'intro', label: 'Opening paragraph (optional)', kind: 'textarea' }
      ],
      defaults: { title: 'New chapter', kicker: '', intro: '' },
      summary: b => b.title,
      render(b, ctx) {
        return `<header class="chap">
          <div class="chap-kicker">Chapter ${ctx.chapter}${b.kicker ? ` <span>·</span> ${esc(b.kicker)}` : ''}</div>
          <h1>${inline(b.title)}</h1>
          <div class="chap-rule"></div>
          ${b.intro ? paras(b.intro, 'lead') : ''}
        </header>`;
      }
    },

    heading: {
      label: 'Heading',
      layout: 'flow',
      fields: [{ key: 'text', label: 'Heading', kind: 'text' }],
      defaults: { text: 'Section heading' },
      summary: b => b.text,
      render: b => `<h2 class="h2">${inline(b.text)}</h2>`
    },

    paragraph: {
      label: 'Text',
      layout: 'flow',
      fields: [{ key: 'text', label: 'Text (blank line = new paragraph, **bold**, *italic*)', kind: 'textarea' }],
      defaults: { text: 'Write something useful here.' },
      summary: b => String(b.text || '').slice(0, 60),
      render: b => `<div class="prose">${paras(b.text)}</div>`
    },

    bullets: {
      label: 'Bullet list',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title (optional)', kind: 'text' },
        { key: 'items', label: 'Items (one per line)', kind: 'list' }
      ],
      defaults: { title: '', items: ['First point', 'Second point', 'Third point'] },
      summary: b => `${list(b.items).length} items`,
      render: b => `<div class="bullets">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}
        <ul>${list(b.items).map(i => `<li>${inline(i)}</li>`).join('')}</ul></div>`
    },

    checklist: {
      label: 'Checklist',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title', kind: 'text' },
        { key: 'items', label: 'Items (one per line)', kind: 'list' }
      ],
      defaults: { title: 'Checklist', items: ['First task', 'Second task', 'Third task'] },
      summary: b => `${b.title || 'Checklist'} · ${list(b.items).length}`,
      render: b => `<div class="checklist">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}
        <ul>${list(b.items).map(i => `<li><span class="box" aria-hidden="true"></span><span>${inline(i)}</span></li>`).join('')}</ul></div>`
    },

    callout: {
      label: 'Callout / tip',
      layout: 'flow',
      fields: [
        { key: 'label', label: 'Label', kind: 'text' },
        { key: 'text', label: 'Text', kind: 'textarea' }
      ],
      defaults: { label: 'Pro tip', text: 'A short, specific piece of advice.' },
      summary: b => b.label,
      render: b => `<aside class="callout"><div class="callout-label">${esc(b.label)}</div>${paras(b.text)}</aside>`
    },

    quote: {
      label: 'Quote',
      layout: 'flow',
      fields: [
        { key: 'text', label: 'Quote', kind: 'textarea' },
        { key: 'cite', label: 'Who said it', kind: 'text' }
      ],
      defaults: { text: 'A line worth remembering.', cite: '' },
      summary: b => String(b.text || '').slice(0, 50),
      render: b => `<figure class="pull"><blockquote>${inline(b.text)}</blockquote>${b.cite ? `<figcaption>${esc(b.cite)}</figcaption>` : ''}</figure>`
    },

    prompts: {
      label: 'Worksheet prompts',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title', kind: 'text' },
        { key: 'items', label: 'Questions (one per line)', kind: 'list' },
        { key: 'lines', label: 'Writing lines per question', kind: 'number' }
      ],
      defaults: { title: 'Reflect', items: ['What do you want to change?', 'Why does it matter now?'], lines: 4 },
      summary: b => `${b.title || 'Prompts'} · ${list(b.items).length} questions`,
      render(b) {
        const n = Math.max(1, Math.min(20, Number(b.lines) || 4));
        return `<div class="prompts">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}
          ${list(b.items).map((q, i) => `<div class="prompt">
            <p class="prompt-q"><span class="prompt-n">${i + 1}</span>${inline(q)}</p>
            <div class="lines" style="--lines:${n}"></div></div>`).join('')}</div>`;
      }
    },

    table: {
      label: 'Table',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title (optional)', kind: 'text' },
        { key: 'headers', label: 'Column headers (separate with | )', kind: 'text' },
        { key: 'rows', label: 'Rows (one per line, cells separated with | )', kind: 'list' }
      ],
      defaults: { title: '', headers: 'Item | Detail | Notes', rows: ['One | Two | Three'] },
      summary: b => `${list(b.rows).length} rows`,
      render(b) {
        const head = String(b.headers || '').split('|').map(s => s.trim());
        const rows = list(b.rows).map(r => r.split('|').map(s => s.trim()));
        return `<div class="tbl">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}<table>
          <thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${head.map((_, i) => `<td>${inline(r[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`;
      }
    },

    weekly: {
      label: 'Weekly planner page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'side', label: 'Sidebar sections (one per line)', kind: 'list' }
      ],
      defaults: { title: 'This week', side: ['Top 3 priorities', 'Habits', 'Notes'] },
      summary: b => b.title,
      render(b) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return `<div class="weekly">
          <div class="weekly-head"><h2 class="page-title">${inline(b.title)}</h2><div class="date-line">Week of <span></span></div></div>
          <div class="weekly-grid">
            <div class="weekly-days">${days.map(d => `<div class="day"><div class="day-name">${d}</div><div class="day-lines"></div></div>`).join('')}</div>
            <div class="weekly-side">${list(b.side).map(s => `<div class="side-box"><div class="side-title">${inline(s)}</div><div class="side-lines"></div></div>`).join('')}</div>
          </div></div>`;
      }
    },

    habit: {
      label: 'Habit tracker page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'habits', label: 'Habits (one per line)', kind: 'list' }
      ],
      defaults: { title: 'Monthly habit tracker', habits: ['Move 30 minutes', 'Read 20 pages', 'In bed by 10:30'] },
      summary: b => `${list(b.habits).length} habits`,
      render(b) {
        const habits = list(b.habits);
        while (habits.length < 10) habits.push('');
        const days = Array.from({ length: 31 }, (_, i) => i + 1);
        return `<div class="habit">
          <div class="weekly-head"><h2 class="page-title">${inline(b.title)}</h2><div class="date-line">Month <span></span></div></div>
          <table class="habit-grid"><thead><tr><th class="habit-name">Habit</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead>
          <tbody>${habits.map(h => `<tr><td class="habit-name">${inline(h)}</td>${days.map(() => '<td></td>').join('')}</tr>`).join('')}</tbody></table>
        </div>`;
      }
    },

    notes: {
      label: 'Notes page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'style', label: 'Paper', kind: 'select', options: { lined: 'Lined', dotted: 'Dot grid', grid: 'Square grid' } }
      ],
      defaults: { title: 'Notes', style: 'lined' },
      summary: b => `${b.title} · ${b.style}`,
      render: b => `<div class="notes"><h2 class="page-title">${inline(b.title)}</h2><div class="notes-area notes--${esc(b.style || 'lined')}"></div></div>`
    },

    pagebreak: {
      label: 'Page break',
      layout: 'chapter',
      fields: [],
      defaults: {},
      summary: () => 'Starts a new page',
      render: () => ''
    }
  };
})();
