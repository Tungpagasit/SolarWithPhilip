function reportId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const home = String(SWP.data.homeowner?.name || 'HOME').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
  return `SWP-${home}-${stamp}`;
}

function concerns() {
  const profile = SWP.data.decisionProfile || {};
  const section5 = profile.sections?.section5 || profile.section5 || {};
  const section6 = profile.sections?.section6 || profile.section6 || {};
  return {
    priorities: section5.outcomes || section5.priorities || {},
    concerns: section5.concerns || {},
    resolutions: section6.resolutions || {},
    direction: section6.direction || 'To be reviewed with Philip'
  };
}

function buildReport() {
  const profile = SWP.fullProfile();
  const offset = Number(SWP.data.scenarios.selected) || 1.25;
  const scenario = SWP.calc.scenario(offset);
  const battery = SWP.calc.battery();
  const panelPlan = scenario.panelPlan || {};
  const costs = SWP.calc.costLab(30);
  const reportReference = reportId();
  const created = new Date();
  const roofSqFt = (Number(SWP.data.property?.solar?.solarPotential?.wholeRoofStats?.areaMeters2) || 0) * 10.7639;
  const decision = concerns();
  const annualDirect = scenario.directSolar.reduce((a,b) => a + b, 0);
  const annualBattery = scenario.batteryDelivered.reduce((a,b) => a + b, 0);
  const savings = year => costs[year].cumUtility - costs[year].cumSolar;
  const monthlyRows = SWP.calc.months.map((month, index) => `
    <tr>
      <td>${month}</td>
      <td>${SWP.num(scenario.use[index])}</td>
      <td>${SWP.num(scenario.prod[index])}</td>
      <td>${SWP.num(scenario.directSolar[index])}</td>
      <td>${SWP.num(scenario.batteryDelivered[index])}</td>
      <td>${SWP.num(scenario.imports[index])}</td>
      <td>${SWP.num(scenario.exports[index])}</td>
    </tr>
  `).join('');

  root.querySelector('[data-print]').innerHTML = `
    <section class="report-cover">
      <div class="report-brand">Solar With <span>Philip</span></div>
      <div class="report-kicker">Home Energy & Solar Planning Report</div>
      <h1>Your Choice. Your Home. Your Energy Future.</h1>
      <p class="report-property"><strong>${SWP.esc(SWP.data.homeowner.name || 'Homeowner')}</strong><br>${SWP.esc([SWP.data.homeowner.street,SWP.data.homeowner.city,SWP.data.homeowner.state,SWP.data.homeowner.zip].filter(Boolean).join(', '))}</p>
      <div class="report-choice"><small>Selected Planning Choice</small><strong>${Math.round(offset * 100)}% Production Strategy · ${battery.count ? `${battery.count} × ${SWP.esc(battery.label)}` : 'No battery selected'}</strong></div>
      <div class="report-id"><span>Report ID: ${reportReference}</span><span>Created: ${created.toLocaleDateString('en-US')}</span></div>
    </section>

    <section class="report-section">
      <h2>Wow. Here Is the Complete Picture.</h2>
      <div class="report-grid">
        <div class="report-metric"><span>Current Annual Usage</span><strong>${SWP.num(SWP.calc.currentAnnual())} kWh</strong></div>
        <div class="report-metric"><span>Future Additions</span><strong>${SWP.num(SWP.calc.futureMonthly()*12)} kWh/yr</strong></div>
        <div class="report-metric"><span>Total Planning Usage</span><strong>${SWP.num(SWP.calc.plannedAnnual())} kWh/yr</strong></div>
        <div class="report-metric"><span>Usable Roof Area</span><strong>${SWP.num(roofSqFt)} sq ft</strong></div>
        <div class="report-metric"><span>Production Strategy</span><strong>${Math.round(offset*100)}%</strong></div>
        <div class="report-metric"><span>Preliminary Production</span><strong>${SWP.num(scenario.annualProduction)} kWh/yr</strong></div>
      </div>
    </section>

    <section class="report-section">
      <h2>Approx. Solar + Battery System Specification</h2>
      <div class="report-grid">
        <div class="report-metric"><span>Solar Module</span><strong>${SWP.esc(SWP.calc.panel?.model || 'Qcells Q.TRON BLK M-G2+/AC 430')}</strong></div>
        <div class="report-metric"><span>Module Rating</span><strong>${SWP.calc.panel?.dcWatts || 430} W</strong></div>
        <div class="report-metric"><span>Estimated Panel Count</span><strong>${panelPlan.modeledPanels ?? panelPlan.panelsNeeded ?? 'Pending design'}</strong></div>
        <div class="report-metric"><span>Battery</span><strong>${battery.count ? `${battery.count} × ${SWP.esc(battery.label)}` : 'None selected'}</strong></div>
        <div class="report-metric"><span>Nominal Battery Energy</span><strong>${Number(battery.installedNominal).toFixed(1)} kWh</strong></div>
        <div class="report-metric"><span>Available After Reserve</span><strong>${Number(battery.dispatchable).toFixed(1)} kWh</strong></div>
      </div>
    </section>

    <section class="report-section">
      <h2>Monthly Energy Planning Evidence</h2>
      <table class="report-months"><thead><tr><th>Month</th><th>Usage</th><th>Solar</th><th>Direct Solar</th><th>Battery</th><th>Grid Import</th><th>Export</th></tr></thead><tbody>${monthlyRows}</tbody></table>
      <p class="disclosure">All energy values are kWh. Monthly production remains preliminary until final design or Google Solar Data Layers processing confirms the seasonal profile.</p>
    </section>

    <section class="report-section">
      <h2>Energy Achievements</h2>
      <div class="report-grid">
        <div class="report-metric"><span>Direct Solar Use</span><strong>${SWP.num(annualDirect)} kWh/yr</strong></div>
        <div class="report-metric"><span>Battery Contribution</span><strong>${SWP.num(annualBattery)} kWh/yr</strong></div>
        <div class="report-metric"><span>Grid Imports</span><strong>${SWP.num(scenario.importKwh)} kWh/yr</strong></div>
        <div class="report-metric"><span>Solar Exports</span><strong>${SWP.num(scenario.exportKwh)} kWh/yr</strong></div>
        <div class="report-metric"><span>Estimated Remaining Utility / True Up</span><strong>${SWP.money(scenario.remainingUtility)}</strong></div>
        <div class="report-metric"><span>Current Direction</span><strong>${SWP.esc(decision.direction)}</strong></div>
      </div>
    </section>

    <section class="report-section report-payoff">
      <h3>Savings by Going Solar</h3>
      <div class="report-payoff-grid">
        <div><span>5 Years</span><strong>${SWP.money(savings(5))}</strong></div>
        <div><span>10 Years</span><strong>${SWP.money(savings(10))}</strong></div>
        <div><span>20 Years</span><strong>${SWP.money(savings(20))}</strong></div>
        <div><span>30 Years</span><strong>${SWP.money(savings(30))}</strong></div>
      </div>
    </section>

    <section class="report-section">
      <h2>Next Step: Complimentary Strategy Review</h2>
      <p>Use this record with Philip to review the selected strategy, remaining concerns, property constraints, battery plan, and whether a complete solution should be prepared.</p>
      <p><strong>Philip · 916-524-7187 · vt@wegreenourworld.com</strong></p>
    </section>

    <section class="report-notice">
      <strong>Prepared exclusively through the Solar With Philip planning process.</strong>
      <p>This report may be retained and shared by the homeowner for personal decision-making. Commercial reuse, repackaging, removal of Solar With Philip identification, reproduction as another representative’s analysis, or use by unaffiliated sales representatives is not authorized.</p>
      <p>Preliminary results are educational planning estimates and are not final engineering, production, utility-billing, savings, tax, legal, or contractual guarantees. Utility fees are not included in the calculations.</p>
      <div class="report-footer"><span>Solar With Philip · ${reportReference}</span><span>${SWP.esc(SWP.data.homeowner.name || 'Homeowner')} · ${created.toLocaleDateString('en-US')}</span></div>
    </section>
  `;

  return {...profile, reportReference, selectedProductionStrategy: offset};
}

root.querySelector('[data-save]').addEventListener('click', async () => {
  const status = root.querySelector('[data-status]');
  status.className = 'status';
  status.textContent = 'Saving your choice and creating the report…';

  try {
    const fullProfile = buildReport();
    const body = {
      ...fullProfile,
      files: {
        utilityBill: await SWP.toPayload(SWP.data.files.bill),
        decisionProfile: await SWP.toPayload(SWP.data.files.decision)
      }
    };

    const response = await fetch('/.netlify/functions/submit-proposal', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(body)
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (!contentType.includes('application/json')) throw new Error('Save service returned HTML instead of JSON.');
    const result = JSON.parse(text);
    if (!response.ok) throw new Error(result.error || 'Save failed.');

    const blob = new Blob([JSON.stringify(fullProfile, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'SolarWithPhilip_Full_Decision_Profile.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    status.textContent = `Saved as ${result.id}. Your Full Decision Profile was downloaded and the Choice Report is opening.`;
    setTimeout(() => window.print(), 350);
  } catch (error) {
    status.className = 'status error';
    status.textContent = error.message;
  }
});
