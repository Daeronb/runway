'use strict';
const APP_VERSION='v4';

/* ---------------- state ---------------- */
const LS='runway:v1';
let state=load();
function load(){
  let s=null;
  try{const j=JSON.parse(localStorage.getItem(LS));if(j&&Array.isArray(j.trips))s=j;}catch(e){}
  s=s||{trips:[],settings:{nlDeparture:''}};
  s.finance=Object.assign({bonds:0,yieldPct:3.2,cash:0,cryptoVal:0,cryptoBasis:0,floor:350000,colMode:'n',thRemit:20000,thLTR:false,jp2028:false,krRemit:false},s.finance||{});
  s.fx=s.fx||null;
  return s;
}
function save(){localStorage.setItem(LS,JSON.stringify(state));}

/* ---------------- dates ---------------- */
const MS=86400000;
const pad=n=>String(n).padStart(2,'0');
function s2d(s){return new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10),12);}
function d2s(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function todayS(){return d2s(new Date());}
function addDays(s,n){const d=s2d(s);d.setDate(d.getDate()+n);return d2s(d);}
function diffDays(a,b){return Math.round((s2d(b)-s2d(a))/MS);}
function fmt(s){return s?s2d(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';}
function fmtShort(s){return s?s2d(s).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'—';}

/* ---------------- rules helpers ---------------- */
function ruleFor(cc){return RULES[cc]||GENERIC_RULE;}
function hasCard(cc){return !!RULES[cc];}
function cname(cc){return (COUNTRIES[cc]||{n:cc}).n;}
function cflag(cc){return (COUNTRIES[cc]||{f:'\u{1F30F}'}).f;}
function isStale(r){return diffDays(r.verified||RULES_BUILT,todayS())>STALE_DAYS;}

/* ---------------- day math ---------------- */
function tripEnd(t,asOf){return t.depart||asOf;}
function overlap(t,ws,we,asOf){
  const e0=tripEnd(t,asOf);
  const s=t.arrive>ws?t.arrive:ws, e=e0<we?e0:we;
  return s>e?0:diffDays(s,e)+1;
}
function daysIn(cc,ws,we,asOf,extra){
  let n=0;
  for(const t of state.trips) if(t.cc===cc && t.arrive<=we) n+=overlap(t,ws,we,asOf);
  if(extra && extra.cc===cc) n+=overlap(extra,ws,we,asOf);
  return n;
}
function ytd(cc,asOf,extra){return daysIn(cc,asOf.slice(0,4)+'-01-01',asOf,asOf,extra);}
function roll365(cc,asOf,extra){return daysIn(cc,addDays(asOf,-364),asOf,asOf,extra);}
function taxDays(cc,asOf,extra){
  const r=ruleFor(cc); if(!r.tax||!r.tax.days) return null;
  const y=ytd(cc,asOf,extra), ro=roll365(cc,asOf,extra);
  const v=r.tax.window==='cal'?y : r.tax.window==='roll'?ro : Math.max(y,ro);
  return {days:v,y,ro,limit:r.tax.days,pct:v/r.tax.days,window:r.tax.window,generic:!hasCard(cc)};
}
function ongoingTrip(){const t=todayS();return state.trips.find(x=>!x.depart&&x.arrive<=t)||null;}
function loggedCCs(){return [...new Set(state.trips.map(t=>t.cc))];}
function level(pct){return pct>=1?'over':pct>=.9?'red':pct>=.75?'amber':'ok';}
const LEVEL_ICON={over:'\u{1F6A8}',red:'\u{1F534}',amber:'\u{1F7E0}',ok:'\u{1F7E2}'};

/* visa status for an ongoing entry */
function visaStat(t,asOf){
  const r=ruleFor(t.cc); if(!r.visa||!r.visa.days) return null;
  const used=diffDays(t.arrive,asOf)+1;
  const base=r.visa.days, ext=r.visa.ext||0;
  const limit=base+(t.ext?ext:0);
  return {used,base,ext,limit,left:limit-used,lastDay:addDays(t.arrive,limit-1),canExtend:!t.ext&&ext>0};
}

/* first date (searching from `from` to `to`) where tax threshold is reached; null if never */
function crossDate(cc,from,to,extra){
  const r=ruleFor(cc); if(!r.tax||!r.tax.days) return null;
  let d=from;
  while(d<=to){
    const td=taxDays(cc,d,extra);
    if(td.days>=td.limit) return d;
    // jump: we are short by (limit - days); can't cross sooner than that many days ahead
    const short=td.limit-td.days;
    d=addDays(d,Math.max(1,short));
  }
  return null;
}

/* ---------------- rendering utils ---------------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast._x);toast._x=setTimeout(()=>t.hidden=true,2600);}

function bar(pct,lv){
  const w=Math.min(100,Math.round(pct*100));
  return `<div class="bar"><div class="fill ${lv}" style="width:${w}%"></div></div>`;
}

/* ---------------- TODAY ---------------- */
function renderToday(){
  const asOf=todayS();
  const cur=ongoingTrip();
  let h='';

  // current location
  if(cur){
    const entryDay=diffDays(cur.arrive,asOf)+1;
    const vs=visaStat(cur,asOf);
    const td=taxDays(cur.cc,asOf);
    h+=`<div class="card hero">
      <div class="hero-flag">${cflag(cur.cc)}</div>
      <div class="hero-body">
        <div class="hero-name">${esc(cname(cur.cc))}</div>
        <div class="muted">Day ${entryDay} of this entry · since ${fmtShort(cur.arrive)}</div>
        ${vs?`<div class="${vs.left<0?'bad':vs.left<=10?'warn':''}">${vs.left>=0
            ?`${vs.left} visa day${vs.left===1?'':'s'} left (limit ${vs.limit}d, last day ${fmtShort(vs.lastDay)})`
            :`\u{1F6A8} ${-vs.left}d over the ${vs.limit}d visa limit`}${vs.canExtend?` — extendable +${vs.ext}d in-country`:''}</div>`:''}
        ${td?`<div class="muted">Tax clock: ${td.days} / ${td.limit}d ${td.window==='cal'?'this year':td.window==='roll'?'(rolling 365)':''} ${td.generic?'· generic':''}</div>`:''}
      </div></div>`;
    // projection if staying put
    if(td&&td.days<td.limit){
      const hit=crossDate(cur.cc,asOf,asOf.slice(0,4)+'-12-31',null);
      if(hit) h+=`<div class="card note">\u{23F3} If you stay in ${esc(cname(cur.cc))}, you hit ${td.limit} tax days on <b>${fmt(hit)}</b> — last safe departure ${fmt(addDays(hit,-1))}.</div>`;
    }
  } else {
    h+=`<div class="card hero"><div class="hero-flag">\u{1F9ED}</div><div class="hero-body">
      <div class="hero-name">No ongoing trip</div>
      <div class="muted">Log your current location in Trips — the clocks run from your trip log.</div></div></div>`;
  }

  // alerts
  const alerts=[];
  for(const cc of loggedCCs()){
    if(cc==='NL'||cc==='XX')continue;
    const td=taxDays(cc,asOf);
    if(td&&td.days>0){
      const lv=level(td.pct);
      if(lv!=='ok') alerts.push({lv,html:`${LEVEL_ICON[lv]} <b>${cflag(cc)} ${esc(cname(cc))}</b> — ${td.days}/${td.limit} tax days (${Math.round(td.pct*100)}%)${lv==='over'?' — THRESHOLD PASSED':''}`});
    }
  }
  if(cur){const vs=visaStat(cur,asOf);
    if(vs&&vs.left<=10) alerts.push({lv:vs.left<0?'over':'red',html:`${vs.left<0?'\u{1F6A8}':'\u{1F534}'} <b>${cflag(cur.cc)} visa</b> — ${vs.left<0?(-vs.left)+'d OVERSTAY':vs.left+'d left on this entry'}`});}
  if(alerts.length){
    h+=`<h2>Alerts</h2>`+alerts.map(a=>`<div class="card alert ${a.lv}">${a.html}</div>`).join('');
  }

  // country meters
  const rows=[];
  for(const cc of loggedCCs()){
    if(cc==='XX')continue;
    const td=taxDays(cc,asOf);
    const y=ytd(cc,asOf), ro=roll365(cc,asOf);
    if(!y&&!ro)continue;
    if(!td){rows.push({pct:0,html:`<div class="meter"><div class="mhead"><span>${cflag(cc)} ${esc(cname(cc))}</span><span class="muted">${y}d this yr</span></div><div class="muted small">${esc(ruleFor(cc).tax.label)}</div></div>`});continue;}
    const lv=level(td.pct);
    rows.push({pct:td.pct,html:`<div class="meter" data-cc="${cc}"><div class="mhead"><span>${cflag(cc)} ${esc(cname(cc))}</span><span class="${lv==='ok'?'muted':lv}">${td.days} / ${td.limit}d</span></div>${bar(td.pct,lv)}<div class="muted small">${td.y}d in ${asOf.slice(0,4)} · ${td.ro}d rolling 365${td.generic?' · generic rule':''}</div></div>`});
  }
  rows.sort((a,b)=>b.pct-a.pct);
  if(rows.length) h+=`<h2>Day counters</h2>`+rows.map(r=>r.html).join('');

  // NL panel
  const dep=state.settings.nlDeparture;
  const nlY=ytd('NL',asOf);
  let nlBody='';
  if(dep){
    const dd=diffDays(asOf,dep);
    nlBody+=dd>0?`<div><b>${dd} days</b> until NL departure (${fmt(dep)})</div>`
               :`<div><b>${-dd} days</b> since NL departure (${fmt(dep)})</div>`;
    if(dd<=0&&nlY>0)nlBody+=`<div class="${nlY>120?'bad':nlY>60?'warn':''}">${nlY} logged NL days this year — keep return visits short & tie-free.</div>`;
  } else nlBody+=`<div class="muted">Set your NL departure date in the menu (☰) to start the exit countdown.</div>`;
  nlBody+=`<div class="muted small" style="margin-top:6px">Box 3 werkelijk rendement: Eerste Kamer vote postponed (30 Jun 2026), still aimed at 1 Jan 2028. Residency = facts &amp; circumstances, not days — see the \u{1F1F3}\u{1F1F1} rule card.</div>`;
  h+=`<h2>Netherlands</h2><div class="card">${nlBody}</div>`;

  h+=`<div class="foot">Informational only — not tax or legal advice. Rules verified ${fmt(RULES_BUILT)}.</div>`;
  $('#view-today').innerHTML=h;
  document.querySelectorAll('#view-today .meter[data-cc]').forEach(el=>el.onclick=()=>{showView('countries');openCountry(el.dataset.cc);});
}

/* ---------------- TRIPS ---------------- */
function renderTrips(){
  const trips=[...state.trips].sort((a,b)=>b.arrive.localeCompare(a.arrive));
  let h='';
  if(!trips.length) h=`<div class="card note">No trips yet. Tap <b>＋</b> to log where you are (or a past trip). Tip: log trips as you land — arrival and departure days both count.</div>`;
  let year='';
  for(const t of trips){
    const y=t.arrive.slice(0,4);
    if(y!==year){h+=`<h2>${y}</h2>`;year=y;}
    const end=t.depart||todayS();
    const n=diffDays(t.arrive,end)+1;
    h+=`<div class="card trip" data-id="${t.id}">
      <span class="tflag">${cflag(t.cc)}</span>
      <span class="tbody"><b>${esc(cname(t.cc))}</b><br>
      <span class="muted small">${fmtShort(t.arrive)} → ${t.depart?fmtShort(t.depart):'<span class="ongoing">ongoing</span>'} · ${n}d${t.note?' · '+esc(t.note):''}</span></span>
      <span class="chev">›</span></div>`;
  }
  $('#view-trips').innerHTML=h;
  document.querySelectorAll('.trip').forEach(el=>el.onclick=()=>tripSheet(state.trips.find(t=>t.id===el.dataset.id)));
}

function countryOptions(sel){
  const regions={};
  for(const [cc,c] of Object.entries(COUNTRIES)){(regions[c.r]=regions[c.r]||[]).push([cc,c]);}
  const order=['Southeast Asia','East Asia','South Asia','Central Asia','Benchmark','Home','Other'];
  let h='';
  for(const r of order){
    if(!regions[r])continue;
    h+=`<optgroup label="${r}">`+regions[r].sort((a,b)=>a[1].n.localeCompare(b[1].n))
      .map(([cc,c])=>`<option value="${cc}" ${cc===sel?'selected':''}>${c.f} ${c.n}${hasCard(cc)?'':' *'}</option>`).join('')+`</optgroup>`;
  }
  return h;
}

function tripSheet(t){
  const isNew=!t;
  t=t||{id:'t'+Date.now(),cc:'TH',arrive:todayS(),depart:'',note:''};
  openSheet(`
    <h3>${isNew?'New trip':'Edit trip'}</h3>
    <label>Country<select id="f-cc">${countryOptions(t.cc)}</select></label>
    <label>Arrived<input type="date" id="f-arr" value="${t.arrive}"></label>
    <label class="row"><input type="checkbox" id="f-on" ${t.depart?'':'checked'}> I'm still here (ongoing)</label>
    <label id="f-dep-wrap" ${t.depart?'':'hidden'}>Departed<input type="date" id="f-dep" value="${t.depart||todayS()}"></label>
    <label class="row" id="f-ext-wrap" ${(ruleFor(t.cc).visa||{}).ext?'':'hidden'}><input type="checkbox" id="f-ext" ${t.ext?'checked':''}> <span id="f-ext-txt">Visa extension obtained (+${(ruleFor(t.cc).visa||{}).ext||0}d)</span></label>
    <label>Note <span class="muted small">(optional)</span><input type="text" id="f-note" maxlength="60" value="${esc(t.note||'')}"></label>
    <div class="btnrow">
      <button class="btn primary" id="f-save">Save</button>
      ${isNew?'':'<button class="btn danger" id="f-del">Delete</button>'}
      <button class="btn" id="f-cancel">Cancel</button>
    </div>
    <div class="muted small">* = no researched rule card yet (generic 183-day caution applies)</div>`);
  $('#f-on').onchange=e=>{$('#f-dep-wrap').hidden=e.target.checked;};
  $('#f-cc').onchange=e=>{const v=ruleFor(e.target.value).visa||{};$('#f-ext-wrap').hidden=!v.ext;$('#f-ext-txt').textContent=`Visa extension obtained (+${v.ext||0}d)`;};
  $('#f-cancel').onclick=closeSheet;
  if(!isNew)$('#f-del').onclick=()=>{state.trips=state.trips.filter(x=>x.id!==t.id);save();closeSheet();renderAll();toast('Trip deleted');};
  $('#f-save').onclick=()=>{
    const cc=$('#f-cc').value, arr=$('#f-arr').value, on=$('#f-on').checked, dep=on?'':$('#f-dep').value;
    if(!arr){toast('Arrival date required');return;}
    if(dep&&dep<arr){toast('Departure is before arrival');return;}
    if(on){const other=state.trips.find(x=>!x.depart&&x.id!==t.id);
      if(other){other.depart=addDays(arr,0)<other.arrive?other.arrive:arr;toast(`Closed ongoing ${cname(other.cc)} trip`);} }
    const obj={id:t.id,cc,arrive:arr,depart:dep,ext:!!($('#f-ext')&&$('#f-ext').checked&&(ruleFor(cc).visa||{}).ext),note:$('#f-note').value.trim()};
    const i=state.trips.findIndex(x=>x.id===t.id);
    if(i>=0)state.trips[i]=obj;else state.trips.push(obj);
    save();closeSheet();renderAll();toast('Saved');
  };
}

/* ---------------- COUNTRIES / RULES ---------------- */
const STANCE={good:['\u{1F7E2}','Off-ramp friendly'],warn:['\u{1F7E1}','Conditional — plan carefully'],bad:['\u{1F534}','Danger zone']};
const STANCE_SHORT={good:'friendly',warn:'careful',bad:'danger'};
const STANCE_GLYPH={good:'✓',warn:'!',bad:'✕'};
function legendHTML(){return `<div class="legend"><span><span class="dot g">✓</span>crypto off-ramp friendly</span><span><span class="dot y">!</span>conditional — plan carefully</span><span><span class="dot r">✕</span>danger zone</span><span><span class="dot n"></span>no rule card yet</span></div>`;}
let _flagOK=null;
function flagsSupported(){
  if(_flagOK!==null)return _flagOK;
  try{
    const c=document.createElement('canvas');c.width=c.height=20;
    const x=c.getContext('2d');x.font='16px sans-serif';x.fillText('\u{1F1F9}\u{1F1ED}',0,16);
    const d=x.getImageData(0,0,20,20).data;
    _flagOK=false;
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]>0&&(Math.abs(d[i]-d[i+1])>16||Math.abs(d[i+1]-d[i+2])>16)){_flagOK=true;break;}
    }
  }catch(e){_flagOK=true;}
  return _flagOK;
}
let openCC=null;

