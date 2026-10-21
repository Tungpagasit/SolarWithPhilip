/* monthly-chart: isolated component */

const labels =
  'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

const draw = () => {
  /*
   * Canonical 12-month usage record.
   */
  const usage =
    SWP.calc.monthlyUsage();

  const maxUsage =
    Math.max(...usage, 1);

  /*
   * Use the same utility-rate source as the
   * rest of the Proposal calculations.
   */
  const rate =
    SWP.calc.utilityRate();

  const chart =
    root.querySelector('[data-chart]');

  if (!chart) return;

  chart.innerHTML =
    usage.map((kwh, index) => {
      const monthlyKwh =
        Number(kwh) || 0;

      const cost =
        monthlyKwh * rate;

      const barHeight =
        Math.max(
          3,
          monthlyKwh /
            maxUsage *
            190
        );

      return `
        <div class="chartbar-wrap">

          <div class="chart-value">

            <strong>
              ${Math.round(
                monthlyKwh
              ).toLocaleString()} kWh
            </strong>

            <span>
              ${cost.toLocaleString(
                'en-US',
                {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }
              )}
            </span>

          </div>

          <div
            class="chartbar"
            style="height:${barHeight}px"
          ></div>

          <small>
            ${labels[index]}
          </small>

        </div>
      `;
    }).join('');
};

draw();

document.addEventListener(
  'swp:data',
  draw
);

document.addEventListener(
  'swp:profile-loaded',
  draw
);
