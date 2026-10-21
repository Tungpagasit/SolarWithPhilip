const labels = {
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
  const loads =
    SWP.data.futureEnergy?.loads || {};

  const items =
    Object.entries(labels).filter(
      ([key]) =>
        Number(loads[key]) > 0
    );

  const message =
    root.querySelector('[data-message]');

  const loadContainer =
    root.querySelector('[data-loads]');

  if (message) {
    message.textContent =
      items.length
        ? 'These planned future electricity additions came from your uploaded Decision_Profile.'
        : 'No future-usage additions were found in the Decision_Profile.';
  }

  if (!loadContainer) return;

  loadContainer.innerHTML =
    items.length
      ? items.map(([key, label]) => {
          const monthlyKwh =
            Number(loads[key]) || 0;

          const annualKwh =
            monthlyKwh * 12;

          return `
            <div class="profile-load-card">
              <span>${label}</span>

              <strong>
                ${monthlyKwh.toLocaleString()} kWh/month
              </strong>

              <small>
                ${annualKwh.toLocaleString()} kWh/year
              </small>
            </div>
          `;
        }).join('')
      : `
        <div class="profile-load-card">
          <span>Additional future usage</span>
          <strong>0 kWh/month</strong>
        </div>
      `;
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
