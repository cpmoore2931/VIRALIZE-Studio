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
| `theme` | `editorial`, `luxe`, `modern`, `soft`, `nordic` |
| `cover` | `classic`, `full`, `frame` |
| `paper` | `letter`, `a4` |
| `accent` | hex color like `#8C3B1F`, or `""` for the theme default |
| `toc` | `true` / `false` (contents page appears when there are 2+ chapters) |

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

Text supports `**bold**` and `*italic*`. In `text` and `intro`, a blank line starts a new paragraph.
The source of truth is `js/blocks.js`.
