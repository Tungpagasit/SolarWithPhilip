function energy(value) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: Number(value) % 1 ? 1 : 0,
    maximumFractionDigits: 1
  });
}

function draw() {
  const offset = Number(SWP.data.scenarios.selected) || 1.25;
  const battery = SWP.calc.battery();
  const scenario = SWP.calc.scenario(offset);
  const property = SWP.data.property;
  const panelPlan = scenario.panelPlan || {};
  const rows = SWP.calc.costLab(30);
  const roofSquareFeet = (Number(property?.solar?.solarPotential?.wholeRoofStats?.areaMeters2) || 0) * 10.7639;
  const savings = year => rows[year].cumUtility - rows[year].cumSolar;
  const panelStatus = panelPlan.roofConstrained
    ? `${panelPlan.modeledPanels ?? 'Pending'} modeled on available roof; ${panelPlan.panelsNeeded ?? '—'} estimated to reach target`
    : `${panelPlan.modeledPanels ?? panelPlan.panelsNeeded ?? 'Pending final design'}`;

  root.querySelector('[data-summary]').innerHTML = `
    <section class="summary-group">
      <h3>Home & Usages</h3>
      <div class="summary-item"><b>Property</b><span>${SWP.esc(property?.formattedAddress || 'Pending property analysis')}</span></div>
      <div class="summary-item"><b>Current average monthly usage</b><span>${SWP.num(SWP.calc.currentMonthlyAverage())} kWh</span></div>
      <div class="summary-item"><b>Current annual usage</b><span>${SWP.num(SWP.calc.currentAnnual())} kWh</span></div>
      <div class="summary-item"><b>Future additions</b><span>${SWP.num(SWP.calc.futureMonthly() * 12)} kWh/year</span></div>
      <div class="summary-item"><b>Total planning usage</b><span>${SWP.num(SWP.calc.plannedAnnual())} kWh/year</span></div>
      <div class="summary-item"><b>Usable roof area</b><span>${SWP.num(roofSquareFeet)} sq ft</span></div>
    </section>

    <section class="summary-group">
      <h3>Approx. Solar + Battery(s) System Spec</h3>
      <div class="summary-item"><b>Production Strategy</b><span>${Math.round(offset * 100)}%</span></div>
      <div class="summary-item"><b>Solar module</b><span>${SWP.esc(SWP.calc.panel.model)} · ${SWP.calc.panel.dcWatts} W module with integrated microinverter</span></div>
      <div class="summary-item"><b>Module technology</b><span>${SWP.esc(SWP.calc.panel.technology)}</span></div>
      <div class="summary-item"><b>Module dimensions</b><span>${SWP.calc.panel.lengthMeters.toFixed(3)} m × ${SWP.calc.panel.widthMeters.toFixed(3)} m</span></div>
      <div class="summary-item"><b>Annual production target</b><span>${SWP.num(panelPlan.targetAnnualKwh || SWP.calc.targetAnnual(offset))} kWh</span></div>
      <div class="summary-item"><b>Preliminary modeled production</b><span>${SWP.num(scenario.annualProduction)} kWh</span></div>
      <div class="summary-item"><b>Estimated Q.TRON panel count</b><span>${panelStatus}</span></div>
      <div class="summary-item"><b>Battery</b><span>${battery.count ? `${battery.count} × ${battery.label}` : 'No battery selected'}</span></div>
      <div class="summary-item"><b>Nominal battery energy</b><span>${energy(battery.installedNominal)} kWh</span></div>
      <div class="summary-item"><b>Available after reserve</b><span>${energy(battery.dispatchable)} kWh</span></div>
      <p class="disclosure">${SWP.esc(SWP.calc.panel.sourceNote)}</p>
    </section>

    <section class="summary-group">
      <h3>Achievements</h3>
      <div class="summary-item"><b>Direct solar use</b><span>${SWP.num(scenario.directSolar.reduce((a,b) => a+b, 0))} kWh/year</span></div>
      <div class="summary-item"><b>Battery contribution</b><span>${SWP.num(scenario.batteryDelivered.reduce((a,b) => a+b, 0))} kWh/year</span></div>
      <div class="summary-item"><b>Grid imports / exports</b><span>${SWP.num(scenario.importKwh)} kWh / ${SWP.num(scenario.exportKwh)} kWh</span></div>
      <div class="summary-item"><b>Estimated remaining utility / True Up</b><span>${SWP.money(scenario.remainingUtility)}</span></div>
      <div class="achievement"><span>Estimated 5-year savings</span><strong>${SWP.money(savings(5))}</strong></div>
      <div class="achievement"><span>Estimated 10-year savings</span><strong>${SWP.money(savings(10))}</strong></div>
      <div class="achievement"><span>Estimated 20-year savings</span><strong>${SWP.money(savings(20))}</strong></div>
      <div class="achievement"><span>Estimated 30-year savings</span><strong>${SWP.money(savings(30))}</strong></div>
      <p class="disclosure">Utility fees are not included in the calculations. Panel placement and monthly production remain preliminary until final design or Google Solar Data Layers processing confirms them.</p>
    </section>
  `;
}

draw();
document.addEventListener('swp:data', draw);
