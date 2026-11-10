/*
 * ART — generated vector artwork for printables.
 *
 * Adds to Folio.blocks: floral, collage, coloring, icons
 * Everything is SVG drawn from a seed number, so it prints sharp at any size
 * and the same seed always gives the same picture. Change the "Design number"
 * field in the editor to get a new variation.
 *
 * Helpers on Folio.art: rng(seed), palettes, icons (24×24 line icons).
 */
window.Folio = window.Folio || {};

(function () {
  const { esc, inline, list } = Folio.util;
  const TAU = Math.PI * 2;
  const f = n => Math.round(n * 10) / 10;

  /* Seeded random numbers (mulberry32). */
  function rng(seed) {
    let a = (Number(seed) || 1) * 2654435761 >>> 0;
    const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    r.range = (lo, hi) => lo + r() * (hi - lo);
    r.int = (lo, hi) => Math.floor(r.range(lo, hi + 1));
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    return r;
  }

  const palettes = {
    blush: { name: 'Blush', bg: '#FBF3EF', ink: '#5A2E3A', c: ['#E8A7B8', '#F3C9C2', '#C77D8F', '#A8B89A', '#F1DCC6'] },
    sage: { name: 'Sage', bg: '#F4F2EA', ink: '#2F3B32', c: ['#A9B9A0', '#6F8A73', '#D9C9A8', '#E7B8A0', '#C8D3C0'] },
    terracotta: { name: 'Terracotta', bg: '#F5ECE1', ink: '#3B2A22', c: ['#C96F4A', '#E3A87E', '#8C4A33', '#D8B48C', '#6F7F5C'] },
    pastel: { name: 'Pastel', bg: '#FBFBFE', ink: '#2A2540', c: ['#C5DDFF', '#DDD0FF', '#FFD0E8', '#FFE3B8', '#C4F2D8'] },
    berry: { name: 'Berry', bg: '#FFF7F8', ink: '#3E1426', c: ['#B23A6B', '#E57A9E', '#7A2348', '#F2B5C8', '#5E6E9E'] },
    ocean: { name: 'Ocean', bg: '#F2F6F7', ink: '#14303A', c: ['#4F8FA8', '#9CC8D3', '#E9C9A3', '#1F5A6E', '#D7E6E8'] }
  };
  const paletteOptions = Object.fromEntries(Object.entries(palettes).map(([k, v]) => [k, v.name]));
  const pal = k => palettes[k] || palettes.blush;

  /* ---------- flowers ---------- */
  function leaf(x, y, ang, len, w, fill, stroke, sw) {
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="M0 0Q${f(len / 2)} ${f(-w)} ${f(len)} 0Q${f(len / 2)} ${f(w)} 0 0Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M${f(len * .08)} 0L${f(len * .8)} 0" stroke="${stroke}" stroke-width="${sw * .7}" fill="none" stroke-linecap="round"/></g>`;
  }
  function head(type, x, y, r, rot, col, center, stroke, sw) {
    const g = c => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${c}</g>`;
    const s = `stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
    if (type === 'daisy') {
      const n = 12; let p = '';
      for (let i = 0; i < n; i++) p += `<ellipse cx="0" cy="${f(-r * .55)}" rx="${f(r * .17)}" ry="${f(r * .45)}" transform="rotate(${f(i * 360 / n)})" fill="${col}" ${s}/>`;
      return g(p + `<circle r="${f(r * .26)}" fill="${center}" ${s}/>`);
    }
    if (type === 'cosmos') {
      const n = 8; let p = '';
      for (let i = 0; i < n; i++) p += `<path d="M0 0C${f(-r * .45)} ${f(-r * .3)} ${f(-r * .38)} ${f(-r * .95)} 0 ${f(-r * .9)}C${f(r * .38)} ${f(-r * .95)} ${f(r * .45)} ${f(-r * .3)} 0 0Z" transform="rotate(${f(i * 45)})" fill="${col}" ${s}/>`;
      return g(p + `<circle r="${f(r * .2)}" fill="${center}" ${s}/>`);
    }
    if (type === 'tulip') {
      return g(`<path d="M${f(-r * .7)} 0C${f(-r * .8)} ${f(-r * .9)} ${f(-r * .45)} ${f(-r * 1.2)} ${f(-r * .3)} ${f(-r * 1.25)}L0 ${f(-r * .75)}L${f(r * .3)} ${f(-r * 1.25)}C${f(r * .45)} ${f(-r * 1.2)} ${f(r * .8)} ${f(-r * .9)} ${f(r * .7)} 0C${f(r * .55)} ${f(r * .45)} ${f(-r * .55)} ${f(r * .45)} ${f(-r * .7)} 0Z" fill="${col}" ${s}/><path d="M0 ${f(-r * .75)}C${f(-r * .15)} ${f(-r * .3)} ${f(-r * .1)} ${f(r * .1)} 0 ${f(r * .3)}" fill="none" ${s}/>`);
    }
    if (type === 'rose') {
      let p = `<circle r="${f(r * .8)}" fill="${col}" ${s}/>`;
      for (let k = 0; k < 4; k++) { const rr = r * (.7 - k * .16); p += `<path d="M${f(-rr)} 0A${f(rr)} ${f(rr)} 0 0 1 ${f(rr * .6)} ${f(-rr * .8)}" fill="none" ${s} transform="rotate(${k * 95})"/>`; }
      return g(p);
    }
    if (type === 'bud') return g(`<path d="M0 ${f(r * .2)}C${f(-r * .5)} ${f(-r * .1)} ${f(-r * .3)} ${f(-r * .8)} 0 ${f(-r)}C${f(r * .3)} ${f(-r * .8)} ${f(r * .5)} ${f(-r * .1)} 0 ${f(r * .2)}Z" fill="${col}" ${s}/>`);
    /* berries */
    let p = '';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .5; p += `<line x1="0" y1="0" x2="${f(Math.cos(a) * r * .8)}" y2="${f(Math.sin(a) * r * .8)}" ${s} fill="none"/><circle cx="${f(Math.cos(a) * r * .85)}" cy="${f(Math.sin(a) * r * .85)}" r="${f(r * .16)}" fill="${col}" ${s}/>`; }
    return g(p);
  }

  /* A stem from (bx,by) to a flower head, with leaves. */
  function stem(R, bx, by, hx, hy, opt) {
    const { stroke, sw, leafFill, cols, center, types, size } = opt;
    const c1x = bx + (hx - bx) * .2 + R.range(-40, 40), c1y = by - (by - hy) * .45;
    const c2x = hx + R.range(-30, 30), c2y = hy + (by - hy) * .35;
    const pt = t => { const u = 1 - t; return [u * u * u * bx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * hx, u * u * u * by + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * hy]; };
    let out = `<path d="M${f(bx)} ${f(by)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(hx)} ${f(hy)}" fill="none" stroke="${stroke}" stroke-width="${sw * 1.1}" stroke-linecap="round"/>`;
    [.32, .5, .66].forEach((t, i) => {
      if (R() < .25) return;
      const [x, y] = pt(t), [x2, y2] = pt(t + .02);
      const ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI + (i % 2 ? 50 : -50) + R.range(-10, 10) + 180;
      out += leaf(x, y, ang, size * R.range(.75, 1.05), size * .22, leafFill, stroke, sw);
    });
    const [px, py] = pt(.97);
    const rot = Math.atan2(hy - py, hx - px) * 180 / Math.PI + 90;
    out += head(R.pick(types), hx, hy, size * R.range(.55, .8), rot, R.pick(cols), center, stroke, sw);
    return out;
  }

  function bouquet(seed, mode, p, opts = {}) {
    const R = rng(seed);
    const W = 800, H = 1000;
    const line = mode === 'line' || mode === 'outline';
    const stroke = mode === 'outline' ? '#1A1A1A' : (line ? (opts.color || p.ink) : p.ink);
    const o = {
      stroke, sw: mode === 'outline' ? 3 : (line ? 2.4 : 2),
      leafFill: line ? (mode === 'outline' ? '#fff' : 'none') : p.c[3] || p.c[0],
      cols: line ? [mode === 'outline' ? '#fff' : 'none'] : p.c.filter((_, i) => i !== 3),
      center: line ? (mode === 'outline' ? '#fff' : 'none') : p.ink,
      types: opts.types || ['daisy', 'cosmos', 'tulip', 'rose', 'bud', 'berry'],
      size: opts.size || 120
    };
    let out = '';
    if (opts.meadow) {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const bx = W * (i + .5) / n + R.range(-20, 20);
        const hx = Math.max(70, Math.min(W - 70, bx + R.range(-50, 50)));
        out += stem(R, bx, H + 20, hx, R.range(H * .4, H * .78), Object.assign({}, o, { size: R.range(55, 85) }));
      }
    } else if (opts.single) {
      out += stem(R, W / 2, H * .9, W / 2 + R.range(-40, 40), H * .25, Object.assign({}, o, { size: 170 }));
    } else {
      const n = R.int(5, 7);
      const heads = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * .2 + R.range(-.05, .05);
        const len = R.range(H * .45, H * .66);
        const pad = o.size * .9;
        heads.push([Math.max(pad, Math.min(W - pad, W / 2 + Math.cos(a) * len)), Math.max(pad, H * .9 + Math.sin(a) * len)]);
      }
      heads.sort((a, b) => a[1] - b[1]).forEach(([hx, hy]) => { out += stem(R, W / 2 + R.range(-12, 12), H * .9, hx, hy, o); });
      if (!line) out += `<path d="M${W / 2 - 60} ${H * .86}Q${W / 2} ${H * .83} ${W / 2 + 60} ${H * .86}L${W / 2 + 30} ${H * .93}L${W / 2 - 30} ${H * .93}Z" fill="${p.c[0]}" stroke="${p.ink}" stroke-width="2"/>`;
    }
    return { W, H, svg: out };
  }

  /* ---------- mandala + geometric coloring ---------- */
  function mandala(seed) {
    const R = rng(seed), C = 500;
    const pol = (r, a) => `${f(C + Math.cos(a) * r)} ${f(C + Math.sin(a) * r)}`;
    const s = 'fill="#fff" stroke="#1A1A1A" stroke-width="2.4" stroke-linejoin="round"';
    let out = '', r = 46;
    const kinds = ['petal', 'round', 'dots', 'tri', 'leaf', 'petal', 'round'];
    const rings = [];
    while (r < 455) { const w = Math.min(455 - r, R.range(48, 82)); rings.push([r, r + w]); r += w; }
    rings.reverse().forEach(([ri, ro], idx) => {
      const n = [8, 12, 16, 20, 24, 32][Math.min(5, Math.floor(ro / 85))];
      const kind = idx === 0 ? 'round' : R.pick(kinds);
      const a = Math.PI / n * .96;
      out += `<circle cx="${C}" cy="${C}" r="${f(ro)}" ${s}/>`;
      for (let i = 0; i < n; i++) {
        const t = i * TAU / n + (idx % 2 ? Math.PI / n : 0);
        if (kind === 'petal' || kind === 'leaf') {
          out += `<path d="M${pol(ri, t - a)}Q${pol(ro * .9, t - a * .55)} ${pol(ro, t)}Q${pol(ro * .9, t + a * .55)} ${pol(ri, t + a)}Z" ${s}/>`;
          out += kind === 'leaf' ? `<path d="M${pol(ri, t)}L${pol(ro * .92, t)}" ${s}/>` : `<path d="M${pol(ri, t - a * .5)}Q${pol(ri + (ro - ri) * .62, t - a * .3)} ${pol(ri + (ro - ri) * .72, t)}Q${pol(ri + (ro - ri) * .62, t + a * .3)} ${pol(ri, t + a * .5)}Z" ${s}/>`;
        } else if (kind === 'round') {
          out += `<path d="M${pol(ri, t - a)}C${pol(ro * 1.04, t - a)} ${pol(ro * 1.04, t + a)} ${pol(ri, t + a)}Z" ${s}/>`;
          out += `<circle cx="${pol((ri + ro) / 2, t).split(' ')[0]}" cy="${pol((ri + ro) / 2, t).split(' ')[1]}" r="${f((ro - ri) * .16)}" ${s}/>`;
        } else if (kind === 'dots') {
          const [x, y] = pol((ri + ro) / 2, t).split(' ');
          out += `<circle cx="${x}" cy="${y}" r="${f(Math.min((ro - ri) * .32, ri * Math.sin(Math.PI / n) * .9))}" ${s}/>`;
        } else {
          out += `<path d="M${pol(ri, t - a)}L${pol(ro, t)}L${pol(ri, t + a)}Z" ${s}/><path d="M${pol(ri, t - a * .45)}L${pol(ri + (ro - ri) * .55, t)}L${pol(ri, t + a * .45)}Z" ${s}/>`;
        }
      }
    });
    out += `<circle cx="${C}" cy="${C}" r="46" ${s}/>`;
    for (let i = 0; i < 8; i++) { const t = i * TAU / 8; out += `<path d="M${C} ${C}Q${pol(30, t - .5)} ${pol(44, t)}Q${pol(30, t + .5)} ${C} ${C}Z" ${s}/>`; }
    out += `<circle cx="${C}" cy="${C}" r="9" ${s}/>`;
    return { W: 1000, H: 1000, svg: out };
  }

  function truchet(seed) {
    const R = rng(seed), cols = 7, rows = 9, sz = 100, W = cols * sz, H = rows * sz;
    const s = 'fill="none" stroke="#1A1A1A" stroke-width="2.6"';
    let out = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff" stroke="#1A1A1A" stroke-width="4"/>`;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const X = x * sz, Y = y * sz, flip = R() < .5;
      const arc = (cx, cy, r, a0, a1) => { const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]; return `<path d="M${f(p0[0])} ${f(p0[1])}A${r} ${r} 0 0 1 ${f(p1[0])} ${f(p1[1])}" ${s}/>`; };
      [.25, .5, .75].forEach(k => {
        const r = sz * k;
        if (!flip) { out += arc(X, Y, r, 0, Math.PI / 2) + arc(X + sz, Y + sz, r, Math.PI, Math.PI * 1.5); }
        else { out += arc(X + sz, Y, r, Math.PI / 2, Math.PI) + arc(X, Y + sz, r, -Math.PI / 2, 0); }
      });
    }
    return { W, H, svg: out };
  }

  /* ---------- collage ---------- */
  function blob(R, cx, cy, r) {
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) { const a = i * TAU / n, rr = r * R.range(.75, 1.15); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!i) d += `M${f(p1[0])} ${f(p1[1])}`;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + 'Z';
  }
  function collage(seed, p, word) {
    const R = rng(seed), W = 800, H = 1000, cols = p.c.slice();
    let out = `<rect width="${W}" height="${H}" fill="${p.bg}"/>`;
    const slots = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) slots.push([W * (x + .5) / 3 + R.range(-70, 70), H * (y + .5) / 3.4 + R.range(-60, 60) + 40]);
    const shapes = ['arch', 'circle', 'blob', 'half', 'stripes', 'dots', 'sparkle', 'wave', 'leafy', 'blob', 'circle', 'arch'];
    slots.sort(() => R() - .5).slice(0, R.int(7, 9)).forEach(([x, y], i) => {
      const k = shapes[(i + R.int(0, 11)) % shapes.length], c = R.pick(cols), sz = R.range(130, 300);
      if (k === 'arch') out += `<path d="M${f(x - sz / 2)} ${f(y + sz * .7)}V${f(y)}A${f(sz / 2)} ${f(sz / 2)} 0 0 1 ${f(x + sz / 2)} ${f(y)}V${f(y + sz * .7)}Z" fill="${c}"/>`;
      else if (k === 'circle') out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(sz / 2.2)}" fill="${c}"/>`;
      else if (k === 'blob') out += `<path d="${blob(R, x, y, sz / 2)}" fill="${c}"/>`;
      else if (k === 'half') out += `<path d="M${f(x - sz / 2)} ${f(y)}A${f(sz / 2)} ${f(sz / 2)} 0 0 0 ${f(x + sz / 2)} ${f(y)}Z" fill="${c}" transform="rotate(${R.pick([0, 90, 180, 270])} ${f(x)} ${f(y)})"/>`;
      else if (k === 'stripes') { for (let j = 0; j < 6; j++) out += `<rect x="${f(x - sz / 2)}" y="${f(y - sz / 2 + j * sz / 6)}" width="${f(sz)}" height="${f(sz / 14)}" rx="${f(sz / 28)}" fill="${c}"/>`; }
      else if (k === 'dots') { for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) out += `<circle cx="${f(x - sz / 2.5 + a * sz / 5)}" cy="${f(y - sz / 2.5 + b * sz / 5)}" r="${f(sz / 26)}" fill="${p.ink}"/>`; }
      else if (k === 'sparkle') { const r = sz / 3; out += `<path d="M${f(x)} ${f(y - r)}C${f(x + r * .15)} ${f(y - r * .15)} ${f(x + r * .15)} ${f(y - r * .15)} ${f(x + r)} ${f(y)}C${f(x + r * .15)} ${f(y + r * .15)} ${f(x + r * .15)} ${f(y + r * .15)} ${f(x)} ${f(y + r)}C${f(x - r * .15)} ${f(y + r * .15)} ${f(x - r * .15)} ${f(y + r * .15)} ${f(x - r)} ${f(y)}C${f(x - r * .15)} ${f(y - r * .15)} ${f(x - r * .15)} ${f(y - r * .15)} ${f(x)} ${f(y - r)}Z" fill="${p.ink}"/>`; }
      else if (k === 'wave') { let d = `M${f(x - sz / 2)} ${f(y)}`; for (let j = 0; j < 4; j++) d += `q${f(sz / 8)} ${j % 2 ? 26 : -26} ${f(sz / 4)} 0`; out += `<path d="${d}" fill="none" stroke="${p.ink}" stroke-width="7" stroke-linecap="round"/>`; }
      else out += leaf(x - sz / 2, y, -35, sz, sz * .28, c, p.ink, 0);
    });
    out += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".5"/>`;
    if (word) out += `<text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="64" fill="${p.ink}">${esc(word)}</text>`;
    return { W, H, svg: out };
  }
  const GRAIN = `<defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/></filter></defs>`;

  /* ---------- icons (24×24, 1.8 stroke) ---------- */
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    heart: '<path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5C19 15.6 12 20 12 20z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.5 12h12L22 7H6"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h8"/>',
    coffee: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M8 2.5v3M12 2.5v3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19l9-9"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><rect x="5" y="12" width="14" height="9" rx="1"/><path d="M12 8v13M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.2 8.6 4.5 4.5 0 0 1 17.5 18z"/>',
    sparkle: '<path d="M12 3c.8 4.5 2.5 6.2 7 7-4.5.8-6.2 2.5-7 7-.8-4.5-2.5-6.2-7-7 4.5-.8 6.2-2.5 7-7zM19 16c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z"/>',
    plane: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    dumbbell: '<path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12"/>',
    plant: '<path d="M7 14h10l-1.5 7h-7z"/><path d="M12 14V9M12 10c-3 0-5-2-5-5 3 0 5 2 5 5zm0-1c0-3 2-5 5-5 0 3-2 5-5 5z"/>',
    food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7h3"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M15 9.3c-.5-1-1.6-1.6-3-1.6-1.8 0-3 .9-3 2.1 0 2.9 6 1.5 6 4.4 0 1.2-1.2 2.1-3 2.1-1.4 0-2.5-.6-3-1.6M12 5.5v13"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    cake: '<rect x="4" y="12" width="16" height="9" rx="1"/><path d="M4 15.5c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M12 12V9M12 4c1 1.2 1 2.2 0 3-1-.8-1-1.8 0-3z"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.8M12 17h.01"/>',
    paw: '<circle cx="7" cy="10" r="1.8"/><circle cx="11" cy="6.5" r="1.8"/><circle cx="16" cy="7" r="1.8"/><circle cx="18.5" cy="11.5" r="1.8"/><path d="M8 17c0-3 2-5 4.5-5S17 14 17 17c0 2-1.5 3-3 3-1 0-1.5-.5-2-.5s-1 .5-2 .5c-1.5 0-2-1-2-3z"/>',
    flower: '<circle cx="12" cy="9" r="2.5"/><path d="M12 6.5C11 3 13 3 12 6.5zM12 6.5c-1-3.5 1-3.5 0 0M9.6 8.2C6.5 7 7 5 9.6 8.2zM14.4 8.2c3.1-1.2 2.6-3.2 0 0M10.4 11.2c-2 2.8-.4 4 1.6 1.3M13.6 11.2c2 2.8.4 4-1.6 1.3"/><circle cx="12" cy="9" r="5"/><path d="M12 14v7M12 18c-2-2-4-2-5-1.5M12 18c2-2 4-2 5-1.5"/>'
  };
  const iconNames = Object.keys(I);
  const icon = (name, color, sw = 1.8) => I[name] ? `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>` : '';

  Folio.art = { rng, palettes, icons: I, icon };
  const svgWrap = (o, extra = '') => `<svg class="gen-svg" viewBox="0 0 ${o.W} ${o.H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${extra}${o.svg}</svg>`;
  const okHex = v => /^#[0-9a-f]{3,8}$/i.test(String(v || '').trim());
  const seedField = { key: 'seed', label: 'Design number (change it for a new variation)', kind: 'number' };

  Object.assign(Folio.blocks, {
    floral: {
      label: 'Floral art',
      layout: 'bare',
      fields: [
        { key: 'style', label: 'Style', kind: 'select', options: { bouquet: 'Colored bouquet', line: 'Botanical line art', single: 'Single stem', meadow: 'Wildflower meadow' } },
        { key: 'palette', label: 'Colors', kind: 'select', options: paletteOptions },
        seedField,
        { key: 'text', label: 'Words under the art (optional)', kind: 'text' },
        { key: 'color', label: 'Line color for line art (hex, optional)', kind: 'text' }
      ],
      defaults: { style: 'bouquet', palette: 'blush', seed: 7, text: '', color: '' },
      summary: b => `${b.style} · ${b.palette} · #${b.seed}`,
      render(b) {
        const p = pal(b.palette), style = b.style || 'bouquet';
        const mode = style === 'line' || style === 'single' ? 'line' : 'color';
        const o = bouquet(b.seed, mode, p, { meadow: style === 'meadow', single: style === 'single', color: okHex(b.color) ? b.color.trim() : p.ink });
        return `<div class="genart genart--floral" style="background:${p.bg};color:${p.ink}">
          <div class="genart-frame">${svgWrap(o)}</div>
          ${b.text ? `<div class="genart-text">${inline(b.text)}</div>` : ''}</div>`;
      }
    },

    collage: {
      label: 'Abstract collage art',
      layout: 'bare',
      fields: [
        { key: 'palette', label: 'Colors', kind: 'select', options: paletteOptions },
        seedField,
        { key: 'word', label: 'Word on the art (optional)', kind: 'text' }
      ],
      defaults: { palette: 'terracotta', seed: 3, word: '' },
      summary: b => `${b.palette} · #${b.seed}${b.word ? ' · ' + b.word : ''}`,
      render(b) {
        const p = pal(b.palette);
        return `<div class="genart genart--collage" style="background:${p.bg}">${svgWrap(collage(b.seed, p, b.word), GRAIN)}</div>`;
      }
    },

    coloring: {
      label: 'Coloring page',
      layout: 'bare',
      fields: [
        { key: 'design', label: 'Design', kind: 'select', options: { mandala: 'Mandala', geometric: 'Geometric pattern', flowers: 'Flower bouquet', meadow: 'Wildflower meadow' } },
        seedField,
        { key: 'caption', label: 'Small caption at the bottom (optional)', kind: 'text' }
      ],
      defaults: { design: 'mandala', seed: 1, caption: '' },
      summary: b => `${b.design} · #${b.seed}`,
      render(b) {
        const d = b.design || 'mandala';
        const o = d === 'mandala' ? mandala(b.seed) : d === 'geometric' ? truchet(b.seed)
          : bouquet(b.seed, 'outline', pal('blush'), { meadow: d === 'meadow', size: 150 });
        return `<div class="genart genart--coloring"><div class="genart-frame">${svgWrap(o)}</div>
          ${b.caption ? `<div class="genart-cap">${inline(b.caption)}</div>` : ''}</div>`;
      }
    },

    icons: {
      label: 'Icon set',
      layout: 'bare',
      fields: [
        { key: 'title', label: 'Title at the top (optional)', kind: 'text' },
        { key: 'items', label: `Icons, one per line: icon | label. Icons: ${iconNames.join(', ')}`, kind: 'list' },
        { key: 'style', label: 'Style', kind: 'select', options: { circle: 'Highlight covers (circles)', tile: 'Rounded tiles', sticker: 'Sticker outline', plain: 'Plain icons' } },
        { key: 'color', label: 'Icon color (hex, optional)', kind: 'text' },
        { key: 'fill', label: 'Background color (hex, optional)', kind: 'text' },
        { key: 'cols', label: 'Icons per row (3–6)', kind: 'number' }
      ],
      defaults: { title: '', items: ['home | Home', 'heart | Love', 'star | Favorites'], style: 'circle', color: '', fill: '', cols: 4 },
      summary: b => `${list(b.items).length} icons · ${b.style}`,
      render(b) {
        const color = okHex(b.color) ? b.color.trim() : 'var(--p-accent)';
        const fill = okHex(b.fill) ? b.fill.trim() : 'var(--p-tint-1)';
        const cols = Math.max(3, Math.min(6, Math.round(Number(b.cols) || 4)));
        const items = list(b.items).map(l => { const [n, ...lab] = l.split('|'); return { n: n.trim().toLowerCase(), lab: lab.join('|').trim() }; }).filter(x => I[x.n]);
        return `<div class="iconset iconset--${esc(b.style || 'circle')}" style="--ic:${color};--if:${fill};--cols:${cols}">
          ${b.title ? `<div class="iconset-title">${inline(b.title)}</div>` : ''}
          <div class="iconset-grid">${items.map(x => `<div class="ic"><div class="ic-badge">${icon(x.n, color, b.style === 'plain' ? 1.6 : 1.7)}</div>${x.lab ? `<div class="ic-label">${esc(x.lab)}</div>` : ''}</div>`).join('')}</div>
        </div>`;
      }
    }
  });
})();
