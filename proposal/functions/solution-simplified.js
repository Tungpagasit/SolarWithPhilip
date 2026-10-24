const crypto = require('crypto');
const contractIndex = require('../contract/enfin-lease-2.2-index.js');

const json = (statusCode, value) => ({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(value)});
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function flatten(value, prefix='', result=[]){
  if(value == null) return result;
  if(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'){
    result.push({key:prefix,value:String(value)});return result;
  }
  if(Array.isArray(value)){value.forEach((item,i)=>flatten(item,`${prefix}[${i}]`,result));return result;}
  for(const [key,item] of Object.entries(value)) flatten(item,prefix?`${prefix}.${key}`:key,result);
  return result;
}

function selectedConcerns(profile){
  const dp=profile.decisionProfile||{}, flat=flatten(dp), candidates=[];
  for(const item of flat){
    const k=item.key.toLowerCase(), v=item.value.trim();
    if(!v) continue;
    if(/concern|barrier|deal.breaker|need.more|discuss|could.stop|resolution/.test(k) || /need more information|still a deal-breaker|discuss with philip|could stop me/i.test(v)) candidates.push({label:item.key,value:v});
  }
  return candidates;
}

function matchAnswers(concerns){
  const text=concerns.map(x=>`${x.label} ${x.value}`).join(' ').toLowerCase();
  const matches=contractIndex.filter(entry=>entry.keywords.some(keyword=>text.includes(keyword)));
  return matches.length?matches:contractIndex.filter(entry=>['ownership','maintenance','transfer','purchase','production_guarantee','battery_backup','arbitration','cancellation'].includes(entry.id));
}

