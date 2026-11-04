/*
 * TRADING — candlestick charts and day-trading blocks.
 *
 * Adds to Folio.blocks:  candles, patterns, risk, journal
 * Adds Folio.chart.candles(data, options) → SVG string (vector, so PDFs stay sharp).
 * Adds Folio.patterns: the built-in candlestick pattern library.
 *
 * Candle data format: one candle per line, "open high low close"
 * (spaces or commas), e.g.  "101.2 103.5 100.8 103.1".
 * Candle colors come from theme variables --p-up and --p-down.
 */
window.Folio = window.Folio || {};

(function () {
  const { esc, inline, paras, list } = Folio.util;

  /* ---------- chart drawing ---------- */
  function fmt(v, step) {
    const d = step < 0.1 ? 3 : step < 1 ? 2 : step < 10 ? 1 : 0;
    return Number(v).toFixed(d);
  }
  function niceStep(range, ticks) {
    const raw = range / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  Folio.chart = {
    /* Parse "o h l c" lines into [[o,h,l,c], ...]; bad lines are skipped. */
    parse(lines) {
      return list(lines).map(l => l.split(/[\s,;|]+/).map(Number))
        .filter(c => c.length >= 4 && c.slice(0, 4).every(Number.isFinite))
        .map(([o, h, l, c]) => [o, Math.max(h, o, c, l), Math.min(l, o, c, h), c]);
    },

    /* Realistic sample data from a seeded random walk. */
    generate(kind, n = 40, seed = 7) {
      let s = seed;
      const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      const drift = { uptrend: 0.35, downtrend: -0.35, range: 0, breakout: 0 }[kind] || 0;
      let price = 100;
      const out = [];
      for (let i = 0; i < n; i++) {
        let d = drift;
        if (kind === 'range') d = (100 - price) * 0.25;
        if (kind === 'breakout') d = i < n * 0.7 ? (100 - price) * 0.3 : 0.9;
        const o = price;
        const c = o + d + (rnd() - 0.5) * 2.2;
        const h = Math.max(o, c) + rnd() * 1.1;
        const l = Math.min(o, c) - rnd() * 1.1;
        out.push([o, h, l, c].map(v => Math.round(v * 100) / 100));
        price = c;
      }
      return out;
    },

    /*
     * options: { w, h, levels: [{price, label}], ma: period, highlight: [index...],
     *            axis: true, uid }
     */
    candles(data, opt = {}) {
      if (!data.length) return '<p class="chart-empty">Add candle data: one line per candle, "open high low close".</p>';
      const w = opt.w || 640, h = opt.h || 260;
      const axis = opt.axis !== false;
      const padL = 6, padR = axis ? 52 : 6, padT = 12, padB = 12;
      const levels = opt.levels || [];
      let lo = Math.min(...data.map(c => c[2]), ...levels.map(l => l.price));
      let hi = Math.max(...data.map(c => c[1]), ...levels.map(l => l.price));
      const m = (hi - lo) * 0.08 || 1; lo -= m; hi += m;
      const pw = w - padL - padR, ph = h - padT - padB;
      const y = v => padT + (hi - v) / (hi - lo) * ph;
      const step = pw / data.length;
      const bw = Math.max(1.5, Math.min(step * 0.62, 26));
      const x = i => padL + step * i + step / 2;
      const parts = [];

      /* grid + price axis */
      if (axis) {
        const st = niceStep(hi - lo, 4);
        for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) {
          parts.push(`<line x1="${padL}" x2="${w - padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="c-grid"/>`);
          parts.push(`<text x="${w - padR + 8}" y="${(y(v) + 3.5).toFixed(1)}" class="c-axis">${fmt(v, st)}</text>`);
        }
      }
      /* highlight band */
      const hl = (opt.highlight || []).filter(i => i >= 0 && i < data.length);
      if (hl.length) {
        const a = Math.min(...hl), b = Math.max(...hl);
        parts.push(`<rect x="${(padL + step * a).toFixed(1)}" y="${padT - 6}" width="${(step * (b - a + 1)).toFixed(1)}" height="${ph + 12}" rx="4" class="c-hl"/>`);
      }
      /* support / resistance levels */
      levels.forEach(l => {
        const yy = y(l.price).toFixed(1);
        parts.push(`<line x1="${padL}" x2="${w - padR}" y1="${yy}" y2="${yy}" class="c-level"/>`);
        if (l.label) parts.push(`<text x="${padL + 4}" y="${(y(l.price) - 5).toFixed(1)}" class="c-level-t">${esc(l.label)}</text>`);
        if (axis) parts.push(`<rect x="${w - padR + 2}" y="${(y(l.price) - 8).toFixed(1)}" width="${padR - 4}" height="16" rx="3" class="c-tag"/><text x="${w - padR + 8}" y="${(y(l.price) + 3.5).toFixed(1)}" class="c-tag-t">${fmt(l.price, 0.5)}</text>`);
      });
      /* candles */
      data.forEach(([o, hh, ll, c], i) => {
        const cls = c >= o ? 'c-up' : 'c-down';
        const top = y(Math.max(o, c)), bot = y(Math.min(o, c));
        parts.push(`<g class="${cls}"><line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${y(hh).toFixed(1)}" y2="${y(ll).toFixed(1)}" class="c-wick"/>` +
          `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, bot - top).toFixed(1)}" class="c-body"/></g>`);
      });
      /* moving average */
      const n = Number(opt.ma) || 0;
      if (n > 1 && data.length > n) {
        const pts = [];
        for (let i = n - 1; i < data.length; i++) {
          const avg = data.slice(i - n + 1, i + 1).reduce((s, c) => s + c[3], 0) / n;
          pts.push(`${x(i).toFixed(1)},${y(avg).toFixed(1)}`);
        }
        parts.push(`<polyline points="${pts.join(' ')}" class="c-ma"/>`);
      }
      return `<svg class="candle-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Candlestick chart">${parts.join('')}</svg>`;
    }
  };

  /* ---------- pattern library ---------- */
  const down = [[56, 56.6, 53.4, 54], [54, 54.5, 51.2, 51.8], [51.8, 52.4, 49, 49.6]];
  const up = [[44, 46.6, 43.4, 46], [46, 48.8, 45.5, 48.2], [48.2, 51, 47.6, 50.4]];
  Folio.patterns = {
    hammer: { name: 'Hammer', signal: 'Bullish reversal', tone: 'up',
      data: [...down, [49.4, 50.3, 45.2, 50.1], [50.2, 52.6, 49.9, 52.3]], hl: [3],
      text: 'Small body at the top, lower wick at least twice the body. Sellers pushed price down and buyers took it all back. Wait for the next candle to close higher.' },
    shootingstar: { name: 'Shooting star', signal: 'Bearish reversal', tone: 'down',
      data: [...up, [50.6, 54.8, 50.3, 50.4], [50.3, 50.6, 48, 48.4]], hl: [3],
      text: 'Small body at the bottom with a long upper wick after a run up. Buyers tried to extend and failed. Strongest at resistance.' },
    doji: { name: 'Doji', signal: 'Indecision', tone: 'neutral',
      data: [...up, [50.4, 52.2, 48.6, 50.45], [50.3, 50.9, 48.4, 48.9]], hl: [3],
      text: 'Open and close are almost equal. Neither side won the period. Treat it as a pause and let the next candle decide direction.' },
    bullishengulfing: { name: 'Bullish engulfing', signal: 'Bullish reversal', tone: 'up',
      data: [...down, [49.4, 49.8, 47.6, 48], [47.7, 51.4, 47.4, 51.1], [51.1, 52.8, 50.6, 52.4]], hl: [3, 4],
      text: 'A green body completely covers the prior red body. Buyers overwhelmed the sellers in one period. More reliable with high volume at support.' },
    bearishengulfing: { name: 'Bearish engulfing', signal: 'Bearish reversal', tone: 'down',
      data: [...up, [50.6, 52.2, 50.2, 51.8], [52.1, 52.4, 48.6, 48.9], [48.9, 49.3, 46.8, 47.2]], hl: [3, 4],
      text: 'A red body completely covers the prior green body. Sellers took control. Most meaningful after an extended move up.' },
    morningstar: { name: 'Morning star', signal: 'Bullish reversal', tone: 'up',
      data: [...down, [49.6, 49.9, 45.8, 46.2], [45.8, 46.6, 44.8, 46], [46.4, 50.2, 46.1, 49.8]], hl: [3, 4, 5],
      text: 'Big red candle, a small indecisive candle, then a big green candle closing past the middle of the first. A three-step shift from selling to buying.' },
    eveningstar: { name: 'Evening star', signal: 'Bearish reversal', tone: 'down',
      data: [...up, [50.4, 54.2, 50.1, 53.8], [54.2, 55.2, 53.6, 54], [53.6, 53.9, 49.8, 50.2]], hl: [3, 4, 5],
      text: 'Big green candle, a small pause, then a big red candle closing into the first body. The mirror of the morning star.' },
    threesoldiers: { name: 'Three white soldiers', signal: 'Bullish continuation', tone: 'up',
      data: [[48, 48.6, 46.4, 46.8], [46.8, 47.2, 45.6, 46], [46.2, 48.8, 46, 48.5], [48.3, 51, 48.1, 50.7], [50.5, 53.3, 50.3, 53]], hl: [2, 3, 4],
      text: 'Three strong green candles in a row, each opening inside the last body and closing near its high. Steady, committed buying.' },
    bullflag: { name: 'Bull flag', signal: 'Bullish continuation', tone: 'up',
      data: [[40, 41, 39.6, 40.8], [40.8, 44, 40.6, 43.7], [43.7, 47.2, 43.5, 46.9], [46.9, 47.4, 45.6, 45.9], [45.9, 46.3, 44.9, 45.2], [45.2, 45.8, 44.3, 44.6], [44.6, 48.6, 44.4, 48.3], [48.3, 50.8, 48, 50.4]], hl: [3, 4, 5],
      text: 'A sharp move up (the pole), then a tight, orderly pullback on lighter volume (the flag). Entry on the break above the flag high, stop below the flag low.' },
    doublebottom: { name: 'Double bottom', signal: 'Bullish reversal', tone: 'up',
      data: [[52, 52.4, 49.6, 50], [50, 50.4, 46.4, 46.8], [46.8, 49.4, 46.5, 49], [49, 50.2, 48.6, 49.8], [49.8, 50, 46.8, 47.1], [47.1, 49.6, 46.6, 49.3], [49.3, 52.2, 49, 51.9]], hl: [1, 4],
      text: 'Price tests the same low twice and holds. The second test fails to break lower, showing sellers are exhausted. Confirmed on the break above the middle peak.' }
  };

  const patternOptions = Object.fromEntries(Object.entries(Folio.patterns).map(([k, p]) => [k, p.name]));

  /* ---------- blocks ---------- */
  Object.assign(Folio.blocks, {
    candles: {
      label: 'Candlestick chart',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Chart title', kind: 'text' },
        { key: 'source', label: 'Data', kind: 'select', options: { sample_uptrend: 'Sample: uptrend', sample_downtrend: 'Sample: downtrend', sample_range: 'Sample: range', sample_breakout: 'Sample: breakout', custom: 'My own data (below)' } },
        { key: 'data', label: 'Candles, one per line: open high low close', kind: 'list' },
        { key: 'levels', label: 'Price levels (one per line: price | label)', kind: 'list' },
        { key: 'ma', label: 'Moving average period (0 = off)', kind: 'number' },
        { key: 'caption', label: 'Caption (optional)', kind: 'textarea' }
      ],
      defaults: { title: 'Price action', source: 'sample_breakout', data: [], levels: ['101.9 | Breakout level'], ma: 9, caption: '' },
      summary: b => b.title || 'Chart',
      render(b) {
        const data = b.source && b.source !== 'custom'
          ? Folio.chart.generate(b.source.replace('sample_', ''), 42, 7)
          : Folio.chart.parse(b.data);
        const levels = list(b.levels).map(l => { const [p, ...t] = l.split('|'); return { price: Number(p), label: t.join('|').trim() }; })
          .filter(l => Number.isFinite(l.price));
        return `<figure class="chart">
          ${b.title ? `<figcaption class="chart-title"><span>${inline(b.title)}</span>${Number(b.ma) > 1 ? `<span class="chart-key"><i></i>${Number(b.ma)}-period MA</span>` : ''}</figcaption>` : ''}
          ${Folio.chart.candles(data, { levels, ma: b.ma })}
          ${b.caption ? `<div class="chart-cap">${paras(b.caption)}</div>` : ''}
        </figure>`;
      }
    },

    patterns: {
      label: 'Candle pattern cards',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title (optional)', kind: 'text' },
        { key: 'items', label: `Patterns, one per line. Available: ${Object.keys(Folio.patterns).join(', ')}`, kind: 'list' }
      ],
      defaults: { title: 'Patterns to know', items: ['hammer', 'bullishengulfing', 'shootingstar', 'doji'] },
      summary: b => `${list(b.items).length} patterns`,
      render(b) {
        const cards = list(b.items).map(k => Folio.patterns[k.toLowerCase().replace(/[^a-z]/g, '')]).filter(Boolean);
        return `<div class="patterns">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}
          <div class="pattern-grid">${cards.map(p => `<div class="pattern">
            <div class="pattern-chart">${Folio.chart.candles(p.data, { w: 260, h: 130, axis: false, highlight: p.hl })}</div>
            <div class="pattern-head"><strong>${esc(p.name)}</strong><span class="sig sig--${p.tone}">${esc(p.signal)}</span></div>
            <p>${esc(p.text)}</p></div>`).join('')}</div></div>`;
      }
    },

    risk: {
      label: 'Position size calculator',
      layout: 'flow',
      fields: [
        { key: 'title', label: 'Title', kind: 'text' },
        { key: 'account', label: 'Account size ($)', kind: 'number' },
        { key: 'riskPct', label: 'Risk per trade (%)', kind: 'number' },
        { key: 'entry', label: 'Example entry price ($)', kind: 'number' },
        { key: 'stops', label: 'Stop distances in $ (one per line)', kind: 'list' }
      ],
      defaults: { title: 'Position sizing', account: 25000, riskPct: 1, entry: 50, stops: ['0.25', '0.50', '1.00', '2.00'] },
      summary: b => `$${b.account} at ${b.riskPct}%`,
      render(b) {
        const acct = Number(b.account) || 0, pct = Number(b.riskPct) || 0, entry = Number(b.entry) || 0;
        const riskD = acct * pct / 100;
        const money = v => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
        const rows = list(b.stops).map(Number).filter(s => s > 0).map(s => {
          const sh = Math.floor(riskD / s);
          const pos = sh * entry;
          return `<tr><td>$${s.toFixed(2)}</td><td>${sh.toLocaleString('en-US')}</td><td>${money(pos)}</td><td>${acct ? (pos / acct * 100).toFixed(0) : 0}%</td><td>${money(sh * s * 2)}</td></tr>`;
        }).join('');
        return `<div class="risk">${b.title ? `<h3 class="h3">${inline(b.title)}</h3>` : ''}
          <div class="risk-stats">
            <div><span>Account</span><strong>${money(acct)}</strong></div>
            <div><span>Risk per trade</span><strong>${pct}%</strong></div>
            <div class="hot"><span>Max loss per trade</span><strong>${money(riskD)}</strong></div>
          </div>
          <div class="tbl"><table><thead><tr><th>Stop distance</th><th>Shares</th><th>Position at $${entry}</th><th>% of account</th><th>Profit at 2R</th></tr></thead><tbody>${rows}</tbody></table></div>
          <p class="formula">Shares = (Account × Risk %) ÷ Stop distance</p></div>`;
      }
    },

    journal: {
      label: 'Trade journal page',
      layout: 'page',
      fields: [
        { key: 'title', label: 'Page title', kind: 'text' },
        { key: 'columns', label: 'Columns (one per line)', kind: 'list' },
        { key: 'rows', label: 'Number of rows', kind: 'number' }
      ],
      defaults: { title: 'Trade journal', columns: ['Date', 'Ticker', 'Setup', 'L/S', 'Entry', 'Stop', 'Exit', 'Size', 'P/L', 'R', 'Grade'], rows: 18 },
      summary: b => `${b.title} · ${b.rows} rows`,
      render(b) {
        const cols = list(b.columns);
        const n = Math.max(1, Math.min(40, Number(b.rows) || 18));
        return `<div class="journal">
          <div class="weekly-head"><h2 class="page-title">${inline(b.title)}</h2><div class="date-line">Week of <span></span></div></div>
          <table class="journal-grid"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${Array.from({ length: n }, () => `<tr>${cols.map(() => '<td></td>').join('')}</tr>`).join('')}</tbody></table>
          <div class="journal-foot"><div><span>Win rate</span></div><div><span>Avg R</span></div><div><span>Net P/L</span></div><div><span>Best lesson</span></div></div>
        </div>`;
      }
    }
  });

  /* Trading products need a risk disclaimer to be sellable responsibly. */
  if (Folio.qualityChecks) {
    Folio.qualityChecks.push({
      label: 'Trading risk disclaimer included', weight: 10,
      test: p => !(p.blocks || []).some(b => ['candles', 'patterns', 'risk', 'journal'].includes(b.type)) ||
        /not financial advice|educational purposes|risk of loss/i.test(JSON.stringify(p.blocks)),
      tip: 'Add a callout saying the content is educational, not financial advice, and that trading carries risk of loss.'
    });
  }
})();
