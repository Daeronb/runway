'use strict';
/* Runway rule data — every card carries a verified date; cards go STALE after 6 months.
   Windows: 'cal' = calendar year, 'roll' = rolling 365 days, 'both' = whichever is higher.
   Stance: good = crypto-off-ramp friendly, warn = conditional/complex, bad = danger zone. */

const RULES_BUILT = '2026-07-12';
const STALE_DAYS = 183;

// Full logging list (flag, name, region). Countries without a RULES entry get the generic 183-day caution.
const COUNTRIES = {
  TH:{n:'Thailand',f:'\u{1F1F9}\u{1F1ED}',r:'Southeast Asia',m:[4,4]}, MY:{n:'Malaysia',f:'\u{1F1F2}\u{1F1FE}',r:'Southeast Asia',m:[4,5]},
  VN:{n:'Vietnam',f:'\u{1F1FB}\u{1F1F3}',r:'Southeast Asia',m:[6,4]}, ID:{n:'Indonesia',f:'\u{1F1EE}\u{1F1E9}',r:'Southeast Asia',m:[5,6]},
  PH:{n:'Philippines',f:'\u{1F1F5}\u{1F1ED}',r:'Southeast Asia',m:[7,4]}, KH:{n:'Cambodia',f:'\u{1F1F0}\u{1F1ED}',r:'Southeast Asia',m:[5,4]},
  LA:{n:'Laos',f:'\u{1F1F1}\u{1F1E6}',r:'Southeast Asia',m:[5,3]}, SG:{n:'Singapore',f:'\u{1F1F8}\u{1F1EC}',r:'Southeast Asia',m:[4,6]},
  MM:{n:'Myanmar',f:'\u{1F1F2}\u{1F1F2}',r:'Southeast Asia',m:[4,3]}, BN:{n:'Brunei',f:'\u{1F1E7}\u{1F1F3}',r:'Southeast Asia',m:[5,5]},
  TL:{n:'Timor-Leste',f:'\u{1F1F9}\u{1F1F1}',r:'Southeast Asia',m:[6,6]},
  JP:{n:'Japan',f:'\u{1F1EF}\u{1F1F5}',r:'East Asia',m:[7,1]}, KR:{n:'South Korea',f:'\u{1F1F0}\u{1F1F7}',r:'East Asia',m:[6,1]},
  TW:{n:'Taiwan',f:'\u{1F1F9}\u{1F1FC}',r:'East Asia',m:[7,2]}, HK:{n:'Hong Kong',f:'\u{1F1ED}\u{1F1F0}',r:'East Asia',m:[6,2]},
  CN:{n:'China',f:'\u{1F1E8}\u{1F1F3}',r:'East Asia',m:[5,1]}, MO:{n:'Macau',f:'\u{1F1F2}\u{1F1F4}',r:'East Asia',m:[6,3]},
  MN:{n:'Mongolia',f:'\u{1F1F2}\u{1F1F3}',r:'East Asia',m:[5,0]},
  IN:{n:'India',f:'\u{1F1EE}\u{1F1F3}',r:'South Asia',m:[2,3]}, LK:{n:'Sri Lanka',f:'\u{1F1F1}\u{1F1F0}',r:'South Asia',m:[2,5]},
  NP:{n:'Nepal',f:'\u{1F1F3}\u{1F1F5}',r:'South Asia',m:[3,2]}, MV:{n:'Maldives',f:'\u{1F1F2}\u{1F1FB}',r:'South Asia',m:[2,6]},
  BD:{n:'Bangladesh',f:'\u{1F1E7}\u{1F1E9}',r:'South Asia',m:[3,3]}, BT:{n:'Bhutan',f:'\u{1F1E7}\u{1F1F9}',r:'South Asia',m:[4,2]},
  KZ:{n:'Kazakhstan',f:'\u{1F1F0}\u{1F1FF}',r:'Central Asia',m:[3,0]}, KG:{n:'Kyrgyzstan',f:'\u{1F1F0}\u{1F1EC}',r:'Central Asia',m:[3,1]},
  UZ:{n:'Uzbekistan',f:'\u{1F1FA}\u{1F1FF}',r:'Central Asia',m:[2,1]}, GE:{n:'Georgia',f:'\u{1F1EC}\u{1F1EA}',r:'Central Asia',m:[1,1]},
  AE:{n:'UAE (Dubai)',f:'\u{1F1E6}\u{1F1EA}',r:'Benchmark',m:[0,2]},
  PY:{n:'Paraguay',f:'\u{1F1F5}\u{1F1FE}',r:'South America',m:[0,8]}, UY:{n:'Uruguay',f:'\u{1F1FA}\u{1F1FE}',r:'South America',m:[1,8]},
  AR:{n:'Argentina',f:'\u{1F1E6}\u{1F1F7}',r:'South America',m:[2,8]},
  NL:{n:'Netherlands',f:'\u{1F1F3}\u{1F1F1}',r:'Home',m:[0,0]},
  XX:{n:'Other / in transit',f:'\u{1F30F}',r:'Other'}
};

const GENERIC_RULE = {
  tax:{days:183,window:'both',label:'~183 days (generic caution)',
    note:'No researched rule card for this country yet — Runway applies the generic 183-day caution used by most tax systems. Verify locally before long stays.'},
  crypto:{stance:'warn',head:'Unresearched',body:'No rule card yet. Treat as unknown: fine to travel, do not off-ramp or hit residency thresholds here without doing the homework first.'},
  trading:{stance:'warn',head:'Unresearched',body:'No trading rule card yet — assume gains could be taxed as income until you verify locally.'},
  visa:{days:null,label:'Check before travel',note:'Visa rules not loaded for this country.'},
  verified:RULES_BUILT, sources:[]
};

