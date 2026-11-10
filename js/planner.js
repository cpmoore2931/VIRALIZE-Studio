/*
 * PLANNER BLOCKS — ADHD-friendly planning pages.
 *
 * Adds to Folio.blocks: adhdday (a one-page daily spread)
 * Design rules for these pages: one priority instead of a long list, big
 * writing space, color-coded boxes, check-ins you can shade instead of write,
 * and a "done list" so unplanned wins count.
 * Colors use theme variables --p-tint-1/2/3 (set in themes.js, defaults derive from the accent).
 */
window.Folio = window.Folio || {};

(function () {
  const { esc, inline, list } = Folio.util;
  const hourLabel = h => { const n = ((h % 24) + 24) % 24; return `${n % 12 || 12} ${n < 12 ? 'am' : 'pm'}`; };

  Folio.blocks.adhdday = {
    label: 'ADHD daily page',
    layout: 'page',
    fields: [
      { key: 'title', label: 'Page title', kind: 'text' },
      { key: 'oneThing', label: 'Name of the main-priority box', kind: 'text' },
      { key: 'basics', label: 'Daily basics to tick (one per line)', kind: 'list' },
      { key: 'water', label: 'Water glasses to tick (0 = hide)', kind: 'number' },
      { key: 'startHour', label: 'Time blocks start (hour, 0–23)', kind: 'number' },
      { key: 'endHour', label: 'Time blocks end (hour, 1–24)', kind: 'number' }
    ],
    defaults: { title: 'Today', oneThing: 'The one thing', basics: ['Meds', 'Real meal', 'Move 10 min', 'Outside'], water: 8, startHour: 8, endHour: 20 },
    summary: b => b.title,
    render(b) {
      const start = Math.max(0, Math.min(23, Math.round(Number(b.startHour) || 8)));
      const end = Math.max(start + 1, Math.min(24, Math.round(Number(b.endHour) || 20)));
      const hours = [];
      for (let h = start; h < end; h++) hours.push(h);
      const water = Math.max(0, Math.min(12, Math.round(Number(b.water) || 0)));
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      const lines = n => Array.from({ length: n }, () => '<span class="ad-line"></span>').join('');
      return `<div class="adhd">
        <div class="ad-head">
          <h2 class="page-title">${inline(b.title)}</h2>
          <div class="ad-date"><span class="ad-lbl">Date</span><span class="ad-dateline"></span></div>
          <div class="ad-days" aria-label="Circle the day">${days.map(d => `<span>${d}</span>`).join('')}</div>
        </div>

        <div class="ad-checkin">
          <div class="ad-meter"><span class="ad-lbl">Energy</span><span class="ad-battery">${'<i></i>'.repeat(5)}</span></div>
          <div class="ad-meter"><span class="ad-lbl">Mood</span><span class="ad-scale">${[1, 2, 3, 4, 5].map(n => `<i>${n}</i>`).join('')}</span></div>
          <div class="ad-meter"><span class="ad-lbl">Slept</span><span class="ad-short"></span><span class="ad-unit">hrs</span></div>
        </div>

        <div class="ad-grid">
          <div class="ad-col">
            <section class="ad-box ad-one">
              <div class="ad-t">${inline(b.oneThing || 'The one thing')}</div>
              <div class="ad-s">If this is the only thing I do, today still counts.</div>
              <span class="ad-line ad-line--big"></span>
              <div class="ad-first"><span class="ad-lbl">Tiny first step</span><span class="ad-line"></span></div>
            </section>
            <section class="ad-box">
              <div class="ad-t">Then, if I have energy</div>
              ${[1, 2, 3].map(() => '<div class="ad-todo"><span class="ad-cb"></span><span class="ad-line"></span></div>').join('')}
            </section>
            <section class="ad-box ad-time">
              <div class="ad-t">Time blocks <span class="ad-s ad-inline">guess, then add half again</span></div>
              <div class="ad-hours">${hours.map(h => `<div class="ad-hour"><span>${hourLabel(h)}</span><i></i></div>`).join('')}</div>
            </section>
          </div>

          <div class="ad-col">
            <section class="ad-box ad-tint-2">
              <div class="ad-t">Daily basics</div>
              <div class="ad-basics">${list(b.basics).map(x => `<span class="ad-chip"><span class="ad-cb"></span>${inline(x)}</span>`).join('')}</div>
              ${water ? `<div class="ad-water"><span class="ad-lbl">Water</span>${'<i></i>'.repeat(water)}</div>` : ''}
            </section>
            <section class="ad-box ad-dump">
              <div class="ad-t">Brain dump</div>
              <div class="ad-s">Get it out of your head. Sort it later, or never.</div>
              <div class="ad-dots"></div>
            </section>
            <section class="ad-box ad-tint-3">
              <div class="ad-t">Done list</div>
              <div class="ad-s">Everything counts, planned or not.</div>
              ${lines(4)}
            </section>
            <section class="ad-box">
              <div class="ad-t">Note to tomorrow me</div>
              ${lines(2)}
            </section>
          </div>
        </div>
      </div>`;
    }
  };
})();
