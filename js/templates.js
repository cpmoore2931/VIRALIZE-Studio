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
      theme: 'viralize',
      accent: '',
      cover: 'glow',
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
    key: 'trading',
    blurb: 'Day trading guide with candle charts, patterns, sizing and a journal.',
    product: {
      kind: 'Trading Playbook',
      title: 'The Opening Range Playbook',
      subtitle: 'A rules-first guide to reading candles, sizing positions and trading the first hour with discipline',
      author: 'Your Name',
      brand: 'Your Studio',
      year: '2026',
      theme: 'terminal',
      accent: '',
      cover: 'full',
      paper: 'letter',
      toc: true,
      listing: {
        price: '39',
        audience: 'new and struggling day traders who want a written plan instead of gut feel',
        promise: 'Read price action with confidence and size every trade so no single loss can hurt you.',
        platform: 'Gumroad'
      },
      blocks: [
        { type: 'chapter', title: 'Read this first', kicker: 'Risk notice', intro: 'This playbook teaches a process. It does not promise profits, and no strategy wins every trade.' },
        { type: 'callout', label: 'Disclaimer', text: 'This guide is for **educational purposes only** and is **not financial advice**. Day trading carries a high risk of loss, and most new traders lose money. Never trade money you cannot afford to lose. Practice in a simulator before risking real capital.' },
        { type: 'paragraph', text: 'Profitable traders are not better at predicting the future. They are better at **controlling losses**, repeating a small number of setups, and reviewing every trade honestly.\n\nThat is what this playbook gives you: a way to read the chart, a short list of setups, a sizing formula, and a journal that turns every session into data.' },

        { type: 'chapter', title: 'How to read a candle', kicker: 'Foundations', intro: 'Every candle answers four questions: where price opened, how high it went, how low it went and where it closed.' },
        { type: 'table', headers: 'Part | What it shows | What to look for', rows: ['Body | Distance from open to close | Big bodies mean conviction', 'Upper wick | Highest price rejected | Long upper wicks at resistance = sellers', 'Lower wick | Lowest price rejected | Long lower wicks at support = buyers', 'Color | **Green** closed above open, **red** below | Several in a row show who is in control'] },
        { type: 'patterns', title: 'Single and two-candle signals', items: ['hammer', 'shootingstar', 'doji', 'bullishengulfing'] },
        { type: 'callout', label: 'Context beats pattern', text: 'A hammer in the middle of nowhere means little. A hammer at a level the market has respected three times this week is a signal worth acting on.' },

        { type: 'chapter', title: 'Market structure', kicker: 'Trend and range', intro: 'Before looking for a setup, decide which of two markets you are in: trending or ranging.' },
        { type: 'candles', title: 'Uptrend: higher highs, higher lows', source: 'sample_uptrend', levels: [], ma: 9, caption: 'In a trend, buy pullbacks toward the 9-period moving average. Stop trading long when price closes decisively below it.' },
        { type: 'candles', title: 'Range: fade the edges', source: 'sample_range', levels: ['101.6 | Resistance', '97.3 | Support'], ma: 0, caption: 'In a range, the edges are the trade. Buy near support, sell near resistance, and do nothing in the middle.' },

        { type: 'chapter', title: 'The setups', kicker: 'Only three', intro: 'Trade a few setups well instead of many setups badly. Each one has an entry, a stop and a target before you click buy.' },
        { type: 'candles', title: 'Opening range breakout', source: 'sample_breakout', levels: ['101.9 | Range high'], ma: 9, caption: 'Mark the high of the first 15–30 minutes. Enter on a candle **close** above it with rising volume. Stop goes below the last higher low. First target is 2R.' },
        { type: 'patterns', title: 'Confirmation patterns', items: ['bullflag', 'doublebottom', 'morningstar', 'threesoldiers'] },
        { type: 'table', title: 'Setup rules at a glance', headers: 'Setup | Entry | Stop | Target', rows: ['Opening range breakout | Close above range high | Below last higher low | 2R, then trail', 'Bull flag | Break of flag high | Below flag low | Pole length', 'Support bounce | Hammer or engulfing at support | Below the wick | Mid-range or 2R'] },

        { type: 'chapter', title: 'Risk and position sizing', kicker: 'The part that keeps you in the game', intro: 'You decide how much you can lose **before** you decide how much you can make.' },
        { type: 'risk', title: 'Risk 1% per trade', account: 25000, riskPct: 1, entry: 50, stops: ['0.25', '0.50', '1.00', '2.00'] },
        { type: 'bullets', title: 'Hard rules', items: ['Never risk more than **1%** of the account on one trade.', 'Stop trading for the day after **3 losses** or **−3R**, whichever comes first.', 'Move the stop only in the direction of the trade, never further away.', 'No new positions in the last 15 minutes of the session.'] },

        { type: 'chapter', title: 'Daily routine', kicker: 'Process', intro: 'Good sessions are built before the open.' },
        { type: 'checklist', title: 'Pre-market (30 minutes)', items: ['Check the economic calendar for scheduled news', 'Build a watchlist of 3–5 stocks gapping on volume', 'Mark yesterday\'s high, low and close on each chart', 'Write the one setup you are looking for today', 'Confirm max loss for the day in dollars'] },
        { type: 'checklist', title: 'After the close (15 minutes)', items: ['Log every trade in the journal', 'Grade each trade A–F on how well you followed the plan, not on profit', 'Screenshot your best and worst trade', 'Write one sentence: what will I do differently tomorrow?'] },
        { type: 'prompts', title: 'Weekly review', items: ['Which setup made the most R this week?', 'Which rule did you break, and what triggered it?'], lines: 3 },
        { type: 'journal', title: 'Trade journal — week 1' },
        { type: 'journal', title: 'Trade journal — week 2' },
        { type: 'notes', title: 'Chart notes', style: 'grid' }
      ]
    }
  },

  {
    key: 'crm',
    blurb: 'White-label CRM training guide: how-to steps, screenshots, videos, FAQ.',
    product: {
      kind: 'Client Training Guide',
      title: 'Getting Started with {{platform}}',
      subtitle: 'Your step-by-step guide to capturing leads, booking appointments and following up automatically',
      author: '',
      brand: '',
      year: '2026',
      theme: 'ledger',
      accent: '',
      cover: 'full',
      paper: 'letter',
      toc: true,
      brandPreset: 'integrity',
      listing: {
        price: '0',
        audience: 'new {{platform}} users on your team or your clients\' teams',
        promise: 'Go from first login to a working lead-follow-up system in one afternoon.',
        platform: 'Client onboarding'
      },
      blocks: [
        { type: 'chapter', title: 'Welcome to {{platform}}', kicker: 'Start here', intro: '{{platform}} keeps every lead, conversation, appointment and follow-up in one place. This guide walks you through the setup that matters most, one task at a time.' },
        { type: 'steps', title: 'Log in for the first time', path: '{{login}}', items: ['Open the welcome email from {{brand}} and click **Set up your account**.', 'Create a password with at least 12 characters.', 'If asked, turn on 2-step verification and choose text or email codes.', 'Bookmark the login page so you can find it in one click.'], result: 'You see the dashboard with your company name in the top-left corner.' },
        { type: 'callout', label: 'Menus can vary', text: 'Your menu may look slightly different depending on which features are switched on for your account. If you cannot find something in this guide, contact {{brand}} support at {{phone}}.' },
        { type: 'video', title: 'Watch: a 5-minute tour', url: '{{website}}', note: 'Prefer video? Scan the code to watch the walkthrough of everything in this chapter.', length: '5 min' },

        { type: 'chapter', title: 'Find your way around', kicker: 'The main menu', intro: 'Everything lives in the menu on the left side of the screen. You will use five areas every day.' },
        { type: 'screenshot', image: '', caption: 'Replace this with a screenshot of your own dashboard. Upload it in the editor and adjust the numbered callouts.', markers: ['8 22 | Main menu', '50 8 | Search contacts', '92 8 | Notifications and profile', '55 50 | Dashboard widgets'] },
        { type: 'table', title: 'What each menu item is for', headers: 'Menu | Use it to | How often', rows: ['Dashboard | See leads, appointments and revenue at a glance | Daily', 'Conversations | Reply to texts, emails and website chats in one inbox | Many times a day', 'Calendars | See and manage booked appointments | Daily', 'Contacts | Find, add and tag every person you work with | Daily', 'Opportunities | Track each deal from new lead to won | Daily', 'Automation | Send follow-ups for you, automatically | Set up once', 'Settings | Business details, team members, phone and email | Rarely'] },

        { type: 'chapter', title: 'Set up your business', kicker: 'One time, 15 minutes', intro: 'Do this once so every message and booking page shows the right name, hours and time zone.' },
        { type: 'steps', title: 'Add your business details', path: 'Settings > Business Profile', items: ['Enter your business name, phone number and address exactly as customers know them.', 'Upload your logo.', 'Set your **time zone**. Appointment times and automations use it.', 'Click **Update Information**.'], result: 'Your logo and business name appear on booking pages and emails.' },
        { type: 'steps', title: 'Invite your team', path: 'Settings > My Staff > Add Employee', items: ['Enter the team member\'s name, email and mobile number.', 'Choose a role: **Admin** for owners and managers, **User** for everyone else.', 'Under permissions, switch off anything they do not need.', 'Click **Save**. They receive an email invite.'], result: 'The new person appears in your staff list with an Invited status.' },

        { type: 'chapter', title: 'Contacts', kicker: 'Your customer list', intro: 'Every lead and customer is a contact. Good contacts make every other feature work.' },
        { type: 'steps', title: 'Add a contact', path: 'Contacts > Add Contact', items: ['Click the **+** button at the top of the contact list.', 'Enter first name, last name, phone and email.', 'Add a **tag** that describes them, such as *new-lead* or *customer*.', 'Click **Save**.'], result: 'The contact appears at the top of your list and you can text or email them.' },
        { type: 'steps', title: 'Import a spreadsheet of contacts', path: 'Contacts > Import Contacts', items: ['Save your spreadsheet as a **CSV** file with one column each for name, phone and email.', 'Click **Import** and upload the file.', 'Match each column to a field, for example *Phone* to *Phone*.', 'Add a tag such as *imported-2026* so you can find this group later.', 'Start the import.'], result: 'A message confirms how many contacts were added or updated.' },
        { type: 'callout', label: 'Pro tip', text: 'Use a small set of tags and write them down. Tags are how you send the right message to the right people later.' },

        { type: 'chapter', title: 'Conversations', kicker: 'One inbox', intro: 'Texts, emails and website chat messages all arrive in one inbox, so nothing gets missed.' },
        { type: 'steps', title: 'Reply to a message', path: 'Conversations', items: ['Click **Unread** to see messages waiting for a reply.', 'Open a conversation to see the full history with that contact.', 'Choose **SMS** or **Email** under the message box.', 'Type your reply and press **Send**.'], result: 'Your reply appears in the thread and the conversation is marked as read.' },

        { type: 'chapter', title: 'Calendars and booking', kicker: 'Let customers book themselves', intro: 'A booking calendar lets customers pick a time that works, without the back-and-forth.' },
        { type: 'steps', title: 'Create a booking calendar', path: 'Calendars > Calendar Settings > Create Calendar', items: ['Choose a simple calendar type for one person, or a round-robin type to share bookings across a team.', 'Name it after the meeting, e.g. *Free Lighting Assessment*.', 'Set the meeting length and the days and hours you are available.', 'Add a buffer between meetings if you need travel time.', 'Click **Save**, then copy the booking link.'], result: 'Opening the booking link in a private browser window shows your available times.' },
        { type: 'steps', title: 'Connect your Google or Outlook calendar', path: 'Settings > Calendars > Connections', items: ['Click **Add new** and choose Google or Outlook.', 'Sign in and allow access.', 'Pick which calendar to check for conflicts.'], result: 'Times already busy in your personal calendar no longer show as available.' },

        { type: 'chapter', title: 'Pipelines and deals', kicker: 'Never lose track of a job', intro: 'A pipeline shows every open deal as a card that moves from left to right as it progresses.' },
        { type: 'steps', title: 'Build your sales pipeline', path: 'Opportunities > Pipelines > Create New Pipeline', items: ['Name it, e.g. *Lighting Projects*.', 'Add stages in order: **New Lead**, **Site Visit Booked**, **Quote Sent**, **Won**, **Lost**.', 'Click **Save**.', 'Open **Opportunities** and drag cards between stages as deals move forward.'], result: 'Each deal shows in the right column with its value and contact.' },

        { type: 'chapter', title: 'Automations', kicker: 'Follow up without thinking about it', intro: 'A workflow does a task for you when something happens. Start with one that replies to every new lead within a minute.' },
        { type: 'steps', title: 'Auto-reply to new website leads', path: 'Automation > Workflows > Create Workflow > Start from Scratch', items: ['Click **Add New Trigger** and choose **Form Submitted**. Pick your website form.', 'Click **+** and add the action **Send SMS**. Write a short, friendly reply.', 'Add the action **Wait** and set it to 1 day.', 'Add **Send Email** with more detail and your booking link.', 'Click **Save**, then switch the workflow from Draft to **Publish**.'], result: 'When you submit your own form as a test, you receive the text within a minute.' },
        { type: 'callout', label: 'Test first', text: 'Always test a workflow with your own phone number and email before your customers see it. Check spelling, links and the sending name.' },
        { type: 'table', title: 'Three more automations worth setting up', headers: 'When this happens | Do this | Why', rows: ['Appointment booked | Send confirmation + reminder 1 day before | Fewer no-shows', 'Deal moved to Won | Send thank-you + review request | More 5-star reviews', 'No reply for 3 days | Send a friendly check-in text | Revives quiet leads'] },

        { type: 'chapter', title: 'Your daily routine', kicker: '10 minutes a day', intro: 'Small daily habits keep the system clean and the leads moving.' },
        { type: 'checklist', title: 'Every morning', items: ['Clear the **Unread** tab in Conversations', 'Check today\'s appointments in Calendars', 'Move any deals that changed stage in Opportunities', 'Call or text every lead that came in overnight'] },
        { type: 'faq', title: 'Common questions', items: ['I forgot my password. What do I do? | On the login page at {{login}}, click **Forgot password** and follow the email.', 'Can I use {{platform}} on my phone? | Yes. Ask {{brand}} for the mobile app name and sign in with the same email and password.', 'Why did a text not send? | The contact may have replied STOP, or the number may be a landline. Check the conversation for an error note.', 'Who do I call for help? | Call {{brand}} support at {{phone}} or visit {{website}}.'] },
        { type: 'cta', title: 'Need a hand?', text: 'Book a free 20-minute setup call with the {{brand}} team and we will build your first workflow with you.', button: 'Book a setup call', url: '{{website}}' },
        { type: 'notes', title: 'My logins and notes', style: 'lined' }
      ]
    }
  },

  {
    key: 'adhdplanner',
    blurb: 'ADHD-friendly daily planner: one priority, brain dump, done list.',
    product: {
      kind: 'Daily Planner',
      title: 'One Thing a Day',
      subtitle: 'An undated, ADHD-friendly daily planner for brains with too many tabs open',
      author: 'Your Name',
      brand: 'Your Studio',
      year: '2026',
      theme: 'focus',
      accent: '',
      cover: 'full',
      paper: 'letter',
      toc: false,
      listing: {
        price: '9',
        audience: 'adults with ADHD, and anyone who finds normal planners overwhelming',
        promise: 'Plan each day around one thing, see where your time actually goes, and notice everything you got done.',
        platform: 'Etsy'
      },
      blocks: [
        { type: 'chapter', title: 'How this planner works', kicker: 'Read me · 2 minutes', intro: 'Most planners ask for a perfect list. This one asks for **one thing**. Everything else on the page is optional.' },
        { type: 'bullets', title: 'Four rules', items: ['**Pick one thing.** If it is the only thing you do, the day still counts.', '**Shrink the first step** until it takes two minutes. Start there.', '**Guess, then add half again.** Time blindness is real. A "20-minute" task gets a 30-minute block.', '**Missed a day? Skip the page.** It is undated on purpose. No catching up, no guilt.'] },
        { type: 'callout', label: 'Use the done list', text: 'Write down what you did, not just what you planned. Answered that email? Drank water? Got out of bed on a hard day? It counts. Seeing it written down builds momentum.' },
        { type: 'table', title: 'Your dopamine menu', headers: 'Quick boost (5 min) | Bigger reset (20 min) | Treat (save for after)', rows: ['Dance to one song | Walk around the block | An episode of a show', 'Cold water on your face | Shower with a good playlist | Coffee somewhere new', 'Stretch next to your desk | Tidy one surface with a podcast on | 30 minutes of a game', ' | | ', ' | | '] },
        { type: 'checklist', title: 'When I get stuck', items: ['Make the task smaller: what is the first two-minute step?', 'Body double: call a friend or join an online focus room', 'Set a 10-minute timer. Stop when it rings, if you want to.', 'Move: a different room, a café, standing up', 'Pick something from the dopamine menu, then try again'] },
        { type: 'adhdday', title: 'Today' },
        { type: 'adhdday', title: 'Today' },
        { type: 'adhdday', title: 'Today' },
        { type: 'adhdday', title: 'Today' },
        { type: 'adhdday', title: 'Today' },
        { type: 'adhdday', title: 'Today' },
        { type: 'adhdday', title: 'Today' },
        { type: 'chapter', title: 'Weekly reset', kicker: '20 minutes, once a week' },
        { type: 'checklist', title: 'Reset checklist', items: ['Empty your bag, pockets and desk', 'Look at next week\'s calendar and circle the busy days', 'Move anything still undone to a brain dump page', 'Refill meds and buy groceries for three easy meals', 'Pick next week\'s one big thing'] },
        { type: 'prompts', title: 'Look back, kindly', items: ['What went better than I expected?', 'What drained me, and can I make it smaller next week?'], lines: 3 },
        { type: 'habit', title: 'Monthly basics', habits: ['Took meds', 'Drank water', 'Moved my body', 'Outside 10 minutes', 'Phone away at bedtime'] },
        { type: 'notes', title: 'Brain dump overflow', style: 'dotted' }
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
      theme: 'viralize',
      accent: '',
      cover: 'glow',
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
