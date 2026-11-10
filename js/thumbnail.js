/*
 * THUMBNAIL — YouTube thumbnails (1280×720) in the Viralize look, made in the browser.
 *
 *   Folio.thumb.mount(el, { product, images, settings, onChange, toast })
 *
 * - Your photo: the background is removed on this device with Google's MediaPipe person
 *   segmenter (free, loaded from a CDN the first time; the photo never leaves the browser).
 *   A PNG that already has a transparent background is used as it is.
 * - The cut-out is saved in this browser (localStorage "folio.me") so you upload it once.
 * - Text is drawn with the Archivo font, so it is spelled exactly as typed.
 * - Settings are saved on the product (product.yt) by the app through onChange.
 */
window.Folio = window.Folio || {};
(function () {
  const W = 1280, H = 720;
  const ME_KEY = 'folio.me';
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
  const BGS = {
    viralize: { label: 'Viralize glow', ink: '#111114', base: '#FBFBFE', glows: ['#BFD7FF', '#D9C8FF', '#FFC7E3', '#FFE2BD'] },
    light: { label: 'Clean white', ink: '#111114', base: '#FFFFFF', glows: ['#EEF2FF', '#F6EEFF'] },
    dark: { label: 'Midnight', ink: '#FFFFFF', base: '#14122B', glows: ['#4B3FA8', '#A23C86', '#2D5BB8'] },
    sunset: { label: 'Sunset pop', ink: '#111114', base: '#FFF4EA', glows: ['#FFB37A', '#FF8FB7', '#FFD86B'] }
  };
  const GRAD = ['#4F86F7', '#8E6CF0', '#E2549C'];
  let segmenter = null;

  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; });
  const store = {
    get() { try { return localStorage.getItem(ME_KEY) || ''; } catch (e) { return ''; } },
    set(v) { try { if (v) localStorage.setItem(ME_KEY, v); else localStorage.removeItem(ME_KEY); return true; } catch (e) { return false; } }
  };

  async function getSegmenter(status) {
    if (segmenter) return segmenter;
    status('Loading the background remover (first time only, about 10 MB)…');
    const m = await import(`${MP}/vision_bundle.mjs`);
    const files = await m.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    segmenter = await m.ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' }, outputConfidenceMasks: true, outputCategoryMask: false, runningMode: 'IMAGE' });
    return segmenter;
  }

  function hasAlpha(img) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 64, 64);
    const d = x.getImageData(0, 0, 64, 64).data;
    let clear = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 200) clear++;
    return clear > 64 * 64 * 0.08;
  }

  /* Photo → transparent cut-out of the person, cropped to the person, max 1100 px tall. */
  async function cutOut(file, status) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url);
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const w = Math.round(img.width * k), h = Math.round(img.height * k);
      const src = document.createElement('canvas'); src.width = w; src.height = h;
      src.getContext('2d').drawImage(img, 0, 0, w, h);
      let out = src;
      if (!hasAlpha(src)) {
        const seg = await getSegmenter(status);
        status('Removing the background…');
        const res = seg.segment(src);
        const bg = res.confidenceMasks[0];
        const mw = bg.width, mh = bg.height, conf = bg.getAsFloat32Array();
        const mask = document.createElement('canvas'); mask.width = mw; mask.height = mh;
        const mx = mask.getContext('2d'); const md = mx.createImageData(mw, mh);
        for (let i = 0; i < conf.length; i++) {
          const a = Math.max(0, Math.min(1, (1 - conf[i] - 0.15) / 0.7)); /* sharpen the edge a little */
          md.data[i * 4 + 3] = Math.round(a * 255);
        }
        mx.putImageData(md, 0, 0);
        res.confidenceMasks.forEach(m => m.close && m.close());
        out = document.createElement('canvas'); out.width = w; out.height = h;
        const ox = out.getContext('2d');
        ox.imageSmoothingQuality = 'high';
        ox.drawImage(mask, 0, 0, w, h);
        ox.globalCompositeOperation = 'source-in';
        ox.drawImage(src, 0, 0);
      }
      /* crop to the visible person */
      const ctx = out.getContext('2d');
      const d = ctx.getImageData(0, 0, out.width, out.height).data;
      let x0 = out.width, y0 = out.height, x1 = 0, y1 = 0;
      for (let y = 0; y < out.height; y += 2) for (let x = 0; x < out.width; x += 2) {
        if (d[(y * out.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 <= x0 || y1 <= y0) throw new Error('No person found in that photo. Try one where you are clearly visible.');
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
      const s = Math.min(1, 1100 / ch);
      const fin = document.createElement('canvas'); fin.width = Math.round(cw * s); fin.height = Math.round(ch * s);
      fin.getContext('2d').drawImage(out, x0, y0, cw, ch, 0, 0, fin.width, fin.height);
      return fin.toDataURL('image/webp', 0.9).startsWith('data:image/webp') ? fin.toDataURL('image/webp', 0.9) : fin.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }

  /* ---------- drawing ---------- */
  function background(x, key) {
    const b = BGS[key] || BGS.viralize;
    x.fillStyle = b.base; x.fillRect(0, 0, W, H);
    const spots = [[0.12, 0.15, 0.55], [0.85, 0.1, 0.5], [0.75, 0.95, 0.6], [0.2, 0.9, 0.45]];
    b.glows.forEach((c, i) => {
      const [px, py, r] = spots[i % spots.length];
      const g = x.createRadialGradient(px * W, py * H, 0, px * W, py * H, r * W);
      g.addColorStop(0, c + 'ee'); g.addColorStop(1, c + '00');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
    /* fine grain so it doesn't look flat */
    x.globalAlpha = key === 'dark' ? 0.05 : 0.035;
    for (let i = 0; i < 2600; i++) { x.fillStyle = i % 2 ? '#000' : '#fff'; x.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    x.globalAlpha = 1;
  }

  /* Person with a thick white sticker outline and a soft shadow. */
  function person(x, img, o) {
    const h = H * (0.62 + 0.38 * o.size);
    const w = img.width * (h / img.height);
    const left = o.side === 'left';
    const px = left ? 30 : W - w - 30, py = H - h + 6;
    const t = document.createElement('canvas'); t.width = Math.ceil(w) + 40; t.height = Math.ceil(h) + 40;
    const tx = t.getContext('2d');
    tx.save();
    if (o.flip) { tx.translate(t.width, 0); tx.scale(-1, 1); }
    /* outline: the silhouette stamped in a ring, then filled white */
    const ring = 12;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) tx.drawImage(img, 20 + Math.cos(a) * ring, 20 + Math.sin(a) * ring, w, h);
    tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#fff'; tx.fillRect(0, 0, t.width, t.height);
    tx.globalCompositeOperation = 'source-over'; tx.drawImage(img, 20, 20, w, h);
    tx.restore();
    x.save(); x.shadowColor = 'rgba(40,20,90,.35)'; x.shadowBlur = 40; x.shadowOffsetY = 14;
    x.drawImage(t, px - 20, py - 20); x.restore();
    return { x: px, w, left };
  }

  function fitFont(x, lines, maxW, maxSize) {
    let size = maxSize;
    while (size > 40) {
      x.font = `900 ${size}px Archivo, 'Arial Black', sans-serif`;
      if (lines.every(l => x.measureText(l).width <= maxW)) break;
      size -= 4;
    }
    return size;
  }

  function headline(x, o, area, bg) {
    const l1 = String(o.line1 || '').toUpperCase().trim(), l2 = String(o.line2 || '').toUpperCase().trim();
    const lines = [l1, l2].filter(Boolean);
    if (!lines.length) return area.y;
    const size = fitFont(x, lines, area.w, o.product === 'none' ? 150 : 118);
    x.textBaseline = 'top'; x.lineJoin = 'round';
    let y = area.y;
    lines.forEach((l, i) => {
      const tw = x.measureText(l).width;
      const lx = area.align === 'right' ? area.x + area.w - tw : area.x;
      const accent = i === lines.length - 1 && lines.length > 1;
      x.lineWidth = size * 0.16; x.strokeStyle = bg === 'dark' ? '#14122B' : '#FFFFFF';
      x.save(); x.shadowColor = 'rgba(40,20,90,.28)'; x.shadowBlur = 18; x.shadowOffsetY = 6; x.strokeText(l, lx, y); x.restore();
      if (accent) {
        const g = x.createLinearGradient(lx, 0, lx + tw, 0);
        GRAD.forEach((c, k) => g.addColorStop(k / (GRAD.length - 1), c));
        x.fillStyle = g;
      } else x.fillStyle = (BGS[bg] || BGS.viralize).ink;
      x.fillText(l, lx, y);
      y += size * 1.02;
    });
    return y;
  }

  function pill(x, text, px, py, alignRight) {
    if (!text) return;
    const t = String(text).toUpperCase();
    x.font = `800 34px Archivo, 'Arial Black', sans-serif`;
    const tw = x.measureText(t).width, w = tw + 52, h = 62;
    const lx = Math.max(24, Math.min(alignRight ? px - w : px, W - 28 - w));
    const g = x.createLinearGradient(lx, 0, lx + w, 0);
    GRAD.forEach((c, k) => g.addColorStop(k / (GRAD.length - 1), c));
    x.save(); x.shadowColor = 'rgba(80,40,160,.35)'; x.shadowBlur = 20; x.shadowOffsetY = 8;
    x.beginPath(); x.roundRect(lx, py, w, h, h / 2); x.fillStyle = g; x.fill(); x.restore();
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(t, lx + 26, py + h / 2 + 2);
  }

  /* The product as a tilted print with a white border. */
  function productCard(x, img, cx, cy, maxW, maxH, tilt) {
    const s = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * s, h = img.height * s;
    x.save(); x.translate(cx, cy); x.rotate(tilt);
    x.shadowColor = 'rgba(40,20,90,.35)'; x.shadowBlur = 36; x.shadowOffsetY = 16;
    x.fillStyle = '#fff'; x.beginPath(); x.roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 16); x.fill();
    x.shadowColor = 'transparent';
    x.save(); x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 10); x.clip(); x.drawImage(img, -w / 2, -h / 2, w, h); x.restore();
    x.restore();
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  function arrow(x, from, to, dark) {
    const mx = (from[0] + to[0]) / 2, my = Math.min(from[1], to[1]) - 70;
    const draw = (color, width) => {
      x.strokeStyle = color; x.lineWidth = width; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(from[0], from[1]); x.quadraticCurveTo(mx, my, to[0], to[1]); x.stroke();
      const ang = Math.atan2(to[1] - my, to[0] - mx);
      x.beginPath();
      x.moveTo(to[0] - 34 * Math.cos(ang - 0.5), to[1] - 34 * Math.sin(ang - 0.5));
      x.lineTo(to[0], to[1]);
      x.lineTo(to[0] - 34 * Math.cos(ang + 0.5), to[1] - 34 * Math.sin(ang + 0.5));
      x.stroke();
    };
    draw(dark ? '#14122B' : '#fff', 22);
    draw(GRAD[2], 10);
  }

  async function render(canvas, o, me, productImg) {
    if (document.fonts && document.fonts.load) { try { await Promise.all([document.fonts.load('900 100px Archivo'), document.fonts.load('800 34px Archivo')]); } catch (e) { /* fallback font */ } }
    const x = canvas.getContext('2d');
    background(x, o.bg);
    let side = { x: o.side === 'left' ? 0 : W, w: 0, left: o.side === 'left' };
    if (me) side = person(x, me, o);
    const pad = 64;
    const area = side.left ? { x: side.x + side.w + 24, w: W - (side.x + side.w + 24) - pad } : { x: pad, w: (me ? side.x - 24 : W - pad) - pad };
    area.w = Math.max(area.w, 420);
    area.y = 54; area.align = side.left && me ? 'left' : 'left';
    const textBottom = headline(x, o, area, o.bg);
    if (productImg && o.product !== 'none') {
      const top = textBottom + 18, maxH = H - top - 40;
      if (maxH > 140) {
        const cx = area.x + Math.min(area.w, 560) / 2 + (side.left ? 40 : 0);
        const card = productCard(x, productImg, cx, top + maxH / 2, Math.min(area.w * 0.62, 420), maxH, side.left ? 0.05 : -0.05);
        /* the label overlaps the bottom corner of the product, like a price sticker */
        if (o.label) pill(x, o.label, card.x + card.w * 0.55, Math.min(card.y + card.h - 40, H - 86), false);
        if (o.arrow && me) {
          const start = side.left ? [side.x + side.w + 10, H * 0.55] : [side.x - 10, H * 0.55];
          const end = side.left ? [card.x - 20, card.y + card.h * 0.5] : [card.x + card.w + 26, card.y + card.h * 0.4];
          if (Math.abs(start[0] - end[0]) > 80) arrow(x, start, end, o.bg === 'dark');
        }
      }
    } else if (o.label) pill(x, o.label, area.x, textBottom + 24, false);
  }

  function mount(el, opts) {
    const p = opts.product;
    const images = opts.images || [];
    const o = Object.assign({ line1: '', line2: '', label: '', side: 'right', flip: false, size: 0.85, bg: 'viralize', product: images.length ? images[0].key : 'none', arrow: true }, opts.settings || {});
    if (!images.find(i => i.key === o.product)) o.product = images.length ? images[0].key : 'none';
    const esc = Folio.util.esc;
    let me = null, productImg = null, busy = false;
    el.innerHTML = `
      <div class="yt">
        <div class="yt-stage"><canvas width="${W}" height="${H}" id="ytCanvas" aria-label="Thumbnail preview"></canvas><div class="yt-status" id="ytStatus" hidden></div></div>
        <div class="yt-form">
          <div class="yt-photo">
            <span class="label">Your photo</span>
            <p class="hint" id="ytPhotoHint"></p>
            <div class="yt-photo-acts"><label class="btn small primary file-btn">Upload a photo<input type="file" id="ytFile" accept="image/*"></label><button type="button" class="btn small ghost danger" id="ytForget">Remove photo</button></div>
          </div>
          <div class="row2">
            <label class="field"><span>Big text, line 1</span><input type="text" id="yt-line1" maxlength="28" value="${esc(o.line1)}"></label>
            <label class="field"><span>Line 2 (gradient)</span><input type="text" id="yt-line2" maxlength="28" value="${esc(o.line2)}"></label>
          </div>
          <div class="row2">
            <label class="field"><span>Label (optional)</span><input type="text" id="yt-label" maxlength="22" value="${esc(o.label)}" placeholder="e.g. $12 ON ETSY"></label>
            <label class="field"><span>Product picture</span><select id="yt-product">${images.map(i => `<option value="${esc(i.key)}"${i.key === o.product ? ' selected' : ''}>${esc(i.label)}</option>`).join('')}<option value="none"${o.product === 'none' ? ' selected' : ''}>None (text only)</option></select></label>
          </div>
          <div class="row2">
            <label class="field"><span>Background</span><select id="yt-bg">${Object.entries(BGS).map(([k, b]) => `<option value="${k}"${k === o.bg ? ' selected' : ''}>${b.label}</option>`).join('')}</select></label>
            <label class="field"><span>You stand on the</span><select id="yt-side"><option value="right"${o.side === 'right' ? ' selected' : ''}>Right</option><option value="left"${o.side === 'left' ? ' selected' : ''}>Left</option></select></label>
          </div>
          <label class="field"><span>Your size</span><input type="range" id="yt-size" min="0" max="1" step="0.05" value="${o.size}"></label>
          <div class="yt-checks">
            <label class="check"><input type="checkbox" id="yt-flip"${o.flip ? ' checked' : ''}> Mirror my photo (so I point at the product)</label>
            <label class="check"><input type="checkbox" id="yt-arrow"${o.arrow ? ' checked' : ''}> Arrow to the product</label>
          </div>
          <div class="yt-acts"><button type="button" class="btn primary" id="ytDownload">Download thumbnail (1280×720)</button></div>
          <p class="hint">Free: made in your browser. The background is removed on this device; your photo is not uploaded anywhere. Keep big text to 2–4 words per line so it reads on a phone.</p>
        </div>
      </div>`;
    const $ = s => el.querySelector(s);
    const canvas = $('#ytCanvas');
    const status = msg => { const s = $('#ytStatus'); s.hidden = !msg; s.textContent = msg || ''; };
    const photoHint = () => { $('#ytPhotoHint').textContent = me ? 'Saved in this browser. Upload another to replace it.' : 'Upload a photo of you pointing to the side. Any background works: it is removed automatically.'; $('#ytForget').hidden = !me; };
    let timer;
    const redraw = () => { clearTimeout(timer); timer = setTimeout(() => render(canvas, o, me, productImg).catch(() => {}), 60); };
    const loadProduct = async () => {
      const im = images.find(i => i.key === o.product);
      productImg = null;
      if (im) { for (const src of im.srcs) { try { productImg = await loadImg(src); break; } catch (e) { /* try the next copy */ } } }
      redraw();
    };
    const saved = store.get();
    (saved ? loadImg(saved).then(i => { me = i; }).catch(() => {}) : Promise.resolve()).then(() => { photoHint(); loadProduct(); });
    photoHint();

    el.addEventListener('input', e => {
      const k = e.target.id.startsWith('yt-') ? e.target.id.slice(3) : null;
      if (!k) return;
      o[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? Number(e.target.value) : e.target.value;
      opts.onChange && opts.onChange(Object.assign({}, o));
      if (k === 'product') loadProduct(); else redraw();
    });
    $('#ytFile').addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0];
      if (!f || busy) return;
      busy = true;
      try {
        const data = await cutOut(f, status);
        me = await loadImg(data);
        if (!store.set(data)) opts.toast && opts.toast('Browser storage is full, so the photo is kept only until you close the app.');
        status(''); photoHint(); redraw();
        opts.toast && opts.toast('Background removed');
      } catch (err) {
        status('');
        opts.toast && opts.toast(err && err.message && !/^image$/.test(err.message) ? err.message : 'That photo could not be processed. Try a JPG or PNG, and check your internet connection the first time.');
      } finally { busy = false; e.target.value = ''; }
    });
    $('#ytForget').addEventListener('click', () => { store.set(''); me = null; photoHint(); redraw(); });
    $('#ytDownload').addEventListener('click', async () => {
      await render(canvas, o, me, productImg);
      try {
        canvas.toBlob(b => {
          if (!b) throw new Error('blob');
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = `${String(Folio.applyTokens(p).title || 'thumbnail').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-youtube-thumbnail.png`;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        }, 'image/png');
      } catch (err) { opts.toast && opts.toast('Download is blocked when the app is opened from a file. Use studio.tryviralize.com.'); }
    });
    redraw();
  }

  Folio.thumb = { mount, render, W, H };
})();
