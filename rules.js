'use strict';
/* Runway rule data — every card carries a verified date; cards go STALE after 6 months.
   Windows: 'cal' = calendar year, 'roll' = rolling 365 days, 'both' = whichever is higher.
   Stance: good = crypto-off-ramp friendly, warn = conditional/complex, bad = danger zone. */

const RULES_BUILT = '2026-07-12';
const STALE_DAYS = 183;

// Full logging list (flag, name, region). Countries without a RULES entry get the generic 183-day caution.
const COUNTRIES = {
  TH:{n:'Thailand',f:'\u{1F1F9}\u{1F1ED}',r:'Southeast Asia'}, MY:{n:'Malaysia',f:'\u{1F1F2}\u{1F1FE}',r:'Southeast Asia'},
  VN:{n:'Vietnam',f:'\u{1F1FB}\u{1F1F3}',r:'Southeast Asia'}, ID:{n:'Indonesia',f:'\u{1F1EE}\u{1F1E9}',r:'Southeast Asia'},
  PH:{n:'Philippines',f:'\u{1F1F5}\u{1F1ED}',r:'Southeast Asia'}, KH:{n:'Cambodia',f:'\u{1F1F0}\u{1F1ED}',r:'Southeast Asia'},
  LA:{n:'Laos',f:'\u{1F1F1}\u{1F1E6}',r:'Southeast Asia'}, SG:{n:'Singapore',f:'\u{1F1F8}\u{1F1EC}',r:'Southeast Asia'},
  MM:{n:'Myanmar',f:'\u{1F1F2}\u{1F1F2}',r:'Southeast Asia'}, BN:{n:'Brunei',f:'\u{1F1E7}\u{1F1F3}',r:'Southeast Asia'},
  TL:{n:'Timor-Leste',f:'\u{1F1F9}\u{1F1F1}',r:'Southeast Asia'},
  JP:{n:'Japan',f:'\u{1F1EF}\u{1F1F5}',r:'East Asia'}, KR:{n:'South Korea',f:'\u{1F1F0}\u{1F1F7}',r:'East Asia'},
  TW:{n:'Taiwan',f:'\u{1F1F9}\u{1F1FC}',r:'East Asia'}, HK:{n:'Hong Kong',f:'\u{1F1ED}\u{1F1F0}',r:'East Asia'},
  CN:{n:'China',f:'\u{1F1E8}\u{1F1F3}',r:'East Asia'}, MO:{n:'Macau',f:'\u{1F1F2}\u{1F1F4}',r:'East Asia'},
  MN:{n:'Mongolia',f:'\u{1F1F2}\u{1F1F3}',r:'East Asia'},
  IN:{n:'India',f:'\u{1F1EE}\u{1F1F3}',r:'South Asia'}, LK:{n:'Sri Lanka',f:'\u{1F1F1}\u{1F1F0}',r:'South Asia'},
  NP:{n:'Nepal',f:'\u{1F1F3}\u{1F1F5}',r:'South Asia'}, MV:{n:'Maldives',f:'\u{1F1F2}\u{1F1FB}',r:'South Asia'},
  BD:{n:'Bangladesh',f:'\u{1F1E7}\u{1F1E9}',r:'South Asia'}, BT:{n:'Bhutan',f:'\u{1F1E7}\u{1F1F9}',r:'South Asia'},
  KZ:{n:'Kazakhstan',f:'\u{1F1F0}\u{1F1FF}',r:'Central Asia'}, KG:{n:'Kyrgyzstan',f:'\u{1F1F0}\u{1F1EC}',r:'Central Asia'},
  UZ:{n:'Uzbekistan',f:'\u{1F1FA}\u{1F1FF}',r:'Central Asia'}, GE:{n:'Georgia',f:'\u{1F1EC}\u{1F1EA}',r:'Central Asia'},
  AE:{n:'UAE (Dubai)',f:'\u{1F1E6}\u{1F1EA}',r:'Benchmark'},
  NL:{n:'Netherlands',f:'\u{1F1F3}\u{1F1F1}',r:'Home'},
  XX:{n:'Other / in transit',f:'\u{1F30F}',r:'Other'}
};

const GENERIC_RULE = {
  tax:{days:183,window:'both',label:'~183 days (generic caution)',
    note:'No researched rule card for this country yet — Runway applies the generic 183-day caution used by most tax systems. Verify locally before long stays.'},
  crypto:{stance:'warn',head:'Unresearched',body:'No rule card yet. Treat as unknown: fine to travel, do not off-ramp or hit residency thresholds here without doing the homework first.'},
  visa:{days:null,label:'Check before travel',note:'Visa rules not loaded for this country.'},
  verified:RULES_BUILT, sources:[]
};

