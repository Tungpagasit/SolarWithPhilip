(()=>{
'use strict';

const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const D={version:'5.1',decisionProfile:null,homeowner:{state:'CA'},monthlyKwh:Array(12).fill(null),property:null,planning:{batteryKwh:20,reserve:.2,efficiency:.9,exportRate:.07,utilityGrowth:4},files:{decision:null,bill:null},consent:null,scenarios:{}};
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const num=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(n)||0);
const defaults={'PG&E':.406,'SCE':.344,'SDG&E':.455,Other:.30};

try{
  const saved=JSON.parse(localStorage.getItem('swp_proposal_v50')||'{}');
  Object.assign(D,saved);
  D.homeowner=D.homeowner||{};
  D.monthlyKwh=Array.isArray(D.monthlyKwh)?D.monthlyKwh.slice(0,12):Array(12).fill(null);
  while(D.monthlyKwh.length<12)D.monthlyKwh.push(null);
  D.files={decision:null,bill:null};
}catch(_){ }

if(!String(D.homeowner.state||'').trim())D.homeowner.state='CA';

const safe=()=>{
  const x=JSON.parse(JSON.stringify(D));
  x.files={
    decision:D.files.decision?{name:D.files.decision.name}:null,
    bill:D.files.bill?{name:D.files.bill.name}:null
  };
  return x;
};

const saveLocal=()=>localStorage.setItem('swp_proposal_v50',JSON.stringify(safe()));

function bindInput(id,key){
  const e=$('#'+id);
  if(!e)return;
  const saved=D.homeowner[key];
  if(saved!==null&&typeof saved!=='undefined'&&String(saved)!=='')e.value=saved;
  if(id==='state'&&!e.value.trim())e.value='CA';
  const sync=()=>{
    D.homeowner[key]=e.value;
    if(id==='state'&&!String(D.homeowner[key]).trim()){
      D.homeowner[key]='CA';
      e.value='CA';
    }
    saveLocal();
  };
  e.addEventListener('input',sync);
  e.addEventListener('change',sync);
}

['name','email','phone','utility','street','city','state','zip'].forEach(x=>bindInput(x,x));
bindInput('avg-bill','averageMonthlyBill');

function syncVisibleForm(){
  const read=id=>String($('#'+id)?.value||'').trim();
  D.homeowner.name=read('name');
  D.homeowner.email=read('email');
  D.homeowner.phone=read('phone');
  D.homeowner.utility=read('utility');
  D.homeowner.street=read('street');
  D.homeowner.city=read('city');
  D.homeowner.state=read('state')||'CA';
  D.homeowner.zip=read('zip');
  const billValue=$('#avg-bill')?.value;
  D.homeowner.averageMonthlyBill=billValue===''||typeof billValue==='undefined'?null:Number(billValue);
  if($('#state')&&!$('#state').value.trim())$('#state').value='CA';
  const monthInputs=Array.from(document.querySelectorAll('#month-inputs input'));
  if(monthInputs.length===12){
    D.monthlyKwh=monthInputs.map(e=>e.value===''?null:Number(e.value));
  }
  saveLocal();
}

const monthBox=$('#month-inputs');
M.forEach((m,i)=>{
  const l=document.createElement('label');
  l.textContent=m;
  l.innerHTML+=`<input type="number" min="0" step="1" inputmode="numeric" aria-label="${m} kWh">`;
  const e=l.querySelector('input');
  const stored=D.monthlyKwh[i];
  if(stored!==null&&stored!==''&&Number.isFinite(Number(stored)))e.value=stored;
  const sync=()=>{
    D.monthlyKwh[i]=e.value===''?null:Number(e.value);
    saveLocal();
    usageStatus();
  };
  e.addEventListener('input',sync);
  e.addEventListener('change',sync);
  monthBox.appendChild(l);
});

function usageStatus(){
  const valid=D.monthlyKwh.filter(v=>v!==null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0).length;
  $('#usage-status').textContent=valid===12?`All 12 months received · ${num(annualKwh())} kWh annually`:`${valid} of 12 months entered.`;
  return valid===12;
}

const annualKwh=()=>D.monthlyKwh.reduce((s,v)=>s+(Number(v)||0),0);
const utilityRate=()=>Number($('#utility-rate')?.value)||defaults[D.homeowner.utility]||.406;
usageStatus();

$('#decision-file').addEventListener('change',async e=>{
  const f=e.target.files[0];
  D.files.decision=f||null;
  $('#decision-name').textContent=f?f.name:'No file selected';
  if(!f)return;
  try{
    const p=JSON.parse(await f.text());
    if(p.profileType!=='SolarWithPhilipDecisionProfile')throw Error('This file is not a Solar With Philip Decision_Profile.');
    const version=Number(p.schemaVersion);
    if(!Number.isFinite(version)||version<2||version>=3)throw Error('This Decision_Profile version is not supported.');
    D.decisionProfile=p;
    $('#profile-loaded').hidden=false;
    renderFuture();
    saveLocal();
  }catch(err){
    D.decisionProfile=null;
    $('#profile-loaded').hidden=true;
    $('#decision-name').textContent=err.message;
  }
});

$('#bill-file').addEventListener('change',e=>{
  D.files.bill=e.target.files[0]||null;
  $('#bill-name').textContent=D.files.bill?D.files.bill.name:'No file selected';
});

function futureLoads(){
  const p=D.decisionProfile||{};
  const s1=p.sections?.section1||p.section1||{};
  const src=s1.futureLoads||s1.loads||p.futureEnergy?.loads||{};
  const vals={};
  Object.entries(src).forEach(([k,v])=>{
    const n=typeof v==='object'?Number(v.monthlyKwh??v.kwh??0):Number(v);
    if(Number.isFinite(n)&&n>0)vals[k]=n;
  });
  return vals;
}

function futureMonthly(){return Object.values(futureLoads()).reduce((a,b)=>a+b,0);}

function renderFuture(){
  const loads=futureLoads(),entries=Object.entries(loads);
  $('#future-context').hidden=!entries.length;
  if(entries.length){
    $('#future-copy').textContent=`Your Decision_Profile includes optional future-use context totaling about ${num(futureMonthly())} kWh per month: ${entries.map(([k,v])=>`${k} (${num(v)} kWh)`).join(', ')}. No entry is required here.`;
  }
}
renderFuture();

$('#analyze-property').addEventListener('click',async()=>{
  syncVisibleForm();
  const status=$('#property-status');
  const missing=[];
  if(!D.homeowner.street)missing.push('street address');
  if(!D.homeowner.city)missing.push('city');
  if(!D.homeowner.state)missing.push('state');
  if(!D.homeowner.zip)missing.push('ZIP code');
  if(missing.length){
    status.className='status error';
    status.textContent=`Please complete: ${missing.join(', ')}.`;
    return;
  }
  const address=[D.homeowner.street,D.homeowner.city,D.homeowner.state,D.homeowner.zip].join(', ');
  status.className='status';
  status.textContent='Analyzing the property…';
  try{
    const r=await fetch('/.netlify/functions/property-analysis',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address})});
    const type=r.headers.get('content-type')||'';
    const text=await r.text();
    if(!type.includes('application/json'))throw Error(`Property service returned ${r.status} instead of JSON. Confirm the Netlify function deployed from proposal/functions.`);
    let j;
    try{j=JSON.parse(text);}catch(_){throw Error('Property service returned unreadable data.');}
    if(!r.ok)throw Error(j.error||`Property analysis failed (${r.status}).`);
    D.property=j;
    saveLocal();
    status.className='status';
    status.textContent='Property recognized ✓';
    const solar=j.solar?.solarPotential||{};
    $('#property-result').hidden=false;
    $('#property-result').innerHTML=`<div class="property-grid"><img src="/.netlify/functions/property-analysis?mode=image&lat=${encodeURIComponent(j.lat)}&lng=${encodeURIComponent(j.lng)}" alt="Satellite view of the analyzed property"><div><strong>${escapeHtml(j.formattedAddress||address)}</strong><p>Google Solar resource data found for this property.</p><ul><li>Maximum sunshine hours/year: ${num(solar.maxSunshineHoursPerYear||0)}</li><li>Usable roof area: ${num(solar.wholeRoofStats?.areaMeters2||0)} m²</li><li>Modeled configurations available: ${(solar.solarPanelConfigs||[]).length}</li></ul></div></div>`;
  }catch(err){
    console.error('Property analysis error:',err);
    status.className='status error';
    status.textContent=err.message||'Property analysis could not be completed.';
  }
});

