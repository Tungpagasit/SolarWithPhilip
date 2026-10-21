const colors = [
  '#147d78',
  '#2878d0',
  '#e99428',
  '#8b5cf6',
  '#d94a4a',
  '#17a673',
  '#6b7280',
  '#d97706',
  '#0f766e',
  '#9333ea',
  '#b45309'
];

const names = {
  current: 'Current household usage',
  ev: 'EV charging',
  hvac: 'Heat pump / HVAC',
  pool: 'Pool / spa',
  waterHeating: 'Electric water heating',
  appliances: 'Electric appliances',
  addition: 'Home addition',
  adu: 'ADU / added space',
  people: 'More people at home',
  wfh: 'Work from home',
  high: 'Other high use',
  other: 'Other'
};

function draw() {
  const currentAnnualKwh =
    SWP.calc.annualKwh();

  const monthlyFutureLoads =
    SWP.data.futureEnergy?.loads || {};

  const futureAnnualKwh =
    SWP.calc.futureKwh();

  const totalAnnualKwh =
    currentAnnualKwh === null
      ? null
      : currentAnnualKwh +
        futureAnnualKwh;

  const currentElement =
    root.querySelector('[data-a]');

  const futureElement =
    root.querySelector('[data-b]');

  const totalElement =
    root.querySelector('[data-c]');

  const monthlyElement =
    root.querySelector('[data-monthly]');

  const donutElement =
    root.querySelector('[data-donut]');

  const legendElement =
    root.querySelector('[data-legend]');

  /*
   * Require all 12 canonical monthly usage
   * entries before building the future-energy mix.
   */
  if (totalAnnualKwh === null) {
    if (currentElement) {
      currentElement.textContent =
        'Complete usage';
    }

    if (futureElement) {
      futureElement.textContent =
        'Waiting';
    }

    if (totalElement) {
      totalElement.textContent =
        'Waiting';
    }

    if (monthlyElement) {
      monthlyElement.textContent = '';
    }

    if (donutElement) {
      donutElement.style.background =
        '#e7eef0';
    }

    if (legendElement) {
      legendElement.innerHTML =
        '<p>Complete all 12 months to build the usage mix.</p>';
    }

    return;
  }

  /*
   * Decision_Profile future-load values are
   * monthly kWh.
   *
   * Convert each individual load to annual kWh
   * before combining it with annual current usage.
   */
  const annualFutureLoads =
    Object.entries(monthlyFutureLoads)
      .map(([key, monthlyKwh]) => [
        key,
        (Number(monthlyKwh) || 0) * 12
      ])
      .filter(
        ([, annualKwh]) =>
          annualKwh > 0
      );

  /*
   * Every value in this data set is now annual kWh.
   */
  const data = [
    [
      'current',
      currentAnnualKwh
    ],
    ...annualFutureLoads
  ];

  /*
   * Build the future-usage donut.
   */
  const stops = [];

  let position = 0;

  data.forEach(
    ([key, annualKwh], index) => {
      const percentage =
        totalAnnualKwh > 0
          ? Number(annualKwh) /
            totalAnnualKwh *
            100
          : 0;

      const end =
        position + percentage;

      stops.push(
        `${
          colors[index % colors.length]
        } ${position}% ${end}%`
      );

      position = end;
    }
  );

  if (donutElement) {
    donutElement.style.background =
      totalAnnualKwh > 0
        ? `conic-gradient(${stops.join(',')})`
        : '#e7eef0';
  }

  /*
   * Build annual-kWh legend.
   */
  if (legendElement) {
    legendElement.innerHTML =
      data.map(
        ([key, annualKwh], index) => {
          const percentage =
            totalAnnualKwh > 0
              ? Number(annualKwh) /
                totalAnnualKwh *
                100
              : 0;

          return `
            <div class="legend-row">

              <span
                class="swatch"
                style="background:${
                  colors[
                    index %
                    colors.length
                  ]
                }"
              ></span>

              <span>
                ${names[key] || key}
              </span>

              <strong>
                ${Math.round(
                  Number(annualKwh)
                ).toLocaleString()}
                kWh/year ·
                ${percentage.toFixed(1)}%
              </strong>

            </div>
          `;
        }
      ).join('');
  }

  /*
   * Summary values.
   */
  if (currentElement) {
    currentElement.textContent =
      `${Math.round(
        currentAnnualKwh
      ).toLocaleString()} kWh/year`;
  }

  if (futureElement) {
    futureElement.textContent =
      `+${Math.round(
        futureAnnualKwh
      ).toLocaleString()} kWh/year`;
  }

  if (totalElement) {
    totalElement.textContent =
      `${Math.round(
        totalAnnualKwh
      ).toLocaleString()} kWh/year`;
  }

  if (monthlyElement) {
    monthlyElement.textContent =
      `Average monthly planning usage: ${Math.round(
        totalAnnualKwh / 12
      ).toLocaleString()} kWh/month`;
  }
}

draw();

document.addEventListener(
  'swp:data',
  draw
);

document.addEventListener(
  'swp:profile-loaded',
  draw
);
