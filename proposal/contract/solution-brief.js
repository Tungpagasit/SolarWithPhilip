'use strict';
// Private Solution Simplified consultant brief builder.
// Reads only the saved authoritative Full Decision Profile; it never rebuilds choices from live page state.
const citations = require('./enfin-lease-citations.js');
const answers = require('./enfin-concern-answers.js');
const reference = require('./enfin-concern-reference.js');
const explain = require('./concern-explanations.js');

const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const MISSING = '<em>Not recorded in the saved profile</em>';
const loadNames = { ev: 'EV charging', hvac: 'HVAC / heat pump', pool: 'Pool / spa', adu: 'ADU / added space', appliances: 'Electric appliances', people: 'More people at home', wfh: 'Work from home', high: 'Other high use' };
const levels = ['Must Have', 'Important', 'Nice to Have', 'Not Important'];

module.exports = function build(p, id, d, h) {
  const { esc, label, dirText, priorityLabels, title } = h;
  const dp = obj(p.decisionProfile), sec = obj(dp.sections && Object.keys(dp.sections).length ? dp.sections : dp);
  const s1 = obj(sec.section1), s2 = obj(sec.section2), s5 = obj(sec.section5), s6 = obj(sec.section6);
  const home = obj(p.homeowner), spec = obj(p.systemSpec), scen = obj(p.selectedScenario), lab = obj(p.costLab), inp = obj(lab.inputs), rows = Array.isArray(lab.rows) ? lab.rows : [];
  const num = v => Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : null;
  const n0 = v => num(v) == null ? null : Math.round(Number(v)).toLocaleString('en-US');
  const money = v => num(v) == null ? null : (Number(v) < 0 ? '-' : '') + '$' + Math.abs(Math.round(Number(v))).toLocaleString('en-US');
  const show = v => v == null || v === '' ? MISSING : esc(v);
  const metric = (k, v) => `<div class="metric"><span>${esc(k)}</span><strong>${v == null || v === '' ? MISSING : esc(v)}</strong></div>`;
  const monthly = Array.isArray(p.currentEnergy?.monthlyKwh) && p.currentEnergy.monthlyKwh.length === 12 ? p.currentEnergy.monthlyKwh.map(Number) : [];
  const currentAnnual = monthly.length ? monthly.reduce((a, b) => a + (b || 0), 0) : num(p.currentEnergy?.annualKwh);
  const fm = p.futureEnergy?.monthlyKwh;
  const addedAnnual = num(p.futureEnergy?.annualKwh) ?? (num(fm) != null ? Number(fm) * 12 : null);
  const planned = currentAnnual != null && addedAnnual != null ? currentAnnual + addedAnnual : null;
  const offset = Math.round((Number(p.selectedProductionStrategy) || 0) * 100);
  const rate = Number(p.selectedSolarRate ?? p.planning?.solarRate ?? 0);
  const monthlyCost = num(home.averageMonthlyBill) ?? num(s1.bill);
  const address = [home.street, home.city, home.state, home.zip].filter(Boolean).join(', ');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const battery = spec.battery ? `${spec.batteryCount ?? 0} x ${spec.battery}` : null;
  const direction = d.direction ? dirText(d.direction) : '';
  const financial = d.financialProduct ? dirText(d.financialProduct) : '';
  const pageLine = c => `${c.pageLabel}${c.lines[0] === c.lines[1] ? `, line ${c.lines[0]}` : `, lines ${c.lines[0]}-${c.lines[1]}`}`;
  const quote = cid => { const c = citations[cid]; return c ? `<blockquote><b>EnFin agreement excerpt</b> - ${esc(c.section)} (${esc(pageLine(c))})<br>\u201c${esc(c.quote)}\u201d</blockquote>` : ''; };
  const cites = ids => [...new Set(ids)].map(cid => citations[cid]).filter(Boolean);

  const concerns = Object.entries(d.concerns).filter(([, v]) => String(v).trim().toLowerCase() !== 'not a concern')
    .sort((a, b) => { const r = v => { v = String(v).toLowerCase(); return v.includes('stop') ? 0 : v.includes('sure') ? 1 : v.includes('resolved') ? 2 : 3; }; return r(a[1]) - r(b[1]); });
  const details = cid => (obj(s5.concernDetails)[cid] || []).map(x => title(x).replace('Ppa', 'PPA').replace('Apr', 'APR').replace('Hoa', 'HOA').replace('Pto', 'PTO'));
  const open = r => ['need more information', 'discuss with philip', 'still a deal-breaker', 'compare between proposals'].includes(String(r || '').toLowerCase());
  const factFor = cid => ({
    battery_backup: battery ? `Selected battery: ${battery}, ${spec.batteryReservePercent ?? 0}% reserve` : null,
    production_expectations: offset ? `Selected production target: ${offset}%` + (num(scen.annualProduction) != null ? ` (${n0(scen.annualProduction)} kWh/year)` : '') : null,
    usage_design: offset ? `Selected production target: ${offset}% against ${currentAnnual != null ? n0(currentAnnual) + ' kWh current' : 'current'} use` : null,
    upfront_monthly: rate ? `Selected solar rate: $${rate.toFixed(2)}/kWh` : null,
    financing_total: financial ? `Financial direction: ${financial}` : null,
    utility_interaction: num(scen.remainingUtility) != null ? `Estimated remaining utility cost: ${money(scen.remainingUtility)}/year` : null,
    property_fit: spec.estimatedPanels ? `Preliminary system: ${spec.estimatedPanels} panels` : null,
    roof_responsibility: spec.estimatedPanels ? `Preliminary system: ${spec.estimatedPanels} panels` : null
  })[cid] || null;

  const concernFacts = concerns.map(([cid, cls]) => {
    const res = d.resolutions[cid], note = d.notes[cid], det = details(cid), fact = factFor(cid), c = cites((answers[cid] || []).flatMap(x => x.cites));
    const other = cid === 'other_concern' && s5.otherConcern ? String(s5.otherConcern) : '';
    return `<article><h3>${esc(label(cid))}</h3><p><b>Classification:</b> ${esc(cls)}<br><b>Resolution status:</b> ${res ? esc(res) : 'No resolution status recorded'}${note ? `<br><b>Homeowner note or question:</b> ${esc(note)}` : ''}${other ? `<br><b>Homeowner wrote:</b> ${esc(other)}` : ''}${det.length ? `<br><b>Specific points selected:</b> ${esc(det.join('; '))}` : ''}${open(res) ? `<br><b>Remaining question:</b> ${esc(res)} - bring to the consultation.` : ''}${fact ? `<br><b>Proposal answer:</b> ${esc(fact)}` : ''}<br><b>EnFin support:</b> ${c.length ? esc(c.slice(0, 4).map(x => `${x.section} (${x.pageLabel})`).join('; ')) : 'No controlled EnFin excerpt - consultant review'}</p></article>`;
  }).join('') || '<p>No applicable concerns were recorded. Concerns marked Not a Concern are excluded.</p>';

  const concernTable = concerns.map(([cid, cls]) => {
    const res = d.resolutions[cid], note = d.notes[cid];
    const left = `<b>${esc(label(cid))}</b><br>Classification: ${esc(cls)}<br>Status: ${res ? esc(res) : 'Not recorded'}${note ? `<br>Homeowner note: ${esc(note)}` : ''}`;
    const right = explain.render(cid, { esc, audience: 'philip', classification: cls, resolution: res, note, details: details(cid), other: cid === 'other_concern' && s5.otherConcern ? String(s5.otherConcern) : '' });
    return `<tr><td>${left}</td><td>${right}</td></tr>`;
  }).join('');

  const future = Object.entries(obj(s1.futureLoads)).filter(([, v]) => v && v.selected).map(([k, v]) => `<li><b>${esc(loadNames[k] || title(k))}</b>${num(v.kwh) != null ? ` - about ${n0(v.kwh)} kWh/month added` : ''}</li>`).join('');
  const wanted = Array.isArray(s2.desiredChanges) ? s2.desiredChanges : [];
  const byLevel = levels.map(l => [l, Object.entries(d.priorities).filter(([, v]) => v === l).map(([k]) => priorityLabels[k] || title(k))]);
  const ranked = byLevel.flatMap(([l, a]) => a.map(x => [l, x])).filter(([l]) => l !== 'Not Important');
  const notes = Object.entries(d.notes).filter(([k, v]) => v && String(d.concerns[k] || '').trim().toLowerCase() !== 'not a concern');

  const outlook = [5, 10, 20, 30].filter(y => rows[y]).map(y => `<tr><td>${y} years</td><td>${money(rows[y].cumUtility)}</td><td>${money(rows[y].cumSolar)}</td><td>${money(rows[y].cumUtility - rows[y].cumSolar)}</td></tr>`).join('');
  const counts = {}; concerns.forEach(([k]) => { const r = d.resolutions[k] || 'No status recorded'; counts[r] = (counts[r] || 0) + 1; });

  const css = 'body{font:15px/1.55 Arial,sans-serif;color:#20313d;background:#eef5f3;padding:24px}main{max-width:1000px;margin:auto;background:#fff;padding:30px;border-radius:20px}header{background:linear-gradient(135deg,#0b2d49,#147d78);color:#fff;padding:28px;border-radius:16px}h2{color:#0b2d49;border-bottom:2px solid #147d78;padding-bottom:6px}section,article{margin:18px 0;padding:16px;border:1px solid #dce5e8;border-radius:14px}blockquote{border-left:4px solid #d7a640;margin:10px 0;padding:10px 16px;background:#fff8e8;font-size:14px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.metric{padding:12px;background:#eef7f5;border-radius:10px}.metric span{display:block;color:#60717d;font-size:13px}.metric strong{font-size:18px}.notice{border:3px solid #8a1f1f;background:#fff3f1;color:#4a1010;padding:18px;border-radius:12px;margin:18px 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d7e1e4;padding:10px;text-align:left;vertical-align:top}th{background:#0b2d49;color:#fff}tr{break-inside:avoid;page-break-inside:avoid}.qa{margin-bottom:14px}.q{font-weight:bold;color:#126b63;margin:0 0 4px}.cx-h{font-weight:bold;color:#0b2d49;margin:12px 0 4px;border-bottom:1px solid #d7e1e4}.enfin-quote{border-left:4px solid #d7a640;margin:10px 0;padding:10px 16px;background:#fff8e8;font-size:14px}.follow{background:#eef3ff;border:1px solid #c9d6f5;padding:8px 12px;border-radius:8px;font-size:14px}@media print{body{background:#fff;padding:0}main{padding:0}}';
  const list = a => a.length ? `<ul>${a.join('')}</ul>` : `<p>${MISSING}</p>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Solution Simplified - ${esc(home.name || 'Homeowner')}</title><style>${css}</style></head><body><main>
<header><h1>Solution Simplified</h1><p>Private consultant preparation brief &middot; ${esc(id)}</p></header>
<div class="notice"><strong>PRIVATE &mdash; PHILIP'S CONSULTATION USE ONLY.</strong> This brief was prepared specifically for Philip's private consultation and homeowner-preparation workflow. It is not authorized for copying, distribution, white-labeling or use by other sales representatives. Contract excerpts remain subject to the controlling homeowner agreement. This brief is educational and preparatory; it is not legal advice and is not a substitute for the executed agreement.</div>
<section><h2>A. Homeowner Information</h2><div class="grid">${metric('Homeowner', home.name)}${metric('Property address', address)}${metric('Phone', home.phone)}${metric('Email', home.email)}${metric('Utility', home.utility)}${metric('Average monthly electric cost', money(monthlyCost))}${metric('Current annual usage', currentAnnual != null ? n0(currentAnnual) + ' kWh' : null)}${metric('Added future usage', addedAnnual != null ? n0(addedAnnual) + ' kWh/year' : null)}${metric('Total planned annual usage', planned != null ? n0(planned) + ' kWh' : null)}</div>${monthly.length ? `<h3>12-month usage profile</h3><table><thead><tr>${monthNames.map(m => `<th>${m}</th>`).join('')}</tr></thead><tbody><tr>${monthly.map(v => `<td>${n0(v)}</td>`).join('')}</tr></tbody></table><p>kWh per month, from the saved profile.</p>` : `<p>${MISSING}</p>`}</section>
<section><h2>B. Future Plans and Expected Usage</h2>${list(future ? [future] : [])}${s1.backup ? `<p><b>Backup goal:</b> ${esc(s1.backup)}${s1.duration ? ' - ' + esc(s1.duration) : ''}</p>` : ''}${s1.future ? `<p><b>Other future changes the homeowner wrote:</b> ${esc(s1.future)}</p>` : ''}${num(s1.totalAddedKwh) != null ? `<p><b>Added usage:</b> ${n0(s1.totalAddedKwh)} kWh/month planned.</p>` : ''}${num(s1.utilityGrowth) != null ? `<p><b>Utility-rate increase assumed:</b> ${esc(s1.utilityGrowth)}%/year; <b>home-usage increase:</b> ${esc(s1.usageGrowth ?? 0)}%/year.</p>` : ''}</section>
<section><h2>C. Solutions Wanted</h2>${wanted.length ? `<p><b>What the homeowner wants the strategy to address:</b></p><ul>${wanted.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${byLevel.some(([, a]) => a.length) ? `<table><thead><tr><th>Importance</th><th>Outcome</th></tr></thead><tbody>${byLevel.filter(([, a]) => a.length).map(([l, a]) => `<tr><td>${esc(l)}</td><td>${esc(a.join(', '))}</td></tr>`).join('')}</tbody></table>` : `<p>${MISSING}</p>`}</section>
<section><h2>D. What Is Important</h2>${ranked.length ? `<ol>${ranked.map(([l, x]) => `<li><b>${esc(x)}</b> - ${esc(l)}</li>`).join('')}</ol>` : `<p>${MISSING}</p>`}${notes.length || s5.otherConcern ? `<h3>Homeowner notes, comments and questions</h3><ul>${notes.map(([k, v]) => `<li><b>${esc(label(k))}:</b> ${esc(v)}</li>`).join('')}${s5.otherConcern ? `<li><b>Something else to address:</b> ${esc(s5.otherConcern)}</li>` : ''}</ul>` : ''}</section>
<section><h2>E. What Could Affect the Decision</h2>${concernFacts}</section>
<section><h2>F. Concerns and Resolutions</h2><table><thead><tr><th style="width:34%">Concern</th><th>Complete Explanation, Resolution & Contract Support</th></tr></thead><tbody>${concernTable || '<tr><td colspan="2">No applicable concerns were recorded.</td></tr>'}</tbody></table><p><small>Excerpt locations use the page printed on the EnFin agreement (or the exhibit PDF page where no page number is printed) and line numbers counted from the first text line below that page's header, blank lines included.</small></p></section>
<section><h2>G. Confirmed Interactive 30-Year Cost Lab Variables</h2><div class="grid">${metric('Monthly electric cost', money(monthlyCost))}${metric('Current annual usage', currentAnnual != null ? n0(currentAnnual) + ' kWh' : null)}${metric('Future annual usage', planned != null ? n0(planned) + ' kWh' : null)}${metric('Utility rate / annual increase', num(inp.utilityRate) != null ? '$' + Number(inp.utilityRate).toFixed(2) + '/kWh / ' + (inp.utilityGrowthPercent ?? '') + '%' : null)}${metric('Solar rate / annual increase', num(inp.solarRate) != null ? '$' + Number(inp.solarRate).toFixed(2) + '/kWh / ' + (inp.solarGrowthPercent ?? '') + '%' : null)}${metric('Production / offset', num(inp.productionStrategy) != null ? Math.round(Number(inp.productionStrategy) * 100) + '%' : (offset ? offset + '%' : null))}${metric('Battery', battery)}${metric('Battery reserve', spec.batteryReservePercent != null ? spec.batteryReservePercent + '%' : null)}${metric('Battery rate adder', num(inp.batteryRateAdder) != null ? '$' + Number(inp.batteryRateAdder).toFixed(2) + '/kWh' : null)}${metric('Remaining utility estimate', num(scen.remainingUtility) != null ? money(scen.remainingUtility) + '/year' : null)}</div><p>Values recorded at Confirm in the saved profile.</p></section>
<section><h2>H. 5, 10, 20 and 30-Year Outlook</h2>${outlook ? `<table><thead><tr><th>Horizon</th><th>Current path (cumulative utility)</th><th>Selected plan (cumulative)</th><th>Difference</th></tr></thead><tbody>${outlook}</tbody></table><p>Computed from the saved Cost Lab rows; a positive difference favors the selected plan. Planning estimates only.</p>` : `<p>${MISSING}</p>`}</section>
<section><h2>I. System Choice Summary</h2><div class="grid">${metric('Strategy / direction', direction)}${metric('Financial direction', financial)}${metric('Production / offset target', offset ? offset + '%' : null)}${metric('Annual production target', num(scen.annualProduction) != null ? n0(scen.annualProduction) + ' kWh' : null)}${metric('System choice', spec.estimatedPanels ? spec.estimatedPanels + ' x ' + (spec.solarModule || 'panels') : spec.solarModule)}${metric('Selected solar rate', rate ? '$' + rate.toFixed(2) + '/kWh' : null)}${metric('Battery (maker / model, quantity)', battery)}${metric('Battery reserve', spec.batteryReservePercent != null ? spec.batteryReservePercent + '%' : null)}${metric('Battery usable after reserve', num(spec.batteryAvailableAfterReserveKwh) != null ? Number(spec.batteryAvailableAfterReserveKwh).toFixed(1) + ' kWh' : null)}${metric('Current annual usage', currentAnnual != null ? n0(currentAnnual) + ' kWh' : null)}${metric('Future annual usage', planned != null ? n0(planned) + ' kWh' : null)}${metric('Concern statuses', Object.keys(counts).length ? Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join('; ') : null)}</div><p><b>Selected plan:</b> ${esc(home.name || 'The homeowner')} chose <b>${direction ? esc(direction) : 'no recorded direction'}</b>${financial && financial !== direction ? ` with <b>${esc(financial)}</b>` : ''}, a <b>${offset ? offset + '%' : 'not recorded'}</b> production target${rate ? ` at <b>$${rate.toFixed(2)}/kWh</b>` : ''}${battery ? `, with <b>${esc(battery)}</b> and a <b>${esc(spec.batteryReservePercent ?? 0)}%</b> reserve` : ', with no battery selected'}.</p></section>
<p><b>Important:</b> Private consultant preparation brief only. The completed homeowner agreement controls.</p></main></body></html>`;
};