const RULES = {

TH: {
  tax:{days:180,window:'cal',label:'≥180 days / calendar year',
    note:'Aggregate days 1 Jan–31 Dec; arrival and departure days both count. At 180 you are a Thai tax resident for that year — automatically, no registration needed.'},
  crypto:{stance:'warn',head:'Remittance-based — timing is everything',
    body:'As a tax resident, foreign-source income (incl. crypto gains) is taxed only when REMITTED into Thailand. Gains earned before 1 Jan 2024 stay exempt (Por. 162). PENDING 2026: proposal to exempt remittances made in the year earned or the following year — not yet enacted, re-verify before relying on it. Playbook: off-ramp offshore and don’t remit in residency years, or hold an LTR visa (foreign-income remittance exemption). Trading on Thai exchanges (Bitkub etc.) = Thai-source income — avoid. DTV gives NO tax privileges.'},
  visa:{days:60,label:'Visa-exempt 60d (cut to 30d approved, pending gazette)',
    note:'60-day visa-exempt entry (+30d extension) still in force July 2026, but the cut to 30 days is approved and takes effect 15 days after Royal Gazette publication — CHECK before each entry. DTV: 5-year multi-entry, 180d per entry (+180 ext), needs THB 500k in savings. LTR: 10-year, for wealthier profiles, includes the remittance tax exemption.'},
  routes:'DTV (soft landing, no tax perks) → LTR (tax exemption) if Thailand becomes the base.',
  verified:'2026-07-12',
  sources:[['Expat Tax Thailand — foreign-sourced income','https://www.expattaxthailand.com/understanding-assessable-foreign-sourced-income-in-thailand/'],['MBMG — 180-day rule 2026','https://mbmg-group.com/the-180-day-rule-are-you-accidentally-a-thai-tax-resident-in-2026/'],['Siam Legal — end of 60-day visa-free','https://siam-legal.com/travel-to-thailand/thailand-approves-end-of-60-day-visa-free-stay/'],['Forvis Mazars — remittance easing proposal','https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/tax/tax-rules-on-foreign-sourced-income']]
},

MY: {
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
  tax:{days:183,window:'roll',label:'No fixed day-count — 183d rolling used as PROXY',
    note:'Japan has no simple day test: residency follows ‘jusho’ (centre of life) or one continuous year of residence. Runway tracks a 183-day rolling proxy — long stays plus ties (lease, gym, girlfriend, furniture) are what actually flip you. N4 and love of the place = exactly how people drift into residency by accident.'},
  crypto:{stance:'bad',head:'DANGER — up to ~55% until the reform lands',
    body:'For residents, crypto gains are miscellaneous income, progressive up to ~55%. Reform is real but not done: FIEA reclassification bill submitted to the Diet March 2026; flat 20.315% planned ONLY for FSA-listed assets on registered Japanese exchanges, and for individuals likely from 2028, pending passage. Staking/DeFi/NFTs/foreign exchanges stay at 55% even after. Rule: visit Japan freely, NEVER become tax resident while holding large unrealised gains. Re-check this card after the 2026 Diet session.'},
  visa:{days:90,label:'90d visa-free (NL can extend to 180d/yr)',
    note:'90 days visa-free; Netherlands has a bilateral arrangement allowing extension to a total of 6 months per year — apply at immigration in Japan before day 90.'},
  routes:'Long-stay only after the 20% regime is law AND assets are FSA-listed — or after off-ramping elsewhere.',
  verified:'2026-07-12',
  sources:[['MailMate — Japan crypto tax 2026','https://mailmate.jp/blog/japan-crypto-tax'],['Finance Magnates — 20% + FIEA 2026','https://www.financemagnates.com/cryptocurrency/regulation/japan-plans-20-crypto-tax-reclassifies-digital-assets-as-financial-products/'],['MOFA — visa exemption list','https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html']]
},

VN: {
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
  tax:{days:183,window:'roll',label:'>183 days in any 12-month period',
    note:'Resident if present >183 days in any 12-month period, or present with intent to reside (KITAS + lease can signal intent earlier).'},
  crypto:{stance:'warn',head:'Worldwide income once resident; exchange levies',
    body:'Residents are taxed on worldwide income. Crypto traded on licensed Indonesian exchanges carries small final transaction taxes (~0.2% range, adjusted 2025); offshore gains for a resident risk ordinary income treatment. Bali is for living, not for off-ramping.'},
  visa:{days:30,label:'VOA 30d (+30 ext) — no visa-free for NL',
    note:'Dutch citizens need Visa on Arrival / e-VOA: 30 days, one 30-day extension. Longer: B211A visit visa or the second-home/remote-worker routes.'},
  verified:'2026-07-12',
  sources:[['Rumavi — SE Asia territorial tax 2026','https://rumavi.com/en/property-guides/territorial-tax-residency-and-overseas-income-in-southeast-asia'],['LetsMoveIndonesia — visa exemptions 2026','https://www.letsmoveindonesia.com/indonesia-visa-complete-visa-exemption-countries-list-2026/']]
},

PH: {
  tax:{days:null,window:null,label:'No worldwide-tax day trap for foreigners',
    note:'Foreign nationals — resident OR non-resident — are taxed on Philippine-source income only. Staying long makes you a ‘resident alien’ but does NOT expose foreign income. One of the few places where the day count barely matters for tax.'},
  crypto:{stance:'good',head:'Foreign-source gains untaxed for aliens',
    body:'Crypto gains realised offshore (foreign exchange, foreign custody) are foreign-source and not taxed for foreign nationals under the territorial treatment of aliens. Local-source/business activity is taxed, and BIR now has crypto reporting forms for domestic activity. Combine with easy long stays = genuinely interesting off-ramp jurisdiction.'},
  visa:{days:30,label:'30d visa-free, extendable to 36 months',
    note:'30 days on arrival, then repeated extensions at BI offices up to a total of 36 months. SRRV retirement visa exists (deposit-based) if you ever want permanence.'},
  verified:'2026-07-12',
  sources:[['PwC Tax Summaries — PH residence','https://taxsummaries.pwc.com/philippines/individual/residence'],['Kryptos — PH crypto tax','https://kryptos.io/guides/philippines-crypto-tax-guide']]
},

KH: {
  tax:{days:182,window:'roll',label:'>182 days in a 12-month period',
    note:'Resident if present >182 days in any 12-month period ending in the tax year, or if your principal place of abode is in Cambodia.'},
  crypto:{stance:'warn',head:'Worldwide in law, formalising fast',
    body:'Residents owe tax on worldwide income in law; enforcement was historically light but is tightening: CGT on securities live since Sep 2025, real estate from Jan 2026. Crypto runs through NBC-licensed platforms. Fine to travel, unwise to build the off-ramp plan on.'},
  visa:{days:30,label:'30d VOA/e-visa, extendable',
    note:'30-day visa on arrival / e-visa; EB extensions in-country up to 12 months.'},
  verified:'2026-07-12',
  sources:[['AG Cambodia — tax residency','https://www.agcambodia.com/understanding-tax-residency-for-foreigners-in-cambodia/'],['Rumavi — Cambodia tax 2026','https://rumavi.com/en/property-guides/cambodia-tax-guide-2026-rates-residency-investor-rules']]
},

LA: {
  tax:{days:183,window:'roll',label:'~183 days (rules thin, rarely enforced)',
    note:'Residency rules exist on paper (~183 days) but administration is thin. Low practical risk, low legal certainty.'},
  crypto:{stance:'warn',head:'No real framework',
    body:'No meaningful individual crypto tax framework; state-licensed mining/exchange pilots exist. Travel yes, off-ramp no.'},
  visa:{days:30,label:'30d e-visa/VOA (+30 ext)',note:'30-day e-visa or visa on arrival, one 30-day extension.'},
  verified:'2026-07-12', sources:[]
},

SG: {
  tax:{days:183,window:'cal',label:'≥183 days / calendar year',
    note:'183 days in a calendar year = resident (also 183 straddling two years under the two-year admin concession).'},
  crypto:{stance:'good',head:'No CGT; best off-ramp infrastructure in Asia',
    body:'No capital gains tax — individual investment gains are tax-free; habitual trading as a business is taxable. Licensed exchanges + banks that actually understand crypto make this the smoothest large-sum off-ramp in the region. Catch: brutal cost of living and hard to get long-term residency — use it as a transaction venue, not a base.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[['IMI — countries that don’t tax crypto 2026','https://www.imidaily.com/analysis/20-livable-countries-that-dont-tax-crypto-gains-in-2026/']]
},

HK: {
  tax:{days:180,window:'both',label:'Territorial — ~180d guideline',
    note:'Territorial system; ordinary residence/180-day presence matters mainly for certificates. Foreign-source gains untaxed regardless.'},
  crypto:{stance:'good',head:'No CGT, territorial, licensed retail exchanges',
    body:'No capital gains tax for individuals; territorial taxation; SFC-licensed retail crypto exchanges (HashKey etc.). Business-like trading caveat applies. Solid off-ramp venue.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[]
},

TW: {
  tax:{days:183,window:'cal',label:'≥183 days / calendar year',
    note:'183 days in a calendar year = resident.'},
  crypto:{stance:'warn',head:'AMT on big overseas income',
    body:'Residents: overseas income (incl. offshore crypto gains) taxed under AMT at 20% only above ~NT$7.5M/yr (~€220k); below that effectively exempt. Domestic-source gains are ordinary income. Workable for mid-size years, planful for big ones.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[]
},

KR: {
  tax:{days:183,window:'roll'
,label:'≥183 days (rolling)',
    note:'183 days’ presence (or domicile) = resident. Useful nuance: foreign nationals resident ≤5 of the past 10 years are taxed on foreign-source income only to the extent it is paid into / remitted to Korea.'},
  crypto:{stance:'warn',head:'20% gains tax scheduled 2027 (delayed before)',
    body:'Crypto gains tax for individuals (20% above ~KRW 2.5M/yr) is scheduled for Jan 2027 after repeated delays — re-verify. Short-term-resident remittance rule above is a real planning lever for foreigners.'},
  visa:{days:90,label:'90 days visa-free (K-ETA rules vary)',note:'90-day visa-free; check current K-ETA exemption status for NL before flying.'},
  verified:'2026-07-12', sources:[]
},

CN: {
  tax:{days:183,window:'cal',label:'≥183 days / calendar year',
    note:'183 days = resident; worldwide taxation phases in after 6 consecutive resident years (the ‘6-year rule’ — breakable with a 30-day absence).'},
  crypto:{stance:'bad',head:'Trading banned — no lawful off-ramp',
    body:'Crypto trading and exchange business banned since 2021; holding sits in a grey zone. Zero crypto activity on Chinese soil, apps or rails. Travel only.'},
  visa:{days:30,label:'30d visa-free for NL (extended policy — verify)',note:'China’s unilateral visa-free policy covers NL for 30 days, currently extended — re-check validity window before each trip.'},
  verified:'2026-07-12', sources:[]
},

AE: {
  tax:{days:90,window:'roll',label:'TRC: 183d, or 90d + ties (rolling)',
    note:'No personal income tax. Tax Residency Certificate: 183 days, or 90 days + residence visa/business ties. Runway tracks the 90-day TRC threshold since here you WANT to cross it.'},
  crypto:{stance:'good',head:'0% — the benchmark',
    body:'0% personal tax on crypto gains, mature off-ramp infrastructure, easy residence visas (freelance/company). Not the Asia lifestyle you want, but the yardstick to compare every other plan against.'},
  visa:{days:90,label:'90 days visa-free',note:'90-day visa-free entry for Dutch citizens.'},
  verified:'2026-07-12', sources:[['IMI — zero-crypto-tax countries 2026','https://www.imidaily.com/analysis/20-livable-countries-that-dont-tax-crypto-gains-in-2026/']]
},

NL: {
  tax:{days:null,window:null,label:'Facts & circumstances — not a day count',
    note:'Dutch residency follows your centre of life: home, partner, ties — not days. Exit properly: deregister (RNI), end/sell housing, move the centre of life visibly. After that, treaty tiebreakers protect you. Return visits in the first years: keep them short and tie-free; months-long stays + a kept-available home is how people get pulled back in.'},
  crypto:{stance:'warn',head:'Exit timeline & box 3',
    body:'Box 3 ‘werkelijk rendement’ (vermogensaanwas) law: passed the Tweede Kamer; Eerste Kamer vote POSTPONED 30 Jun 2026 pending a novelle (rate ~35–36%, small franchise) — still aimed at 1 Jan 2028. Your leave-before-2028 logic holds. ZZP exit: stakingswinst taxed in the final year (stakingsaftrek €3,630; stakingslijfrente can defer a chunk), file the M-form for the departure year. No conserverende aanslag on crypto held privé (it’s not aanmerkelijk belang), but pension/lijfrente products do get one. Get ONE professional review of the exit year — this card is information, not advice.'},
  visa:{days:null,label:'Home country',note:'Track post-departure visit days here so return trips stay deliberately modest.'},
  verified:'2026-07-12',
  sources:[['Eerste Kamer — Wet werkelijk rendement box 3 (36.748)','https://www.eerstekamer.nl/wetsvoorstel/36748_wet_werkelijk_rendement_box'],['Rijksoverheid — plannen box 3','https://www.rijksoverheid.nl/onderwerpen/inkomstenbelasting/plannen-werkelijk-rendement-box-3']]
}

};
