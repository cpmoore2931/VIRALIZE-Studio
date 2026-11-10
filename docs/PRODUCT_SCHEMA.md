# Product JSON format

Every product is one JSON object. This is what "AI edit" sends to ChatGPT/Grok and
what you get from "Download .json backup".

```json
{
  "id": "k3j9a8xq",
  "kind": "Ebook",
  "title": "The Quiet Money Method",
  "subtitle": "A calm, 30-day system for spending on purpose",
  "author": "Jane Doe",
  "brand": "Doe Studio",
  "year": "2026",
  "theme": "editorial",
  "accent": "",
  "cover": "frame",
  "paper": "letter",
  "toc": true,
  "listing": {
    "price": "19",
    "audience": "people who feel anxious about money",
    "promise": "Know where every dollar goes without a strict budget.",
    "platform": "Gumroad"
  },
  "blocks": [
    { "id": "a1", "type": "chapter", "title": "Why budgets fail", "kicker": "Start here", "intro": "…" },
    { "id": "a2", "type": "paragraph", "text": "First paragraph.\n\nSecond paragraph with **bold**." }
  ]
}
```

## Top-level fields

| Field | Values |
| --- | --- |
| `theme` | `blush`, `focus`, `editorial`, `luxe`, `modern`, `soft`, `nordic`, `terminal`, `ledger` |
| `cover` | `classic`, `full`, `frame` |
| `paper` | `letter`, `a4` |
| `accent` | hex color like `#8C3B1F`, or `""` for the theme default |
| `toc` | `true` / `false` (contents page appears when there are 2+ chapters) |
| `brandId` | id of a saved brand kit, or `""` for none |
| `showCover` | `false` to skip the cover page (wall art, paper packs, labels) |
| `watermark` | text stamped across inside pages (e.g. `SAMPLE`), or `""` |
| `from` | key of the starter it was made from (Projects page, thumbnail photo) |
| `idea`, `ai` | the idea typed into "Write it for me", and `true` when AI wrote the first draft |
| `listing.etsy` | AI-written Etsy listing: `{ title, tags[13], description, pinTitle, pinDescription, at }` |
| `mockups`, `pins` | generated photos `{ id, src, thumb, at, … }`; `src` links expire after 7 days, `thumb` is a small saved copy |
| `videos`, `audio` | generated promo videos and narration links (temporary) |
| `yt` | YouTube thumbnail settings `{ line1, line2, label, side, flip, size, bg, product, arrow }` |

## Block types

| type | fields | layout |
| --- | --- | --- |
| `chapter` | `title`, `kicker`, `intro` | starts a new page |
| `heading` | `text` | flows |
| `paragraph` | `text` | flows |
| `bullets` | `title`, `items[]` | flows |
| `checklist` | `title`, `items[]` | flows |
| `callout` | `label`, `text` | flows |
| `quote` | `text`, `cite` | flows |
| `prompts` | `title`, `items[]`, `lines` (number) | flows |
| `table` | `title`, `headers` ("A \| B \| C"), `rows[]` ("1 \| 2 \| 3") | flows |
| `weekly` | `title`, `side[]` | full page |
| `habit` | `title`, `habits[]` | full page |
| `notes` | `title`, `style` (`lined`, `dotted`, `grid`) | full page |
| `pagebreak` | — | starts a new page |
| `candles` | `title`, `source` (`sample_uptrend`, `sample_downtrend`, `sample_range`, `sample_breakout`, `custom`), `data[]` ("open high low close"), `levels[]` ("price \| label"), `ma` (number), `caption` | flows |
| `patterns` | `title`, `items[]` (hammer, shootingstar, doji, bullishengulfing, bearishengulfing, morningstar, eveningstar, threesoldiers, bullflag, doublebottom) | flows |
| `risk` | `title`, `account`, `riskPct`, `entry` (numbers), `stops[]` (dollar stop distances) | flows |
| `floral` | `style` (`bouquet`, `line`, `single`, `meadow`), `palette`, `seed`, `text`, `color` | bare page |
| `collage` | `palette`, `seed`, `word` | bare page |
| `coloring` | `design` (`mandala`, `geometric`, `flowers`, `meadow`), `seed`, `caption` | bare page |
| `icons` | `title`, `items[]` ("icon \| label"), `style` (`circle`, `tile`, `sticker`, `plain`), `color`, `fill`, `cols` | bare page |

Art is generated from `seed`: the same number always draws the same picture; change it for a new one.
Palettes: blush, sage, terracotta, pastel, berry, ocean. Icon names are listed in `js/art.js`.

| type | fields | layout |
| --- | --- | --- |
| `journal` | `title`, `columns[]`, `rows` (number) | full page |

| `steps` | `title`, `path` ("Settings > Business Profile"), `items[]`, `result` | flows |
| `screenshot` | `image` (data URL), `caption`, `markers[]` ("x% y% \| label") | flows |
| `faq` | `title`, `items[]` ("Question \| Answer") | flows |
| `video` | `title`, `url`, `note`, `length` (shows a QR code) | flows |
| `cta` | `title`, `text`, `button`, `url` | flows |
| `monthly` | `title`, `month` ("2027-01" or empty), `start` (`mon`/`sun`), `side[]` | full page |
| `yearly` | `title`, `year`, `start` | full page |
| `mealplan` | `title`, `meals[]`, `side` | full page |
| `cards` | `title`, `items[]` ("Front \| text"), `style` (`band`, `outline`, `filled`) | full page |
| `recipe` | `title`, `serves`, `time`, `ingredients[]`, `steps[]`, `note` | flows |
| `savings` | `title`, `goal`, `boxes`, `currency` | full page |
| `wallart` | `text`, `cite`, `style` (`minimal`, `bold`, `glow`, `arch`, `frame`), `color` | bare page |
| `paper` | `pattern` (gingham, stripes, dots, grid, checker, diagonal, linen, grain, watercolor), `color`, `base`, `scale` | bare page |
| `letterhead` | `name`, `line`, `footer`, `ruled` | bare page |
| `labels` | `items[]`, `shape` (`round`, `rect`, `pill`, `tag`), `cols` | bare page |
| `journal` | `title`, `columns[]`, `rows`, `foot[]` (summary boxes) | full page |
| `adhdday` | `title`, `oneThing`, `basics[]`, `water` (number), `startHour`, `endHour` (numbers) | full page |

Placeholders `{{platform}}`, `{{brand}}`, `{{login}}`, `{{website}}`, `{{email}}`, `{{phone}}`
work in any text and are filled from the product's brand kit.

For `candles` with your own data, set `source` to `custom` and give one candle per line in `data`,
e.g. `"101.2 103.5 100.8 103.1"`.

Text supports `**bold**` and `*italic*`. In `text` and `intro`, a blank line starts a new paragraph.
The source of truth is `js/blocks.js`.
