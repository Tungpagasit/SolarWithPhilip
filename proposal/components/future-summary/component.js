const colors = ['#147d78','#2878d0','#e58a2f','#7c5ce0','#0fa3a3','#d94a4a','#55a630','#777'];

function label(key) {
  return ({
    ev: 'EV Charging',
    hvac: 'HVAC / Heat Pump',
    waterHeating: 'Water Heating',
    pool: 'Pool / Spa',
    adu: 'Home Addition / ADU',
    appliances: 'Electric Appliances',
    other: 'Other'
  })[key] || key.replace(/[_-]/g, ' ');
}

function draw() {
  const items = [
    ['Current Household', SWP.calc.currentMonthlyAverage()],
    ...Object.entries(SWP.calc.futureLoads()).map(([key, value]) => [label(key), value])
  ];

  const total = items.reduce((sum, item) => sum + item[1], 0);
  let angle = 0;
  const stops = [];

  items.forEach((item, index) => {
    const next = angle + (total ? item[1] / total * 360 : 0);
    stops.push(`${colors[index % colors.length]} ${angle}deg ${next}deg`);
    angle = next;
  });

  root.querySelector('[data-total]').textContent = SWP.num(total);
  root.querySelector('[data-donut]').style.setProperty('--parts', `conic-gradient(${stops.join(',')})`);
  root.querySelector('[data-legend]').innerHTML = items.map((item, index) => `
    <div>
      <i style="background:${colors[index % colors.length]}"></i>
      <span>${SWP.esc(item[0])}</span>
      <b>${SWP.num(item[1])} kWh/mo · ${SWP.num(item[1] * 12)} kWh/yr</b>
    </div>
  `).join('');
}

draw();
document.addEventListener('swp:data', draw);
