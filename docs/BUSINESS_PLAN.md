# Can Viralize Studio become a real app to sell?

Short answer: **yes.** The product already does the hard, visible part. Making it a
business means adding accounts, payments and a small server, and getting the
legal basics right. This is a realistic plan, not a promise of revenue.

## Who would pay, and why

People selling printables and digital products on Etsy, Gumroad, Stan and Payhip.
They currently stitch together Canva (design), a spreadsheet or eRank/EverBee
(research) and a mockup generator (listing photos). Viralize Studio does all
three in one place:

1. **Find a product worth making**: the Trends view, built on real Google search
   demand and Etsy competition.
2. **Make it fast and well**: 58 ready-made starters, print-ready PDF export, a quality score.
3. **List it**: listing copy plus product mockup photos.

Our own market data (Trends view, Nov 2026) shows the demand is real: "coloring pages for
adults" ~74k–90k US searches a month, "habit tracker" ~18k (doubling in January),
"2027 planner" grew from 170 to 18,100 searches a month in a year, "Sunday reset
checklist" +124% in three months with no dominant Etsy sellers.

## What exists today

- Editor, 22+ page types, themes, brand kits (white label), PDF export
- 58 starters with real content and product photos
- Trends view with a data snapshot
- Runs as a static site on Vercel, saves work in the browser only

## What a sellable version needs

| Need | Why | Typical tool | Effort |
| --- | --- | --- | --- |
| Accounts + cloud save | Work is in one browser today and can be lost | Supabase or Firebase | 1–2 weeks |
| Payments + plans | Charge monthly, gate premium starters/AI | Stripe Checkout + Billing | ~1 week |
| Small server (API) | API keys (Treg, image AI) must never sit in the browser | Vercel serverless functions | ~1 week |
| Live trends | Refresh demand data weekly instead of a snapshot | Scheduled job calling Treg/DataForSEO | 2–3 days |
| On-demand mockups | "Make a photo of my product" button | Image model via the server, with per-user limits | 3–5 days |
| Reliable PDF export | Browser print varies; a server render is consistent | Headless Chrome on the server | 3–5 days |
| Terms, privacy, refunds | Required to take payments | Lawyer-reviewed templates | Ongoing |

A focused developer (or you with an AI assistant) could ship a paid beta in
roughly **6–10 weeks**.

## Costs per customer (rough)

- Trends data: one $0.09 keyword call covers ~1,000 keywords for **all** users; a weekly refresh is under $5/month total.
- Mockup photos: ~$0.03 each. 30 per user per month ≈ $0.90.
- Hosting, database and email: about $25–75/month to start.

At **$12–19/month** per seller, a single customer covers their own AI cost many times over.
For comparison (approximate public prices): Canva Pro ~$15/mo, eRank ~$6–10/mo,
EverBee ~$30/mo. Bundling creation + research + mockups is the pitch.

## Risks to check before launching

- **Name**: "VIRALIZE" is registered to **Antithica LLC** (San Antonio, TX): USPTO serial
  99209525, Reg. No. 8141746, registered Feb 17, 2026, **Class 35** (marketing/advertising services).
  Two follow-ups for selling the app itself:
  1. Software is usually **Class 9** (downloadable software) and **Class 42** (software as a service).
     Consider filing VIRALIZE (or "VIRALIZE STUDIO") in those classes too.
  2. A separate VIRALIZE registration exists, Reg. No. 5409705, owned by Viralize SRL (Italy), covering
     Classes 9, 35 and 42. Check its current status on USPTO TSDR and ask a trademark attorney whether
     it affects a software product.
- **AI image rights**: confirm the image model's terms allow commercial use of outputs and
  that generated covers do not copy real brands or artists.
- **Fonts and libraries**: current fonts are Google Fonts (open licenses) — fine to use commercially.
- **Health and finance products**: keep the "not medical / financial advice" notes the app already adds.
- **Etsy data**: use official APIs or licensed data providers for anything shown to paying users.

## Ideas to come back to

- **Amazon (already a registered seller account, unused so far).** Print-on-demand T-shirts and similar
  merch through Merch by Amazon or a POD partner, and digital products / low-content books through
  Amazon KDP. The app's research already shows Amazon prices and "bought in past month" counts; a
  T-shirt design generator (transparent PNG, 4500×5400) would be the natural next feature.

## Suggested next steps

1. Pick 10–20 Etsy sellers and offer the current app free for feedback.
2. Add accounts + cloud save (biggest gap for real users).
3. Add Stripe with one plan and a free tier (e.g. 3 products, no AI photos).
4. Move Trends and mockups behind the server so they run live.
