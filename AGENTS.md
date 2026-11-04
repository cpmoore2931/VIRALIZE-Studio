# Instructions for AI assistants (ChatGPT, Grok, Claude, Gemini, Copilot, Codex)

Read this file first. It tells you how this project is built and how to change it safely.

## What this is

**Folio Studio** is a browser app for creating premium digital products to sell
(ebooks, workbooks, planners, checklists). The user edits content on the left,
sees real pages on the right, and exports a print-ready PDF.

## Hard rules

1. **No build step, no frameworks, no npm.** Plain HTML, CSS and JavaScript only.
   The app must keep working by double-clicking `index.html`.
2. **No ES modules** (`import`/`export`). Files are loaded with `<script>` tags in
   `index.html` and share one global namespace: `window.Folio`.
3. **Keep the load order** in `index.html`: themes → blocks → templates → render → quality → app.
4. **Return whole files** when you change a file, unless the user asks for a diff.
5. Don't break saved projects. If you rename a field, handle the old name in
   `normalize()` in `js/app.js`.

## File map

| File | What it does | Change it when you want to… |
| --- | --- | --- |
| `index.html` | Page shell, Google Fonts link, script tags | add a font, add a top-bar button |
| `js/themes.js` | `Folio.themes`, cover styles, paper sizes | add a visual theme or paper size |
| `js/blocks.js` | `Folio.blocks` registry + text helpers | add a new kind of content (e.g. "recipe card") |
| `js/templates.js` | Starter products in the "New" dialog | add a ready-made product |
| `js/render.js` | Turns a product into pages | change page-splitting, cover or contents page |
| `js/quality.js` | Quality score checks | change what "premium" means |
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
Append an object to `Folio.templates` in `js/templates.js` (see the existing ones).
Write real, specific, high-quality content. Never use lorem ipsum.

## Quality bar for content

Products made here are sold, so content must feel premium: specific numbers and
examples, short confident sentences, a clear promise, and something the buyer
*does* (checklists, worksheets, planners), not just reads.

## Testing your change

Open `index.html` in a browser. Check: no console errors, the preview updates as you
type, Export PDF shows clean pages, and dark mode still looks right.
