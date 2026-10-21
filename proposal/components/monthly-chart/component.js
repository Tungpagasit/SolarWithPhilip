/* monthly-chart: isolated component */

const labels = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

const draw = () => {
  const usage = SWP.calc.monthlyUsage();
  const maxUsage = Math.max(...usage, 1);

  /*
   * Uses the homeowner's current electricity rate.
   * Replace this line only if your canonical rate
   * is stored somewhere else.
   */
  const rate =
    SWP.data?.currentEnergy?.ratePerKwh || 0;

  root.querySelector('[data-chart]').innerHTML = usage.map((kwh, i) => {

    const cost = kwh * rate;

    return `
      <div class="chartbar-wrap">

        <div class="chart-value">
          <strong>${Math.round(kwh).toLocaleString()} kWh</strong>
          ${rate > 0
            ? `<span>$${Math.round(cost).toLocaleString()}</span>`
            : ''
          }
        </div>

        <div
          class="chartbar"
          style="height:${Math.max(3, kwh / maxUsage * 190)}px"
        ></div>

        <small>${labels[i]}</small>

      </div>
    `;
  }).join('');
};

draw();

document.addEventListener('swp:data', draw);
