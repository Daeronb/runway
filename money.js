'use strict';
/* Runway Navigator — portfolio, off-ramp tax models, cost of living.
   All figures are ROUGH PLANNING MODELS, not advice. Verified 2026-07-12. */

const MONEY_VERIFIED='2026-07-12';

/* Fallback FX (open.er-api.com snapshot 2026-07-11, EUR base) — used when offline */
const FX_FALLBACK={date:'2026-07-11',rates:{THB:38.05,MYR:4.65,JPY:184.78,IDR:20625,VND:29975,PHP:70.37,
  KRW:1719,SGD:1.48,HKD:8.95,TWD:36.69,CNY:7.75,KHR:4627,LAK:25341,AED:4.19,USD:1.14,GEL:3.01}};
const FX_SHOW=['THB','MYR','VND','IDR','PHP','JPY','USD'];

/* Cost of living, €/month, single person, incl. ~€150–250 health/travel insurance.
   f = frugal (local-style, older studio/room, cook+street food), n = normal (nomad-comfortable, 1BR, coworking, eating out). */
const COL={
  TH:{f:1050,n:1800,c:'Chiang Mai (Bangkok ≈ +25%)'},
  MY:{f:1250,n:1800,c:'Kuala Lumpur'},
  VN:{f:650, n:1100,c:'Da Nang'},
  ID:{f:1000,n:1800,c:'Bali/Canggu'},
  PH:{f:900, n:1500,c:'Cebu'},
  KH:{f:800, n:1350,c:'Phnom Penh'},
  LA:{f:700, n:1200,c:'Luang Prabang'},
  TW:{f:1400,n:2200,c:'Taipei'},
  KR:{f:1500,n:2400,c:'Seoul'},
  JP:{f:1600,n:2600,c:'Tokyo (Fukuoka ≈ −25%)'},
  CN:{f:1000,n:1700,c:'2nd-tier city'},
  SG:{f:2800,n:4200,c:'Singapore'},
  HK:{f:2600,n:4000,c:'Hong Kong'},
  AE:{f:2500,n:3900,c:'Dubai'},
  IN:{f:700, n:1300,c:'Goa (Bengaluru ≈ similar)'},
  PY:{f:950, n:1500,c:'Asunción'},
  GE:{f:1050,n:1600,c:'Tbilisi'},
  UY:{f:1600,n:2300,c:'Montevideo'},
  AR:{f:1300,n:2000,c:'Buenos Aires (peso-volatile)'},
  NL:{f:1900,n:2700,c:'non-Randstad (return reference)'}
};

/* progressive tax helper: brackets = [[upperLimit, rate], ...] */
function prog(x,brackets){
  let t=0,prev=0;
  for(const [lim,rate] of brackets){
    const slice=Math.min(x,lim)-prev;
    if(slice>0)t+=slice*rate;
    if(x<=lim)break;
    prev=lim;
  }
  return t;
}

const TH_PIT=[[150000,0],[300000,.05],[500000,.10],[750000,.15],[1000000,.20],[2000000,.25],[5000000,.30],[Infinity,.35]];
const JP_NAT=[[1950000,.05],[3300000,.10],[6950000,.20],[9000000,.23],[18000000,.33],[40000000,.40],[Infinity,.45]];
const ID_PIT=[[60e6,.05],[250e6,.15],[500e6,.25],[5e9,.30],[Infinity,.35]];

/* Each model: calc({gain, proceeds, fx, o}) -> {tax:number|null, notes:[..], rough?:true}
   gain/proceeds in EUR; fx(cur) = units per EUR; o = finance options. Assumes: you are TAX RESIDENT there,
   investor (not trader) profile, no other local income. */
