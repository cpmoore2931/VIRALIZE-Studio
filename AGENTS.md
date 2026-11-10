# Instructions for AI assistants (ChatGPT, Grok, Claude, Gemini, Copilot, Codex)

Read this file first. It tells you how this project is built and how to change it safely.

## What this is

**Viralize Studio** is a browser app for creating premium digital products to sell
(ebooks, workbooks, planners, checklists). The user edits content on the left,
sees real pages on the right, and exports a print-ready PDF.

## Hard rules

1. **No build step, no frameworks, no npm.** Plain HTML, CSS and JavaScript only.
   The app must keep working by double-clicking `index.html`.
2. **No ES modules** (`import`/`export`). Files are loaded with `<script>` tags in
   `index.html` and share one global namespace: `window.Folio`.
3. **Keep the load order** in `index.html`: qrcode library (CDN) → themes → brands → blocks → templates → render → quality → trading → training → planner → library → art → templates-library → app.
4. **Return whole files** when you change a file, unless the user asks for a diff.
5. Don't break saved projects. If you rename a field, handle the old name in
   `normalize()` in `js/app.js`.

## File map

| File | What it does | Change it when you want to… |
| --- | --- | --- |
| `index.html` | Page shell, Google Fonts link, script tags | add a font, add a top-bar button |
| `js/themes.js` | `Folio.themes`, cover styles, paper sizes | add a visual theme or paper size |
| `js/brands.js` | White-label brand kits, brand fonts, `{{token}}` placeholders | add a starter brand, a brand font or a new placeholder |
| `js/training.js` | Software/CRM training blocks: steps, screenshot, faq, video (QR), cta | change how-to guides and training pages |
| `js/planner.js` | ADHD-friendly planner pages (`adhdday` daily spread) | change the daily planner page |
| `js/library.js` | Lifestyle pages: monthly, yearly, mealplan, cards, recipe, savings, wallart, paper, letterhead, labels | add or change calendars, cards, wall art, papers |
| `js/art.js` | Generated vector art: floral prints, abstract collage, coloring pages (mandala, geometric, flowers), line icon set (`Folio.art.icons`) | add an icon, a palette or a new art generator |
| `js/templates-library.js` | ~46 ready-to-sell starters with categories (planners, trackers, journals, money, art) | add a starter to the New dialog |
| `assets/brands/` | Logo files for starter brands | add a brand logo |
| `js/blocks.js` | `Folio.blocks` registry + text helpers | add a new kind of content (e.g. "recipe card") |
| `js/templates.js` | Starter products in the "New" dialog | add a ready-made product |
| `js/render.js` | Turns a product into pages | change page-splitting, cover or contents page |
| `js/quality.js` | Quality score checks | change what "premium" means |
| `js/trading.js` | Candlestick charts (`Folio.chart`), pattern library (`Folio.patterns`), trading blocks | add a candle pattern, change chart drawing, add trading blocks |
| `js/app.js` | Editor UI, saving, modals, AI prompt, PDF export | change editor behavior |
| `css/app.css` | Editor look (light + dark) | restyle the editor |
| `css/product.css` | Product page look + print rules | restyle the product / PDF |
| `docs/PRODUCT_SCHEMA.md` | The product JSON format | (keep in sync with blocks.js) |

## Common tasks

### Add a new block type
Add one entry to `Folio.blocks` in `js/blocks.js`:

```js
recipe: {
  label: 'Recipe card',
  layout: 'flow',                // 'flow' | 'chapter' | 'page'
  fields: [
    { key: 'title', label: 'Recipe name', kind: 'text' },
    { key: 'ingredients', label: 'Ingredients (one per line)', kind: 'list' },
    { key: 'steps', label: 'Method', kind: 'textarea' }
  ],
  defaults: { title: 'Recipe', ingredients: [], steps: '' },
  summary: b => b.title,
  render: (b) => `<div class="recipe"><h3 class="h3">${Folio.util.inline(b.title)}</h3>…</div>`
}
```
Then add its CSS to `css/product.css` using only `--p-*` variables for colors and fonts.
The editor form, AI prompt and "Add block" menu pick it up automatically.

### Add a theme
Copy an entry in `js/themes.js`, rename the key, change values. Add any new
fonts to the Google Fonts `<link>` in `index.html`.

### Add a template
Add a starter with `add(key, category, blurb, product)` in `js/templates-library.js`
(or append to `Folio.templates` in `js/templates.js`). Categories group the New dialog.
Block layout `bare` = full page with no margins or footer (wall art, papers, labels);
set `showCover: false` on products that should not start with a cover.
Write real, specific, high-quality content. Never use lorem ipsum.

### Add a candlestick pattern
Add an entry to `Folio.patterns` in `js/trading.js`: `name`, `signal`, `tone`
(`up` / `down` / `neutral`), `data` (array of `[open, high, low, close]`, 4–8 candles
with context before the pattern), `hl` (indexes of the pattern candles to highlight)
and `text` (2–3 sentence explanation). Charts are SVG, so they stay sharp in PDFs.

### Trading products
Any product using trading blocks must include a disclaimer that it is educational,
not financial advice, and that trading carries risk of loss. The quality check enforces this.
Never write content promising guaranteed or specific returns.

### White-label brands and placeholders
Brand kits live in the browser store (`store.brands`); starters are in `Folio.brandPresets`.
A product links to one with `brandId`. Text can use `{{platform}}`, `{{brand}}`, `{{login}}`,
`{{website}}`, `{{email}}`, `{{phone}}`; `Folio.applyTokens()` fills them in at render time.
When writing CRM/software training content, use `{{platform}}` instead of a product name
so the guide can be re-branded. Menu paths go in the `steps` block's `path` field, separated by `>`.

### Images
Uploaded images are stored inside the product as data URLs (shrunk on upload). The AI-edit
prompt replaces them with `KEEP_IMAGE`; keep that value as-is and the app restores the image.

## Quality bar for content

Products made here are sold, so content must feel premium: specific numbers and
examples, short confident sentences, a clear promise, and something the buyer
*does* (checklists, worksheets, planners), not just reads.

## Testing your change

Open `index.html` in a browser. Check: no console errors, the preview updates as you
type, Export PDF shows clean pages, and dark mode still looks right.

## Naming note
The product name is **Viralize Studio**. In code, everything lives under the global
`window.Folio` namespace and projects are saved under the `folio.v1` storage key
(the app's original working name). Keep those names so saved projects keep working.
