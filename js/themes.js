/*
 * THEMES — the visual look of a product.
 *
 * To add a theme: copy one entry, give it a new key, change the values.
 * Fonts must also be added to the Google Fonts <link> in index.html.
 * Every value here becomes a CSS variable on the product (see render.js).
 * Optional: up / down (candle colors) and mono (chart labels) — defaults apply if left out.
 */
window.Folio = window.Folio || {};

Folio.themes = {
  editorial: {
    name: 'Editorial',
    note: 'Literary serif, warm paper. Ebooks and guides.',
    display: "'Fraunces', Georgia, serif",
    body: "'Source Serif 4', Georgia, serif",
    paper: '#FBF9F4',
    ink: '#1F1C17',
    muted: '#6B645A',
    rule: '#E3DDD2',
    accent: '#8C3B1F',
    coverBg: '#F1ECE2',
    coverInk: '#1F1C17'
  },
  luxe: {
    name: 'Luxe',
    note: 'Black and gold, high-contrast serif. Premium courses.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Jost', 'Helvetica Neue', Arial, sans-serif",
    paper: '#FFFDF9',
    ink: '#151515',
    muted: '#6E6A63',
    rule: '#E8E1D3',
    accent: '#A6824A',
    coverBg: '#141414',
    coverInk: '#F4EDE0'
  },
  modern: {
    name: 'Modern',
    note: 'Heavy grotesk, crisp white. Checklists and playbooks.',
    display: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    body: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
    paper: '#FFFFFF',
    ink: '#0F1420',
    muted: '#5A6272',
    rule: '#E2E5EC',
    accent: '#2340D6',
    coverBg: '#2340D6',
    coverInk: '#FFFFFF'
  },
  soft: {
    name: 'Soft',
    note: 'Rounded serif, blush paper. Workbooks and journals.',
    display: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    paper: '#FFF8F5',
    ink: '#2B1F22',
    muted: '#7A6468',
    rule: '#F0DCD8',
    accent: '#B4506E',
    coverBg: '#F6E3DF',
    coverInk: '#2B1F22'
  },
  nordic: {
    name: 'Nordic',
    note: 'Quiet serif, sage tones. Planners and trackers.',
    display: "'Instrument Serif', Georgia, serif",
    body: "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif",
    paper: '#F7F8F5',
    ink: '#1C2420',
    muted: '#5F6B65',
    rule: '#DDE3DE',
    accent: '#2F5D50',
    coverBg: '#2F5D50',
    coverInk: '#F2F5F1'
  },
  terminal: {
    name: 'Terminal',
    note: 'Dark trading-desk look, amber accent. Trading guides.',
    display: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    body: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace",
    paper: '#10141A',
    ink: '#E3E8EF',
    muted: '#8D97A5',
    rule: '#262E39',
    accent: '#F2B230',
    up: '#26B57F',
    down: '#F0564B',
    coverBg: '#0A0D12',
    coverInk: '#E3E8EF'
  },
  ledger: {
    name: 'Ledger',
    note: 'Clean white with market green and red. Trading workbooks.',
    display: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    body: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace",
    paper: '#FFFFFF',
    ink: '#111827',
    muted: '#5B6473',
    rule: '#E3E7ED',
    accent: '#1F5FD1',
    up: '#13915F',
    down: '#D63B32',
    coverBg: '#0F1B2D',
    coverInk: '#F3F6FA'
  }
};

/* Cover layouts. The CSS for each lives in css/product.css (.cover--<key>). */
Folio.coverStyles = {
  classic: 'Classic — centered title on paper',
  full: 'Full bleed — solid color cover',
  frame: 'Framed — fine border, editorial'
};

/* Paper sizes used for the preview and for PDF export. */
Folio.paperSizes = {
  letter: { name: 'US Letter (8.5 × 11 in)', w: '8.5in', h: '11in' },
  a4: { name: 'A4 (210 × 297 mm)', w: '210mm', h: '297mm' }
};