function validate(){
  syncVisibleForm();
  const bad=[];
  if(!D.homeowner.name)bad.push('full name');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(D.homeowner.email))bad.push('valid email');
  if(!D.homeowner.phone)bad.push('phone');
  if(!D.homeowner.utility)bad.push('utility');
  if(!D.homeowner.street)bad.push('street address');
  if(!D.homeowner.city)bad.push('city');
  if(!D.homeowner.state)bad.push('state');
  if(!D.homeowner.zip)bad.push('ZIP code');
  if(D.homeowner.averageMonthlyBill===null||!Number.isFinite(D.homeowner.averageMonthlyBill)||D.homeowner.averageMonthlyBill<0)bad.push('average monthly electric cost');
  if(!D.files.bill)bad.push('full utility bill');
  if(!usageStatus())bad.push('all 12 monthly kWh values');
  if(!$('#consent').checked)bad.push('authorization');
  return bad;
}

$('#consent').addEventListener('change',e=>{
  D.consent=e.target.checked?new Date().toISOString():null;
  saveLocal();
});

$('#build-analysis').addEventListener('click',()=>{
  const bad=validate();
  if(bad.length){
    $('#build-status').className='status error';
    $('#build-status').textContent=`Please complete: ${bad.join(', ')}.`;
    return;
  }
  $('#build-status').className='status';
  $('#build-status').textContent='';
  D.consent=D.consent||new Date().toISOString();
  renderAll();
  $('#analysis').hidden=false;
  $('#analysis').scrollIntoView({behavior:'smooth'});
  saveLocal();
});