function renderCountries(){
  const asOf=todayS();
  const logged=loggedCCs();
  const ccs=Object.keys(RULES).sort((a,b)=>{
    const la=logged.includes(a)?0:1, lb=logged.includes(b)?0:1;
    if(la!==lb)return la-lb;
    return cname(a).localeCompare(cname(b));
  });
  let h=legendHTML()+`<div class="muted small pad">The colored badge rates each country for liquidating crypto while tax-resident there. Every card shows a “verified” date — after 6 months it flags itself STALE; rules here change fast.</div>`;
  for(const cc of ccs){
    const r=RULES[cc];
    const st=STANCE[r.crypto.stance];
    const y=ytd(cc,asOf);
    const stale=isStale(r);
    const open=openCC===cc;
    h+=`<div class="card country ${open?'open':''}" data-cc="${cc}">
      <div class="chead">
        <span class="tflag">${cflag(cc)}</span>
        <span class="tbody"><b>${esc(cname(cc))}</b> <span class="pill ${r.crypto.stance}">${st[0]} ${STANCE_SHORT[r.crypto.stance]}</span>${stale?' <span class="stale">STALE — re-verify</span>':''}<br>
          <span class="muted small">${esc(r.tax.label)}${y?` · ${y}d this yr`:''}</span></span>
        <span class="chev">${open?'▾':'›'}</span>
      </div>
      ${open?`<div class="cbody">
        <div class="sect"><b>${st[0]} Crypto: ${esc(r.crypto.head)}</b><p>${esc(r.crypto.body)}</p></div>
        <div class="sect"><b>\u{1F4C6} Tax residency</b><p>${esc(r.tax.note)}</p></div>
        <div class="sect"><b>\u{1F6C2} Visa (NL passport): ${esc(r.visa.label)}</b><p>${esc(r.visa.note)}</p></div>
        ${r.routes?`<div class="sect"><b>\u{1F5FA} Route</b><p>${esc(r.routes)}</p></div>`:''}
        <div class="muted small">Verified ${fmt(r.verified)}${stale?' — STALE':''}</div>
        ${r.sources.length?`<div class="srcs">${r.sources.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])} ↗</a>`).join('')}</div>`:''}
      </div>`:''}
    </div>`;
  }
  $('#view-countries').innerHTML=h;
  document.querySelectorAll('.country').forEach(el=>{
    el.querySelector('.chead').onclick=()=>{openCC=openCC===el.dataset.cc?null:el.dataset.cc;renderCountries();};
  });
}
function openCountry(cc){openCC=cc;renderCountries();
  const el=document.querySelector(`.country[data-cc="${cc}"]`);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}

/* ---------------- MAP ---------------- */
function renderMap(){
  const asOf=todayS();
  let tiles='';
  for(const [cc,c] of Object.entries(COUNTRIES)){
    if(!c.m)continue;
    const carded=hasCard(cc);
    const y=ytd(cc,asOf), ro=roll365(cc,asOf);
    const td=(carded||y||ro)?taxDays(cc,asOf):null;
    const lv=td&&td.days>0?level(td.pct):null;
    const st=carded?RULES[cc].crypto.stance:null;
    const showFlag=flagsSupported();
    const warnGlyph=lv==='amber'?'⚠ ':(lv==='red'||lv==='over')?'✕ ':'';
    tiles+=`<div class="tile ${st?'st-'+st:''} ${lv?'lv-'+lv:''} ${!carded?'dim':''} ${showFlag?'':'noflag'}" style="grid-column:${c.m[0]+1};grid-row:${c.m[1]+1}" data-cc="${cc}">
      ${st?`<span class="stbadge sb-${st}">${STANCE_GLYPH[st]}</span>`:''}
      ${showFlag?`<span class="tf">${c.f}</span>`:''}<span class="tn">${cc}</span><span class="td ${lv&&lv!=='ok'?lv:''}">${td&&td.days>0?warnGlyph+td.days+'/'+td.limit:'&nbsp;'}</span></div>`;
  }
  $('#view-map').innerHTML=legendHTML()+`<div class="mapwrap"><div class="maptiles">${tiles}</div></div>
    <div class="muted small pad" style="margin-top:10px">Schematic map — tap a country for its snapshot. Tiles fill amber/red as tax-day clocks approach thresholds; dashed tiles have no researched rule card yet.</div>`;
  document.querySelectorAll('.tile').forEach(el=>el.onclick=()=>mapSheet(el.dataset.cc));
}
function mapSheet(cc){
  const r=ruleFor(cc), asOf=todayS(), st=STANCE[r.crypto.stance], td=taxDays(cc,asOf);
  const cur=ongoingTrip(); const vs=cur&&cur.cc===cc?visaStat(cur,asOf):null;
  openSheet(`
    <h3>${cflag(cc)} ${esc(cname(cc))} <span class="pill ${r.crypto.stance}">${st[0]} ${STANCE_SHORT[r.crypto.stance]}</span></h3>
    <div class="sect"><b>Crypto</b><p>${esc(r.crypto.head)}</p></div>
    <div class="sect"><b>Tax residency</b><p>${esc(r.tax.label)}${td&&td.days>0?` — <b>${td.days}/${td.limit}d</b> used`:''}</p></div>
    <div class="sect"><b>Visa</b><p>${esc(r.visa.label)}${vs?` — ${vs.left}d left on this entry`:''}</p></div>
    <div class="btnrow">
      ${hasCard(cc)?`<button class="btn primary" id="ms-card">Full rule card</button>`:''}
      <button class="btn" id="ms-plan">Plan a stay</button>
      <button class="btn" id="ms-close">Close</button>
    </div>`);
  $('#ms-close').onclick=closeSheet;
  const b=$('#ms-card'); if(b)b.onclick=()=>{closeSheet();showView('countries');openCountry(cc);};
  $('#ms-plan').onclick=()=>{closeSheet();planCC=cc;renderPlan._init=true;showView('plan');};
}

/* ---------------- PLAN ---------------- */
let planCC='TH', planDate=addDays(todayS(),30);
function renderPlan(){
  const cur=ongoingTrip();
  if(cur&&!renderPlan._init){planCC=cur.cc;renderPlan._init=true;}
  let h=`<div class="card">
    <h3 style="margin-top:0">\u{1F52E} Scenario: stay in…</h3>
    <label>Country<select id="p-cc">${countryOptions(planCC)}</select></label>
    <label>…until<input type="date" id="p-date" value="${planDate}"></label>
    <div class="btnrow">
      <button class="btn chip" data-d="30">+30d</button>
      <button class="btn chip" data-d="60">+60d</button>
      <button class="btn chip" data-d="90">+90d</button>
      <button class="btn chip" data-d="180">+180d</button>
    </div>
  </div><div id="p-out"></div>`;
  $('#view-plan').innerHTML=h;
  $('#p-cc').onchange=e=>{planCC=e.target.value;planOut();};
  $('#p-date').onchange=e=>{planDate=e.target.value;planOut();};
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{planDate=addDays(todayS(),+b.dataset.d);$('#p-date').value=planDate;planOut();});
  planOut();
}
function planOut(){
  const asOf=todayS(), cc=planCC, target=planDate;
  if(!target||target<asOf){$('#p-out').innerHTML=`<div class="card note">Pick a future date.</div>`;return;}
  const cur=ongoingTrip();
  const already=cur&&cur.cc===cc; // ongoing trip extends automatically via asOf
  const extra=already?null:{cc,arrive:asOf,depart:target};
  const stayDays=diffDays(asOf,target)+1;
  const r=ruleFor(cc);
  let h=`<div class="card"><b>${cflag(cc)} ${esc(cname(cc))} until ${fmt(target)}</b> <span class="muted small">(${already?'continuing current stay':'assumes arrival today'}, ${stayDays}d more)</span>`;

  const td=taxDays(cc,target,extra);
  if(td){
    const lv=level(td.pct);
    h+=`<div style="margin-top:8px">${bar(td.pct,lv)}
      <div>${LEVEL_ICON[lv]} <b>${td.days} / ${td.limit}</b> tax days (${td.window==='cal'?'calendar year '+target.slice(0,4):td.window==='roll'?'rolling 365':'max of both windows'})${td.generic?' — generic rule':''}</div>`;
    const cross=crossDate(cc,asOf,target,extra);
    if(cross){
      h+=`<div class="bad">\u{1F6A8} You cross ${td.limit} days on <b>${fmt(cross)}</b> → last safe departure <b>${fmt(addDays(cross,-1))}</b>.</div>`;
    } else {
      // margin: how much longer past target could you stay this window?
      const horizon=addDays(target,400);
      const later=crossDate(cc,target,horizon,already?null:{cc,arrive:asOf,depart:horizon});
      h+=`<div class="good">\u{2705} Safe. ${later?`Staying on, you'd cross ${td.limit}d on ${fmt(later)}.`:`No crossing within a year at this pace.`}</div>`;
    }
    h+=`</div>`;
  } else {
    h+=`<div class="good" style="margin-top:8px">\u{2705} ${esc(r.tax.label)} — no day-count tax trap here.</div>`;
  }

  // visa check (extension-aware)
  if(r.visa&&r.visa.days){
    const entryStart=already?cur.arrive:asOf;
    const entryDays=diffDays(entryStart,target)+1;
    const base=r.visa.days, vext=r.visa.ext||0, vmax=base+vext;
    const baseEnd=addDays(entryStart,base-1), maxEnd=addDays(entryStart,vmax-1);
    if(entryDays<=base)
      h+=`<div class="muted" style="margin-top:6px">\u{1F6C2} Visa OK for one entry: ${entryDays} of ${base}d${vext?` (+${vext}d extension available)`:''} — ${esc(r.visa.label)}</div>`;
    else if(entryDays<=vmax)
      h+=`<div class="warn" style="margin-top:6px">\u{1F6C2} Doable WITH an in-country extension: the base ${base}d runs out ${fmt(baseEnd)} — apply before then for +${vext}d, covering you to ${fmt(maxEnd)}. ${esc(r.visa.label)}</div>`;
    else
      h+=`<div class="bad" style="margin-top:6px">\u{1F6C2} Exceeds even the extended ${vmax}d limit on <b>${fmt(addDays(maxEnd,1))}</b> — visa run or a proper visa needed. ${esc(r.visa.label)}</div>`;
  }

  // what does it do to OTHER clocks (rolling windows elsewhere are unaffected by presence here, but show top-2 running countries for context)
  h+=`</div>`;
  const others=loggedCCs().filter(x=>x!==cc&&x!=='XX'&&taxDays(x,target)).map(x=>({cc:x,td:taxDays(x,target)}))
    .filter(o=>o.td.days>0).sort((a,b)=>b.td.pct-a.td.pct).slice(0,3);
  if(others.length){
    h+=`<div class="card"><b>Other clocks on ${fmtShort(target)}</b>`+others.map(o=>`<div class="muted">${cflag(o.cc)} ${esc(cname(o.cc))}: ${o.td.days}/${o.td.limit}d</div>`).join('')+`</div>`;
  }
  $('#p-out').innerHTML=h;
}

/* ---------------- MONEY (Navigator) ---------------- */
const eur=n=>n==null?'—':'€'+Math.round(n).toLocaleString('en-GB');
function fxRate(cur){
  if(state.fx&&state.fx.rates&&state.fx.rates[cur])return state.fx.rates[cur];
  return FX_FALLBACK.rates[cur]||1;
}
async function fetchFX(force){
  const t=todayS();
  if(!force&&state.fx&&state.fx.date===t)return;
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/EUR');
    const j=await r.json();
    if(j&&j.rates){state.fx={date:t,rates:j.rates};save();if(curView==='money')renderMoney();if(force)toast('FX updated');}
  }catch(e){if(force)toast('FX fetch failed — using '+(state.fx?state.fx.date:'built-in '+FX_FALLBACK.date)+' rates');}
}
function finNum(id){const v=parseFloat($(id).value);return isNaN(v)?0:v;}
function gainNow(){const f=state.finance;return Math.max(0,(f.cryptoVal||0)-(f.cryptoBasis||0));}

function offRampRows(){
  const f=state.finance;
  const gain=gainNow(), proceeds=f.cryptoVal||0;
  const rows=[];
  for(const [cc,m] of Object.entries(TAX_MODELS)){
    let r;
    try{r=m.calc({gain,proceeds,fx:fxRate,o:f});}catch(e){r={tax:null,notes:['model error']};}
    rows.push({cc,tax:r.tax,eff:r.tax!=null&&gain>0?r.tax/gain:null,rough:!!r.rough,notes:r.notes||[]});
  }
  rows.sort((a,b)=>(a.tax==null?1e15:a.tax)-(b.tax==null?1e15:b.tax));
  return rows;
}
function runwayRows(){
  const f=state.finance;
  const capital=(f.bonds||0)+(f.cash||0);
  const yieldMo=(f.bonds||0)*(f.yieldPct||0)/100/12;
  const rows=[];
  for(const [cc,c] of Object.entries(COL)){
    const burn=f.colMode==='f'?c.f:c.n;
    const net=burn-yieldMo;
    const months=net<=0?Infinity:Math.max(0,(capital-(f.floor||0))/net);
    rows.push({cc,burn,net,months,city:c.c});
  }
  rows.sort((a,b)=>b.months-a.months);
  return {rows,capital,yieldMo};
}

function renderMoney(){
  const f=state.finance;
  const gain=gainNow();
  let h='';

  // portfolio
  h+=`<div class="card"><h3 style="margin-top:0">\u{1F4BC} Portfolio</h3>
    <div class="fingrid">
      <label>Bonds €<input type="number" inputmode="decimal" id="fi-bonds" value="${f.bonds||''}" placeholder="300000"></label>
      <label>Avg yield %/yr<input type="number" inputmode="decimal" step="0.1" id="fi-yield" value="${f.yieldPct||''}" placeholder="3.2"></label>
      <label>Cash €<input type="number" inputmode="decimal" id="fi-cash" value="${f.cash||''}" placeholder="30000"></label>
      <label>Crypto now €<input type="number" inputmode="decimal" id="fi-cval" value="${f.cryptoVal||''}" placeholder="75000"></label>
      <label>Crypto cost basis €<input type="number" inputmode="decimal" id="fi-cbasis" value="${f.cryptoBasis||''}" placeholder="25000"></label>
      <label>Capital floor €<input type="number" inputmode="decimal" id="fi-floor" value="${f.floor||''}" placeholder="350000"></label>
    </div>
    <div class="muted small">Saved on-device as you type. Yield income ≈ <b>${eur((f.bonds||0)*(f.yieldPct||0)/100/12)}/mo</b> gross · unrealised crypto gain ≈ <b>${eur(gain)}</b>.</div>
  </div>`;

  // off-ramp comparison
  h+=`<h2>Off-ramp simulator</h2>`;
  if(!f.cryptoVal){
    h+=`<div class="card note">Enter your crypto value (and cost basis) above to compare estimated liquidation tax across countries.</div>`;
  } else {
    const rows=offRampRows();
    h+=`<div class="card"><div class="muted small" style="margin-bottom:8px">Estimated tax if you sell the full <b>${eur(f.cryptoVal)}</b> (gain ${eur(gain)}) while <b>tax-resident</b> there. Assumes investor profile, no other local income. Tap a row for the reasoning + toggles. ~ = rough model.</div>
    ${rows.map(r=>{const nm=TAX_MODELS[r.cc].n;return `<div class="frow" data-cc="${r.cc}">
      <span class="tflag">${cflag(r.cc)}</span>
      <span class="tbody"><b>${esc(nm)}</b></span>
      <span class="famt ${r.tax===0?'good':r.tax==null?'muted':r.eff>0.3?'bad':r.eff>0.1?'warn':''}">${r.tax==null?'n/a':(r.rough?'~':'')+eur(r.tax)}${r.eff!=null&&r.tax>0?` <span class="muted small">(${Math.round(r.eff*100)}%)</span>`:''}</span>
      <span class="chev">›</span></div>`;}).join('')}
    </div>`;
  }

  // runway
  h+=`<h2>Runway to the floor</h2>`;
  const {rows:rw,capital,yieldMo}=runwayRows();
  if(!capital){
    h+=`<div class="card note">Enter bonds/cash above to see how long each country lets you live off yield before touching the ${eur(f.floor)} floor.</div>`;
  } else {
    h+=`<div class="card">
      <div class="btnrow" style="margin:0 0 10px">
        <button class="btn chip ${f.colMode==='f'?'primary':''}" id="fi-frugal">Frugal</button>
        <button class="btn chip ${f.colMode==='n'?'primary':''}" id="fi-normal">Normal</button>
      </div>
      <div class="muted small" style="margin-bottom:8px">Liquid capital ${eur(capital)} (bonds+cash, crypto excluded) · yield ${eur(yieldMo)}/mo · floor ${eur(f.floor)}. Cost of living incl. ~€150–250 health/travel insurance, verified ${fmt(MONEY_VERIFIED)}.</div>
      ${rw.map(r=>`<div class="frow frow-run">
        <span class="tflag">${cflag(r.cc)}</span>
        <span class="tbody"><b>${esc(cname(r.cc))}</b><br><span class="muted small">${esc(r.city)} · ${eur(r.burn)}/mo</span></span>
        <span class="famt ${r.months===Infinity?'good':r.months<24?'bad':r.months<48?'warn':''}">${r.months===Infinity?'∞ covered':Math.round(r.months)+' mo'}</span>
      </div>`).join('')}
      <div class="muted small" style="margin-top:8px">∞ = yield alone covers the burn; capital never drops. Months = time until liquid capital hits the floor at that burn.</div>
    </div>`;
  }

  // fx footer
  const fxd=state.fx?state.fx.date:FX_FALLBACK.date+' (built-in)';
  h+=`<div class="card"><div class="muted small">1 € = ${FX_SHOW.map(c=>`${Math.round(fxRate(c)).toLocaleString()} ${c}`).join(' · ')}<br>Rates: ${fxd} · <a href="#" id="fi-fx">refresh</a></div></div>`;
  h+=`<div class="foot">Rough planning models — not tax or financial advice. Verify with a professional before acting.</div>`;

  $('#view-money').innerHTML=h;

  const bind=(id,key)=>{const el=$(id);if(el)el.oninput=()=>{state.finance[key]=finNum(id);save();};el.onchange=()=>{renderMoney();};};
  bind('#fi-bonds','bonds');bind('#fi-yield','yieldPct');bind('#fi-cash','cash');
  bind('#fi-cval','cryptoVal');bind('#fi-cbasis','cryptoBasis');bind('#fi-floor','floor');
  const fr=$('#fi-frugal'),no=$('#fi-normal');
  if(fr)fr.onclick=()=>{state.finance.colMode='f';save();renderMoney();};
  if(no)no.onclick=()=>{state.finance.colMode='n';save();renderMoney();};
  document.querySelectorAll('.frow[data-cc]').forEach(el=>el.onclick=()=>offRampSheet(el.dataset.cc));
  const fx=$('#fi-fx');if(fx)fx.onclick=e=>{e.preventDefault();fetchFX(true);};
  fetchFX(false);
}

function offRampSheet(cc){
  const f=state.finance, m=TAX_MODELS[cc];
  const gain=gainNow();
  let r;try{r=m.calc({gain,proceeds:f.cryptoVal||0,fx:fxRate,o:f});}catch(e){r={tax:null,notes:[]};}
  let toggles='';
  if(cc==='TH')toggles=`
    <label>Remitted into Thailand €/yr<input type="number" inputmode="decimal" id="ff-threm" value="${f.thRemit||0}"></label>
    <label class="row"><input type="checkbox" id="ff-thltr" ${f.thLTR?'checked':''}> I hold an LTR visa (remittance exemption)</label>`;
  if(cc==='JP')toggles=`<label class="row"><input type="checkbox" id="ff-jp28" ${f.jp2028?'checked':''}> Assume 2028 reform passed + FSA-listed asset (20.315%)</label>`;
  if(cc==='KR')toggles=`<label class="row"><input type="checkbox" id="ff-krrem" ${f.krRemit?'checked':''}> Proceeds remitted into Korea</label>`;
  openSheet(`
    <h3>${cflag(cc)} ${esc(m.n)} off-ramp</h3>
    <div class="sect"><b>Estimated tax: ${r.tax==null?'n/a':(r.rough?'~':'')+eur(r.tax)}</b>${r.tax>0&&gain>0?` <span class="muted">(${Math.round(r.tax/gain*100)}% of gain)</span>`:''}</div>
    ${toggles}
    ${(r.notes||[]).map(n=>`<div class="sect"><p>• ${esc(n)}</p></div>`).join('')}
    <div class="muted small">Model assumes tax residency there, investor profile, no other local income. Verified ${fmt(MONEY_VERIFIED)}.</div>
    <div class="btnrow">
      ${RULES[cc]?`<button class="btn" id="ff-card">Rule card</button>`:''}
      <button class="btn primary" id="ff-close">Close</button>
    </div>`);
  $('#ff-close').onclick=()=>{closeSheet();renderMoney();};
  const cb=$('#ff-card');if(cb)cb.onclick=()=>{closeSheet();showView('countries');openCountry(cc);};
  const tr=$('#ff-threm');if(tr)tr.onchange=()=>{state.finance.thRemit=finNum('#ff-threm');save();offRampSheet(cc);};
  const tl=$('#ff-thltr');if(tl)tl.onchange=()=>{state.finance.thLTR=tl.checked;save();offRampSheet(cc);};
  const j8=$('#ff-jp28');if(j8)j8.onchange=()=>{state.finance.jp2028=j8.checked;save();offRampSheet(cc);};
  const kr=$('#ff-krrem');if(kr)kr.onchange=()=>{state.finance.krRemit=kr.checked;save();offRampSheet(cc);};
}

/* ---------------- SHEET / MENU ---------------- */
function openSheet(html){$('#sheet').innerHTML=html;$('#sheetWrap').hidden=false;}
function closeSheet(){$('#sheetWrap').hidden=true;}
$('#sheetBg')?0:0;

function menuSheet(){
  openSheet(`
    <h3>Runway ${APP_VERSION}</h3>
    <label>NL departure date<input type="date" id="m-dep" value="${esc(state.settings.nlDeparture||'')}"></label>
    <div class="btnrow" style="flex-wrap:wrap">
      <button class="btn" id="m-export">\u{2B07} Export backup</button>
      <button class="btn" id="m-import">\u{2B06} Import backup</button>
      <button class="btn" id="m-update">\u{1F504} Check for updates</button>
      <button class="btn danger" id="m-wipe">\u{1F5D1} Wipe all data</button>
    </div>
    <div class="muted small">Data lives only on this device (localStorage). Export a backup before switching phones. Rules verified ${fmt(RULES_BUILT)}. Informational only — not tax, legal or immigration advice.</div>
    <div class="btnrow"><button class="btn" id="m-close">Close</button></div>`);
  $('#m-close').onclick=closeSheet;
  $('#m-dep').onchange=e=>{state.settings.nlDeparture=e.target.value;save();renderAll();toast('Departure date saved');};
  $('#m-export').onclick=()=>{
    const blob=new Blob([JSON.stringify({app:'runway',version:APP_VERSION,exported:new Date().toISOString(),state},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='runway-backup-'+todayS()+'.json';a.click();URL.revokeObjectURL(a.href);
  };
  $('#m-import').onclick=()=>$('#importFile').click();
  $('#m-wipe').onclick=()=>{
    if(confirm('Wipe ALL trips and settings?')&&confirm('Really? This cannot be undone (unless you exported a backup).')){
      state={trips:[],settings:{nlDeparture:''}};save();closeSheet();renderAll();toast('Wiped');}
  };
  $('#m-update').onclick=checkUpdates;
}
$('#importFile').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const j=JSON.parse(await f.text());
    const s=j.state||j;
    if(!s||!Array.isArray(s.trips))throw 0;
    state={trips:s.trips,settings:s.settings||{nlDeparture:''}};
    save();closeSheet();renderAll();toast('Backup restored — '+state.trips.length+' trips');
  }catch(_){toast('Not a valid Runway backup');}
  e.target.value='';
});

async function checkUpdates(){
  toast('Checking…');
  try{
    const r=await fetch('./app.js?upd='+Date.now(),{cache:'no-store'});
    const m=(await r.text()).match(/APP_VERSION='([^']+)'/);
    if(m&&m[1]!==APP_VERSION){
      toast('Updating to '+m[1]+'…');
      for(const f of ['./','./index.html','./app.css','./app.js','./rules.js','./money.js'])
        try{await fetch(f,{cache:'reload'});}catch(_){}
      const reg=await navigator.serviceWorker?.getRegistration();
      if(reg)await reg.update();
      setTimeout(()=>location.reload(),400);
    } else toast('Up to date ('+APP_VERSION+')');
  }catch(_){toast('Check failed — offline?');}
}

/* ---------------- NAV ---------------- */
const VIEWS=['today','trips','map','countries','plan','money'];
let curView='today';
function showView(v){
  curView=v;
  for(const x of VIEWS)$('#view-'+x).hidden=x!==v;
  document.querySelectorAll('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.view===v));
  $('#fab').hidden=v!=='trips';
  renderAll();
}
document.querySelectorAll('#tabbar button').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('#menuBtn').onclick=menuSheet;
$('#fab').onclick=()=>tripSheet(null);
$('#sheetBg').onclick=closeSheet;

function renderAll(){
  if(curView==='today')renderToday();
  if(curView==='trips')renderTrips();
  if(curView==='map')renderMap();
  if(curView==='countries')renderCountries();
  if(curView==='plan')renderPlan();
  if(curView==='money')renderMoney();
}

/* ---------------- boot ---------------- */
renderAll();
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').then(reg=>{reg.update();});
  let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded)return;reloaded=true;location.reload();});
}
