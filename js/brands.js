/*
 * BRANDS — white-label brand kits.
 *
 * A brand kit is saved once and can be applied to any product. It overrides the
 * theme's accent color, cover color and fonts, puts the logo on the cover and in
 * the footer, and fills in placeholders anywhere in the product text:
 *
 *   {{platform}}  the CRM / software name you sell it under (white-label name)
 *   {{brand}}     the brand / company name
 *   {{login}}     the login web address for the platform
 *   {{website}}   {{email}}   {{phone}}
 *
 * So one training guide can be re-branded for any client in one click.
 * To add a starter brand, add an entry to Folio.brandPresets.
 */
window.Folio = window.Folio || {};

/* Fonts a brand can use. Each must be in the Google Fonts <link> in index.html. */
Folio.brandFonts = {
  theme: { name: 'Use the theme font' },
  lato: { name: 'Lato Black', stack: "'Lato', 'Helvetica Neue', Arial, sans-serif", weight: 900 },
  inter: { name: 'Inter', stack: "'Inter', 'Helvetica Neue', Arial, sans-serif", weight: 700 },
  archivo: { name: 'Archivo Extended', stack: "'Archivo', 'Arial Black', Arial, sans-serif", weight: 900, stretch: '125%' },
  plex: { name: 'IBM Plex Sans', stack: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif", weight: 600 },
  fraunces: { name: 'Fraunces (serif)', stack: "'Fraunces', Georgia, serif", weight: 600 },
  dmserif: { name: 'DM Serif Display', stack: "'DM Serif Display', Georgia, serif", weight: 400 },
  instrument: { name: 'Instrument Sans', stack: "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif", weight: 600 }
};

Folio.brandFields = [
  { key: 'name', label: 'Brand / company name', kind: 'text' },
  { key: 'tagline', label: 'Tagline (under the logo on the cover)', kind: 'text' },
  { key: 'logo', label: 'Logo (PNG with transparent background works best)', kind: 'image', max: 600 },
  { key: 'platformName', label: 'Platform name — what you call the CRM/software ({{platform}})', kind: 'text' },
  { key: 'login', label: 'Login web address ({{login}})', kind: 'text' },
  { key: 'website', label: 'Website ({{website}})', kind: 'text' },
  { key: 'email', label: 'Support email ({{email}})', kind: 'text' },
  { key: 'phone', label: 'Support phone ({{phone}})', kind: 'text' },
  { key: 'primary', label: 'Main color', kind: 'color' },
  { key: 'secondary', label: 'Highlight color', kind: 'color' },
  { key: 'dark', label: 'Dark color (covers)', kind: 'color' },
  { key: 'headingFont', label: 'Heading font', kind: 'select', options: 'brandFonts' },
  { key: 'bodyFont', label: 'Body font', kind: 'select', options: 'brandFonts' },
  { key: 'logoOnCover', label: 'Show logo on the cover', kind: 'checkbox' },
  { key: 'logoInFooter', label: 'Show logo in page footers', kind: 'checkbox' }
];

Folio.brandPresets = {
  blank: {
    name: 'New brand', tagline: '', logo: '', platformName: 'the CRM', login: '', website: '', email: '', phone: '',
    primary: '#2563EB', secondary: '#10B981', dark: '#0F172A',
    headingFont: 'theme', bodyFont: 'theme', logoOnCover: true, logoInFooter: true
  },
  integrity: {
    name: 'Integrity LED Pro Services',
    tagline: 'Commercial lighting systems',
    logo: 'assets/brands/integrity-led-eagle.png',
    platformName: 'Integrity Pro CRM',
    login: '',
    website: 'integrityled.info',
    email: '',
    phone: '(830) 538-0991',
    primary: '#009EDD',
    secondary: '#5BCF8B',
    dark: '#142030',
    headingFont: 'lato',
    bodyFont: 'inter',
    logoOnCover: true,
    logoInFooter: true
  },
  viralize: {
    name: 'Viralize', tagline: 'Little things, made slowly', logo: '', platformName: 'Viralize Studio', login: '',
    website: 'tryviralize.com', email: '', phone: '',
    primary: '#7D7FE8', secondary: '#F5A6CF', dark: '#0A0A0B',
    headingFont: 'archivo', bodyFont: 'instrument', logoOnCover: true, logoInFooter: false
  }
};

/* Saved brands are put here by app.js so render.js can look them up. */
Folio.brands = Folio.brands || {};

Folio.brandOf = function (p) {
  return (p && p.brandId && Folio.brands[p.brandId]) || null;
};

/* Replace {{tokens}} in every text field of a product (images are left alone). */
Folio.applyTokens = function (p) {
  const b = Folio.brandOf(p) || {};
  const map = {
    platform: b.platformName || 'the platform',
    brand: b.name || p.brand || '',
    login: b.login || 'your login page',
    website: b.website || '',
    email: b.email || '',
    phone: b.phone || ''
  };
  const walk = v => {
    if (typeof v === 'string') return v.startsWith('data:') ? v : v.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in map ? map[k] : m));
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = walk(v[k]); return o; }
    return v;
  };
  return walk(p);
};