function renderUsage(){
  syncVisibleForm();
  const values=D.monthlyKwh.map(v=>Number(v)||0);
  const max=Math.max(...values,1);
  $('#usage-chart').innerHTML=values.map((v,i)=>`<div class="bar-wrap"><span class="bar-value">${num(v)}</span><div class="bar" style="height:${Math.max(3,v/max*205)}px"></div><span class="bar-label">${M[i]}</span></div>`).join('');
  const annual=annualKwh();
  $('#annual-use').textContent=`${num(annual)} kWh`;
  $('#average-use').textContent=`${num(annual/12)} kWh`;
  $('#annual-cost').textContent=money(annual*utilityRate());
}

const weights=[.74,.76,.98,1.11,1.10,1.19,1.26,1.28,1.10,.95,.81,.68];
const days=[31,28,31,30,31,30,31,31,30,31,30,31];
const solarHours=[9.7,10.7,12,13.2,14.2,14.8,14.5,13.6,12.4,11.1,10,9.4];

function seasonal(offset){
  const future=futureMonthly();
  const use=D.monthlyKwh.map(v=>Number(v)+future);
  const annual=use.reduce((a,b)=>a+b,0);
  const sum=weights.reduce((a,b)=>a+b,0);
  const prod=weights.map(w=>annual*offset*w/sum);
  const battery=Number($('#battery-kwh').value)||0;
  const reserve=Number($('#battery-reserve').value)||0;
  const eff=Number($('#battery-efficiency').value)||.9;
  const imports=[],exports=[];
  use.forEach((month,i)=>{
    const dailyUse=month/days[i];
    const dailyProd=prod[i]/days[i];
    const solarShare=Math.min(.72,Math.max(.35,solarHours[i]/24));
    const dayUse=dailyUse*solarShare;
    const nightUse=dailyUse-dayUse;
    const direct=Math.min(dayUse,dailyProd);
    const excess=Math.max(0,dailyProd-direct);
    const usable=Math.max(0,battery*(1-reserve));
    const charge=Math.min(excess,usable/Math.max(eff,.01));
    const delivered=Math.min(nightUse,charge*eff);
    const grid=Math.max(0,dayUse-direct)+Math.max(0,nightUse-delivered);
    const exported=Math.max(0,excess-charge);
    imports.push(grid*days[i]);
    exports.push(exported*days[i]);
  });
  const ik=imports.reduce((a,b)=>a+b,0);
  const ek=exports.reduce((a,b)=>a+b,0);
  const importCost=ik*utilityRate();
  const exportCredit=ek*(Number($('#export-rate').value)||0);
  return{offset,use,prod,imports,exports,importKwh:ik,exportKwh:ek,importCost,exportCredit,trueup:Math.max(0,importCost-exportCredit),annualUse:annual,annualProduction:prod.reduce((a,b)=>a+b,0)};
}