const TAX_MODELS={
  MY:{n:'Malaysia',calc:()=>({tax:0,notes:['No CGT for individuals — occasional investor disposals untaxed.','Risk: frequent business-like trading can be assessed as income (0–30%).','MM2H: explicit foreign-income exemption on top.']})},
  SG:{n:'Singapore',calc:()=>({tax:0,notes:['No capital gains tax for individual investors.','Best banking/exchange infrastructure for large sums.','Habitual trading as a business is taxable.']})},
  HK:{n:'Hong Kong',calc:()=>({tax:0,notes:['No CGT; territorial system.','Business-like trading caveat applies.']})},
  PH:{n:'Philippines',calc:()=>({tax:0,notes:['Foreign nationals taxed on PH-source income only — offshore crypto gains are foreign-source.','Keep exchange + custody offshore; local business activity is taxed.']})},
  AE:{n:'UAE',calc:()=>({tax:0,notes:['0% personal income tax. The benchmark.']})},
  TH:{n:'Thailand',calc:({fx,o})=>{
    const remit=o.thRemit||0;
    const taxTHB=prog(remit*fx('THB'),TH_PIT);
    const tax=o.thLTR?0:taxTHB/fx('THB');
    return {tax,notes:[
      o.thLTR?'LTR visa: foreign-source remittances exempt → €0.':'Only what you REMIT into Thailand is taxed (progressive PIT). Model uses your remittance setting: €'+Math.round(remit).toLocaleString()+'/yr.',
      'Off-ramp offshore and remit only living money — or hold LTR for full exemption.',
      'Pre-2024 gains exempt. PENDING: same-year/next-year remittance exemption (proposed 2026).',
      'Never sell on a Thai exchange (Thai-source).']};
  }},
  JP:{n:'Japan',calc:({gain,fx,o})=>{
    if(o.jp2028)return {tax:gain*.20315,notes:['Assumes the 2028 reform passed AND asset is FSA-listed, sold on a registered JP exchange: flat 20.315%.','Foreign exchanges / DeFi / staking stay at up to ~55% even after reform.']};
    const jpy=gain*fx('JPY');
    const tax=(prog(jpy,JP_NAT)*1.021+jpy*.10)/fx('JPY');
    return {tax,notes:['Miscellaneous income: progressive national (5–45%) ×1.021 surtax + 10% inhabitant tax.','This is the danger-zone number — do NOT become JP tax resident holding gains.','Toggle the 2028-reform switch to see the future 20.315% scenario.']};
  }},
  VN:{n:'Vietnam',calc:({proceeds})=>({tax:proceeds*.001,notes:['New framework: 0.1% of GROSS sale proceeds (like securities), via licensed pilot exchanges.','Cheap on big gains — but regime is young; verify hard before relying on it.'],rough:true}),},
  ID:{n:'Indonesia',calc:({gain,fx})=>({tax:prog(gain*fx('IDR'),ID_PIT)/fx('IDR'),notes:['Resident = worldwide income; offshore gains modeled at ordinary progressive rates (5–35%).','Domestic licensed-exchange trades instead get small final levies (~0.2%) — but your gains are offshore.'],rough:true})},
  TW:{n:'Taiwan',calc:({gain,fx})=>({tax:Math.max(0,gain*fx('TWD')-7.5e6)*.20/fx('TWD'),notes:['Overseas income under AMT: 20% only above ~NT$7.5M/yr (≈€204k at current FX).','Below the threshold: effectively 0. Big years: split across tax years.'],rough:true})},
  KR:{n:'South Korea',calc:({gain,fx,o})=>{
    if(!o.krRemit)return {tax:0,notes:['Foreign national resident ≤5 of last 10 yrs: foreign-source income taxed ONLY if remitted to Korea.','Model assumes you keep proceeds offshore. Toggle remit to see taxed case.']};
    return {tax:Math.max(0,gain*fx('KRW')-2.5e6)*.22/fx('KRW'),notes:['20% + 2% local above ~KRW 2.5M — crypto gains tax scheduled Jan 2027 (delayed before; verify).'],rough:true};
  }},
  KH:{n:'Cambodia',calc:({gain})=>({tax:gain*.20,notes:['Worldwide income in law; modeled flat ~20%. Enforcement evolving — VERY rough.'],rough:true})},
  LA:{n:'Laos',calc:()=>({tax:null,notes:['No clear framework — unquantifiable. Do not off-ramp here.']})},
  CN:{n:'China',calc:()=>({tax:null,notes:['Trading banned — no lawful off-ramp.']})},
  IN:{n:'India',calc:({gain})=>({tax:gain*.30,notes:['Flat 30% on crypto (VDA) gains — plus 4% cess & surcharge, so ~34% effective. NO holding-period relief, NO loss offset.','A separate 1% TDS is withheld on every transfer.','Only applies if you are India tax-resident (≥182 days). One of the harshest regimes — do not off-ramp here.'],rough:true})},
  PY:{n:'Paraguay',calc:()=>({tax:0,notes:['Territorial: crypto sold on foreign exchanges is foreign-source → 0% tax.','Report crypto activity over ~US$5k/yr (Resolution 47/2026) — but the rate stays 0%.','No 183-day trap; residency via cédula + RUC.']})},
  GE:{n:'Georgia',calc:()=>({tax:0,notes:['Individual crypto disposals are deemed non-Georgian-source → 0% personal income tax, any amount.','No wealth, inheritance or gift tax.','Run trading as a registered business instead → Small-Business status (1% of turnover up to 500k GEL).']})},
  UY:{n:'Uruguay',calc:({gain,o})=>{
    if(o.uyHoliday)return {tax:0,notes:['New-resident tax holiday elected: foreign crypto gains exempt for ~11 years.','Requires 183+ days AND a qualifying investment (~US$2M property or US$100k/yr fund).']};
    return {tax:gain*.12,notes:['Standard resident: foreign-source capital gains (crypto) taxed at a flat 12% IRPF since 2026.','Toggle the holiday if you elect the new-resident exemption instead.'],rough:true};
  }},
  AR:{n:'Argentina',calc:({gain})=>({tax:gain*.15,notes:['Modeled at 15% (capital-gain treatment); can reach 35% if treated as ordinary income.','PLUS a yearly wealth tax of 0.5–1.75% on the crypto holdings themselves.','Currency controls complicate moving funds — avoid as an off-ramp.'],rough:true})},
  NL:{n:'Netherlands',calc:({gain})=>({tax:gain*.36,notes:['Reference: 2028 werkelijk-rendement regime ≈36% on gains as they accrue.','This is the number the whole plan routes around.'],rough:true})}
};