const STRATEGY=[
{ id:'nowhere', icon:'\u{1F9ED}', accent:'warn',
  title:'Perpetual traveler / “tax-resident nowhere”',
  sub:'Can you just sell while resident nowhere? Legal, but fragile.',
  body:[
   {h:'Short answer',p:'Being tax-resident nowhere at the moment you sell is legally possible, and crypto gains have no fixed “source country” — so in principle no state has an automatic claim. The Netherlands has no exit tax on privately-held crypto: it is not aanmerkelijk belang, so no conserverende aanslag applies, and box 3 is an annual levy, not a toll on the way out. But “nowhere” is a weak position in practice — the three edges below are where it breaks.'},
   {h:'Edge 1 — residency judges the WHOLE year',p:'Most day-count rules look back over the entire calendar year, not just the day you sold. Sell in March, then spend 180 days in Thailand by October, and you are Thai tax-resident for that year — including the March sale. Vietnam’s 12-month window can reach across a year boundary. And the Netherlands can deem you never to have left if you return within a year without genuinely becoming resident somewhere else. Lesson: in the year you sell, do not accidentally become resident anywhere that taxes worldwide income.'},
   {h:'Edge 2 — banks and exchanges force a residence on you',p:'Every exchange and bank now demands a declared tax residence, and EU crypto reporting (DAC8/CARF) is live from 1 Jan 2026: providers collect your tax residence + transaction data and report it to that country’s tax authority (first exchange due by Sep 2027). Declare “nowhere” and you are either refused or reported to the last residence on file — which for you is the Netherlands. This is why getting a Tax Residency Certificate from a friendly country (Malaysia, UAE) BEFORE a big off-ramp beats nowhere-residency: it gives the report a clean place to land.'},
   {h:'Edge 3 — proof for your ~2031 return to NL',p:'When you move back with the proceeds, the Belastingdienst can ask where the money came from. Your defence is a clean paper trail: the trip log in this app, exported backups, exchange statements, and ideally a TRC showing you were genuinely resident somewhere low- or zero-rate when you sold. “I was resident nowhere” is the answer that invites the most questions.'}
  ],
  verified:'2026-07-13',
  sources:[['EU Commission — DAC8','https://taxation-customs.ec.europa.eu/taxation/tax-transparency-cooperation/administrative-co-operation-and-mutual-assistance/directive-administrative-cooperation-dac/dac8_en'],['Belastingdienst — emigration checklist','https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/checklist-emigration']]
},
{ id:'sequencing', icon:'\u{1FA9C}', accent:'good',
  title:'Off-ramp sequencing checklist (Kraken)',
  sub:'The order of operations for a clean cash-out.',
  checklist:[
   'Choose the residence you will sell UNDER first — a 0%/low-rate friendly country (Malaysia, Philippines, UAE, Paraguay) where you can get a real Tax Residency Certificate — and set it up BEFORE you sell, not after.',
   'Become genuinely resident there: enough days, a TRC, a cédula — so the residence you declare to Kraken and your bank is true and defensible.',
   'Mind the calendar year: sell in a year where no OTHER country’s day-count also catches you. Cleanest pattern — sell in year N while not yet resident in any worldwide-tax country, or use a residence where it is moot (Malaysia taxes no foreign capital gains anyway).',
   'Update your residence on Kraken and banks — expect re-KYC. Kraken’s EU arm (Payward Europe, MiCA-licensed via the Central Bank of Ireland) only serves the 30 EU/EEA countries; moving to Thailand/Malaysia/Philippines migrates you to Kraken’s non-EEA entity and a fresh verification. Do this deliberately, not mid-sale.',
   'Send coins from cold storage to the exchange only when ready to sell — minimise the window they sit on a platform (counterparty risk; no deposit-guarantee scheme covers crypto or the cash proceeds).',
   'Sell, then move the fiat OUT quickly to a bank/EMI that accepts your new residence. A Dutch bank may restrict or close a non-EU-resident account; Wise and Revolut are also residence-based — line up the receiving account before you sell.',
   'Keep everything: exchange statements, TRC, trip-log export. This is your source-of-funds evidence for the ~2031 NL return.'
  ],
  body:[
   {h:'The principle under all of it',p:'The taxable event is the SALE, not the withdrawal. What matters is where you are tax-resident at the moment of sale — later residency does not reach back, but same-calendar-year rules can. Everything above is about making sure the residence you sell under is the one you want, and that it is real.'}
  ],
  verified:'2026-07-13',
  sources:[['Kraken — MiCA license (Central Bank of Ireland)','https://blog.kraken.com/news/mica-license-central-bank-of-ireland'],['Kraken — where licensed/regulated','https://support.kraken.com/articles/where-is-kraken-licensed-or-regulated'],['EU Commission — DAC8','https://taxation-customs.ec.europa.eu/taxation/tax-transparency-cooperation/administrative-co-operation-and-mutual-assistance/directive-administrative-cooperation-dac/dac8_en']]
},
{ id:'emergency', icon:'\u{1F6A8}', accent:'bad',
  title:'Emergency cash-out (sudden bull run)',
  sub:'~3 days to react. What actually maximises what you keep.',
  body:[
   {h:'Before 2028 — just go home',p:'Pre-2028 the Netherlands is CHEAP for a one-time sale: Box 3 taxes ~2.8% of your holdings’ 1-January VALUE and does NOT tax the realised gain at all. So if a life-changing run hits while you are already out but before the 2028 werkelijk-rendement regime, the play is simple: fly back to NL, re-register (returning within a year can even deem you never to have left), sell as a Dutch resident, pay the modest wealth tax, done. No 30%+ CGT anywhere. This is the base case for 2026–27.'},
   {h:'From 2028 — the real scenario',p:'Once NL taxes gains (including unrealised) at ~36%, going home is the expensive option and this playbook applies. Core truth: what taxes the sale is your tax residence on sale day PLUS where you spend the rest of the calendar year. In 3 days you cannot build a genuine new residency or TRC — so do not try. Sell from a place that is 0% even WITHOUT residency, and do not trigger a taxed residency afterwards.'},
   {h:'The 3-day playbook',p:'1) Fly to a zero-CGT, deep-liquidity hub — Singapore or Hong Kong (no CGT, best banking/OTC for 8-figure sums, 90d visa-free); Dubai as backup. 2) The bottleneck is BANKING, not tax — line up an OTC desk plus a receiving bank/EMI that will not freeze a sudden large inflow. 3) Sell (one taxable event; split only for liquidity, or to straddle a Dec/Jan year boundary). 4) Get the fiat off the exchange fast. 5) Lock your calendar so you cross no country’s 180/183-day worldwide-tax threshold this year. 6) Call a cross-border crypto tax advisor the same day — on this much money the fee is a rounding error.'},
   {h:'Prep beats scramble',p:'The people who win this set it up in advance: an accurate, favourable declared residence on Kraken and banks; a pre-opened receiving account in a 0% hub; a pre-KYC’d OTC desk; live day-count awareness (this app); and an NL exit timed around 2028. Do those five and “sell now” becomes a phone call, not a crisis.'}
  ],
  verified:'2026-07-13',
  sources:[['EU Commission — DAC8','https://taxation-customs.ec.europa.eu/taxation/tax-transparency-cooperation/administrative-co-operation-and-mutual-assistance/directive-administrative-cooperation-dac/dac8_en'],['IMI — livable 0% crypto countries 2026','https://www.imidaily.com/analysis/20-livable-countries-that-dont-tax-crypto-gains-in-2026/'],['Deloitte — NL Box 3 actual-return bill','https://www.deloitte.com/nl/en/services/tax/perspectives/wetsvoorstel-wet-werkelijk-rendement-box-3-aangenomen-tweede-kamer.html']]
},
{ id:'buysell', icon:'\u{1F4B1}', accent:'info',
  title:'Buy vs sell: what actually triggers tax',
  sub:'Only disposals are taxable. Buying is free.',
  body:[
   {h:'Buying with fiat = nothing to declare',p:'Converting euros to crypto is never an income or gains event, anywhere. It only sets your cost basis and starts your holding clock. Your €45k cash → crypto on Kraken triggers zero tax. You can accumulate and rebalance INTO crypto freely.'},
   {h:'What DOES trigger',p:'Disposals only: (a) selling crypto for fiat; (b) swapping one coin for another — a crypto-to-crypto trade is a SALE of the first coin in most CGT countries, so a “buy” funded by selling BTC is taxable; (c) spending crypto on goods. Gain = proceeds minus cost basis at that moment.'},
   {h:'Two exceptions to “buying is free”',p:'1) WEALTH taxes hit the holding regardless of buy/sell — NL Box 3, Argentina Bienes Personales, Switzerland — they tax the VALUE on an assessment date, so buying more raises that base. 2) A few countries add tiny transaction taxes on trades (including buys) on their LOCAL licensed exchanges (Indonesia; India’s 1% TDS mechanics). Neither touches you buying on Kraken’s EU entity.'},
   {h:'Upshot for you',p:'Accumulating and rebalancing is tax-silent. The entire plan is about the SELL — when, and tax-resident where. Until then only your NL Box-3 value (pre-2028) and counterparty risk on Kraken matter.'}
  ],
  verified:'2026-07-13',
  sources:[['CoinLedger — crypto tax guide 2026','https://coinledger.io/guides/crypto-tax'],['Koinly — crypto taxes 2026','https://koinly.io/guides/crypto-taxes/']]
},
{ id:'trading', icon:'\u{26A1}', accent:'good',
  title:'Trading often without getting taxed',
  sub:'Where occasional day-trading stays untaxed.',
  body:[
   {h:'Why NL works now',p:'NL does not tax per-trade gains — Box 3 only reads your year-end wealth VALUE, so trading frequency is irrelevant pre-2028. From 2028 the actual-return regime taxes the gains themselves, killing this edge — another reason the whole plan pivots on 2028.'},
   {h:'The best replacements',p:'UAE (Dubai): 0% personal income, 0% CGT, no wealth tax — trade as often as you like, individual gains untaxed regardless of frequency. The cleanest daytrader base. Georgia: individual crypto gains officially untaxed (deemed non-Georgian-source), also frequency-agnostic. Both beat NL because there is not even a year-end wealth levy.'},
   {h:'The reclassification catch',p:'No-CGT countries that DO watch frequency: Malaysia, Singapore, Hong Kong, Malta. Occasional trades are fine, but high-frequency “business-like” trading can be reclassified as taxable trade income (SG up to ~22%, HK 15% profits tax). Fine now-and-again, risky as a full-time activity. Thailand is remittance-based: trade offshore, do not remit, stays untaxed.'},
   {h:'Bottom line',p:'For active-ish trading with zero tax and no frequency risk: UAE > Georgia > (NL pre-2028). For your Asia base, Malaysia / HK / SG are fine if trading stays clearly occasional and non-professional.'}
  ],
  verified:'2026-07-13',
  sources:[['Koinly — crypto tax-free countries 2026','https://koinly.io/blog/crypto-tax-free-countries/'],['TokenTax — Dubai crypto tax 2026','https://tokentax.co/blog/dubai-crypto-tax'],['TaxRavens — Georgia crypto 0%','https://taxravens.com/en/georgia/crypto-tax-haven']]
},
{ id:'systems', icon:'\u{1F9EE}', accent:'info',
  title:'The 3 tax systems (the idea behind every card)',
  sub:'Territorial vs worldwide vs remittance.',
  body:[
   {h:'Worldwide',p:'Taxes your global income and gains once you are resident, wherever earned. NL, Japan, Korea, India, Argentina, most of the West. This is the type you must AVOID being resident in during a big sale.'},
   {h:'Territorial',p:'Taxes only locally-sourced income; foreign income and gains are untaxed. Paraguay, Philippines (for foreigners), Hong Kong, Malaysia (largely), Georgia (crypto deemed non-source). Off-ramp foreign-held crypto here and it is 0%.'},
   {h:'Remittance',p:'Foreign income is taxed only if you BRING it into the country. Thailand (post-2024 rules). Sell offshore, keep the proceeds offshore, remit only living money → little or no tax. A timing game.'},
   {h:'Plus: no-tax and wealth-tax',p:'No-tax hubs (UAE) tax nothing personal. Wealth-tax systems (NL Box 3, Switzerland, Argentina) tax the VALUE you hold, not the gain — friendly to trading, but a levy on merely owning. Match your move to the system, not the marketing.'}
  ],
  verified:'2026-07-13',
  sources:[['IMI — 0% crypto countries 2026','https://www.imidaily.com/analysis/20-livable-countries-that-dont-tax-crypto-gains-in-2026/'],['Rumavi — territorial tax SE Asia','https://rumavi.com/en/property-guides/territorial-tax-residency-and-overseas-income-in-southeast-asia']]
}
];

