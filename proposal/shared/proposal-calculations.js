window.SWP = window.SWP || {};

(() => {
  const C = SWP.calc = {};

  C.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  C.defaults = {'PG&E': 0.30, 'SCE': 0.30, 'SDG&E': 0.30, 'Other': 0.30};

  C.panel = {
    model: 'Qcells Q.TRON BLK M-G2+/AC 430',
    dcWatts: 430,
    lengthMeters: 1.722,
    widthMeters: 1.134,
    areaMeters2: 1.722 * 1.134,
    technology: 'Q.ANTUM NEO / TOPCon N-type',
    sourceNote: 'Standard planning module: Qcells Q.TRON BLK M-G2+/AC 430. Final panel count and placement require approved design.'
  };

  C.catalog = {
    'tesla-pw3': {
      label: 'Tesla Powerwall 3',
      nominalKwh: 13.5,
      usableKwh: 13.5,
      chargeKw: 5,
      dischargeKw: 11.5,
      efficiency: 0.89,
      rateAdder: 0.01,
      note: '13.5 kWh battery energy. Reserve is applied separately. The model uses 5 kW maximum continuous charge power, output configuration up to 11.5 kW AC, and 89% solar-to-battery-to-home/grid efficiency.',
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
      if (Number.isFinite(monthlyKwh) && monthlyKwh > 0) output[key] = monthlyKwh;
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
      dispatchable: model.usableKwh * count * (1 - reserve),
      totalChargeKw: model.chargeKw * count,
      totalDischargeKw: model.dischargeKw * count
    };
  };

  // Preliminary Northern California monthly shares. The later
  // solar-data-layers.js plug-in can replace these with 12 property-specific
  // monthly flux shares without changing the hourly battery model.
  const regionalShares = [0.052,0.064,0.088,0.101,0.112,0.117,0.119,0.112,0.093,0.067,0.040,0.035];
  const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
  const representativeDayOfYear = [15,46,74,105,135,166,196,227,258,288,319,349];

  // Normalized residential hourly planning profile. It creates a morning rise,
  // moderate daytime usage and a larger evening peak. Each value is a share of
  // one representative day's electricity use and the array sums to 1.
  const residentialHourlyProfile = [
    0.026,0.023,0.021,0.020,0.021,0.027,
    0.041,0.052,0.047,0.039,0.035,0.034,
    0.035,0.036,0.037,0.039,0.046,0.061,
    0.073,0.078,0.071,0.057,0.044,0.037
  ];
  const profileSum = residentialHourlyProfile.reduce((a,b) => a + b, 0);
  const normalizedLoadProfile = residentialHourlyProfile.map(value => value / profileSum);

  C.targetAnnual = offset => C.plannedAnnual() * offset;

  C.googleConfigurations = () => SWP.data.property?.solar?.solarPotential?.solarPanelConfigs || [];

  C.googleConfig = offset => {
    const configurations = C.googleConfigurations();
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

  C.googlePanelAssumptions = () => {
    const solar = SWP.data.property?.solar?.solarPotential || {};
    return {
      watts: Number(solar.panelCapacityWatts) || 0,
      heightMeters: Number(solar.panelHeightMeters) || 0,
      widthMeters: Number(solar.panelWidthMeters) || 0
    };
  };

  C.qtronPanelPlan = offset => {
    const target = C.targetAnnual(offset);
    const configurations = C.googleConfigurations();
    const closest = C.googleConfig(offset);
    const maximum = configurations.length
      ? configurations.reduce((best, configuration) =>
          Number(configuration.yearlyEnergyDcKwh || 0) > Number(best.yearlyEnergyDcKwh || 0)
            ? configuration
            : best,
          configurations[0]
        )
      : null;

    const googleAssumptions = C.googlePanelAssumptions();
    const reference = closest || maximum;
    const referencePanels = Number(reference?.panelsCount) || 0;
    const referenceAnnual = Number(reference?.yearlyEnergyDcKwh) || 0;
    const googleWatts = googleAssumptions.watts || C.panel.dcWatts;

    // Scale Google's modeled per-panel annual yield to the 430 W Q.TRON.
    const googleAnnualPerPanel = referencePanels ? referenceAnnual / referencePanels : 0;
    const qtronAnnualPerPanel = googleAnnualPerPanel
      ? googleAnnualPerPanel * (C.panel.dcWatts / googleWatts)
      : 0;

    const panelsNeeded = qtronAnnualPerPanel > 0
      ? Math.ceil(target / qtronAnnualPerPanel)
      : (referencePanels || null);

    // Google's available placements are based on Google's returned panel
    // dimensions. Adjust the placement count conservatively when Q.TRON uses a
    // larger footprint. This remains preliminary and never replaces final design.
    const googlePanelArea = googleAssumptions.heightMeters && googleAssumptions.widthMeters
      ? googleAssumptions.heightMeters * googleAssumptions.widthMeters
      : C.panel.areaMeters2;
    const maximumGooglePanels = Number(maximum?.panelsCount) || referencePanels || 0;
    const footprintAdjustedMaximum = maximumGooglePanels
      ? Math.floor(maximumGooglePanels * googlePanelArea / C.panel.areaMeters2)
      : null;

    const roofSupportedPanels = footprintAdjustedMaximum || maximumGooglePanels || null;
    const modeledPanels = panelsNeeded && roofSupportedPanels
      ? Math.min(panelsNeeded, roofSupportedPanels)
      : (panelsNeeded || roofSupportedPanels);
    const modeledAnnual = modeledPanels && qtronAnnualPerPanel
      ? modeledPanels * qtronAnnualPerPanel
      : (referenceAnnual || target);

    return {
      targetAnnualKwh: target,
      closestGoogleConfig: closest,
      maximumGoogleConfig: maximum,
      qtronAnnualPerPanel,
      panelsNeeded,
      roofSupportedPanels,
      modeledPanels,
      modeledAnnualKwh: modeledAnnual,
      roofConstrained: Boolean(panelsNeeded && roofSupportedPanels && panelsNeeded > roofSupportedPanels),
      googleAssumptions
    };
  };

  C.monthlyProduction = offset => {
    const plan = C.qtronPanelPlan(offset);
    const propertyShares = SWP.data.property?.monthlyProductionShares;
    const shares = Array.isArray(propertyShares) && propertyShares.length === 12
      ? propertyShares
      : regionalShares;
    return shares.map(share => plan.modeledAnnualKwh * share);
  };

  function daylightWindow(latitudeDegrees, dayOfYear) {
    const latitude = latitudeDegrees * Math.PI / 180;
    const declination = 23.44 * Math.PI / 180 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    const cosineHourAngle = Math.max(-1, Math.min(1, -Math.tan(latitude) * Math.tan(declination)));
    const hourAngle = Math.acos(cosineHourAngle);
    const dayLength = 24 * hourAngle / Math.PI;
    return {
      sunrise: 12 - dayLength / 2,
      sunset: 12 + dayLength / 2,
      dayLength
    };
  }

  function hourlySolarShape(monthIndex) {
    const latitude = Number(SWP.data.property?.lat) || 38.8;
    const window = daylightWindow(latitude, representativeDayOfYear[monthIndex]);
    const raw = Array.from({length: 24}, (_, hour) => {
      const midpoint = hour + 0.5;
      if (midpoint <= window.sunrise || midpoint >= window.sunset) return 0;
      const progress = (midpoint - window.sunrise) / window.dayLength;
      return Math.pow(Math.sin(Math.PI * progress), 1.35);
    });
    const sum = raw.reduce((a,b) => a + b, 0) || 1;
    return raw.map(value => value / sum);
  }

  C.scenario = offset => {
    const monthlyUse = C.plannedMonthly();
    const monthlyProduction = C.monthlyProduction(offset);
    const battery = C.battery();
    const panelPlan = C.qtronPanelPlan(offset);
    const directSolar = [];
    const batteryDelivered = [];
    const batteryCharged = [];
    const imports = [];
    const exports = [];
    const monthlyDetails = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const days = daysInMonth[monthIndex];
      const dailyUse = monthlyUse[monthIndex] / days;
      const dailySolar = monthlyProduction[monthIndex] / days;
      const hourlySolarFractions = hourlySolarShape(monthIndex);

      let stateOfCharge = 0;
      let dayDirectSolar = 0;
      let dayBatteryDelivered = 0;
      let dayBatteryChargeInput = 0;
      let dayImport = 0;
      let dayExport = 0;

      for (let hour = 0; hour < 24; hour += 1) {
        const load = dailyUse * normalizedLoadProfile[hour];
        const solar = dailySolar * hourlySolarFractions[hour];
        const direct = Math.min(load, solar);
        let remainingLoad = load - direct;
        let surplus = solar - direct;

        dayDirectSolar += direct;

        if (surplus > 0 && battery.count > 0) {
          const availableCapacityInput = Math.max(0, (battery.dispatchable - stateOfCharge) / battery.efficiency);
          const chargeInput = Math.min(surplus, battery.totalChargeKw, availableCapacityInput);
          stateOfCharge += chargeInput * battery.efficiency;
          surplus -= chargeInput;
          dayBatteryChargeInput += chargeInput;
        }

        if (remainingLoad > 0 && battery.count > 0 && stateOfCharge > 0) {
          const discharge = Math.min(remainingLoad, battery.totalDischargeKw, stateOfCharge);
          stateOfCharge -= discharge;
          remainingLoad -= discharge;
          dayBatteryDelivered += discharge;
        }

        dayImport += Math.max(0, remainingLoad);
        dayExport += Math.max(0, surplus);
      }

      // Representative day repeats through the month. State of charge begins
      // empty each representative day, preventing unsupported energy carryover.
      const monthDirect = dayDirectSolar * days;
      const monthBatteryDelivered = dayBatteryDelivered * days;
      const monthBatteryCharged = dayBatteryChargeInput * days;
      const monthImports = dayImport * days;
      const monthExports = dayExport * days;

      directSolar.push(monthDirect);
      batteryDelivered.push(monthBatteryDelivered);
      batteryCharged.push(monthBatteryCharged);
      imports.push(monthImports);
      exports.push(monthExports);
      monthlyDetails.push({
        month: C.months[monthIndex],
        usageKwh: monthlyUse[monthIndex],
        productionKwh: monthlyProduction[monthIndex],
        directSolarKwh: monthDirect,
        batteryChargeInputKwh: monthBatteryCharged,
        batteryDeliveredKwh: monthBatteryDelivered,
        importKwh: monthImports,
        exportKwh: monthExports
      });
    }

    const importKwh = imports.reduce((sum, value) => sum + value, 0);
    const exportKwh = exports.reduce((sum, value) => sum + value, 0);
    const importCost = importKwh * C.utilityRate();
    const exportCredit = exportKwh * (Number(SWP.data.planning.exportRate) || 0.07);

    return {
      offset,
      use: monthlyUse,
      prod: monthlyProduction,
      directSolar,
      batteryCharged,
      batteryDelivered,
      imports,
      exports,
      monthlyDetails,
      annualProduction: monthlyProduction.reduce((sum, value) => sum + value, 0),
      importKwh,
      exportKwh,
      importCost,
      exportCredit,
      remainingUtility: Math.max(0, importCost - exportCredit),
      googleConfig: panelPlan.closestGoogleConfig,
      panelPlan
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
