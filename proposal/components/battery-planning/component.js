const model = root.querySelector('[data-model]');
const count = root.querySelector('[data-count]');
const reserve = root.querySelector('[data-reserve]');
const exportRate = root.querySelector('[data-export]');

model.value = SWP.data.planning.batteryModel;
count.value = SWP.data.planning.batteryCount;
reserve.value = SWP.data.planning.reserve;
exportRate.value = SWP.data.planning.exportRate;
document.addEventListener('swp:state-restored', () => {
  const set = (el, v) => { const o = [...el.options || []].find(x => Number(x.value) === Number(v)); el.value = o ? o.value : v; };
  model.value = SWP.data.planning.batteryModel;
  set(count, SWP.data.planning.batteryCount);
  set(reserve, SWP.data.planning.reserve);
  exportRate.value = SWP.data.planning.exportRate;
  draw();
});

function formatEnergy(value) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: Number(value) % 1 ? 1 : 0,
    maximumFractionDigits: 1
  });
}

function draw() {
  SWP.data.planning.batteryModel = model.value;
  SWP.data.planning.batteryCount = Number(count.value);
  SWP.data.planning.reserve = Number(reserve.value);
  SWP.data.planning.exportRate = Number(exportRate.value);

  const battery = SWP.calc.battery();

  root.querySelector('[data-summary]').innerHTML = `
    <b>${battery.label}</b>
    <p>${formatEnergy(battery.installedNominal)} kWh nominal · ${formatEnergy(battery.installedUsable)} kWh usable before reserve · ${formatEnergy(battery.dispatchable)} kWh available after reserve</p>
    <p>${SWP.esc(battery.note)}</p>
    <small>${SWP.esc(battery.sourceNote || '')}</small>
  `;

  SWP.save();
}

for (const element of [model, count, reserve, exportRate]) {
  element.addEventListener('input', draw);
}

draw();
