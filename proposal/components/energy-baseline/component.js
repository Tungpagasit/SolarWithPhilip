function draw() {
  const annual = SWP.calc.currentAnnual();
  const monthly = annual / 12;
  const currentRate = SWP.calc.utilityRate();
  const nextYearCost = annual * currentRate * 1.06;

  root.querySelector('[data-current-rate]').textContent = `${SWP.rate(currentRate)}/kWh`;
  root.querySelector('[data-metrics]').innerHTML = `
    <div><span>Current average monthly usage</span><strong>${SWP.num(monthly)} kWh</strong></div>
    <div><span>Current annual usage</span><strong>${SWP.num(annual)} kWh</strong></div>
    <div><span>Estimated monthly cost next year</span><strong>${SWP.money(nextYearCost / 12)}</strong></div>
    <div><span>Estimated annual cost next year</span><strong>${SWP.money(nextYearCost)}</strong></div>
  `;
}

draw();
document.addEventListener('swp:data', draw);
