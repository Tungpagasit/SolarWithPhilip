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
  const configuration = scenario.googleConfig;
  const rows = SWP.calc.costLab(30);
  const roofSquareFeet = (Number(property?.solar?.solarPotential?.wholeRoofStats?.areaMeters2) || 0) * 10.7639;
  const savings = year => rows[year].cumUtility - rows[year].cumSolar;

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
      <div class="summary-item"><b>Estimated annual production</b><span>${SWP.num(scenario.annualProduction)} kWh</span></div>
      <div class="summary-item"><b>Estimated panels</b><span>${configuration?.panelsCount ?? 'Pending final design'}</span></div>
      <div class="summary-item"><b>Battery</b><span>${battery.count ? `${battery.count} × ${battery.label}` : 'No battery selected'}</span></div>
      <div class="summary-item"><b>Nominal battery energy</b><span>${energy(battery.installedNominal)} kWh</span></div>
      <div class="summary-item"><b>Usable before reserve</b><span>${energy(battery.installedUsable)} kWh</span></div>
      <div class="summary-item"><b>Available after reserve</b><span>${energy(battery.dispatchable)} kWh</span></div>
    </section>

    <section class="summary-group">
      <h3>Achievements</h3>
      <div class="summary-item"><b>Energy flow</b><span>Imports ${SWP.num(scenario.importKwh)} kWh · Exports ${SWP.num(scenario.exportKwh)} kWh</span></div>
      <div class="summary-item"><b>Estimated remaining utility / True Up</b><span>${SWP.money(scenario.remainingUtility)}</span></div>
      <div class="achievement"><span>Estimated 5-year savings</span><strong>${SWP.money(savings(5))}</strong></div>
      <div class="achievement"><span>Estimated 10-year savings</span><strong>${SWP.money(savings(10))}</strong></div>
      <div class="achievement"><span>Estimated 20-year savings</span><strong>${SWP.money(savings(20))}</strong></div>
      <div class="achievement"><span>Estimated 30-year savings</span><strong>${SWP.money(savings(30))}</strong></div>
      <p class="disclosure">Utility fees are not included in the calculations.</p>
    </section>
  `;
}

draw();
document.addEventListener('swp:data', draw);