const RULES = {

IN: {
  trading:{stance:'bad',head:'Worst case for active trading',body:'The flat 30% VDA tax hits every gain and a 1% TDS fires on every single trade, with no loss offset — churning bleeds fast. Avoid entirely while resident.'},
  tax:{days:182,window:'cal',label:'≥182 days / year → worldwide income taxed',
    note:'182 days in a tax year (1 Apr–31 Mar) makes you a resident, and residents are taxed on WORLDWIDE income. The new Income-Tax Act 2025 (in force 1 Apr 2026) keeps 182 days as the core test; a 120-day trigger only bites people with over ₹15 lakh of India-source income. Stay under 182 days = non-resident, only India-source income taxed. Returning NRIs get an RNOR grace that shields foreign income for up to ~3 years.'},
  crypto:{stance:'bad',head:'Brutal — flat 30% + 1% TDS, no loss offset',
    body:'For residents, gains on Virtual Digital Assets (VDA = crypto) are taxed at a FLAT 30% — plus a 4% cess and any surcharge, so ~34%+ effective — with NO holding-period relief and NO offsetting of losses (not between coins, not against other income). A separate 1% tax is deducted at source (TDS) on every transfer. Confirmed unchanged for the 2026-27 budget. One of the harshest crypto regimes anywhere: travel freely, but NEVER off-ramp or become tax-resident here while holding gains.'},
  visa:{days:null,label:'e-Visa required (no visa-free entry)',
    note:'Dutch citizens must get an e-Tourist Visa in advance (30-day, 1-year or 5-year options; the multi-year ones cap each visit at ~90 days). No visa-free or visa-on-arrival for NL passports.'},
  verified:'2026-07-13',
  sources:[['Koinly — India crypto tax 2026','https://koinly.io/guides/crypto-tax-india/'],['ClearTax — residential status','https://cleartax.in/s/residential-status'],['India Briefing — new NRI residency rules 2026','https://www.india-briefing.com/news/understanding-the-new-tax-residency-rules-for-nris-36318.html/']]
},

PY: {
  trading:{stance:'good',head:'0% on foreign-exchange trades',body:'Trades on foreign exchanges are foreign-source and untaxed no matter how often you trade. Only Paraguay-source activity is taxed.'},
  tax:{days:null,window:null,label:'Territorial — no day-count trap',
    note:'Paraguay taxes only Paraguay-source income. There is NO 183-day residency test: tax residency comes from holding legal residency + a cédula (national ID) + an active RUC (tax number). Foreign-source income — including foreign crypto — sits outside the tax base entirely.'},
  crypto:{stance:'good',head:'0% on foreign-source crypto',
    body:'Under the territorial system (Law 6380), gains on crypto held and sold on FOREIGN exchanges are foreign-source and taxed at 0%. Only Paraguay-source income is taxed, at a flat 8–10%. Resolution 47/2026 adds a REPORTING duty — cumulative crypto activity over ~US$5,000/yr must be disclosed (wallets, tx hashes, counterparties) — but does NOT change the 0% rate. Cheap, fast residency plus no day trap make this a genuine off-ramp base.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens. Permanent residency + cédula is famously cheap and fast (a single visit and a bank deposit), which is what actually establishes tax residency.'},
  verified:'2026-07-13',
  sources:[['Paraguay Sovereign — territorial tax','https://paraguaysovereign.com/tax/territorial-tax-explained/'],['Plan B Expat — Paraguay crypto reporting 2026','https://www.planbexpat.com/blog/paraguay-crypto-reporting-rules-2026']]
},

UY: {
  trading:{stance:'warn',head:'12% on gains (0% under the holiday)',body:'A standard resident pays 12% IRPF on each realised gain, trading included. The elected new-resident holiday exempts it, but demands big presence plus a sizeable investment.'},
  tax:{days:183,window:'cal',label:'≥183 days / year — foreign income 12%, or elect a holiday',
    note:'183 days (or a centre-of-economic-interest test) makes you resident. Since 1 Jan 2026 (Law 20.446) foreign-source investment income & capital gains — crypto included — are taxed at a flat 12%. New residents may instead ELECT a tax holiday: foreign income exempt for the arrival year plus 10 more (~11 years), then 6% for 5 years. The holiday needs 183+ days AND a qualifying investment (~US$2M real estate or US$100k/yr innovation fund). People who elected before 2026 are grandfathered on the old terms.'},
  crypto:{stance:'warn',head:'12% flat — or 0% under the elected holiday',
    body:'Crypto is treated as capital income: a standard resident pays 12% IRPF on foreign-source gains. Elect the new-resident tax holiday and foreign crypto gains are exempt for ~11 years — but that route demands real physical presence plus a sizeable qualifying investment, so it is not a light-touch option. Watch the look-through rule (owning >5% of a foreign company attributes its income to you personally). Stable, well-run, treaty-light — but living costs are higher than its neighbours.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens. Residency is straightforward, but if you want the tax holiday the election must be made in the first year.'},
  verified:'2026-07-13',
  sources:[['EY — Uruguay foreign-source investment income','https://www.ey.com/en_gl/technical/tax-alerts/uruguay-regulates-application-of-personal-income-tax-on-foreign-source-investment-income-and-capital-gains'],['IMI Daily — Uruguay 12% foreign income 2026','https://www.imidaily.com/latin-america/uruguay-raises-tax-holiday-threshold-to-us2-million-taxes-foreign-income-at-12/']]
},

AR: {
  trading:{stance:'bad',head:'Taxed hard, plus a wealth tax',body:'Trading gains are ordinary income up to 35% (15% if capital), and the coins are hit yearly by the Bienes Personales wealth tax. Currency controls make it worse.'},
  tax:{days:183,window:'cal',label:'Worldwide income; 12 months’ stay = resident',
    note:'Residents are taxed on WORLDWIDE income. Foreigners acquire tax residency after 12 continuous months of authorised stay. On top of income tax sits Bienes Personales — a wealth tax on worldwide assets (crypto included) at 0.5–1.75%, scheduled to ease toward 0.25% by 2027. Strict BCRA currency controls (the parallel “blue” dollar, restricted access to official FX) make moving money in and out awkward.'},
  crypto:{stance:'bad',head:'Worldwide tax PLUS a wealth tax on the coins',
    body:'For residents, crypto gains are taxed up to 35% as ordinary income (or 15% if treated as a capital gain), AND the holdings themselves are hit every year by the Personal Assets (wealth) tax at 0.5–1.75% of value. Combined with currency controls, Argentina is a place to visit, not to off-ramp. Milei-era reforms (ARCA replacing AFIP, RIGI, periodic amnesties) are shifting fast — re-verify if it ever starts to look tempting.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens (extendable once). Currency controls make local banking clumsy for non-residents.'},
  verified:'2026-07-13',
  sources:[['PwC — Argentina other taxes (wealth tax)','https://taxsummaries.pwc.com/argentina/individual/other-taxes'],['MEXC — Argentina crypto tax guide 2026','https://www.mexc.co/en-IN/learn/article/argentina-crypto-tax-guide-2026-rates-rules-and-reporting/1']]
},

TH: {
  trading:{stance:'warn',head:'Untaxed if offshore and unremitted',body:'Trade on foreign exchanges and keep the proceeds offshore during residency years → nothing to tax. Trading on Thai exchanges is Thai-source income — avoid.'},
  tax:{days:180,window:'cal',label:'≥180 days / calendar year',
    note:'Aggregate days 1 Jan–31 Dec; arrival and departure days both count. At 180 you are a Thai tax resident for that year — automatically, no registration needed.'},
  crypto:{stance:'warn',head:'Remittance-based — timing is everything',
    body:'As a tax resident, foreign-source income (incl. crypto gains) is taxed only when REMITTED into Thailand. Gains earned before 1 Jan 2024 stay exempt (Por. 162). PENDING 2026: proposal to exempt remittances made in the year earned or the following year — not yet enacted, re-verify before relying on it. Playbook: off-ramp offshore and don’t remit in residency years, or hold an LTR visa (foreign-income remittance exemption). Trading on Thai exchanges (Bitkub etc.) = Thai-source income — avoid. DTV gives NO tax privileges.'},
  visa:{days:60,ext:30,label:'Visa-exempt 60d (cut to 30d approved, pending gazette)',
    note:'60-day visa-exempt entry (+30d extension) still in force July 2026, but the cut to 30 days is approved and takes effect 15 days after Royal Gazette publication — CHECK before each entry. DTV: 5-year multi-entry, 180d per entry (+180 ext), needs THB 500k in savings. LTR: 10-year, for wealthier profiles, includes the remittance tax exemption.'},
  routes:'DTV (soft landing, no tax perks) → LTR (tax exemption) if Thailand becomes the base.',
  verified:'2026-07-12',
  sources:[['Expat Tax Thailand — foreign-sourced income','https://www.expattaxthailand.com/understanding-assessable-foreign-sourced-income-in-thailand/'],['MBMG — 180-day rule 2026','https://mbmg-group.com/the-180-day-rule-are-you-accidentally-a-thai-tax-resident-in-2026/'],['Siam Legal — end of 60-day visa-free','https://siam-legal.com/travel-to-thailand/thailand-approves-end-of-60-day-visa-free-stay/'],['Forvis Mazars — remittance easing proposal','https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/tax/tax-rules-on-foreign-sourced-income']]
},

MY: {
  trading:{stance:'warn',head:'Occasional fine; frequency is watched',body:'No CGT means casual trading is untaxed, but business-like high-frequency trading can be reassessed as income (0–30%) under badges-of-trade. App-based occasional trading like yours stays clear.'},
  tax:{days:182,window:'cal',label:'≥182 days / calendar year',
    note:'182 days in a basis (calendar) year makes you resident — which in Malaysia is mostly GOOD for you: resident status unlocks the territorial treatment and treaty access.'},
  crypto:{stance:'good',head:'No CGT for individuals — the friendly base',
    body:'Malaysia has no capital gains tax for individuals: occasional disposal of long-held crypto is not taxed. Caveat: frequent, business-like trading can be assessed as income (0–30%) under badges-of-trade. Foreign-source income received by resident individuals is exempt under current orders, and MM2H holders get an explicit foreign-funds exemption. One of the cleanest legal off-ramps in Asia.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens. MM2H 2024 tiers: Silver USD 150k fixed deposit, Gold 500k, Platinum 1M, property purchase required; under-50s must spend ≥90 days/yr in Malaysia. DE Rantau nomad pass = cheaper 1-year route.'},
  routes:'DE Rantau to test → MM2H Silver if committing. ≥90d/yr MM2H stay obligation dovetails with hitting 182d residency if you want it.',
  verified:'2026-07-12',
  sources:[['Kryptos — Malaysia crypto tax','https://kryptos.io/guides/malaysia-crypto-tax-guide'],['OwnPropertyAbroad — MM2H 2026','https://ownpropertyabroad.com/malaysia/my-second-home-mm2h-malaysia-guide/'],['Bratu Capital — MM2H tax implications','https://bratucapital.com/post/mm2h-tax-implications-expats-malaysia-2026']]
},

JP: {
  trading:{stance:'bad',head:'Up to ~55% until the reform lands',body:'Trading gains are miscellaneous income taxed progressively to ~55%. The planned flat 20% reaches only FSA-listed assets on JP exchanges (~2028). Never trade here as a resident.'},
  tax:{days:183,window:'roll',label:'No fixed day-count — 183d rolling used as PROXY',
    note:'Japan has no simple day test: residency follows ‘jusho’ (centre of life) or one continuous year of residence. Runway tracks a 183-day rolling proxy — long stays plus ties (lease, gym, girlfriend, furniture) are what actually flip you. N4 and love of the place = exactly how people drift into residency by accident.'},
  crypto:{stance:'bad',head:'DANGER — up to ~55% until the reform lands',
    body:'For residents, crypto gains are miscellaneous income, progressive up to ~55%. Reform is real but not done: FIEA reclassification bill submitted to the Diet March 2026; flat 20.315% planned ONLY for FSA-listed assets on registered Japanese exchanges, and for individuals likely from 2028, pending passage. Staking/DeFi/NFTs/foreign exchanges stay at 55% even after. Rule: visit Japan freely, NEVER become tax resident while holding large unrealised gains. Re-check this card after the 2026 Diet session.'},
  visa:{days:90,ext:90,label:'90d visa-free (NL can extend to 180d/yr)',
    note:'90 days visa-free; Netherlands has a bilateral arrangement allowing extension to a total of 6 months per year — apply at immigration in Japan before day 90.'},
  routes:'Long-stay only after the 20% regime is law AND assets are FSA-listed — or after off-ramping elsewhere.',
  verified:'2026-07-12',
  sources:[['MailMate — Japan crypto tax 2026','https://mailmate.jp/blog/japan-crypto-tax'],['Finance Magnates — 20% + FIEA 2026','https://www.financemagnates.com/cryptocurrency/regulation/japan-plans-20-crypto-tax-reclassifies-digital-assets-as-financial-products/'],['MOFA — visa exemption list','https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html']]
},

VN: {
  trading:{stance:'warn',head:'0.1% per sale — adds up if you churn',body:'Each disposal is taxed 0.1% of gross proceeds: trivial for a big infrequent sell, but paid on every sale regardless of profit, so heavy churning is a slow drag.'},
  tax:{days:183,window:'both',label:'≥183 days / calendar year OR any 12 months',
    note:'Resident if ≥183 days in the calendar year OR in 12 consecutive months from first arrival — whichever hits first. A registered residence or a lease ≥183 days can also trigger it.'},
  crypto:{stance:'warn',head:'New regime: 0.1% on gross proceeds',
    body:'Vietnam’s new digital-asset framework taxes crypto disposals like securities: 0.1% of GROSS sale proceeds (not gains), via the piloted licensed-exchange regime. On large gains that flat 0.1% can be remarkably cheap — but residents are taxed on worldwide income generally, and the framework is young and shifting. Interesting dark horse; verify hard before relying on it.'},
  visa:{days:45,label:'45 days visa-free (NL, until Aug 2028)',
    note:'45-day visa exemption for Dutch citizens under Resolution 229 (15 Aug 2025 – 14 Aug 2028). E-visa: 90 days, multiple entry.'},
  verified:'2026-07-12',
  sources:[['Offshore in Asia — crypto rules by country','https://offshoreinasia.com/crypto-tax-rules-in-asia-a-country-by-country-guide/'],['Vietnam-visa — NL 45-day exemption','https://www.vietnam-visa.org/visa/netherlands-citizens.html']]
},

ID: {
  trading:{stance:'bad',head:'Worldwide income + exchange levies',body:'Residents are taxed on worldwide income and local-exchange trades carry small final levies. Not a trading base.'},
  tax:{days:183,window:'roll',label:'>183 days in any 12-month period',
    note:'Resident if present >183 days in any 12-month period, or present with intent to reside (KITAS + lease can signal intent earlier).'},
  crypto:{stance:'warn',head:'Worldwide income once resident; exchange levies',
    body:'Residents are taxed on worldwide income. Crypto traded on licensed Indonesian exchanges carries small final transaction taxes (~0.2% range, adjusted 2025); offshore gains for a resident risk ordinary income treatment. Bali is for living, not for off-ramping.'},
  visa:{days:30,ext:30,label:'VOA 30d (+30 ext) — no visa-free for NL',
    note:'Dutch citizens need Visa on Arrival / e-VOA: 30 days, one 30-day extension. Longer: B211A visit visa or the second-home/remote-worker routes.'},
  verified:'2026-07-12',
  sources:[['Rumavi — SE Asia territorial tax 2026','https://rumavi.com/en/property-guides/territorial-tax-residency-and-overseas-income-in-southeast-asia'],['LetsMoveIndonesia — visa exemptions 2026','https://www.letsmoveindonesia.com/indonesia-visa-complete-visa-exemption-countries-list-2026/']]
},

PH: {
  trading:{stance:'good',head:'Foreign-exchange trades untaxed for aliens',body:'Trades on foreign exchanges are foreign-source and untaxed for foreign nationals, whatever the frequency. Only local or business activity is taxed.'},
  tax:{days:null,window:null,label:'No worldwide-tax day trap for foreigners',
    note:'Foreign nationals — resident OR non-resident — are taxed on Philippine-source income only. Staying long makes you a ‘resident alien’ but does NOT expose foreign income. One of the few places where the day count barely matters for tax.'},
  crypto:{stance:'good',head:'Foreign-source gains untaxed for aliens',
    body:'Crypto gains realised offshore (foreign exchange, foreign custody) are foreign-source and not taxed for foreign nationals under the territorial treatment of aliens. Local-source/business activity is taxed, and BIR now has crypto reporting forms for domestic activity. Combine with easy long stays = genuinely interesting off-ramp jurisdiction.'},
  visa:{days:30,ext:335,label:'30d visa-free, extendable to 36 months',
    note:'30 days on arrival, then repeated extensions at BI offices up to a total of 36 months. SRRV retirement visa exists (deposit-based) if you ever want permanence.'},
  verified:'2026-07-12',
  sources:[['PwC Tax Summaries — PH residence','https://taxsummaries.pwc.com/philippines/individual/residence'],['Kryptos — PH crypto tax','https://kryptos.io/guides/philippines-crypto-tax-guide']]
},

KH: {
  trading:{stance:'warn',head:'Worldwide in law, enforcement tightening',body:'Residents owe worldwide tax on paper, and no clear crypto-trading framework exists. Fine to travel, not to build on.'},
  tax:{days:182,window:'roll',label:'>182 days in a 12-month period',
    note:'Resident if present >182 days in any 12-month period ending in the tax year, or if your principal place of abode is in Cambodia.'},
  crypto:{stance:'warn',head:'Worldwide in law, formalising fast',
    body:'Residents owe tax on worldwide income in law; enforcement was historically light but is tightening: CGT on securities live since Sep 2025, real estate from Jan 2026. Crypto runs through NBC-licensed platforms. Fine to travel, unwise to build the off-ramp plan on.'},
  visa:{days:30,ext:30,label:'30d VOA/e-visa, extendable',
    note:'30-day visa on arrival / e-visa; EB extensions in-country up to 12 months.'},
  verified:'2026-07-12',
  sources:[['AG Cambodia — tax residency','https://www.agcambodia.com/understanding-tax-residency-for-foreigners-in-cambodia/'],['Rumavi — Cambodia tax 2026','https://rumavi.com/en/property-guides/cambodia-tax-guide-2026-rates-residency-investor-rules']]
},

LA: {
  trading:{stance:'warn',head:'No framework',body:'No meaningful individual crypto rules — low certainty. Not a place to trade seriously.'},
  tax:{days:183,window:'roll',label:'~183 days (rules thin, rarely enforced)',
    note:'Residency rules exist on paper (~183 days) but administration is thin. Low practical risk, low legal certainty.'},
  crypto:{stance:'warn',head:'No real framework',
    body:'No meaningful individual crypto tax framework; state-licensed mining/exchange pilots exist. Travel yes, off-ramp no.'},
  visa:{days:30,ext:30,label:'30d e-visa/VOA (+30 ext)',note:'30-day e-visa or visa on arrival, one 30-day extension.'},
  verified:'2026-07-12', sources:[]
},

SG: {
  trading:{stance:'warn',head:'Occasional fine; habitual = business',body:'Investment gains are tax-free, but IRAS can treat habitual, business-like trading as taxable trade income (up to ~22%) under badges-of-trade. Superb for occasional, risky as a profession.'},
  tax:{days:183,window:'cal',label:'≥183 days / calendar year',
    note:'183 days in a calendar year = resident (also 183 straddling two years under the two-year admin concession).'},
  crypto:{stance:'good',head:'No CGT; best off-ramp infrastructure in Asia',
    body:'No capital gains tax — individual investment gains are tax-free; habitual trading as a business is taxable. Licensed exchanges + banks that actually understand crypto make this the smoothest large-sum off-ramp in the region. Catch: brutal cost of living and hard to get long-term residency — use it as a transaction venue, not a base.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[['IMI — countries that don’t tax crypto 2026','https://www.imidaily.com/analysis/20-livable-countries-that-dont-tax-crypto-gains-in-2026/']]
},

HK: {
  trading:{stance:'warn',head:'Occasional fine; business-like is taxed',body:'No CGT on investment gains, but frequent business-like trading can fall under the 15% profits tax. Fine kept clearly casual.'},
  tax:{days:180,window:'both',label:'Territorial — ~180d guideline',
    note:'Territorial system; ordinary residence/180-day presence matters mainly for certificates. Foreign-source gains untaxed regardless.'},
  crypto:{stance:'good',head:'No CGT, territorial, licensed retail exchanges',
    body:'No capital gains tax for individuals; territorial taxation; SFC-licensed retail crypto exchanges (HashKey etc.). Business-like trading caveat applies. Solid off-ramp venue.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[]
},

TW: {
  trading:{stance:'warn',head:'20% AMT only above ~NT$7.5M',body:'Offshore trading gains fall under AMT at 20% only above ~NT$7.5M/yr (≈€200k); below that, effectively untaxed. Planful only in big years.'},
  tax:{days:183,window:'cal',label:'≥183 days / calendar year',
    note:'183 days in a calendar year = resident.'},
  crypto:{stance:'warn',head:'AMT on big overseas income',
    body:'Residents: overseas income (incl. offshore crypto gains) taxed under AMT at 20% only above ~NT$7.5M/yr (~€220k); below that effectively exempt. Domestic-source gains are ordinary income. Workable for mid-size years, planful for big ones.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[]
},

KR: {
  trading:{stance:'warn',head:'20% scheduled 2027 (delayed before)',body:'No individual crypto gains tax yet; a 20% tax is slated for Jan 2027 after repeated delays. Short-term foreign residents are taxed on foreign gains only if remitted — a real lever.'},
  tax:{days:183,window:'roll'
,label:'≥183 days (rolling)',
    note:'183 days’ presence (or domicile) = resident. Useful nuance: foreign nationals resident ≤5 of the past 10 years are taxed on foreign-source income only to the extent it is paid into / remitted to Korea.'},
  crypto:{stance:'warn',head:'20% gains tax scheduled 2027 (delayed before)',
    body:'Crypto gains tax for individuals (20% above ~KRW 2.5M/yr) is scheduled for Jan 2027 after repeated delays — re-verify. Short-term-resident remittance rule above is a real planning lever for foreigners.'},
  visa:{days:90,label:'90 days visa-free (K-ETA rules vary)',note:'90-day visa-free; check current K-ETA exemption status for NL before flying.'},
  verified:'2026-07-12', sources:[]
},

CN: {
  trading:{stance:'bad',head:'Banned',body:'Crypto trading is illegal — no lawful venue at all. Travel only.'},
  tax:{days:183,window:'cal',label:'≥183 days / calendar year',
    note:'183 days = resident; worldwide taxation phases in after 6 consecutive resident years (the ‘6-year rule’ — breakable with a 30-day absence).'},
  crypto:{stance:'bad',head:'Trading banned — no lawful off-ramp',
    body:'Crypto trading and exchange business banned since 2021; holding sits in a grey zone. Zero crypto activity on Chinese soil, apps or rails. Travel only.'},
  visa:{days:30,label:'30d visa-free for NL (extended policy — verify)',note:'China’s unilateral visa-free policy covers NL for 30 days, currently extended — re-check validity window before each trip.'},
  verified:'2026-07-12', sources:[]
},

AE: {
  trading:{stance:'good',head:'0% — the daytrader benchmark',body:'No income tax, no CGT, no wealth tax: trade as often as you like, individual gains untaxed regardless of frequency. The cleanest active-trading base.'},
  tax:{days:90,window:'roll',label:'TRC: 183d, or 90d + ties (rolling)',
    note:'No personal income tax. Tax Residency Certificate: 183 days, or 90 days + residence visa/business ties. Runway tracks the 90-day TRC threshold since here you WANT to cross it.'},
  crypto:{stance:'good',head:'0% — the benchmark',
    body:'0% personal tax on crypto gains, mature off-ramp infrastructure, easy residence visas (freelance/company). Not the Asia lifestyle you want, but the yardstick to compare every other plan against.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[['IMI — zero-crypto-tax countries 2026','https://www.imidaily.com/analysis/20-livable-countries-that-dont-tax-crypto-gains-in-2026/']]
},

NL: {
  trading:{stance:'warn',head:'Free to trade now; taxed from 2028',body:'Box 3 reads only your year-end wealth value, so trading frequency is irrelevant and per-trade gains are untaxed pre-2028. The 2028 actual-return regime taxes the gains themselves, ending this edge.'},
  tax:{days:null,window:null,label:'Facts & circumstances — not a day count',
    note:'Dutch residency follows your centre of life: home, partner, ties — not days. Exit properly: deregister (RNI), end/sell housing, move the centre of life visibly. After that, treaty tiebreakers protect you. Return visits in the first years: keep them short and tie-free; months-long stays + a kept-available home is how people get pulled back in.'},
  crypto:{stance:'warn',head:'Exit timeline & box 3',
    body:'Box 3 ‘werkelijk rendement’ (vermogensaanwas) law: passed the Tweede Kamer; Eerste Kamer vote POSTPONED 30 Jun 2026 pending a novelle (rate ~35–36%, small franchise) — still aimed at 1 Jan 2028. Your leave-before-2028 logic holds. ZZP exit: stakingswinst taxed in the final year (stakingsaftrek €3,630; stakingslijfrente can defer a chunk), file the M-form for the departure year. No conserverende aanslag on crypto held privé (it’s not aanmerkelijk belang), but pension/lijfrente products do get one. Get ONE professional review of the exit year — this card is information, not advice.'},
  visa:{days:null,label:'Home country',note:'Track post-departure visit days here so return trips stay deliberately modest.'},
  verified:'2026-07-12',
  sources:[['Eerste Kamer — Wet werkelijk rendement box 3 (36.748)','https://www.eerstekamer.nl/wetsvoorstel/36748_wet_werkelijk_rendement_box'],['Rijksoverheid — plannen box 3','https://www.rijksoverheid.nl/onderwerpen/inkomstenbelasting/plannen-werkelijk-rendement-box-3']]
},

GE: {
  trading:{stance:'good',head:'0% for individuals, any frequency',body:'Individual crypto gains are untaxed (deemed non-Georgian-source) however often you trade. Only if you formally run it as a business does the 1%-turnover small-business regime apply.'},
  tax:{days:183,window:'roll',label:'≥183 days — or the HNWI fast-track',
    note:'183 days present in a 12-month period makes you a Georgian tax resident. Georgia is territorial — only Georgian-source income is taxed — so becoming resident here is generally SAFE for a crypto holder. A separate High-Net-Worth-Individual route grants residency WITHOUT the day count (≈3M GEL global assets, or 200k GEL/yr income for 3 years, plus a Georgian tie such as US$500k property or 25k GEL local income), taking ~3–5 months.'},
  crypto:{stance:'good',head:'0% on individual crypto — a genuine haven',
    body:'The Revenue Service treats crypto disposals by individuals as non-Georgian-source, so personal crypto gains are untaxed (0%) regardless of size. No wealth, inheritance or gift tax either. Run trading as a registered business instead and you can elect Small-Business status (1% of turnover up to 500k GEL). One 2026 wrinkle: tourists must now carry health/accident insurance (≥30,000 GEL cover).'},
  visa:{days:365,label:'365 days visa-free — exceptional',
    note:'Georgia grants Dutch (and all EU) citizens a full 365 days visa-free on entry — among the most generous regimes anywhere, and a natural fit for banking the 183 days that establish tax residency. EU nationals can enter on an ID card. Formal residence permits are a separate track for permanence.'},
  routes:'365-day visa-free stay → bank the 183 days for tax residency → HNWI status or a residence permit if you commit.',
  verified:'2026-07-13',
  sources:[['Andersen — crypto tax for individuals in Georgia','https://ge.andersen.com/crypto-tax-georgia-individuals/'],['gegidze — HNWI tax residency in Georgia','https://www.gegidze.com/post/hnwi-tax-residency-the-high-net-worth-individual-route-asset-requirements-and-tax-benefits-in-geo'],['Visa policy of Georgia — Wikipedia','https://en.wikipedia.org/wiki/Visa_policy_of_Georgia']]
}

};