function renderScenarios(){
  D.planning={batteryKwh:Number($('#battery-kwh').value)||0,reserve:Number($('#battery-reserve').value)||0,efficiency:Number($('#battery-efficiency').value)||.9,exportRate:Number($('#export-rate').value)||0,utilityGrowth:Number($('#utility-growth').value)||0,utilityRate:utilityRate()};
  const defs=[[1,'100% · Starting Point','Baseline'],[1.25,'125% · Balanced Planning Target','Balanced'],[1.6,"160% · Philip’s Higher-Production Planning Scenario",'Worth Exploring']];
  const results=defs.map(d=>({def:d,result:seasonal(d[0])}));
  D.scenarios=Object.fromEntries(results.map(x=>[String(x.def[0]),x.result]));
  $('#scenario-cards').innerHTML=results.map(({def,result})=>`<article class="scenario ${def[0]===1.6?'recommended':''}"><span class="tag">${def[2]}</span><h4>${def[1]}</h4><dl><dt>Planned annual production</dt><dd>${num(result.annualProduction)} kWh</dd><dt>Estimated grid imports</dt><dd>${num(result.importKwh)} kWh</dd><dt>Estimated exports</dt><dd>${num(result.exportKwh)} kWh</dd><dt>Estimated True-Up exposure</dt><dd>${money(result.trueup)}</dd></dl></article>`).join('');
  $('#scenario-chart').innerHTML=`<table class="scenario-table"><thead><tr><th>Month</th><th>Usage</th><th>100% production</th><th>125% production</th><th>160% production</th></tr></thead><tbody>${M.map((m,i)=>`<tr><td>${m}</td><td>${num(results[0].result.use[i])}</td>${results.map(x=>`<td>${num(x.result.prod[i])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  saveLocal();
}

function cumulative(years){
  let total=0;
  const rate=utilityRate();
  const growth=(Number($('#utility-growth').value)||0)/100;
  const annual=annualKwh();
  for(let y=0;y<years;y++)total+=annual*rate*Math.pow(1+growth,y);
  return total;
}

function renderCosts(){
  const vals=Array.from({length:30},(_,i)=>cumulative(i+1));
  const max=Math.max(...vals,1);
  $('#cost-chart').innerHTML=vals.map((v,i)=>`<div class="cost-column" title="Year ${i+1}: ${money(v)}" style="height:${Math.max(3,v/max*240)}px"></div>`).join('');
  $('#cost-milestones').innerHTML=[10,20,30].map(y=>`<div><span>${y}-Year Accumulated Electricity Cost</span><strong>${money(cumulative(y))}</strong></div>`).join('');
}

function renderAll(){
  renderUsage();
  renderFuture();
  renderScenarios();
  renderCosts();
  buildReport();
}

['battery-kwh','battery-reserve','battery-efficiency','export-rate'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(!$('#analysis').hidden)renderScenarios();}));
$('#utility-growth').addEventListener('input',()=>{if(!$('#analysis').hidden){renderCosts();renderScenarios();}});
$('#utility-rate').value=defaults[D.homeowner.utility]||.406;
$('#utility-rate').addEventListener('input',()=>{if(!$('#analysis').hidden)renderAll();});

function profileConcerns(){
  const p=D.decisionProfile||{},s5=p.sections?.section5||p.section5||{},s6=p.sections?.section6||p.section6||{};
  return{concerns:s5.concerns||{},details:s5.concernDetails||{},resolutions:s6.resolutions||{},notes:s6.notes||{},direction:s6.direction||''};
}

function fullProfile(){
  syncVisibleForm();
  return{schemaVersion:'1.0',profileType:'SolarWithPhilipFullDecisionProfile',createdAt:new Date().toISOString(),source:{application:'Solar With Philip',experience:'Preliminary Property and Energy Analysis'},homeowner:D.homeowner,decisionProfile:D.decisionProfile,currentEnergy:{monthlyKwh:D.monthlyKwh,annualKwh:annualKwh()},futureEnergy:{loads:futureLoads(),monthlyKwh:futureMonthly()},property:D.property,planning:D.planning,scenarios:D.scenarios,concernSummary:profileConcerns(),uploads:{utilityBill:D.files.bill?{name:D.files.bill.name,type:D.files.bill.type,size:D.files.bill.size}:null,decisionProfile:D.files.decision?{name:D.files.decision.name,type:D.files.decision.type,size:D.files.decision.size}:null},authorization:{accepted:Boolean(D.consent),timestamp:D.consent},report:{kind:'preliminary-analysis',commercialReuseAuthorized:false,homeownerSharingAllowed:true}};
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[character]);
}

function buildReport(){
  const p=fullProfile(),c=profileConcerns();
  $('#print-report').innerHTML=`<header class="print-header"><div class="eyebrow">Solar With Philip</div><h1>Home Energy & Solar Planning Report</h1><p><strong>Prepared for:</strong> ${escapeHtml(D.homeowner.name||'Homeowner')}<br><strong>Property:</strong> ${escapeHtml([D.homeowner.street,D.homeowner.city,D.homeowner.state,D.homeowner.zip].filter(Boolean).join(', '))}<br><strong>Prepared by:</strong> Philip · 916-524-7187 · vt@wegreenourworld.com</p></header><section class="print-section"><h2>Your Starting Point</h2><p>Annual electricity use: <strong>${num(annualKwh())} kWh</strong>. Planning utility rate: <strong>${money(utilityRate())}/kWh</strong>.</p></section><section class="print-section"><h2>Your Energy Strategy</h2><p>Current direction: <strong>${escapeHtml(c.direction||'To be reviewed with Philip')}</strong>.</p><p>Decision_Profile loaded: <strong>${D.decisionProfile?'Yes':'No'}</strong>.</p></section><section class="print-section"><h2>12-Month Electricity Use</h2><table class="print-table"><tr>${M.map(x=>`<th>${x}</th>`).join('')}</tr><tr>${D.monthlyKwh.map(x=>`<td>${num(x)}</td>`).join('')}</tr></table></section><section class="print-section"><h2>Production Planning Scenarios</h2><table class="print-table"><tr><th>Scenario</th><th>Production</th><th>Grid imports</th><th>Exports</th><th>Estimated True-Up exposure</th></tr>${[['100%',D.scenarios['1']],['125%',D.scenarios['1.25']],['160%',D.scenarios['1.6']]].map(([n,x])=>x?`<tr><td>${n}</td><td>${num(x.annualProduction)} kWh</td><td>${num(x.importKwh)} kWh</td><td>${num(x.exportKwh)} kWh</td><td>${money(x.trueup)}</td></tr>`:'').join('')}</table></section><section class="print-section"><h2>Accumulated Electricity Cost</h2><p>10 years: <strong>${money(cumulative(10))}</strong> · 20 years: <strong>${money(cumulative(20))}</strong> · 30 years: <strong>${money(cumulative(30))}</strong></p></section><section class="print-section"><h2>Next Step</h2><p>Use the Complimentary Strategy Review with Philip to clarify remaining questions and determine whether a complete solution should be prepared.</p></section><p class="print-notice">Prepared exclusively through the Solar With Philip planning process. The homeowner may retain and share this report for personal decision-making. Commercial reuse, repackaging, removal of Solar With Philip identification, or use by unaffiliated sales representatives is not authorized. Preliminary planning estimates are educational and are not final engineering, production, savings, utility-billing, tax, legal or contractual guarantees.</p>`;
  return p;
}

async function toPayload(f){
  if(!f)return null;
  if(f.size>8*1024*1024)throw Error(`${f.name} is larger than 8 MB.`);
  const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(f);});
  return{name:f.name,type:f.type,size:f.size,data};
}

$('#save-report').addEventListener('click',async()=>{
  const status=$('#save-status');
  status.className='status';
  status.textContent='Saving the complete planning record…';
  try{
    const full=fullProfile();
    const payload={...full,files:{utilityBill:await toPayload(D.files.bill),decisionProfile:await toPayload(D.files.decision)}};
    const r=await fetch('/.netlify/functions/submit-proposal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const type=r.headers.get('content-type')||'';
    const text=await r.text();
    if(!type.includes('application/json'))throw Error('The save service returned an HTML page instead of JSON. Confirm the Netlify function deployed.');
    const j=JSON.parse(text);
    if(!r.ok)throw Error(j.error||'Save failed.');
    const blob=new Blob([JSON.stringify(full,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='SolarWithPhilip_Full_Decision_Profile.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    buildReport();
    status.textContent=`Saved as ${j.id}. Your Full Decision Profile was downloaded. The print dialog will open for your professional report.`;
    setTimeout(()=>window.print(),350);
  }catch(err){
    status.className='status error';
    status.textContent=err.message;
  }
});

$('#solution-simplified').addEventListener('click',async()=>{
  if(!new URLSearchParams(location.search).has('philip'))return;
  if(!D.decisionProfile){alert('Load the homeowner Decision_Profile first.');return;}
  const secret=prompt('Philip access code');
  if(!secret)return;
  try{
    const r=await fetch('/.netlify/functions/solution-simplified',{method:'POST',headers:{'content-type':'application/json','x-philip-secret':secret},body:JSON.stringify(fullProfile())});
    const type=r.headers.get('content-type')||'';
    const text=await r.text();
    if(!type.includes('application/json'))throw Error('Solution Simplified returned an unexpected response.');
    const j=JSON.parse(text);
    if(!r.ok)throw Error(j.error||'Could not create the consultation brief.');
    alert(`Solution Simplified brief created and saved. Reference: ${j.id}`);
  }catch(err){alert(err.message);}
});

saveLocal();
})();
