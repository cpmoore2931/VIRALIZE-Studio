/*
 * LIBRARY BLOCKS — lifestyle, home, money, art and paper pages.
 *
 * Adds to Folio.blocks:
 *   monthly   month calendar page (undated, or real dates with "2027-01")
 *   yearly    year-at-a-glance page (real dates when the year is a number)
 *   mealplan  7-day meal grid with a grocery column
 *   cards     a page of cut-out cards (mindfulness, mood, workout, notes…)
 *   recipe    recipe card with ingredients and method
 *   savings   savings challenge: shade a box each time you save
 *   wallart   full-bleed printable quote / poster
 *   paper     full-bleed pattern or texture paper
 *   letterhead stationery page
 *   labels    a sheet of printable labels
 *
 * Layout 'bare' (see render.js) = a full page with no margins and no footer.
 */
window.Folio = window.Folio || {};

(function () {
  const { esc, inline, paras, list } = Folio.util;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dow = start => (start === 'sun' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  /* 42 cells for a month: day numbers or '' (blank when no real date). */
  function monthCells(year, month, start) {
    const cells = Array(42).fill('');
    if (year == null) return cells;
    const first = new Date(year, month, 1).getDay(); // 0 = Sunday
    const offset = start === 'sun' ? first : (first + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) cells[offset + d - 1] = d;
    return cells;
  }

  const startField = { key: 'start', label: 'Week starts on', kind: 'select', options: { mon: 'Monday', sun: 'Sunday' } };

  Object.assign(Folio.blocks, {
    monthly: {
      label: 'Monthly calendar page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'month', label: 'Real dates: year-month like 2027-01 (leave empty for undated)', kind: 'text' },
        startField,
        { key: 'side', label: 'Sidebar boxes (one per line, empty = none)', kind: 'list' }
      ],
      defaults: { title: 'This month', month: '', start: 'mon', side: ['Goals', 'Important dates', 'Notes'] },
      summary: b => b.month || b.title,
      render(b) {
        const m = /^(\d{4})-(\d{1,2})$/.exec(String(b.month || '').trim());
        const year = m ? Number(m[1]) : null, month = m ? Number(m[2]) - 1 : 0;
        const title = m && (!b.title || b.title === 'This month') ? `${MONTHS[month]} ${year}` : b.title;
        const side = list(b.side);
        return `<div class="mo">
          <div class="weekly-head"><h2 class="page-title">${inline(title)}</h2>${m ? '' : '<div class="date-line">Month <span></span></div>'}</div>
          <div class="mo-wrap${side.length ? '' : ' mo-wrap--full'}">
            <div class="mo-cal"><div class="mo-dow">${dow(b.start).map(d => `<span>${d}</span>`).join('')}</div>
              <div class="mo-grid">${monthCells(year, month, b.start).map(d => `<div class="mo-cell${m && d === '' ? ' mo-cell--off' : ''}"><span>${d}</span></div>`).join('')}</div></div>
            ${side.length ? `<div class="weekly-side">${side.map(s => `<div class="side-box"><div class="side-title">${inline(s)}</div><div class="side-lines"></div></div>`).join('')}</div>` : ''}
          </div></div>`;
      }
    },

    yearly: {
      label: 'Year at a glance',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'year', label: 'Year (a number fills in real dates; leave empty for undated)', kind: 'text' },
        startField
      ],
      defaults: { title: 'Year at a glance', year: '2027', start: 'mon' },
      summary: b => b.year || b.title,
      render(b) {
        const y = /^\d{4}$/.test(String(b.year).trim()) ? Number(b.year) : null;
        return `<div class="yr">
          <div class="weekly-head"><h2 class="page-title">${inline(b.title)}</h2><div class="yr-year">${y || '<span class="date-line">Year <span></span></span>'}</div></div>
          <div class="yr-grid">${MONTHS.map((name, i) => `<div class="yr-month"><div class="yr-name">${name}</div>
            <div class="yr-dow">${dow(b.start).map(d => `<span>${d[0]}</span>`).join('')}</div>
            <div class="yr-days">${monthCells(y, i, b.start).map(d => `<span>${d}</span>`).join('')}</div></div>`).join('')}</div>
        </div>`;
      }
    },

    mealplan: {
      label: 'Meal plan page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'meals', label: 'Meals (columns, one per line)', kind: 'list' },
        { key: 'side', label: 'Side column title', kind: 'text' }
      ],
      defaults: { title: 'Meal plan', meals: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], side: 'Grocery list' },
      summary: b => b.title,
      render(b) {
        const meals = list(b.meals);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return `<div class="meal">
          <div class="weekly-head"><h2 class="page-title">${inline(b.title)}</h2><div class="date-line">Week of <span></span></div></div>
          <div class="meal-wrap">
            <table class="meal-grid"><thead><tr><th></th>${meals.map(m => `<th>${inline(m)}</th>`).join('')}</tr></thead>
            <tbody>${days.map(d => `<tr><th>${d}</th>${meals.map(() => '<td></td>').join('')}</tr>`).join('')}</tbody></table>
            ${b.side ? `<div class="side-box meal-side"><div class="side-title">${inline(b.side)}</div><div class="meal-checks">${'<span><i></i></span>'.repeat(18)}</div></div>` : ''}
          </div></div>`;
      }
    },

    cards: {
      label: 'Printable cards page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Small heading at the top (optional)', kind: 'text' },
        { key: 'items', label: 'Cards, one per line: Front title | text (8 fit on a page)', kind: 'list' },
        { key: 'style', label: 'Style', kind: 'select', options: { band: 'Color band', outline: 'Outline', filled: 'Soft fill' } }
      ],
      defaults: { title: '', items: ['Breathe | In for 4, hold for 4, out for 6.', 'Notice | Name 3 things you can hear right now.'], style: 'band' },
      summary: b => `${list(b.items).length} cards`,
      render(b) {
        return `<div class="cards">${b.title ? `<div class="cards-title">${inline(b.title)}</div>` : ''}
          <div class="cards-grid">${list(b.items).map((c, i) => { const [t, ...x] = c.split('|'); return `<div class="pcard pcard--${esc(b.style || 'band')}">
            <div class="pcard-n">${String(i + 1).padStart(2, '0')}</div><div class="pcard-t">${inline(t.trim())}</div>
            ${x.length ? `<div class="pcard-x">${inline(x.join('|').trim())}</div>` : ''}</div>`; }).join('')}</div>
          <div class="cards-cut">Cut along the dashed lines</div></div>`;
      }
    },

    recipe: {
      label: 'Recipe card',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Recipe name', kind: 'text' },
        { key: 'serves', label: 'Serves', kind: 'text' },
        { key: 'time', label: 'Time', kind: 'text' },
        { key: 'ingredients', label: 'Ingredients (one per line)', kind: 'list' },
        { key: 'steps', label: 'Method (one step per line)', kind: 'list' },
        { key: 'note', label: 'Tip (optional)', kind: 'text' }
      ],
      defaults: { title: 'Recipe', serves: '4', time: '30 min', ingredients: ['Ingredient'], steps: ['Step'], note: '' },
      summary: b => b.title,
      render(b) {
        return `<div class="recipe">
          <div class="recipe-head"><h3 class="h3">${inline(b.title)}</h3><div class="recipe-meta">${b.serves ? `<span>Serves ${esc(b.serves)}</span>` : ''}${b.time ? `<span>${esc(b.time)}</span>` : ''}</div></div>
          <div class="recipe-body"><div><div class="recipe-lbl">Ingredients</div><ul>${list(b.ingredients).map(i => `<li>${inline(i)}</li>`).join('')}</ul></div>
          <div><div class="recipe-lbl">Method</div><ol>${list(b.steps).map(s => `<li>${inline(s)}</li>`).join('')}</ol></div></div>
          ${b.note ? `<div class="recipe-note">${inline(b.note)}</div>` : ''}</div>`;
      }
    },

    savings: {
      label: 'Savings challenge',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Goal name', kind: 'text' },
        { key: 'goal', label: 'Goal amount', kind: 'number' },
        { key: 'boxes', label: 'Number of boxes (10–150)', kind: 'number' },
        { key: 'currency', label: 'Currency symbol', kind: 'text' }
      ],
      defaults: { title: 'Emergency fund', goal: 1000, boxes: 50, currency: '$' },
      summary: b => `${b.currency || '$'}${b.goal} · ${b.boxes} boxes`,
      render(b) {
        const goal = Math.max(1, Number(b.goal) || 1000), n = Math.max(10, Math.min(150, Math.round(Number(b.boxes) || 50)));
        const step = goal / n, cur = esc(b.currency || '$');
        const fmt = v => (v % 1 ? v.toFixed(2) : String(v));
        return `<div class="save">
          <div class="weekly-head"><h2 class="page-title">${inline(b.title)}</h2><div class="save-goal">Goal <strong>${cur}${goal.toLocaleString('en-US')}</strong></div></div>
          <p class="save-how">Shade one box every time you save ${cur}${fmt(Math.round(step * 100) / 100)}. Fill them all and you're there.</p>
          <div class="save-grid" style="--cols:${n > 100 ? 12 : n > 60 ? 10 : 8}">${Array.from({ length: n }, (_, i) => `<span>${cur}${fmt(Math.round(step * 100) / 100)}<small>${i + 1}</small></span>`).join('')}</div>
          <div class="save-marks">${[25, 50, 75, 100].map(p => `<div><strong>${p}%</strong><span>${cur}${Math.round(goal * p / 100).toLocaleString('en-US')}</span><i></i></div>`).join('')}</div>
        </div>`;
      }
    },

    wallart: {
      label: 'Wall art / poster',
      layout: 'bare',
      fields: [
        { key: 'text', label: 'Quote or words', kind: 'textarea' },
        { key: 'cite', label: 'Small line underneath (optional)', kind: 'text' },
        { key: 'style', label: 'Style', kind: 'select', options: { minimal: 'Minimal serif', bold: 'Bold color block', glow: 'Soft glow', arch: 'Arch', frame: 'Fine frame' } },
        { key: 'color', label: 'Color (hex, optional — uses the accent if empty)', kind: 'text' }
      ],
      defaults: { text: 'Bloom where you are planted', cite: '', style: 'minimal', color: '' },
      summary: b => String(b.text || '').slice(0, 40),
      render(b) {
        const c = /^#[0-9a-f]{3,8}$/i.test(String(b.color || '').trim()) ? b.color.trim() : 'var(--p-accent)';
        return `<div class="art art--${esc(b.style || 'minimal')}" style="--art:${c}">
          <div class="art-inner"><div class="art-text">${inline(b.text).replace(/\n/g, '<br>')}</div>${b.cite ? `<div class="art-cite">${esc(b.cite)}</div>` : ''}</div></div>`;
      }
    },

    paper: {
      label: 'Pattern / texture paper',
      layout: 'bare',
      fields: [
        { key: 'pattern', label: 'Pattern', kind: 'select', options: { gingham: 'Gingham', stripes: 'Stripes', dots: 'Polka dots', grid: 'Grid', checker: 'Checkerboard', diagonal: 'Diagonal stripes', linen: 'Linen texture', grain: 'Paper grain texture', watercolor: 'Watercolor wash' } },
        { key: 'color', label: 'Color (hex, optional — uses the accent if empty)', kind: 'text' },
        { key: 'base', label: 'Background (hex, optional)', kind: 'text' },
        { key: 'scale', label: 'Pattern size (0.5 – 3)', kind: 'number' }
      ],
      defaults: { pattern: 'gingham', color: '', base: '', scale: 1 },
      summary: b => `${b.pattern}${b.color ? ' · ' + b.color : ''}`,
      render(b) {
        const ok = v => /^#[0-9a-f]{3,8}$/i.test(String(v || '').trim());
        const c = ok(b.color) ? b.color.trim() : 'var(--p-accent)';
        const base = ok(b.base) ? b.base.trim() : 'var(--p-paper)';
        const k = Math.max(0.5, Math.min(3, Number(b.scale) || 1));
        return `<div class="paper paper--${esc(b.pattern || 'gingham')}" style="--pc:${c};--pb:${base};--ps:${k}"></div>`;
      }
    },

    letterhead: {
      label: 'Stationery / letterhead',
      layout: 'bare',
      fields: [
        { key: 'name', label: 'Name at the top', kind: 'text' },
        { key: 'line', label: 'Small line under the name', kind: 'text' },
        { key: 'footer', label: 'Footer (contact details)', kind: 'text' },
        { key: 'ruled', label: 'Ruled writing lines', kind: 'checkbox' }
      ],
      defaults: { name: 'Your Name', line: '', footer: '', ruled: true },
      summary: b => b.name,
      render(b) {
        return `<div class="lh"><div class="lh-head"><div class="lh-name">${inline(b.name)}</div>${b.line ? `<div class="lh-line">${inline(b.line)}</div>` : ''}</div>
          <div class="lh-body${b.ruled ? ' lh-body--ruled' : ''}"></div>
          ${b.footer ? `<div class="lh-foot">${inline(b.footer)}</div>` : ''}</div>`;
      }
    },

    labels: {
      label: 'Label sheet',
      layout: 'bare',
      fields: [
        { key: 'items', label: 'Labels (one per line)', kind: 'list' },
        { key: 'shape', label: 'Shape', kind: 'select', options: { round: 'Round', rect: 'Rectangle', pill: 'Pill', tag: 'Tag' } },
        { key: 'cols', label: 'Labels per row (2–5)', kind: 'number' }
      ],
      defaults: { items: ['Flour', 'Sugar', 'Rice', 'Pasta'], shape: 'round', cols: 4 },
      summary: b => `${list(b.items).length} labels · ${b.shape}`,
      render(b) {
        const cols = Math.max(2, Math.min(5, Math.round(Number(b.cols) || 4)));
        return `<div class="labels" style="--cols:${cols}">${list(b.items).map(t => `<div class="lbl lbl--${esc(b.shape || 'round')}"><span>${inline(t)}</span></div>`).join('')}</div>`;
      }
    }
  });
})();
