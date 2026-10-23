window.SWP = window.SWP || {};

(() => {
  const C = SWP.calc = {};

  C.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  C.defaults = {'PG&E': 0.30, 'SCE': 0.30, 'SDG&E': 0.30, 'Other': 0.30};

  C.catalog = {
    'tesla-pw3': {
      label: 'Tesla Powerwall 3',
      nominalKwh: 13.5,
      usableKwh: 13.5,
      chargeKw: 5,
      dischargeKw: 11.5,
      efficiency: 0.89,
      rateAdder: 0.01,
      note: '13.5 kWh battery energy. Reserve is applied separately. The planning model uses 5 kW maximum continuous charge power, output configuration up to 11.5 kW AC, and 89% solar-to-battery-to-home/grid efficiency.',
      sourceNote: 'Source: Tesla Powerwall 3 U.S. datasheet. Final configuration is controlled by approved design and current product documentation.'
    },
    'qhome-core': {
      label: 'Qcells Q.HOME CORE H3S / H7S',
      nominalKwh: 10,
      usableKwh: 9,
      chargeKw: 5,
      dischargeKw: 5,
      efficiency: 0.90,
      rateAdder: 0.01,
      note: 'Aurora planning uses a 10.0 kWh nominal bank and 9.0 kWh usable energy. Not Q.HOME CORE G3.',
      sourceNote: 'Planning value supplied for the Q.HOME CORE H3S / H7S configuration used in Aurora.'
    }
  };

  C.futureLoads = () => {
    const profile = SWP.data.decisionProfile || {};
    const section1 = profile.sections?.section1 || profile.section1 || {};
    const source = section1.futureLoads || section1.loads || profile.futureEnergy?.loads || {};
    const output = {};

    for (const [key, value] of Object.entries(source)) {
      const monthlyKwh = typeof value === 'object'
        ? Number(value.monthlyKwh ?? value.kwh ?? value.value ?? 0)
        : Number(value);

      if (Number.isFinite(monthlyKwh) && monthlyKwh > 0) {
        output[key] = monthlyKwh;
      }
    }

    return output;
  };

  C.futureMonthly = () => Object.values(C.futureLoads()).reduce((sum, value) => sum + value, 0);
  C.currentAnnual = () => SWP.data.currentEnergy.monthlyKwh.reduce((sum, value) => sum + (Number(value) || 0), 0);
  C.currentMonthlyAverage = () => C.currentAnnual() / 12;
  C.plannedMonthly = () => SWP.data.currentEnergy.monthlyKwh.map(value => (Number(value) || 0) + C.futureMonthly());
  C.plannedAnnual = () => C.plannedMonthly().reduce((sum, value) => sum + value, 0);
  C.utilityRate = () => Number(SWP.data.planning.utilityRate) || 0.30;

  C.battery = () => {
    const model = C.catalog[SWP.data.planning.batteryModel] || C.catalog['tesla-pw3'];
    const count = Number(SWP.data.planning.batteryCount) || 0;
    const reserve = Number(SWP.data.planning.reserve) || 0;

    return {
      ...model,
      count,
      reserve,
      installedNominal: model.nominalKwh * count,
      installedUsable: model.usableKwh * count,
      dispatchable: model.usableKwh * count * (1 - reserve)
    };
  };

  const regionalShares = [0.052,0.064,0.088,0.101,0.112,0.117,0.119,0.112,0.093,0.067,0.040,0.035];
  const days = [31,28,31,30,31,30,31,31,30,31,30,31];
  const solarWindowHours = [4.0,4.6,5.6,6.7,7.5,8.0,8.1,7.5,6.5,5.4,4.3,3.8];

  C.targetAnnual = offset => C.plannedAnnual() * offset;

  C.googleConfig = offset => {
    const configurations = SWP.data.property?.solar?.solarPotential?.solarPanelConfigs || [];
    const target = C.targetAnnual(offset);
    if (!configurations.length) return null;

    return configurations.reduce((best, configuration) =>
      Math.abs(Number(configuration.yearlyEnergyDcKwh || 0) - target) <
      Math.abs(Number(best.yearlyEnergyDcKwh || 0) - target)
        ? configuration
        : best,
      configurations[0]
    );
  };

  C.monthlyProduction = offset => {
    const configuration = C.googleConfig(offset);
    const annualProduction = Number(configuration?.yearlyEnergyDcKwh) || C.targetAnnual(offset);
    const propertyShares = SWP.data.property?.monthlyProductionShares;
    const shares = Array.isArray(propertyShares) && propertyShares.length === 12
      ? propertyShares
      : regionalShares;

    return shares.map(share => annualProduction * share);
  };

  C.scenario = offset => {
    const use = C.plannedMonthly();
    const production = C.monthlyProduction(offset);
    const battery = C.battery();
    const directSolar = [];
    const batteryDelivered = [];
    const imports = [];
    const exports = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const monthlyUse = use[monthIndex];
      const solarHours = solarWindowHours[monthIndex];
      const solarPeriodShare = Math.min(0.62, Math.max(0.28, solarHours / 14));
      const solarPeriodUse = monthlyUse * solarPeriodShare;
      const nonSolarUse = monthlyUse - solarPeriodUse;
      const direct = Math.min(solarPeriodUse, production[monthIndex]);
      const surplus = Math.max(0, production[monthIndex] - direct);
      const maxChargeByPower = battery.chargeKw * solarHours * days[monthIndex];
      const maxMonthlyCycling = battery.dispatchable * days[monthIndex];
      const chargeInput = Math.min(surplus, maxChargeByPower, maxMonthlyCycling);
      const delivered = Math.min(nonSolarUse, chargeInput * battery.efficiency);
      const grid = Math.max(0, solarPeriodUse - direct) + Math.max(0, nonSolarUse - delivered);
      const exported = Math.max(0, surplus - chargeInput);

      directSolar.push(direct);
      batteryDelivered.push(delivered);
      imports.push(grid);
      exports.push(exported);
    }

    const importKwh = imports.reduce((sum, value) => sum + value, 0);
    const exportKwh = exports.reduce((sum, value) => sum + value, 0);
    const importCost = importKwh * C.utilityRate();
    const exportCredit = exportKwh * (Number(SWP.data.planning.exportRate) || 0.07);

    return {
      offset,
      use,
      prod: production,
      directSolar,
      batteryDelivered,
      imports,
      exports,
      annualProduction: production.reduce((sum, value) => sum + value, 0),
      importKwh,
      exportKwh,
      importCost,
      exportCredit,
      remainingUtility: Math.max(0, importCost - exportCredit),
      googleConfig: C.googleConfig(offset)
    };
  };

  C.costLab = (years = 30) => {
    const totalAnnual = C.plannedAnnual();
    const startingUtilityRate = C.utilityRate();
    const utilityGrowth = (Number(SWP.data.planning.utilityGrowth) || 0) / 100;
    const startingSolarRate = Number(SWP.data.planning.solarRate) || 0.20;
    const solarGrowth = (Number(SWP.data.planning.solarEscalator) || 0) / 100;
    const selectedOffset = Number(SWP.data.scenarios.selected) || 1.25;
    const scenario = C.scenario(selectedOffset);
    const battery = C.battery();
    const batteryAdder = battery.count ? (Number(SWP.data.planning.batteryRateAdder) || 0.01) : 0;
    const effectiveSolarRate = startingSolarRate + batteryAdder;
    const rows = [];
    let cumulativeUtility = 0;
    let cumulativeSolar = 0;

    for (let year = 0; year <= years; year += 1) {
      const utilityRate = startingUtilityRate * Math.pow(1 + utilityGrowth, year);
      const solarRate = effectiveSolarRate * Math.pow(1 + solarGrowth, year);
      const utilityAnnual = totalAnnual * utilityRate;
      const remainingUtility = Math.max(0, scenario.importKwh * utilityRate - scenario.exportCredit);
      const solarAnnual = totalAnnual * solarRate + remainingUtility;

      cumulativeUtility += utilityAnnual;
      cumulativeSolar += solarAnnual;

      rows.push({
        year,
        utilityRate,
        solarRate,
        utilityAnnual,
        solarAnnual,
        cumUtility: cumulativeUtility,
        cumSolar: cumulativeSolar,
        remainingUtility
      });
    }

    return rows;
  };
})();