async function supabaseGet(url,key,path){
  const response=await fetch(`${url}${path}`,{headers:{apikey:key,authorization:`Bearer ${key}`}});
  if(!response.ok) throw new Error(`Supabase read failed: ${await response.text()}`);
  return response;
}
async function downloadStorage(url,key,path){
  if(!path) return null;
  const response=await fetch(`${url}/storage/v1/object/proposal-uploads/${path}`,{headers:{apikey:key,authorization:`Bearer ${key}`}});
  if(!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

function htmlEmail(profile,concerns,answers,proposalId){
  const h=profile.homeowner||{}, current=profile.currentEnergy||{}, future=profile.futureEnergy||{}, planning=profile.planning||{}, scenario=profile.selectedScenario||profile.scenario||{}, monthly=Array.isArray(current.monthlyKwh)?current.monthlyKwh:[];
  const futureRows=Object.entries(future.loads||{}).map(([k,v])=>`<li><b>${esc(k)}:</b> ${esc(typeof v==='object'?(v.monthlyKwh??v.kwh??v.value??''):v)} kWh/month</li>`).join('')||'<li>No future-load numbers found.</li>';
  const concernHtml=concerns.map(c=>`<li><b>${esc(c.label)}</b>: ${esc(c.value)}</li>`).join('')||'<li>No unresolved concern selections were detected in the saved profile.</li>';
  const answerHtml=answers.map(a=>`<div style="margin:18px 0;padding:16px;border:1px solid #dce5e8;border-radius:12px"><h3 style="margin:0 0 8px;color:#12324a">${esc(a.topic)}</h3><blockquote style="margin:8px 0;padding:12px;border-left:4px solid #e8a93a;background:#fff8e7">“${esc(a.quote)}”</blockquote><p>${esc(a.explanation)}</p><p style="font-size:12px;color:#61717b"><b>Source:</b> CA EnFin Lease 2.2, PDF page ${a.page}, ${esc(a.section)}, curated excerpt lines ${esc(a.lines)}. Verify against the completed homeowner contract before advising.</p></div>`).join('');
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#20313d;background:#f3f7f6;padding:24px"><div style="max-width:860px;margin:auto;background:white;border-radius:18px;overflow:hidden"><header style="padding:28px;background:linear-gradient(135deg,#071e2e,#0f6a65);color:white"><div style="color:#ffd982;font-weight:900">SolarWithPhilip.com</div><h1 style="margin:8px 0">Solution Simplified - Confirmed Homeowner Choice</h1><p style="margin:0">Private consultant brief · Proposal ID ${esc(proposalId)}</p></header><main style="padding:26px"><h2>Homeowner and property</h2><p><b>Name:</b> ${esc(h.name)}<br><b>Property:</b> ${esc([h.street,h.city,h.state,h.zip].filter(Boolean).join(', '))}<br><b>Email:</b> ${esc(h.email)}<br><b>Phone:</b> ${esc(h.phone)}<br><b>Utility:</b> ${esc(h.utility)}</p><h2>Energy numbers</h2><p><b>12 monthly usage values:</b> ${esc(monthly.join(', '))} kWh<br><b>Current annual usage:</b> ${esc(current.annualKwh)} kWh<br><b>Current average monthly usage:</b> ${esc(current.averageMonthlyKwh)} kWh</p><h3>Future-use profile</h3><ul>${futureRows}</ul><h2>Confirmed direction</h2><p><b>Direction:</b> ${esc(profile.decisionDirection||profile.direction||'Not found')}<br><b>Financial product:</b> ${esc(profile.financialProduct||planning.financialProduct||'Not found')}<br><b>Confirmed production strategy:</b> ${esc(profile.selectedProductionStrategy||scenario.offset||planning.productionStrategy||'Not found')}<br><b>Solar module:</b> ${esc(profile.systemSpec?.solarModule||'Qcells Q.TRON BLK M-G2+/AC 430')}<br><b>Panel count:</b> ${esc(profile.systemSpec?.estimatedPanels||'Preliminary / pending design')}<br><b>Battery:</b> ${esc(profile.systemSpec?.battery||planning.batteryModel||'Not found')}<br><b>Battery quantity:</b> ${esc(profile.systemSpec?.batteryCount||planning.batteryCount||0)}</p><h2>Selected concerns</h2><ul>${concernHtml}</ul><h2>Contract-grounded answers</h2>${answerHtml}<p style="padding:14px;background:#fff3cd;border-radius:10px"><b>Important:</b> These excerpts come from the sample CA EnFin Lease 2.2. The completed homeowner contract controls. This email is a consultant preparation brief and not legal advice.</p></main><footer style="padding:18px 26px;background:#071e2e;color:white">Prepared for Viruk Tungpagasit · Solar Consultant · CSLB HIS #93852 SP · SolarWithPhilip.com</footer></div></body></html>`;
}

exports.handler=async event=>{
  if(event.httpMethod!=='POST') return json(405,{error:'Method not allowed.'});
  try{
    const {proposalId,profile:postedProfile}=JSON.parse(event.body||'{}');
    const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY, resendKey=process.env.RESEND_API_KEY;
    if(!url||!key) throw new Error('Supabase is not configured.');
    if(!resendKey) throw new Error('RESEND_API_KEY is not configured.');
    let profile=postedProfile||null, row=null;
    if(proposalId){
      const response=await supabaseGet(url,key,`/rest/v1/proposals?id=eq.${encodeURIComponent(proposalId)}&select=*`);
      const rows=await response.json(); row=rows[0]||null;
      if(row) profile={...(row.submission?.fullProfile||{}),homeowner:row.homeowner,currentEnergy:row.current_energy,futureEnergy:row.future_energy,property:row.property,planning:row.planning,decisionProfile:row.concern_profile,authorization:row.authorization,savedProposalId:row.id};
    }
    if(!profile) throw new Error('No saved Full Decision Profile was provided or found.');
    const concerns=selectedConcerns(profile), answers=matchAnswers(concerns), id=proposalId||profile.savedProposalId||crypto.randomUUID();
    const attachments=[];
    const billPath=row?.uploads?.utilityBill?.path;
    const bill=await downloadStorage(url,key,billPath);
    if(bill) attachments.push({filename:row.uploads.utilityBill.name||'Utility-Bill.pdf',content:bill.toString('base64')});
    attachments.push({filename:'SolarWithPhilip_Full_Decision_Profile.json',content:Buffer.from(JSON.stringify(profile,null,2)).toString('base64')});
    const emailResponse=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${resendKey}`,'content-type':'application/json'},body:JSON.stringify({from:process.env.NOTIFICATION_FROM_EMAIL||'Solar With Philip <notifications@solarwithphilip.com>',to:[process.env.NOTIFICATION_TO_EMAIL||'vt@wegreenourworld.com'],subject:`Solution Simplified - ${profile.homeowner?.name||'Homeowner'} - ${id}`,html:htmlEmail(profile,concerns,answers,id),attachments})});
    const emailResult=await emailResponse.json();
    if(!emailResponse.ok) throw new Error(emailResult.message||'Email delivery failed.');
    return json(200,{ok:true,id,emailId:emailResult.id,concernsFound:concerns.length,contractAnswers:answers.length,billAttached:Boolean(bill)});
  }catch(error){return json(500,{error:error.message||'Solution Simplified failed.'});}
};
