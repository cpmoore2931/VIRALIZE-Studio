/*
 * TEMPLATE LIBRARY — ready-to-sell starters for popular digital products.
 *
 * Each call to add() puts one template in the "New" dialog under a category.
 * Products are the same shape as any saved project (docs/PRODUCT_SCHEMA.md).
 * Helpers keep this file short: rep(n, fn) repeats pages, L() fills the listing.
 * Loaded after templates.js and every block file.
 */
window.Folio = window.Folio || {};

(function () {
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const L = (price, audience, promise, platform = 'Etsy') => ({ price: String(price), audience, promise, platform });
  const add = (key, cat, blurb, p) => Folio.templates.push({
    key, cat, blurb,
    product: Object.assign({ author: 'Your Name', brand: 'Your Studio', year: '2026', accent: '', cover: 'full', paper: 'letter', toc: false }, p)
  });
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const howTo = (items, title = 'How to use this') => ({ type: 'bullets', title, items });

  /* Categories for the starters defined in templates.js */
  const catOf = { ebook: 'Guides & ebooks', trading: 'Business & money', crm: 'Business & money', adhdplanner: 'Planners', workbook: 'Mind & wellness', planner: 'Planners', checklist: 'Business & money', blank: 'Start from scratch' };
  Folio.templates.forEach(t => { t.cat = t.cat || catOf[t.key] || 'Guides & ebooks'; });

  /* ================= PLANNERS ================= */
  add('weekly', 'Planners', 'Undated weekly spreads with priorities and wins.', {
    kind: 'Weekly Planner', title: 'The Calm Week', subtitle: 'An undated weekly planner built around three priorities, not thirty tasks', theme: 'nordic',
    listing: L(8, 'busy people who want a simple, repeatable weekly plan', 'Plan a full week in 15 minutes and actually finish what matters.'),
    blocks: [
      { type: 'chapter', title: 'Plan your week in 15 minutes', kicker: 'Start here', intro: 'Every Sunday, open a fresh spread and work top to bottom.' },
      howTo(['Write your **top 3 priorities** first. Everything else fits around them.', 'Block time for each priority before you add meetings.', 'Use **Wins** on Friday: three things that went well, however small.', 'Undone tasks move to next week once. If they move twice, delete or delegate them.']),
      ...rep(8, i => ({ type: 'weekly', title: `Week ${i + 1}`, side: ['Top 3 priorities', 'Focus blocks', 'Wins'] })),
      { type: 'notes', title: 'Notes', style: 'lined' }
    ]
  });

  add('monthly', 'Planners', 'Twelve undated month pages plus goals.', {
    kind: 'Monthly Planner', title: 'Month by Month', subtitle: 'Twelve undated monthly calendars with space for goals and important dates', theme: 'blush', cover: 'full',
    listing: L(9, 'anyone who plans by the month and likes to see the big picture', 'See every month at a glance and never miss a date that matters.'),
    blocks: [
      { type: 'chapter', title: 'Your year, one month at a time', kicker: 'Start here', intro: 'Fill in the dates at the start of each month, then add birthdays, bills and plans.' },
      howTo(['Number the days in the top corner of each box.', 'Write **fixed dates** first: bills, birthdays, appointments.', 'Pick one goal per month and write it in the sidebar.', 'At month end, circle the best day and note why.']),
      ...rep(12, i => ({ type: 'monthly', title: 'This month', start: 'mon', side: ['Monthly goal', 'Important dates', 'Notes'] })),
      { type: 'prompts', title: 'Year in review', items: ['Which month felt best, and what made it work?', 'What will you do differently next year?'], lines: 4 }
    ]
  });

  add('yearly', 'Planners', 'Year at a glance, goals by quarter and a 12-month calendar.', {
    kind: 'Yearly Planner', title: 'The 2027 Planner', subtitle: 'Your year at a glance, quarterly goals and a dated calendar for every month', theme: 'editorial', cover: 'frame',
    listing: L(14, 'planners who want a dated, full-year overview', 'Set your goals for 2027 and keep every month on track.'),
    blocks: [
      { type: 'yearly', title: 'Year at a glance', year: '2027', start: 'mon' },
      { type: 'chapter', title: 'Set up your year', kicker: 'Start here', intro: 'Big goals get done when they are broken into quarters, then months.' },
      { type: 'table', title: 'Goals by quarter', headers: 'Quarter | Main goal | First step', rows: ['Q1 (Jan–Mar) | | ', 'Q2 (Apr–Jun) | | ', 'Q3 (Jul–Sep) | | ', 'Q4 (Oct–Dec) | | '] },
      { type: 'table', title: 'Dates to remember', headers: 'Date | Event | Prepare by', rows: rep(8, () => ' | | ') },
      ...MONTHS.map((m, i) => ({ type: 'monthly', title: 'This month', month: `2027-${String(i + 1).padStart(2, '0')}`, start: 'mon', side: ['Focus', 'Important', 'Notes'] }))
    ]
  });

  add('lifeorganizer', 'Planners', 'Home, money, health and contacts in one binder.', {
    kind: 'Life Organizer', title: 'Life, Organized', subtitle: 'One binder for your schedule, money, home, health and the details you always forget', theme: 'blush', toc: true,
    listing: L(17, 'people juggling a household, a job and everything in between', 'Find any important detail in seconds and stop running your life from memory.'),
    blocks: [
      { type: 'chapter', title: 'Your week', kicker: 'Plan', intro: 'Start each week here before anything else.' },
      ...rep(2, i => ({ type: 'weekly', title: `Week ${i + 1}`, side: ['Top 3', 'Errands', 'Call / email'] })),
      { type: 'monthly', title: 'This month', side: ['Bills due', 'Birthdays', 'Notes'] },
      { type: 'chapter', title: 'Money', kicker: 'Track', intro: 'Know what comes in, what goes out and what is left.' },
      { type: 'table', title: 'Monthly bills', headers: 'Bill | Amount | Due day | Autopay?', rows: ['Rent / mortgage | | | ', 'Electricity | | | ', 'Water | | | ', 'Internet | | | ', 'Phone | | | ', 'Insurance | | | ', 'Subscriptions | | | ', ' | | | '] },
      { type: 'chapter', title: 'Home and health', kicker: 'Keep', intro: 'The details that are hard to find when you need them.' },
      { type: 'table', title: 'Appointments', headers: 'Who | Doctor / service | Last visit | Next due', rows: rep(6, () => ' | | | ') },
      { type: 'table', title: 'Accounts and renewals', headers: 'What | Provider | Renews | Notes', rows: ['Car insurance | | | ', 'Home insurance | | | ', 'Passport | | | ', 'Driving licence | | | ', ' | | | '] },
      { type: 'callout', label: 'Keep it safe', text: 'Never write passwords in a printed organizer. Use a password manager and note only which one you use.' },
      { type: 'table', title: 'Important contacts', headers: 'Name | Role | Phone | Email', rows: ['Doctor | | | ', 'Dentist | | | ', 'Vet | | | ', 'Plumber | | | ', 'School | | | ', ' | | | '] }
    ]
  });

  add('routine', 'Planners', 'Design morning and evening routines that stick.', {
    kind: 'Routine Builder', title: 'Routines That Stick', subtitle: 'Design a morning and evening routine that fits your real life, then track it for 30 days', theme: 'focus',
    listing: L(9, 'anyone who has tried a routine and dropped it after a week', 'Build a short routine you will still be doing a month from now.'),
    blocks: [
      { type: 'chapter', title: 'Start small', kicker: 'The method', intro: 'A routine fails when it is too long. Start with three steps and add one per week.' },
      howTo(['Anchor each step to something you already do: *after I pour coffee, I…*', 'Keep the first version under **10 minutes**.', 'Track it, but miss a day without guilt. Never miss two.'], 'Three rules'),
      { type: 'table', title: 'My morning routine', headers: 'After I… | I will… | Minutes', rows: ['wake up | drink a glass of water | 1', 'make coffee | write my one thing for today | 3', 'get dressed | step outside for fresh air | 5', ' | | ', ' | | '] },
      { type: 'table', title: 'My evening routine', headers: 'After I… | I will… | Minutes', rows: ['finish dinner | clear the kitchen counter | 5', 'brush my teeth | set out tomorrow\'s clothes | 2', 'get into bed | put my phone across the room | 1', ' | | ', ' | | '] },
      { type: 'habit', title: '30-day routine tracker', habits: ['Morning routine', 'Evening routine', 'Water first thing', 'Phone away at bedtime'] },
      { type: 'prompts', title: 'After 30 days', items: ['Which step became automatic?', 'Which step should I drop or change?'], lines: 3 }
    ]
  });

  const dayPage = (title, prompts, lines = 3) => ({ type: 'prompts', title, items: prompts, lines });
  add('morning', 'Planners', 'A daily morning page: intention, gratitude, one thing.', {
    kind: 'Morning Planner', title: 'Good Mornings', subtitle: 'A five-minute morning page to start every day with intention', theme: 'blush', cover: 'glow',
    listing: L(7, 'people who want a calmer, more intentional start to the day', 'Start each day clear on what matters in five minutes or less.'),
    blocks: [
      { type: 'chapter', title: 'Five minutes, every morning', kicker: 'Start here', intro: 'Before the phone, before the news: one page.' },
      { type: 'checklist', title: 'Morning basics', items: ['Glass of water', 'Open the curtains or step outside', 'Stretch for one minute', 'Fill in today\'s page'] },
      ...rep(14, i => [{ type: 'pagebreak' }, dayPage(`Morning ${i + 1}`, ['Today I\'m grateful for…', 'My intention for today is…', 'The one thing I will finish is…', 'I will feel good today if…'])]).flat()
    ]
  });

  add('night', 'Planners', 'A wind-down page: reflect, release, plan tomorrow.', {
    kind: 'Night Planner', title: 'Slow Evenings', subtitle: 'A calming evening page to close the day and sleep with a clear head', theme: 'nordic', cover: 'full',
    listing: L(7, 'over-thinkers who struggle to switch off at night', 'Put the day down on paper so your mind can rest.'),
    blocks: [
      { type: 'chapter', title: 'Close the day', kicker: 'Start here', intro: 'Ten minutes before bed, screens away, one page.' },
      { type: 'checklist', title: 'Wind-down routine', items: ['Dim the lights', 'Phone on charge outside the bedroom', 'Tidy one small thing', 'Fill in tonight\'s page', 'Read or stretch for 10 minutes'] },
      ...rep(14, i => [{ type: 'pagebreak' }, dayPage(`Evening ${i + 1}`, ['Three good things from today', 'What is on my mind (let it go here)', 'Tomorrow\'s first task', 'Tonight I am proud of…'])]).flat()
    ]
  });

  add('study', 'Planners', 'Exam countdown, weekly study plan and session log.', {
    kind: 'Study Planner', title: 'Study Smarter', subtitle: 'Plan your revision, track focused sessions and walk into every exam prepared', theme: 'focus', toc: true,
    listing: L(8, 'high school and university students', 'Turn a pile of topics into a calm, scheduled revision plan.'),
    blocks: [
      { type: 'chapter', title: 'Plan your revision', kicker: 'Start here', intro: 'Short, spaced sessions beat long cramming. This planner is built around that.' },
      howTo(['Study in **25-minute sessions** with 5-minute breaks.', 'Revisit each topic after 1 day, 3 days and 7 days.', 'Test yourself instead of re-reading. Close the book and write what you remember.'], 'What actually works'),
      { type: 'table', title: 'Exam countdown', headers: 'Subject | Exam date | Days left | Confidence (1–5)', rows: rep(6, () => ' | | | ') },
      { type: 'table', title: 'Topic tracker', headers: 'Topic | Day 1 | Day 3 | Day 7 | Ready?', rows: rep(10, () => ' | | | | ') },
      ...rep(4, i => ({ type: 'weekly', title: `Study week ${i + 1}`, side: ['Topics this week', 'Practice tests', 'Questions for teacher'] })),
      { type: 'journal', title: 'Study session log', columns: ['Date', 'Subject', 'Topic', 'Minutes', 'Focus 1–5', 'What I learned'], rows: 20, foot: ['Total hours', 'Best subject', 'Needs work'] }
    ]
  });

  add('project', 'Planners', 'Brief, milestones, tasks and meeting notes for one project.', {
    kind: 'Project Planner', title: 'Project Playbook', subtitle: 'Take any project from idea to done with a clear brief, milestones and weekly check-ins', theme: 'modern', toc: true,
    listing: L(12, 'freelancers, small teams and side-project builders', 'Know what done looks like, what is next and what is late, at a glance.'),
    blocks: [
      { type: 'chapter', title: 'The brief', kicker: 'Define', intro: 'Fifteen minutes here saves weeks later.' },
      { type: 'prompts', title: 'Project brief', items: ['What are we making, in one sentence?', 'Who is it for?', 'How will we know it is done?', 'Deadline and budget'], lines: 2 },
      { type: 'chapter', title: 'The plan', kicker: 'Organize' },
      { type: 'table', title: 'Milestones', headers: 'Milestone | Owner | Due | Status', rows: rep(8, () => ' | | | ') },
      { type: 'journal', title: 'Task list', columns: ['Task', 'Owner', 'Due', 'Priority', 'Done'], rows: 22, foot: [] },
      { type: 'table', title: 'Risks', headers: 'What could go wrong | How likely | What we will do', rows: rep(5, () => ' | | ') },
      { type: 'chapter', title: 'Check-ins', kicker: 'Weekly' },
      ...rep(4, i => ({ type: 'prompts', title: `Week ${i + 1} check-in`, items: ['Done this week', 'Blocked by', 'Next week'], lines: 2 })),
      { type: 'notes', title: 'Meeting notes', style: 'lined' }
    ]
  });

  add('work', 'Planners', 'Weekly work pages with meetings, deadlines and follow-ups.', {
    kind: 'Work Planner', title: 'Deep Work, Done', subtitle: 'A weekly work planner for meetings, deadlines and the follow-ups that slip through', theme: 'ledger',
    listing: L(10, 'professionals who live in meetings and email', 'Leave work each Friday knowing nothing has been forgotten.'),
    blocks: [
      { type: 'chapter', title: 'Your work week', kicker: 'Start here', intro: 'Monday: plan. Daily: two-minute check. Friday: review.' },
      howTo(['Protect one **focus block** every day before checking email.', 'Write every promise you make in **Waiting on / follow up**.', 'Friday: move unfinished items and clear the page.']),
      ...rep(8, i => ({ type: 'weekly', title: `Week ${i + 1}`, side: ['Deadlines', 'Meetings', 'Waiting on / follow up'] })),
      { type: 'journal', title: 'Follow-up tracker', columns: ['Date', 'Who', 'About', 'Next step', 'Due', 'Done'], rows: 20, foot: [] }
    ]
  });

  /* ================= HOME & FOOD ================= */
  add('cleaning', 'Home & food', 'Daily, weekly, monthly and seasonal cleaning lists.', {
    kind: 'Cleaning Schedule', title: 'A Tidy Home', subtitle: 'A realistic cleaning schedule: 15 minutes a day keeps the big clean away', theme: 'nordic',
    listing: L(6, 'busy households who hate weekend-long cleaning marathons', 'Keep the whole house clean in about 15 minutes a day.'),
    blocks: [
      { type: 'chapter', title: 'Little and often', kicker: 'The method', intro: 'Daily resets, one weekly zone per day and a monthly deep clean.' },
      { type: 'checklist', title: 'Daily reset (15 minutes)', items: ['Dishes done and sink empty', 'Wipe kitchen counters', 'Quick tidy of the living room', 'One load of laundry, start to finish', 'Take out full bins'] },
      { type: 'table', title: 'Weekly zones', headers: 'Day | Zone | Tasks', rows: ['Monday | Kitchen | Fridge clear-out, wipe appliances, mop', 'Tuesday | Bathrooms | Toilet, sink, shower, mirrors, floor', 'Wednesday | Bedrooms | Change sheets, dust, vacuum', 'Thursday | Living areas | Dust, vacuum, cushions', 'Friday | Floors | Hall, stairs, entryway', 'Saturday | Laundry | Towels, catch-up loads', 'Sunday | Rest | Plan the week'] },
      { type: 'checklist', title: 'Monthly', items: ['Clean inside the microwave and oven', 'Wash bins', 'Dust skirting boards and light switches', 'Vacuum under furniture', 'Descale the kettle'] },
      { type: 'checklist', title: 'Seasonal', items: ['Wash windows inside and out', 'Flip mattresses', 'Clean behind appliances', 'Declutter one cupboard per room', 'Test smoke alarms'] },
      { type: 'habit', title: 'Daily reset tracker', habits: ['Dishes', 'Counters', 'Tidy', 'Laundry', 'Zone of the day'] }
    ]
  });

  add('mealprep', 'Home & food', 'Weekly meal plans, a grocery list and prep recipes.', {
    kind: 'Meal Prep Planner', title: 'Prep Once, Eat Well', subtitle: 'Plan the week\'s meals, shop once and prep in two hours', theme: 'focus', cover: 'full',
    listing: L(9, 'families and busy professionals tired of "what\'s for dinner?"', 'Plan a week of meals in 20 minutes and cut takeout spending.'),
    blocks: [
      { type: 'chapter', title: 'The Sunday system', kicker: 'Start here', intro: 'Plan, shop, prep. About two hours once a week.' },
      howTo(['Pick **3 dinners** and make double portions for leftovers.', 'Choose 2 breakfasts and 2 lunches and repeat them all week.', 'Shop from the list on the meal plan page only.', 'Prep: cook grains, roast a tray of vegetables, cook one protein, wash fruit.'], 'Four steps'),
      ...rep(4, i => ({ type: 'mealplan', title: `Week ${i + 1}`, meals: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], side: 'Grocery list' })),
      { type: 'chapter', title: 'Prep-friendly recipes', kicker: 'Starter set' },
      { type: 'recipe', title: 'Sheet-pan chicken and vegetables', serves: '4', time: '35 min', ingredients: ['4 chicken thighs', '2 peppers, sliced', '1 red onion, wedged', '2 cups broccoli', '2 tbsp olive oil', '1 tsp smoked paprika, salt, pepper'], steps: ['Heat oven to 220°C / 425°F.', 'Toss everything with oil and spices on one tray.', 'Roast 30 minutes, turning once.', 'Divide into 4 containers with rice or grains.'], note: 'Keeps 4 days in the fridge.' },
      { type: 'recipe', title: 'Overnight oats', serves: '1', time: '5 min', ingredients: ['½ cup rolled oats', '½ cup milk', '¼ cup yogurt', '1 tsp chia seeds', 'Berries and honey to top'], steps: ['Stir oats, milk, yogurt and chia in a jar.', 'Refrigerate overnight.', 'Top with berries and honey in the morning.'], note: 'Make five jars on Sunday for the whole week.' }
    ]
  });

  add('recipecards', 'Home & food', 'Printable recipe cards with family favorites.', {
    kind: 'Recipe Cards', title: 'Weeknight Favorites', subtitle: 'Six reliable dinners on printable recipe cards, ready for your kitchen binder', theme: 'blush', cover: 'full',
    listing: L(5, 'home cooks who want a short list of dinners that always work', 'Have six go-to dinners you can make without thinking.'),
    blocks: [
      { type: 'recipe', title: 'One-pot tomato pasta', serves: '4', time: '20 min', ingredients: ['350 g spaghetti', '400 g cherry tomatoes, halved', '1 onion, thinly sliced', '4 cloves garlic, sliced', '4 cups water or stock', 'Basil, olive oil, parmesan'], steps: ['Put pasta, tomatoes, onion, garlic and water in a wide pan.', 'Boil, stirring often, for 10 minutes until the liquid is mostly gone.', 'Season, finish with olive oil, basil and parmesan.'] },
      { type: 'recipe', title: 'Honey garlic salmon', serves: '2', time: '15 min', ingredients: ['2 salmon fillets', '2 tbsp honey', '2 tbsp soy sauce', '2 cloves garlic, grated', '1 tbsp butter'], steps: ['Sear salmon skin-side down for 4 minutes.', 'Flip, add butter, garlic, honey and soy.', 'Spoon the sauce over for 2 minutes until glossy.'] },
      { type: 'pagebreak' },
      { type: 'recipe', title: 'Black bean tacos', serves: '4', time: '15 min', ingredients: ['2 cans black beans, drained', '1 tsp cumin, 1 tsp chili powder', '8 small tortillas', 'Avocado, lime, salsa, cheese'], steps: ['Warm beans with spices and a splash of water; mash lightly.', 'Warm tortillas in a dry pan.', 'Fill and top with avocado, salsa and lime.'] },
      { type: 'recipe', title: 'Chicken fried rice', serves: '4', time: '20 min', ingredients: ['3 cups cooked rice (day-old is best)', '2 chicken breasts, diced', '2 eggs', '1 cup frozen peas and carrots', '3 tbsp soy sauce', '2 spring onions'], steps: ['Cook chicken in a hot pan until golden; set aside.', 'Scramble eggs, then add vegetables and rice.', 'Return chicken, add soy sauce, toss for 2 minutes.'] },
      { type: 'pagebreak' },
      { type: 'recipe', title: 'Creamy lentil soup', serves: '6', time: '35 min', ingredients: ['1 cup red lentils', '1 onion, 2 carrots, 2 celery sticks, diced', '1 can coconut milk', '4 cups stock', '2 tsp curry powder'], steps: ['Soften vegetables in oil for 5 minutes.', 'Add lentils, curry powder and stock; simmer 20 minutes.', 'Stir in coconut milk and blend half for a creamy texture.'], note: 'Freezes well for 3 months.' },
      { type: 'recipe', title: 'Baked potato bar', serves: '4', time: '60 min', ingredients: ['4 large potatoes', 'Butter and sour cream', 'Toppings: cheese, chili, broccoli, bacon, chives'], steps: ['Prick potatoes and bake at 200°C / 400°F for 50–60 minutes.', 'Split open and fluff with butter.', 'Set out toppings and let everyone build their own.'] }
    ]
  });

  add('pantry', 'Home & food', 'Pantry, fridge and freezer inventory plus jar labels.', {
    kind: 'Pantry Inventory', title: 'The Organized Pantry', subtitle: 'Know what you have, use what you buy and stop throwing food away', theme: 'nordic',
    listing: L(6, 'households who keep buying things they already have', 'See everything in your pantry, fridge and freezer before you shop.'),
    blocks: [
      { type: 'chapter', title: 'Shop your kitchen first', kicker: 'Start here', intro: 'Update these lists as you unpack groceries. Check them before every shop.' },
      { type: 'journal', title: 'Pantry inventory', columns: ['Item', 'Qty', 'Shelf', 'Best by', 'Restock?'], rows: 22, foot: [] },
      { type: 'journal', title: 'Fridge and freezer', columns: ['Item', 'Qty', 'Date in', 'Use by', 'Plan'], rows: 22, foot: [] },
      { type: 'labels', items: ['Flour', 'Sugar', 'Rice', 'Pasta', 'Oats', 'Lentils', 'Coffee', 'Tea', 'Brown sugar', 'Quinoa', 'Cereal', 'Snacks', 'Baking soda', 'Salt', 'Nuts', 'Beans'], shape: 'round', cols: 4 }
    ]
  });

  add('bride', 'Home & food', 'Timeline, budget, guests, vendors and the day-of schedule.', {
    kind: 'Wedding Planner', title: 'The Bride\'s Planner', subtitle: 'Every checklist, budget and timeline you need from engagement to "I do"', theme: 'luxe', cover: 'frame', toc: true,
    listing: L(15, 'newly engaged couples planning their wedding', 'Plan the whole wedding without missing a single detail.'),
    blocks: [
      { type: 'chapter', title: 'Timeline', kicker: '12 months to go' },
      { type: 'checklist', title: '12–9 months', items: ['Set the budget', 'Draft the guest list', 'Book the venue', 'Book photographer and caterer', 'Choose the wedding party'] },
      { type: 'checklist', title: '8–4 months', items: ['Send save-the-dates', 'Buy the dress and attire', 'Book florist, music and cake', 'Plan the honeymoon', 'Book hair and makeup trial'] },
      { type: 'checklist', title: '3–1 months', items: ['Send invitations', 'Final dress fittings', 'Buy rings', 'Confirm all vendors in writing', 'Write vows'] },
      { type: 'checklist', title: 'The final week', items: ['Give final numbers to the caterer', 'Make the seating chart', 'Pack an emergency kit', 'Pay final balances', 'Rest'] },
      { type: 'chapter', title: 'Budget', kicker: 'Money' },
      { type: 'table', title: 'Wedding budget', headers: 'Category | Budget | Actual | Paid?', rows: ['Venue | | | ', 'Catering | | | ', 'Photography | | | ', 'Attire | | | ', 'Flowers | | | ', 'Music | | | ', 'Cake | | | ', 'Stationery | | | ', 'Rings | | | ', 'Other | | | '] },
      { type: 'chapter', title: 'People', kicker: 'Guests and vendors' },
      { type: 'journal', title: 'Guest list', columns: ['Name', 'Party of', 'Address sent', 'RSVP', 'Meal', 'Table'], rows: 24, foot: ['Invited', 'Attending', 'Declined'] },
      { type: 'table', title: 'Vendors', headers: 'Vendor | Contact | Phone | Deposit | Balance due', rows: rep(8, () => ' | | | | ') },
      { type: 'chapter', title: 'The day', kicker: 'Schedule' },
      { type: 'table', title: 'Day-of timeline', headers: 'Time | What | Who', rows: ['8:00 | Hair and makeup begin | ', '12:00 | Photos | ', '14:00 | Ceremony | ', '15:00 | Cocktail hour | ', '16:30 | Reception | ', '18:00 | Speeches | ', '19:00 | First dance | ', ' | | '] }
    ]
  });

  add('homebinder', 'Home & food', 'House info, maintenance, contacts and emergencies.', {
    kind: 'Home Binder', title: 'Our Home Binder', subtitle: 'Everything about your home in one place: info, maintenance, contacts and emergencies', theme: 'editorial', cover: 'classic', toc: true,
    listing: L(10, 'homeowners, renters and anyone who has hunted for the Wi-Fi password', 'Find any detail about your home in under a minute.'),
    blocks: [
      { type: 'chapter', title: 'Home info', kicker: 'The basics' },
      { type: 'table', title: 'Details', headers: 'Item | Detail', rows: ['Wi-Fi network | ', 'Water shut-off location | ', 'Fuse box location | ', 'Gas meter location | ', 'Bin collection days | ', 'Alarm company | ', 'Spare key with | '] },
      { type: 'callout', label: 'Keep it safe', text: 'Store the binder somewhere private and never write alarm codes or passwords in it.' },
      { type: 'chapter', title: 'Maintenance', kicker: 'Keep it running' },
      { type: 'table', title: 'Maintenance schedule', headers: 'Task | How often | Last done | Next due', rows: ['Replace HVAC filter | 3 months | | ', 'Test smoke alarms | Monthly | | ', 'Clean gutters | Twice a year | | ', 'Service boiler | Yearly | | ', 'Flush water heater | Yearly | | ', 'Check fire extinguisher | Yearly | | '] },
      { type: 'journal', title: 'Repairs and improvements', columns: ['Date', 'What', 'Who did it', 'Cost', 'Warranty'], rows: 18, foot: [] },
      { type: 'chapter', title: 'Contacts and emergencies', kicker: 'Who to call' },
      { type: 'table', title: 'Service contacts', headers: 'Service | Name | Phone | Notes', rows: ['Plumber | | | ', 'Electrician | | | ', 'Landlord / HOA | | | ', 'Insurance | | | ', 'Neighbors | | | '] },
      { type: 'checklist', title: 'Emergency kit', items: ['Water for 3 days', 'Torch and batteries', 'First-aid kit', 'Phone power bank', 'Copies of documents', 'Medications'] }
    ]
  });

  add('weeklyreset', 'Home & food', 'A Sunday reset checklist for home, body and plans.', {
    kind: 'Weekly Reset', title: 'The Sunday Reset', subtitle: 'A one-hour weekly reset for your home, your body and your week ahead', theme: 'blush', cover: 'glow',
    listing: L(5, 'anyone who starts Mondays feeling behind', 'Walk into Monday with a clean home, a clear plan and a calm mind.'),
    blocks: [
      { type: 'chapter', title: 'One hour, once a week', kicker: 'Start here', intro: 'Put on a playlist and work through the lists in order.' },
      { type: 'checklist', title: 'Home (25 min)', items: ['Change bed sheets', 'Start laundry', 'Clear kitchen counters and fridge', 'Take out bins', 'Reset the entryway'] },
      { type: 'checklist', title: 'Body (15 min)', items: ['Shower and skincare', 'Prep three healthy snacks', 'Fill water bottle', 'Lay out Monday\'s clothes'] },
      { type: 'checklist', title: 'Plans (20 min)', items: ['Check the calendar for the week', 'Pick three priorities', 'Plan dinners and write the grocery list', 'Pay any bills due', 'Clear email inbox to zero or near it'] },
      { type: 'prompts', title: 'Reflect', items: ['What went well this week?', 'What will I do differently?'], lines: 3 },
      { type: 'habit', title: 'Reset tracker', habits: ['Home reset', 'Body reset', 'Week planned'] }
    ]
  });

  /* ================= HEALTH & FITNESS ================= */
  add('skincare', 'Health & fitness', 'AM/PM routines, product inventory and a skin log.', {
    kind: 'Skincare Tracker', title: 'Skin Diary', subtitle: 'Track your routine, your products and how your skin responds', theme: 'blush', cover: 'glow',
    listing: L(6, 'skincare lovers who want to know what is actually working', 'See which products help your skin and which ones to stop buying.'),
    blocks: [
      { type: 'table', title: 'My routine', headers: 'Step | Morning | Evening', rows: ['Cleanse | | ', 'Treat / serum | | ', 'Moisturize | | ', 'SPF | | —', ' | | '] },
      { type: 'callout', label: 'One change at a time', text: 'Introduce one new product every two weeks so you can tell what made the difference. Patch-test first.' },
      { type: 'journal', title: 'Product inventory', columns: ['Product', 'Type', 'Opened', 'Use by', 'Verdict'], rows: 16, foot: [] },
      { type: 'habit', title: 'Routine tracker', habits: ['AM routine', 'PM routine', 'SPF', '8 glasses of water', '7+ hours sleep'] },
      { type: 'journal', title: 'Skin log', columns: ['Date', 'Skin today (1–5)', 'Breakouts', 'New product?', 'Notes'], rows: 22, foot: [] }
    ]
  });

  add('water', 'Health & fitness', 'Monthly water tracker with glass-by-glass check-offs.', {
    kind: 'Water Tracker', title: 'Drink Your Water', subtitle: 'A month of glass-by-glass check-offs to make hydration a habit', theme: 'focus', cover: 'full',
    listing: L(3, 'anyone who forgets to drink water during the day', 'Build a daily water habit you can see filling up.'),
    blocks: [
      { type: 'callout', label: 'Make it easy', text: 'Keep a filled bottle where you can see it. Drink a glass after each bathroom break and with every meal.' },
      { type: 'habit', title: 'Water this month', habits: ['Glass 1', 'Glass 2', 'Glass 3', 'Glass 4', 'Glass 5', 'Glass 6', 'Glass 7', 'Glass 8'] },
      { type: 'habit', title: 'Next month', habits: ['Glass 1', 'Glass 2', 'Glass 3', 'Glass 4', 'Glass 5', 'Glass 6', 'Glass 7', 'Glass 8'] }
    ]
  });

  add('sleep', 'Health & fitness', 'Bedtime and wake log with quality ratings.', {
    kind: 'Sleep Tracker', title: 'Sleep Better', subtitle: 'Log your sleep for 30 days and find the habits that help you rest', theme: 'nordic', cover: 'full',
    listing: L(5, 'people who wake up tired and want to find out why', 'Spot the habits behind your best and worst nights.'),
    blocks: [
      { type: 'chapter', title: 'Find your pattern', kicker: 'Start here', intro: 'Log every morning for 30 days. Patterns appear after about two weeks.' },
      howTo(['Fill in the log within 10 minutes of waking.', 'Note caffeine after 2 pm, alcohol and late screens.', 'After 30 days, compare your five best nights with your five worst.'], 'How to track'),
      { type: 'journal', title: 'Sleep log', columns: ['Date', 'In bed', 'Woke', 'Hours', 'Quality 1–5', 'Caffeine late?', 'Notes'], rows: 16, foot: ['Avg hours', 'Avg quality', 'Best night'] },
      { type: 'journal', title: 'Sleep log', columns: ['Date', 'In bed', 'Woke', 'Hours', 'Quality 1–5', 'Caffeine late?', 'Notes'], rows: 16, foot: ['Avg hours', 'Avg quality', 'Best night'] },
      { type: 'habit', title: 'Sleep habits', habits: ['No caffeine after 2 pm', 'Screens off 30 min before bed', 'Same wake-up time', 'Bedroom cool and dark'] },
      { type: 'prompts', title: 'After 30 days', items: ['What do my best nights have in common?', 'One habit I will keep'], lines: 3 }
    ]
  });

  add('fitness', 'Health & fitness', 'A weekly training plan, workout log and habit tracker.', {
    kind: 'Fitness Schedule', title: 'Train Consistently', subtitle: 'A simple weekly training plan and log for strength, cardio and rest', theme: 'modern',
    listing: L(8, 'beginners and returners building a regular workout habit', 'Show up three to four times a week and see your progress on paper.'),
    blocks: [
      { type: 'table', title: 'Weekly plan', headers: 'Day | Workout | Minutes', rows: ['Monday | Strength: full body | 40', 'Tuesday | Walk or easy cardio | 30', 'Wednesday | Strength: full body | 40', 'Thursday | Rest or stretch | 15', 'Friday | Strength: full body | 40', 'Saturday | Long walk, hike or sport | 60', 'Sunday | Rest | —'] },
      { type: 'callout', label: 'Progress rule', text: 'When you can do every set with good form, add a little weight or one more rep next time.' },
      { type: 'journal', title: 'Workout log', columns: ['Date', 'Exercise', 'Sets × reps', 'Weight', 'How it felt'], rows: 22, foot: ['Workouts this month', 'Personal bests'] },
      { type: 'habit', title: 'Monthly tracker', habits: ['Workout', 'Steps goal', 'Stretch', 'Protein at each meal', '7+ hours sleep'] }
    ]
  });

  add('steps', 'Health & fitness', 'Daily step log with weekly totals.', {
    kind: 'Step Tracker', title: '10,000 Steps', subtitle: 'Log your daily steps, beat your weekly total and walk more without trying harder', theme: 'focus',
    listing: L(4, 'walkers building a daily movement habit', 'Walk more each week by tracking a number you can beat.'),
    blocks: [
      { type: 'callout', label: 'Easy wins', text: 'Take a 10-minute walk after each meal. Walk during phone calls. Park further away.' },
      { type: 'journal', title: 'Step log', columns: ['Date', 'Steps', 'Goal met?', 'Walked where', 'Notes'], rows: 16, foot: ['Week total', 'Best day', 'Daily average'] },
      { type: 'journal', title: 'Step log', columns: ['Date', 'Steps', 'Goal met?', 'Walked where', 'Notes'], rows: 16, foot: ['Week total', 'Best day', 'Daily average'] },
      { type: 'table', title: 'Monthly totals', headers: 'Month | Total steps | Daily average | Best day', rows: MONTHS.map(m => `${m} | | | `) }
    ]
  });

  add('calories', 'Health & fitness', 'A food and calorie log with daily totals.', {
    kind: 'Calorie Tracker', title: 'Food Log', subtitle: 'A simple food, calorie and protein diary to understand how you eat', theme: 'ledger',
    listing: L(5, 'people who want to understand their eating without an app', 'See what you eat each day in two minutes of writing.'),
    blocks: [
      { type: 'callout', label: 'Please note', text: 'This log is a general tool, not medical or nutrition advice. Talk to a doctor or registered dietitian about your own needs.' },
      ...rep(3, () => ({ type: 'journal', title: 'Daily food log', columns: ['Date', 'Meal', 'Food', 'Portion', 'Calories', 'Protein (g)'], rows: 20, foot: ['Total calories', 'Total protein', 'Water'] }))
    ]
  });

  add('medication', 'Health & fitness', 'Medication list, daily check-offs and a dose log.', {
    kind: 'Medication Tracker', title: 'My Medications', subtitle: 'Keep every medication, dose and refill in one place, and never wonder "did I take it?"', theme: 'nordic',
    listing: L(5, 'people managing daily medications for themselves or a family member', 'Know exactly what you take, when you took it and when to refill.'),
    blocks: [
      { type: 'callout', label: 'Please note', text: 'This tracker helps you keep records. It is not medical advice. Always follow your doctor\'s and pharmacist\'s instructions.' },
      { type: 'table', title: 'Medication list', headers: 'Medication | Dose | When | Prescribed by | Refill date', rows: rep(8, () => ' | | | | ') },
      { type: 'habit', title: 'Daily check-off', habits: ['Morning meds', 'Midday meds', 'Evening meds', 'Bedtime meds'] },
      { type: 'journal', title: 'Dose log', columns: ['Date', 'Time', 'Medication', 'Dose', 'Side effects', 'Initials'], rows: 22, foot: [] },
      { type: 'table', title: 'Allergies and contacts', headers: 'Item | Detail', rows: ['Allergies | ', 'Doctor | ', 'Pharmacy | ', 'Emergency contact | '] }
    ]
  });

  add('symptom', 'Health & fitness', 'Symptom log plus doctor-visit prep.', {
    kind: 'Symptom Tracker', title: 'Symptom Journal', subtitle: 'Track symptoms, triggers and patterns so your next appointment is more useful', theme: 'focus',
    listing: L(6, 'people with chronic or recurring symptoms', 'Walk into appointments with clear notes instead of fuzzy memories.'),
    blocks: [
      { type: 'callout', label: 'Please note', text: 'This journal is for your records and is not a diagnosis tool. Seek urgent care for severe or sudden symptoms.' },
      { type: 'journal', title: 'Symptom log', columns: ['Date', 'Time', 'Symptom', 'Severity 1–10', 'Possible trigger', 'What helped'], rows: 18, foot: ['Most common', 'Worst day', 'Pattern?'] },
      { type: 'journal', title: 'Symptom log', columns: ['Date', 'Time', 'Symptom', 'Severity 1–10', 'Possible trigger', 'What helped'], rows: 18, foot: ['Most common', 'Worst day', 'Pattern?'] },
      { type: 'prompts', title: 'Before my appointment', items: ['My main concern is…', 'It started on… and happens about…', 'What I have tried so far', 'Questions to ask'], lines: 3 }
    ]
  });

  add('workoutcards', 'Health & fitness', '16 printable no-equipment workout cards.', {
    kind: 'Workout Cards', title: 'Move Anywhere', subtitle: '16 no-equipment exercise cards: shuffle, draw four, do three rounds', theme: 'modern', cover: 'full',
    listing: L(5, 'people who want quick home workouts without planning', 'Get a full-body workout by drawing four cards.'),
    blocks: [
      { type: 'chapter', title: 'Shuffle and draw', kicker: 'How to play', intro: 'Draw four cards. Do each for 40 seconds with 20 seconds rest. Repeat three rounds.' },
      { type: 'cards', title: 'Lower body', style: 'band', items: ['Squats | Feet shoulder-width, sit back and down, stand tall. 15 reps.', 'Reverse lunges | Step back, lower the back knee, return. 10 each leg.', 'Glute bridge | Lie on your back, push hips up, squeeze, lower. 15 reps.', 'Wall sit | Back flat on a wall, knees at 90°. Hold 40 seconds.', 'Calf raises | Rise onto your toes, lower slowly. 20 reps.', 'Side lunges | Step wide, bend one knee, push back. 10 each side.', 'Jump squats | Squat, then jump up softly. 10 reps.', 'Step-ups | Use a sturdy step. 10 each leg.'] },
      { type: 'cards', title: 'Upper body and core', style: 'band', items: ['Push-ups | On knees or toes. Chest to fist height. 10 reps.', 'Plank | Elbows under shoulders, body straight. Hold 40 seconds.', 'Mountain climbers | Plank position, drive knees in fast. 40 seconds.', 'Tricep dips | Use a chair. Lower, then press up. 12 reps.', 'Dead bug | On your back, extend opposite arm and leg. 10 each side.', 'Superman | Lie face down, lift arms and legs, hold 2 seconds. 12 reps.', 'Side plank | Hold 20 seconds each side.', 'Burpees | Squat, jump back, jump in, stand. 8 reps.'] }
    ]
  });

  add('stretching', 'Health & fitness', 'A 10-minute stretching guide with step-by-step moves.', {
    kind: 'Stretching Guide', title: 'Ten-Minute Stretch', subtitle: 'A daily stretching routine for stiff backs, tight hips and desk-bound bodies', theme: 'nordic', toc: true,
    listing: L(7, 'desk workers and anyone who feels stiff', 'Feel looser in ten minutes a day.'),
    blocks: [
      { type: 'chapter', title: 'Before you start', kicker: 'Safety', intro: 'Stretch gently. Mild tension is fine; pain is not.' },
      { type: 'callout', label: 'Please note', text: 'This guide is general information, not medical advice. If you have an injury or condition, check with a doctor or physiotherapist first.' },
      { type: 'chapter', title: 'The routine', kicker: '10 minutes' },
      { type: 'steps', title: 'Neck release', path: 'Seated > 1 minute', items: ['Sit tall, shoulders relaxed.', 'Tilt your right ear toward your right shoulder. Hold 20 seconds.', 'Repeat on the left.', 'Slowly roll your chin to your chest and back up.'], result: 'Your neck feels longer and your shoulders drop.' },
      { type: 'steps', title: 'Cat–cow', path: 'Hands and knees > 1 minute', items: ['Start on hands and knees.', 'Breathe in, drop your belly and lift your head.', 'Breathe out, round your back and tuck your chin.', 'Repeat slowly 8 times.'] },
      { type: 'steps', title: 'Hip flexor stretch', path: 'Kneeling > 2 minutes', items: ['Kneel on your right knee, left foot forward.', 'Tuck your hips under and shift forward gently.', 'Hold 45 seconds, then switch sides.'], result: 'You feel a stretch at the front of the back hip.' },
      { type: 'steps', title: 'Hamstring stretch', path: 'Lying down > 2 minutes', items: ['Lie on your back and loop a towel around your right foot.', 'Straighten the leg toward the ceiling.', 'Hold 45 seconds, then switch.'] },
      { type: 'steps', title: 'Child\'s pose', path: 'Kneeling > 2 minutes', items: ['Sit back on your heels and fold forward.', 'Stretch arms in front, forehead down.', 'Breathe slowly for 10 breaths.'] },
      { type: 'habit', title: '30-day stretch tracker', habits: ['Morning stretch', 'Evening stretch', 'Stood up every hour'] }
    ]
  });

  /* ================= MIND & WELLNESS ================= */
  add('anxiety', 'Mind & wellness', 'Grounding tools, a worry log and gentle prompts.', {
    kind: 'Anxiety Journal', title: 'Calm in Your Pocket', subtitle: 'Grounding tools, a worry log and gentle prompts for anxious days', theme: 'nordic', cover: 'glow',
    listing: L(8, 'people who feel anxious and want practical tools on paper', 'Have a calming tool ready the moment anxiety shows up.'),
    blocks: [
      { type: 'callout', label: 'Please note', text: 'This journal supports, but does not replace, professional care. If you are in crisis, contact local emergency services or a crisis line right away.' },
      { type: 'chapter', title: 'Grounding tools', kicker: 'Use any time' },
      { type: 'checklist', title: '5-4-3-2-1', items: ['Name 5 things you can see', 'Name 4 things you can touch', 'Name 3 things you can hear', 'Name 2 things you can smell', 'Name 1 thing you can taste'] },
      { type: 'steps', title: 'Box breathing', path: '1 minute', items: ['Breathe in for 4.', 'Hold for 4.', 'Breathe out for 4.', 'Hold for 4. Repeat four times.'], result: 'Your shoulders drop and your breathing slows.' },
      { type: 'chapter', title: 'Worry log', kicker: 'Write it down' },
      { type: 'journal', title: 'Worry log', columns: ['Date', 'The worry', 'Likely?', 'Can I act?', 'Next step'], rows: 16, foot: [] },
      ...rep(6, i => [{ type: 'pagebreak' }, { type: 'prompts', title: `Check-in ${i + 1}`, items: ['What am I feeling, and where do I feel it in my body?', 'What is one fact about this situation?', 'What would I say to a friend feeling this way?', 'One kind thing I can do for myself now'], lines: 3 }]).flat()
    ]
  });

  add('wellness', 'Mind & wellness', 'Daily wellness pages, habits and mood tracking.', {
    kind: 'Wellness Journal', title: 'Well, Daily', subtitle: 'A daily wellness journal for mood, movement, rest and small joys', theme: 'focus', cover: 'glow',
    listing: L(8, 'people building healthier daily habits', 'Notice what makes you feel good, then do more of it.'),
    blocks: [
      { type: 'habit', title: 'Wellness habits', habits: ['Water', 'Movement', 'Outside time', 'Real meals', 'Screen-free hour', '7+ hours sleep'] },
      ...rep(14, i => [{ type: 'pagebreak' }, { type: 'prompts', title: `Day ${i + 1}`, items: ['Mood today (1–10) and why', 'How I moved my body', 'Something that made me smile', 'What I need more of tomorrow'], lines: 3 }]).flat()
    ]
  });

  add('therapy', 'Mind & wellness', 'Session prep, notes and between-session reflections.', {
    kind: 'Therapy Journal', title: 'Between Sessions', subtitle: 'Prepare for therapy, capture what you learn and practice in between', theme: 'soft', cover: 'full', toc: true,
    listing: L(9, 'people in therapy who want to get more from each session', 'Arrive at each session prepared and remember what you learned.'),
    blocks: [
      { type: 'chapter', title: 'How to use this journal', kicker: 'Start here', intro: 'Before a session, use the prep page. After, write your takeaways while they are fresh.' },
      { type: 'callout', label: 'Please note', text: 'This journal supports your therapy and does not replace it. Share anything here with your therapist only if and when you want to.' },
      ...rep(6, i => [{ type: 'chapter', title: `Session ${i + 1}`, kicker: 'Prep and notes' }, { type: 'prompts', title: 'Before', items: ['What has been on my mind since last time?', 'What I want to talk about'], lines: 3 }, { type: 'prompts', title: 'After', items: ['Key insight', 'What I will practice this week'], lines: 3 }]).flat(),
      { type: 'notes', title: 'Notes', style: 'lined' }
    ]
  });

  add('mindfulnesscards', 'Mind & wellness', '16 printable mindfulness practice cards.', {
    kind: 'Mindfulness Cards', title: 'Pause Cards', subtitle: '16 one-minute mindfulness practices to cut out and keep close', theme: 'nordic', cover: 'glow',
    listing: L(5, 'busy people who want small moments of calm in the day', 'Find calm in one minute, anywhere.'),
    blocks: [
      { type: 'cards', style: 'filled', items: ['Breathe | In for 4, hold for 4, out for 6. Three times.', 'Listen | Close your eyes and name three sounds near and far.', 'Feet | Press your feet into the floor and notice the support.', 'Sip | Drink a glass of water slowly, noticing each sip.', 'Look | Find five things that are blue around you.', 'Shoulders | Lift them to your ears, then let them drop.', 'Hands | Rub your palms together and feel the warmth.', 'Smile | Smile softly for 30 seconds, even if you do not feel like it.'] },
      { type: 'cards', style: 'filled', items: ['Name it | Say what you feel in one word. Just name it.', 'Window | Look outside for one minute. Notice the sky.', 'Gratitude | Think of one person you are glad exists.', 'Body scan | Notice your head, chest, belly, legs, feet.', 'Slow walk | Walk ten steps as slowly as you can.', 'Hum | Hum one long note and feel the vibration.', 'Release | Clench your fists for 5 seconds, then let go.', 'Kind words | Say to yourself: "I am doing my best."'] }
    ]
  });

  add('moodcards', 'Mind & wellness', '16 emotion cards with what each feeling might need.', {
    kind: 'Mood Cards', title: 'Feelings Cards', subtitle: '16 emotion cards that name the feeling and suggest what it might need', theme: 'blush', cover: 'glow',
    listing: L(5, 'parents, teachers, therapists and anyone learning to name emotions', 'Put a name to a feeling and find a next step.'),
    blocks: [
      { type: 'cards', style: 'band', items: ['Happy | Share it: tell someone about the good thing.', 'Calm | Notice what helped, so you can return to it.', 'Excited | Channel it: start the thing you are excited about.', 'Proud | Write down what you did. You earned this.', 'Grateful | Say thank you to someone today.', 'Hopeful | Take one small step toward what you hope for.', 'Loved | Let it in. Then pass some on.', 'Curious | Ask one more question or look something up.'] },
      { type: 'cards', style: 'band', items: ['Sad | Let yourself feel it. A hug, a walk or a good cry can help.', 'Angry | Pause. Breathe out longer than you breathe in.', 'Worried | Write the worry down. What can you control?', 'Tired | Rest is not lazy. Can you take a short break?', 'Lonely | Reach out to one person, even with a short message.', 'Overwhelmed | Pick one small thing. Just that.', 'Frustrated | Step away for five minutes, then try again.', 'Nervous | Breathe slowly and remind yourself you are prepared.'] }
    ]
  });

  add('visionboard', 'Mind & wellness', 'Prompts, goal areas and affirmation posters for a vision board.', {
    kind: 'Vision Board Kit', title: 'Dream It, Pin It', subtitle: 'Guided prompts, life-area goals and printable affirmations for your vision board', theme: 'blush', cover: 'glow',
    listing: L(9, 'goal-setters who want a vision board that means something', 'Build a vision board you will actually look at and act on.'),
    blocks: [
      { type: 'chapter', title: 'Dream first', kicker: 'Step 1', intro: 'Answer fast, without editing. The first answer is usually the honest one.' },
      { type: 'prompts', title: 'Picture next year', items: ['A perfect ordinary day a year from now looks like…', 'How I want to feel most days', 'Something I want to learn or try'], lines: 3 },
      { type: 'chapter', title: 'Choose your areas', kicker: 'Step 2' },
      { type: 'table', title: 'Life areas', headers: 'Area | What I want | One image idea', rows: ['Health | | ', 'Home | | ', 'Work / money | | ', 'Relationships | | ', 'Fun / adventure | | ', 'Growth | | '] },
      { type: 'chapter', title: 'Print and pin', kicker: 'Step 3', intro: 'Cut out these affirmations and mix them with photos and magazine clippings.' },
      { type: 'wallart', text: 'I am building a life I love', style: 'glow' },
      { type: 'wallart', text: 'Small steps, every day', style: 'arch' },
      { type: 'cards', style: 'filled', items: ['I am allowed to want more', 'I keep promises to myself', 'Good things are coming', 'I choose calm', 'I am proud of how far I have come', 'My future self will thank me', 'I have everything I need to begin', 'This is my year'] }
    ]
  });

  add('goals', 'Mind & wellness', 'Goal-setting sheets with milestones and weekly actions.', {
    kind: 'Goal Setting Sheets', title: 'Goals That Get Done', subtitle: 'Turn one big goal into milestones, weekly actions and a habit you can track', theme: 'focus', toc: true,
    listing: L(7, 'anyone who sets goals in January and forgets them by March', 'Break one big goal into steps you can start this week.'),
    blocks: [
      { type: 'chapter', title: 'Choose one goal', kicker: 'Clarity', intro: 'One goal you finish beats five you start.' },
      { type: 'prompts', title: 'The goal', items: ['My goal, specific and measurable', 'Why it matters to me', 'Done by (date)', 'What could get in the way, and my plan for it'], lines: 2 },
      { type: 'chapter', title: 'Break it down', kicker: 'Milestones' },
      { type: 'table', title: 'Milestones', headers: 'Milestone | Done by | Done?', rows: rep(6, () => ' | | ') },
      { type: 'table', title: 'Weekly actions', headers: 'Week | Action | Done?', rows: rep(12, (i) => `${i + 1} | | `) },
      { type: 'habit', title: 'Daily habit for this goal', habits: ['Daily action', 'Reviewed my goal', 'Told someone about progress'] },
      { type: 'prompts', title: 'Monthly review', items: ['What moved forward?', 'What will I change next month?'], lines: 3 }
    ]
  });

  add('braindump', 'Mind & wellness', 'Dotted brain dump pages with a sort-it-later system.', {
    kind: 'Brain Dump Pages', title: 'Empty Your Head', subtitle: 'Dump every thought on paper, then sort it into do, schedule, delegate or drop', theme: 'focus', cover: 'full',
    listing: L(4, 'over-thinkers and anyone with too many tabs open in their head', 'Clear your mind in 10 minutes and know exactly what to do next.'),
    blocks: [
      { type: 'chapter', title: 'Dump, then sort', kicker: 'The method', intro: 'Set a 10-minute timer and write everything. Then sort.' },
      { type: 'table', title: 'Sort it', headers: 'Do (under 10 min) | Schedule | Delegate | Drop', rows: rep(10, () => ' | | | ') },
      ...rep(8, () => ({ type: 'notes', title: 'Brain dump', style: 'dotted' }))
    ]
  });

  add('timeblock', 'Planners', 'Daily time-blocking sheets with one top priority.', {
    kind: 'Time Blocking Sheets', title: 'Block Your Day', subtitle: 'Daily time-blocking sheets that put your most important work first', theme: 'focus', cover: 'full',
    listing: L(5, 'people who want to stop reacting and start planning their hours', 'Give every hour a job and finish your priority before lunch.'),
    blocks: [
      { type: 'chapter', title: 'How to time block', kicker: 'Start here', intro: 'Decide the night before. Protect the first block for your top priority.' },
      howTo(['Block your top priority first, in your best-energy hours.', 'Add meetings and fixed commitments.', 'Group small tasks like email into one block.', 'Leave one empty block for the unexpected.'], 'Four steps'),
      ...rep(10, () => ({ type: 'adhdday', title: 'Today', oneThing: 'Top priority', basics: ['Plan reviewed', 'Inbox done', 'Break taken', 'Shut-down done'], water: 0, startHour: 7, endHour: 19 }))
    ]
  });

  /* ================= MONEY ================= */
  add('budget', 'Business & money', 'Monthly budget, 50/30/20 guide and expense log.', {
    kind: 'Budget Sheet', title: 'Budget Made Simple', subtitle: 'A monthly budget sheet, the 50/30/20 guide and an expense log that fits on one page', theme: 'ledger', toc: true,
    listing: L(7, 'people starting a budget for the first time', 'Know where your money goes and decide where it should go next month.'),
    blocks: [
      { type: 'chapter', title: 'The 50/30/20 guide', kicker: 'Start here', intro: 'A simple starting split of your take-home pay.' },
      { type: 'table', headers: 'Share | For | Example on $3,000', rows: ['50% | Needs: housing, food, bills, transport | $1,500', '30% | Wants: eating out, fun, shopping | $900', '20% | Saving and extra debt payments | $600'] },
      { type: 'chapter', title: 'Monthly budget', kicker: 'Plan' },
      { type: 'table', title: 'Income', headers: 'Source | Planned | Actual', rows: ['Paycheck | | ', 'Side income | | ', 'Other | | '] },
      { type: 'table', title: 'Expenses', headers: 'Category | Planned | Actual | Difference', rows: ['Housing | | | ', 'Utilities | | | ', 'Groceries | | | ', 'Transport | | | ', 'Insurance | | | ', 'Debt payments | | | ', 'Eating out | | | ', 'Fun | | | ', 'Shopping | | | ', 'Savings | | | ', 'Other | | | '] },
      { type: 'journal', title: 'Expense log', columns: ['Date', 'Item', 'Category', 'Amount', 'Need / want'], rows: 22, foot: ['Total spent', 'Needs', 'Wants'] }
    ]
  });

  add('savings', 'Business & money', 'Shade-a-box savings challenges for three goals.', {
    kind: 'Saving Tracker', title: 'Save It Up', subtitle: 'Shade-a-box savings challenges that make every deposit feel like a win', theme: 'blush', cover: 'glow',
    listing: L(4, 'savers who need motivation they can see', 'Watch your savings grow one shaded box at a time.'),
    blocks: [
      { type: 'savings', title: 'Emergency fund', goal: 1000, boxes: 50, currency: '$' },
      { type: 'savings', title: 'Dream vacation', goal: 2500, boxes: 100, currency: '$' },
      { type: 'savings', title: 'Holiday gifts', goal: 500, boxes: 40, currency: '$' },
      { type: 'prompts', title: 'Stay motivated', items: ['Why this goal matters to me', 'Where the extra money will come from'], lines: 3 }
    ]
  });

  add('expenses', 'Business & money', 'Monthly expense logs and a year summary.', {
    kind: 'Expense Log', title: 'Where It Went', subtitle: 'Log every expense for a month and see exactly where your money goes', theme: 'ledger',
    listing: L(4, 'anyone who gets to the end of the month wondering where the money went', 'See your real spending in black and white.'),
    blocks: [
      ...rep(3, () => ({ type: 'journal', title: 'Expense log', columns: ['Date', 'Where', 'What', 'Category', 'Amount', 'Paid with'], rows: 22, foot: ['Total', 'Biggest category', 'Surprise spend'] })),
      { type: 'table', title: 'Year summary', headers: 'Month | Income | Spent | Saved', rows: MONTHS.map(m => `${m} | | | `) }
    ]
  });

  /* ================= ART & PAPER ================= */
  const art = (key, title, blurb, theme, pieces) => add(key, 'Art & paper', blurb, {
    kind: 'Printable Wall Art', title, subtitle: '', theme, showCover: false,
    listing: L(6, 'people decorating on a budget who love printable art', 'Print at home or at a print shop in any frame size.'),
    blocks: pieces
  });
  art('minimalart', 'Quiet Words', 'Five minimalist typographic prints.', 'editorial', [
    { type: 'wallart', text: 'Slow down', style: 'minimal' },
    { type: 'wallart', text: 'Home is wherever we are together', style: 'minimal' },
    { type: 'wallart', text: 'Breathe', style: 'frame' },
    { type: 'wallart', text: 'Less, but better', style: 'minimal', cite: 'A design principle' },
    { type: 'wallart', text: 'Today is a good day', style: 'frame' }
  ]);
  art('quoteart', 'Say It Loud', 'Six bold quote posters in color.', 'modern', [
    { type: 'wallart', text: 'Do more of what makes you happy', style: 'bold', color: '#2340D6' },
    { type: 'wallart', text: 'You got this', style: 'bold', color: '#E4572E' },
    { type: 'wallart', text: 'Make it happen', style: 'bold', color: '#0F1420' },
    { type: 'wallart', text: 'Good things take time', style: 'bold', color: '#2F5D50' },
    { type: 'wallart', text: 'Stay curious', style: 'bold', color: '#B4506E' },
    { type: 'wallart', text: 'Start where you are', style: 'bold', color: '#A6824A' }
  ]);
  art('aesthetic', 'Soft Glow Posters', 'Four dreamy gradient affirmation posters.', 'viralize', [
    { type: 'wallart', text: 'Little things, made slowly', style: 'glow' },
    { type: 'wallart', text: 'Soft life, strong mind', style: 'arch', color: '#B7A6EC' },
    { type: 'wallart', text: 'Main character energy', style: 'glow' },
    { type: 'wallart', text: 'Romanticize your life', style: 'arch', color: '#F5A6CF' }
  ]);

  const papers = (key, title, blurb, items) => add(key, 'Art & paper', blurb, {
    kind: 'Digital Paper Pack', title, subtitle: '', theme: 'viralize', showCover: false,
    listing: L(4, 'crafters, scrapbookers and digital planners', 'Print or import into any app. Full-page, ready to use.'),
    blocks: items.map(([pattern, color, base, scale]) => ({ type: 'paper', pattern, color, base: base || '', scale: scale || 1 }))
  });
  papers('patternpapers', 'Pastel Pattern Papers', 'Eight pastel pattern papers: gingham, dots, stripes, checks.', [
    ['gingham', '#F5A6CF'], ['gingham', '#9FBFF0'], ['dots', '#B7A6EC', '#FBF8FF', 0.8], ['stripes', '#CDEFDC'],
    ['checker', '#FFD0A8', '', 1.2], ['diagonal', '#F5A6CF'], ['grid', '#9FBFF0'], ['dots', '#F5A6CF', '#FFF7FA', 1.4]
  ]);
  papers('texturepapers', 'Natural Texture Papers', 'Six linen, grain and watercolor textures.', [
    ['linen', '#C8B79E', '#FBF7F0'], ['linen', '#9FBFF0', '#F7FAFF'], ['grain', '#D9C2A3', '#FBF6EE'],
    ['grain', '#B7A6EC', '#FAF8FF'], ['watercolor', '#F5A6CF', '#FFFDFD'], ['watercolor', '#9FBFF0', '#FDFEFF']
  ]);


  /* ================= GENERATED ART ================= */
  add('floralart', 'Art & paper', 'Botanical and bouquet prints, generated as crisp vector art.', {
    kind: 'Floral Wall Art', title: 'In Bloom', subtitle: '', theme: 'editorial', showCover: false,
    listing: L(7, 'flower lovers decorating bedrooms, nurseries and kitchens', 'Print-at-home botanical art in soft, frame-ready colors.'),
    blocks: [
      { type: 'floral', style: 'bouquet', palette: 'blush', seed: 7, text: 'Grow at your own pace' },
      { type: 'floral', style: 'line', palette: 'sage', seed: 12, text: '' },
      { type: 'floral', style: 'single', palette: 'terracotta', seed: 4, text: '' },
      { type: 'floral', style: 'meadow', palette: 'pastel', seed: 21, text: 'Wildflowers' },
      { type: 'floral', style: 'bouquet', palette: 'berry', seed: 33, text: '' },
      { type: 'floral', style: 'line', palette: 'blush', seed: 5, text: 'Bloom', color: '#B4506E' }
    ]
  });

  add('collageart', 'Art & paper', 'Abstract mid-century collage prints in curated palettes.', {
    kind: 'Digital Collage Art', title: 'Shapes & Sun', subtitle: '', theme: 'editorial', showCover: false,
    listing: L(7, 'modern home decorators who love bold, abstract shapes', 'Gallery-wall-ready abstract art you can print in any frame size.'),
    blocks: [
      { type: 'collage', palette: 'terracotta', seed: 3, word: '' },
      { type: 'collage', palette: 'sage', seed: 11, word: 'slow' },
      { type: 'collage', palette: 'pastel', seed: 8, word: '' },
      { type: 'collage', palette: 'ocean', seed: 24, word: 'here' },
      { type: 'collage', palette: 'berry', seed: 15, word: '' },
      { type: 'collage', palette: 'blush', seed: 42, word: 'soft' }
    ]
  });

  add('coloring', 'Art & paper', '12 coloring pages: mandalas, patterns and flowers.', {
    kind: 'Coloring Pages', title: 'Color & Calm', subtitle: 'Twelve relaxing coloring pages for adults: mandalas, flowing patterns and flowers', theme: 'editorial', cover: 'classic',
    listing: L(6, 'adults who color to relax and unwind', 'Twelve printable pages to slow down and switch off.'),
    blocks: [
      ...[1, 2, 3, 4, 5, 6].map(n => ({ type: 'coloring', design: 'mandala', seed: n * 7, caption: `Mandala ${n}` })),
      ...[1, 2, 3].map(n => ({ type: 'coloring', design: 'geometric', seed: n * 5, caption: `Flow ${n}` })),
      { type: 'coloring', design: 'flowers', seed: 7, caption: 'Bouquet' },
      { type: 'coloring', design: 'flowers', seed: 19, caption: 'Bouquet' },
      { type: 'coloring', design: 'meadow', seed: 21, caption: 'Meadow' }
    ]
  });

  const lifeIcons = ['home | Home', 'heart | Love', 'star | Faves', 'coffee | Coffee', 'food | Food', 'plane | Travel', 'camera | Photos', 'music | Music', 'dumbbell | Fitness', 'book | Reading', 'plant | Plants', 'paw | Pets', 'bag | Shop', 'sparkle | Beauty', 'gift | Gifts', 'chat | Reviews', 'question | FAQ', 'mail | Contact', 'work | Work', 'idea | Tips'];
  const plannerIcons = ['calendar | Appt', 'check | Done', 'bell | Reminder', 'clock | Due', 'cart | Groceries', 'money | Pay day', 'cake | Birthday', 'phone | Call', 'mail | Email', 'pin | Errand', 'dumbbell | Workout', 'leaf | Self care', 'sun | Day off', 'moon | Early night', 'plane | Trip', 'pen | Write', 'book | Study', 'user | Meeting', 'cloud | Rest', 'flower | Treat'];
  add('iconpack', 'Art & paper', 'Line icon set as highlight covers and planner stickers.', {
    kind: 'Icon Pack', title: 'Everyday Icons', subtitle: '', theme: 'blush', showCover: false,
    listing: L(6, 'Instagram creators, small shops and digital planners', 'A matching icon set for highlight covers, planners and websites.'),
    blocks: [
      { type: 'icons', title: 'Highlight covers · Blush', items: lifeIcons, style: 'circle', cols: 4 },
      { type: 'icons', title: 'Highlight covers · Neutral', items: lifeIcons, style: 'circle', color: '#5A4A3F', fill: '#EFE6DC', cols: 4 },
      { type: 'icons', title: 'Highlight covers · Pastel', items: lifeIcons, style: 'circle', color: '#6B5BD6', fill: '#ECE8FF', cols: 4 },
      { type: 'icons', title: 'Planner stickers', items: plannerIcons, style: 'sticker', cols: 5 },
      { type: 'icons', title: 'Planner tiles', items: plannerIcons, style: 'tile', color: '#2F5D50', fill: '#E3EEE8', cols: 5 }
    ]
  });

  add('stationery', 'Art & paper', 'Letterheads, notepaper and thank-you cards.', {
    kind: 'Stationery Set', title: 'Paper Goods', subtitle: '', theme: 'editorial', showCover: false,
    listing: L(6, 'small businesses and people who still love writing letters', 'Personalize, print and write.'),
    blocks: [
      { type: 'letterhead', name: 'Your Name', line: 'Studio · City', footer: 'hello@yourstudio.com · yourstudio.com', ruled: false },
      { type: 'letterhead', name: 'Notes', line: 'From the desk of Your Name', footer: '', ruled: true },
      { type: 'cards', style: 'outline', items: ['Thank you | for being here', 'Thank you | for your order', 'You made my day', 'Just a note', 'With love', 'Congratulations', 'Thinking of you', 'Hello, friend'] }
    ]
  });

  add('labels', 'Art & paper', 'Pantry, closet and kids\' room label sheets.', {
    kind: 'Label Templates', title: 'Label Everything', subtitle: '', theme: 'blush', showCover: false,
    listing: L(4, 'organizers who love a labeled jar and a tidy closet', 'Print on sticker paper and label your whole home in an afternoon.'),
    blocks: [
      { type: 'labels', shape: 'round', cols: 4, items: ['Flour', 'Sugar', 'Rice', 'Pasta', 'Oats', 'Coffee', 'Tea', 'Cereal', 'Lentils', 'Quinoa', 'Nuts', 'Snacks', 'Salt', 'Spices', 'Baking', 'Beans'] },
      { type: 'labels', shape: 'rect', cols: 3, items: ['Towels', 'Bed linen', 'Winter', 'Summer', 'Shoes', 'Bags', 'Scarves', 'Hats', 'Gym', 'Cables', 'Batteries', 'Documents', 'Gift wrap', 'First aid', 'Cleaning'] },
      { type: 'labels', shape: 'pill', cols: 3, items: ['Toys', 'Books', 'Art', 'Blocks', 'Dolls', 'Cars', 'Puzzles', 'Games', 'Dress up', 'Crafts', 'Lego', 'Stuffies'] }
    ]
  });

  /* Product photos for the New dialog (assets/covers/<key>.jpg, generated as listing-style mockups). */
  Folio.templates.forEach(t => { if (!t.image) t.image = `assets/covers/${t.key}.jpg`; });
})();
