/*
 * TEMPLATES — starter products shown in the "New" dialog.
 *
 * A template is a full product object (same shape as a saved project,
 * see docs/PRODUCT_SCHEMA.md). Blocks are { type, ...fields } — ids are
 * added automatically. To add a template, append an object to this list.
 */
window.Folio = window.Folio || {};

Folio.templates = [
  {
    key: 'ebook',
    blurb: 'A 4-chapter guide with tips, tables and a checklist.',
    product: {
      kind: 'Ebook',
      title: 'The Quiet Money Method',
      subtitle: 'A calm, 30-day system for spending on purpose and saving without stress',
      author: 'Your Name',
      brand: 'Your Studio',
      year: '2026',
      theme: 'editorial',
      accent: '',
      cover: 'frame',
      paper: 'letter',
      toc: true,
      listing: {
        price: '19',
        audience: 'people who earn decent money but still feel anxious about it',
        promise: 'Know where every dollar goes and build a 3-month cushion without a strict budget.',
        platform: 'Gumroad'
      },
      blocks: [
        { type: 'chapter', title: 'Why budgets fail', kicker: 'Start here', intro: 'Most budgets are written on a good day and abandoned on a bad one. This guide replaces willpower with a few defaults that run in the background.' },
        { type: 'paragraph', text: 'A traditional budget asks you to predict every category a month in advance, then punishes you when life happens. The result is guilt, then avoidance, then no system at all.\n\nThe Quiet Money Method works the other way around. You decide **three numbers** once, automate them, and spend the rest freely. You will check in for ten minutes a week, not ten hours a month.' },
        { type: 'quote', text: 'You do not rise to the level of your goals. You fall to the level of your systems.', cite: 'James Clear' },
        { type: 'callout', label: 'Before you begin', text: 'Pull your last 60 days of bank and card statements. You only need the totals, not every line.' },

        { type: 'chapter', title: 'Find your three numbers', kicker: 'Days 1–7', intro: 'Every dollar you earn has one of three jobs. Give each job a number and you are done planning.' },
        { type: 'table', title: 'The three numbers', headers: 'Number | What it covers | Starting point', rows: ['Fixed | Rent, utilities, insurance, debt minimums | Your real 60-day average', 'Future | Savings, investing, extra debt payments | 10–20% of take-home pay', 'Free | Food, fun, shopping, everything else | Whatever is left'] },
        { type: 'paragraph', text: 'Write your take-home pay at the top of a page. Subtract **Fixed**, then **Future**. What remains is **Free**, and you may spend it on anything without tracking it.' },
        { type: 'callout', label: 'Pro tip', text: 'If Free comes out negative, lower Future to 5% for now. A small habit you keep beats a big one you quit.' },

        { type: 'chapter', title: 'Automate the boring parts', kicker: 'Days 8–14', intro: 'Set it up once on payday and let the bank do the remembering.' },
        { type: 'bullets', title: 'Your payday flow', items: ['Paycheck lands in **Checking**.', 'Day 1: automatic transfer of your Future number to a separate **high-yield savings** account.', 'Fixed bills are scheduled from Checking on autopay.', 'Day 2: Free money moves to a **spending account** with its own debit card.'] },
        { type: 'paragraph', text: 'When the spending account is empty, Free is done for the month. No spreadsheet required. The balance *is* the budget.' },

        { type: 'chapter', title: 'The ten-minute weekly check-in', kicker: 'Days 15–30', intro: 'One short ritual keeps the system honest.' },
        { type: 'checklist', title: 'Every Sunday', items: ['Check the spending account balance against days left in the month', 'Move any surprise income straight to Future', 'Note one purchase that felt great and one that did not', 'Confirm next week\'s bills are covered', 'Close the app. You are finished.'] },
        { type: 'prompts', title: 'Your 30-day reflection', items: ['What did you stop worrying about this month?', 'Which default would you change, and to what?'], lines: 4 }
      ]
    }
  },

  {
    key: 'workbook',
    blurb: 'Guided prompts and exercises with writing space.',
    product: {
      kind: 'Workbook',
      title: 'Clarity Sessions',
      subtitle: 'A guided workbook for deciding what you actually want next',
      author: 'Your Name',
      brand: 'Your Studio',
      year: '2026',
      theme: 'soft',
      accent: '',
      cover: 'full',
      paper: 'letter',
      toc: true,
      listing: {
        price: '14',
        audience: 'anyone at a crossroads in their career or life',
        promise: 'Turn a fuzzy feeling of "something needs to change" into one clear next step.',
        platform: 'Etsy'
      },
      blocks: [
        { type: 'chapter', title: 'Where you are now', kicker: 'Session one', intro: 'Clarity starts with an honest inventory. Answer quickly; your first answer is usually the true one.' },
        { type: 'prompts', title: 'Take stock', items: ['What is working well in your life right now?', 'What drains your energy most weeks?', 'If nothing changed for a year, how would you feel?'], lines: 4 },
        { type: 'callout', label: 'How to use this workbook', text: 'Set a 20-minute timer for each session. Write by hand if you can. Skip any question that does not land and come back to it later.' },

        { type: 'chapter', title: 'What you value', kicker: 'Session two', intro: 'Values are the filter for every decision that follows.' },
        { type: 'checklist', title: 'Circle your top five', items: ['Freedom', 'Security', 'Creativity', 'Family', 'Growth', 'Health', 'Recognition', 'Adventure', 'Service', 'Craft'] },
        { type: 'prompts', title: 'Go deeper', items: ['Pick your number-one value. When did you last feel it fully?', 'Which value are you neglecting, and what is it costing you?'], lines: 5 },

        { type: 'chapter', title: 'Your next step', kicker: 'Session three', intro: 'Big changes are a series of small, specific moves.' },
        { type: 'table', title: 'Options on the table', headers: 'Option | Matches my values? | First small step', rows: [' | | ', ' | | ', ' | | '] },
        { type: 'prompts', title: 'Commit', items: ['The one step I will take in the next 7 days is…', 'The person I will tell about it is…'], lines: 3 },
        { type: 'notes', title: 'Notes', style: 'dotted' }
      ]
    }
  },

  {
    key: 'planner',
    blurb: 'Weekly spreads, a habit tracker and notes pages.',
    product: {
      kind: 'Planner',
      title: 'Deep Work Weekly',
      subtitle: 'An undated planner for people who want fewer, better hours',
      author: 'Your Name',
      brand: 'Your Studio',
      year: '2026',
      theme: 'nordic',
      accent: '',
      cover: 'full',
      paper: 'letter',
      toc: false,
      listing: {
        price: '12',
        audience: 'freelancers, students and makers who protect focus time',
        promise: 'Plan each week around three priorities and finish what matters.',
        platform: 'Etsy'
      },
      blocks: [
        { type: 'chapter', title: 'How this planner works', kicker: 'Read me', intro: 'Each week has one spread. Choose three priorities on Sunday, block time for them first, and let everything else fit around them.' },
        { type: 'bullets', items: ['**Sunday:** pick three priorities and schedule them.', '**Daily:** one focus block before you open email.', '**Friday:** tick off habits and write one sentence about the week.'] },
        { type: 'weekly', title: 'Week one', side: ['Top 3 priorities', 'Focus blocks', 'Wins'] },
        { type: 'weekly', title: 'Week two', side: ['Top 3 priorities', 'Focus blocks', 'Wins'] },
        { type: 'habit', title: 'Monthly habits', habits: ['90-minute focus block', 'No phone first hour', 'Walk outside', 'Read 20 pages', 'Lights out by 10:30'] },
        { type: 'notes', title: 'Ideas', style: 'grid' }
      ]
    }
  },

  {
    key: 'checklist',
    blurb: 'A punchy lead magnet or bonus checklist.',
    product: {
      kind: 'Checklist',
      title: 'Launch Day, Handled',
      subtitle: 'The 40-point checklist for launching a digital product without the 2 a.m. panic',
      author: 'Your Name',
      brand: 'Your Studio',
      year: '2026',
      theme: 'modern',
      accent: '',
      cover: 'full',
      paper: 'letter',
      toc: false,
      listing: {
        price: '0',
        audience: 'first-time course and template creators',
        promise: 'Launch on schedule with nothing forgotten.',
        platform: 'Email opt-in'
      },
      blocks: [
        { type: 'chapter', title: 'Two weeks out', kicker: 'T-14' },
        { type: 'checklist', title: 'Product', items: ['Final file exported and opened on phone and desktop', 'Download link tested from a logged-out browser', 'Refund policy written', 'Bonus or early-bird offer decided'] },
        { type: 'checklist', title: 'Sales page', items: ['Headline states the outcome, not the format', 'Three proof points or testimonials', 'FAQ answers price, access and refunds', 'Buy button above the fold and at the bottom'] },
        { type: 'chapter', title: 'Launch week', kicker: 'T-7 to T-0' },
        { type: 'checklist', title: 'Audience', items: ['Teaser email sent', 'Three social posts scheduled', 'Launch email written and tested', 'Reminder email for the final 24 hours'] },
        { type: 'callout', label: 'Rule of thumb', text: 'Most launch sales arrive on the **first** and **last** day. Plan your loudest emails for those two.' },
        { type: 'chapter', title: 'After launch', kicker: 'T+1' },
        { type: 'checklist', items: ['Thank-you email to buyers', 'Ask three buyers for a testimonial', 'Record revenue, conversion rate and refund count', 'Write down one thing to change next time'] }
      ]
    }
  },

  {
    key: 'blank',
    blurb: 'Start from an empty product.',
    product: {
      kind: 'Guide',
      title: 'Untitled product',
      subtitle: '',
      author: '',
      brand: '',
      year: '2026',
      theme: 'luxe',
      accent: '',
      cover: 'classic',
      paper: 'letter',
      toc: true,
      listing: { price: '', audience: '', promise: '', platform: 'Gumroad' },
      blocks: [
        { type: 'chapter', title: 'Introduction', kicker: '', intro: '' },
        { type: 'paragraph', text: 'Start writing here.' }
      ]
    }
  }
];
