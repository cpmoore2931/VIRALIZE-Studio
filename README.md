# Viralize Studio

Create premium digital products — ebooks, workbooks, planners, checklists and day-trading guides — and
export them as print-ready PDFs to sell on Gumroad, Etsy, Payhip, Stan or your own site.

## Features

- **7 designer themes** (Editorial, Luxe, Modern, Soft, Nordic, Terminal, Ledger) with custom accent colors
- **Trading toolkit**: vector candlestick charts (your own OHLC data or realistic samples) with
  support/resistance levels and moving averages, 10 illustrated candle-pattern cards,
  a position-size calculator and printable trade-journal pages
- **17 content blocks**: chapters, text, checklists, worksheet prompts with writing lines,
  tables, callouts, quotes, weekly planner spreads, habit trackers, notes pages and more
- **Live page preview** — click any block to edit it
- **Export PDF** in US Letter or A4 with real, selectable text (crisp at any zoom)
- **Quality score** that flags what keeps a product from feeling premium
- **Listing copy generator** for your sales page
- **AI edit**: one click copies a prompt for ChatGPT, Grok, Claude or Gemini; paste the reply back to apply it
- Auto-saves in your browser; download/import `.json` backups
- 5 ready-made starter products with real content, including *The Opening Range Playbook* (day trading)

## Run it

No install needed. Download the repo and double-click `index.html`.

Or turn on **GitHub Pages** (Settings → Pages → Source: *GitHub Actions*). The included
workflow publishes the app at `https://<your-username>.github.io/viralize-studio/`.

## Export a high-quality PDF

1. Click **Export PDF**.
2. Destination: **Save as PDF**.
3. Margins: **None**. Turn on **Background graphics**.
4. Use Chrome or Edge for the best result.

## Editing with ChatGPT or Grok

- **Edit a product's content:** in the app, click **AI edit → Copy prompt**, paste it into
  the AI, describe the change, then paste the reply back and click **Apply changes**.
- **Change the app itself:** give the AI [`AGENTS.md`](AGENTS.md) plus the file you want
  changed. The code is plain HTML/CSS/JS with no build step, and each file has a
  header comment explaining what it does.

## Project layout

```
index.html            app shell
css/app.css           editor styles
css/product.css       product page + PDF styles
js/themes.js          themes, covers, paper sizes
js/blocks.js          content block types
js/templates.js       starter products
js/render.js          product → pages
js/quality.js         quality score
js/app.js             editor, saving, AI edit, export
docs/PRODUCT_SCHEMA.md product JSON format
AGENTS.md             rules for AI assistants
```

## License

MIT
