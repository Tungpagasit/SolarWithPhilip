const utilityRateInput = root.querySelector('[data-u]');
const utilityGrowthInput = root.querySelector('[data-ug]');
const solarRateInput = root.querySelector('[data-s]');
const solarGrowthInput = root.querySelector('[data-sg]');
const strategyInput = root.querySelector('[data-o]');

utilityRateInput.value = SWP.data.planning.utilityRate || 0.30;
utilityGrowthInput.value = SWP.data.planning.utilityGrowth || 4;
solarRateInput.value = SWP.data.planning.solarRate || 0.20;
solarGrowthInput.value = SWP.data.planning.solarEscalator || 4;
strategyInput.value = SWP.data.scenarios.selected || 1.25;

function draw() {
  SWP.data.planning.utilityRate = Number(utilityRateInput.value);
  SWP.data.planning.utilityGrowth = Number(utilityGrowthInput.value);
  SWP.data.planning.solarRate = Number(solarRateInput.value);
  SWP.data.planning.solarEscalator = Number(solarGrowthInput.value);
  SWP.data.scenarios.selected = Number(strategyInput.value);

  const rows = SWP.calc.costLab(30);
  const width = 1000;
  const height = 430;
  const padding = 70;
  const x = year => padding + year / 30 * (width - 2 * padding);
  const y = value => height - padding - Math.min(3, Math.max(0, value)) / 3 * (height - 2 * padding);
  const line = key => rows.map((row, index) => `${x(index)},${y(row[key])}`).join(' ');

  root.querySelector('[data-chart]').innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" aria-label="Stay with Utility and Go Solar plus True Up rate graph">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height-padding}" stroke="#789"/>
      <line x1="${padding}" y1="${height-padding}" x2="${width-padding}" y2="${height-padding}" stroke="#789"/>
      ${[0,.5,1,1.5,2,2.5,3].map(value => `<text x="${padding-12}" y="${y(value)+4}" text-anchor="end">$${value.toFixed(2)}</text>`).join('')}
      ${[0,5,10,15,20,25,30].map(year => `<text x="${x(year)}" y="${height-padding+25}" text-anchor="middle">${year}</text>`).join('')}
      <text x="20" y="35">$/kWh</text>
      <text x="${width/2}" y="${height-12}" text-anchor="middle">Years</text>
      <polyline points="${line('utilityRate')}" fill="none" stroke="#d94a4a" stroke-width="6"/>
      <polyline points="${line('solarRate')}" fill="none" stroke="#147d78" stroke-width="6"/>
      <text x="90" y="28" fill="#d94a4a">Stay with Utility</text>
      <text x="250" y="28" fill="#147d78">Go Solar + True Up</text>
    </svg>
  `;

  const strategyPercent = Math.round(Number(strategyInput.value) * 100);

  root.querySelector('[data-milestones]').innerHTML = [10,20,30].map(year => {
    const row = rows[year];
    const savings = row.cumUtility - row.cumSolar;

    return `
      <article class="outlook-card">
        <h3>${year}-Year Outlook</h3>
        <div class="outlook-row"><span>Production Strategy</span><b>${strategyPercent}%</b></div>
        <div class="outlook-row"><span>Stay with Utility</span><b>${SWP.money(row.cumUtility)}</b></div>
        <div class="outlook-row"><span>Go Solar + True Up</span><b>${SWP.money(row.cumSolar)}</b></div>
        <div class="savings-payoff"><span>Savings by Going Solar</span><strong>${SWP.money(savings)}</strong></div>
      </article>
    `;
  }).join('');

  SWP.save();
}

for (const element of [utilityRateInput, utilityGrowthInput, solarRateInput, solarGrowthInput, strategyInput]) {
  element.addEventListener('input', draw);
}

draw();
