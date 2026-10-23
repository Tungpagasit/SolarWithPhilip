window.SWP = window.SWP || {};

(() => {

  const calc = {};

  SWP.calc = calc;


  /* =========================================================
     MONTHS AND UTILITY DEFAULTS
     ========================================================= */

  calc.months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];


  calc.defaults = {
    'PG&E': 0.406,
    'SCE': 0.344,
    'SDG&E': 0.455,
    'Other': 0.30
  };


  /* =========================================================
     BATTERY CATALOG
     ========================================================= */

  calc.catalog = {

    'tesla-pw3': {

      label:
        'Tesla Powerwall 3',

      nominalKwh:
        13.5,

      usableKwh:
        13.5,

      chargeKw:
        5,

      dischargeKw:
        11.5,

      efficiency:
        0.89,

      rateAdder:
        0.01,

      note:
        'Uses the Powerwall 3 planning specifications. Backup reserve is applied separately.'
    },


    'qhome-core': {

      label:
        'Qcells Q.HOME CORE H3S / H7S',

      nominalKwh:
        10.0,

      usableKwh:
        9.0,

      chargeKw:
        5,

      dischargeKw:
        5,

      efficiency:
        0.90,

      rateAdder:
        0.01,

      note:
        'Aurora planning uses a 10.0 kWh nominal bank and 9.0 kWh usable energy. This is Q.HOME CORE H3S / H7S, not Q.HOME CORE G3.'
    }

  };


  /* =========================================================
     DECISION PROFILE FUTURE LOADS
     ========================================================= */

  calc.futureLoads = () => {

    const profile =
      SWP.data.decisionProfile ||
      {};

    const section1 =
      profile.sections?.section1 ||
      profile.section1 ||
      {};

    const source =
      section1.futureLoads ||
      section1.loads ||
      profile.futureEnergy?.loads ||
      {};

    const futureLoads = {};


    Object.entries(
      source
    ).forEach(
      ([key, value]) => {

        const monthlyKwh =
          typeof value === 'object'
            ? Number(
                value.monthlyKwh ??
                value.kwh ??
                value.value ??
                0
              )
            : Number(value);


        if (
          Number.isFinite(
            monthlyKwh
          ) &&
          monthlyKwh > 0
        ) {

          futureLoads[key] =
            monthlyKwh;

        }

      }
    );


    return futureLoads;

  };


  calc.futureMonthly = () =>
    Object.values(
      calc.futureLoads()
    ).reduce(
      (total, value) =>
        total + value,
      0
    );


  /* =========================================================
     CURRENT AND PLANNED ENERGY
     ========================================================= */

  calc.currentAnnual = () =>
    SWP.data.currentEnergy
      .monthlyKwh
      .reduce(
        (total, value) =>
          total +
          (Number(value) || 0),
        0
      );


  calc.plannedMonthly = () => {

    const futureMonthlyKwh =
      calc.futureMonthly();


    return SWP.data.currentEnergy
      .monthlyKwh
      .map(
        value =>
          (Number(value) || 0) +
          futureMonthlyKwh
      );

  };


  calc.plannedAnnual = () =>
    calc.plannedMonthly()
      .reduce(
        (total, value) =>
          total + value,
        0
      );


  calc.utilityRate = () =>
    Number(
      SWP.data.planning
        .utilityRate
    ) ||
    calc.defaults[
      SWP.data.homeowner.utility
    ] ||
    0.406;


  /* =========================================================
     BATTERY PLANNING
     ========================================================= */

  calc.battery = () => {

    const model =
      calc.catalog[
        SWP.data.planning
          .batteryModel
      ] ||
      calc.catalog[
        'tesla-pw3'
      ];


    const count =
      Number(
        SWP.data.planning
          .batteryCount
      ) || 0;


    const reserve =
      Number(
        SWP.data.planning
          .reserve
      ) || 0;


    const installedNominal =
      model.nominalKwh *
      count;


    const installedUsable =
      model.usableKwh *
      count;


    const dispatchable =
      installedUsable *
      (1 - reserve);


    return {

      ...model,

      count,

      reserve,

      installedNominal,

      installedUsable,

      dispatchable

    };

  };


  /* =========================================================
     SEASONAL PRODUCTION PLANNING
     ========================================================= */

  const productionWeights = [
    0.72,
    0.78,
    0.96,
    1.09,
    1.17,
    1.24,
    1.27,
    1.22,
    1.08,
    0.94,
    0.78,
    0.68
  ];


  const daysInMonth = [
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];


  const approximateSunHours = [
    9.7,
    10.7,
    12.0,
    13.2,
    14.2,
    14.8,
    14.5,
    13.6,
    12.4,
    11.1,
    10.0,
    9.4
  ];


  calc.monthlyProduction =
    offset => {

      const annualTarget =
        calc.plannedAnnual() *
        offset;


      const googleAnnual =
        Number(
          SWP.data.property
            ?.selectedAnnualKwh
        ) || 0;


      /*
       * Use a Google-selected annual
       * configuration only when it is
       * reasonably close to the chosen
       * planning target.
       */
      const selectedAnnual =
        googleAnnual &&
        annualTarget > 0 &&
        (
          Math.abs(
            googleAnnual -
            annualTarget
          ) /
          annualTarget
        ) < 0.35

          ? googleAnnual

          : annualTarget;


      const weightTotal =
        productionWeights.reduce(
          (total, value) =>
            total + value,
          0
        );


      return productionWeights.map(
        weight =>
          selectedAnnual *
          weight /
          weightTotal
      );

    };


  /* =========================================================
     BATTERY-AWARE MONTHLY SCENARIO
     ========================================================= */

  calc.scenario =
    offset => {

      const use =
        calc.plannedMonthly();


      const production =
        calc.monthlyProduction(
          offset
        );


      const battery =
        calc.battery();


      const directSolar = [];

      const batteryDelivered = [];

      const imports = [];

      const exports = [];


      for (
        let monthIndex = 0;
        monthIndex < 12;
        monthIndex += 1
      ) {

        const days =
          daysInMonth[
            monthIndex
          ];


        const monthlyUse =
          use[
            monthIndex
          ];


        const monthlyProduction =
          production[
            monthIndex
          ];


        const dailyUse =
          monthlyUse /
          days;


        const dailyProduction =
          monthlyProduction /
          days;


        /*
         * Approximate the fraction of
         * daily household use occurring
         * during the solar-production
         * window.
         */
        const solarUseShare =
          Math.min(
            0.68,
            Math.max(
              0.32,
              approximateSunHours[
                monthIndex
              ] / 24
            )
          );


        const daytimeNeed =
          dailyUse *
          solarUseShare;


        const nonSolarNeed =
          dailyUse -
          daytimeNeed;


        const dailyDirectSolar =
          Math.min(
            daytimeNeed,
            dailyProduction
          );


        const dailySurplus =
          Math.max(
            0,
            dailyProduction -
            dailyDirectSolar
          );


        /*
         * Battery charging is constrained
         * by actual monthly solar surplus.
         */
        const monthlySolarSurplus =
          dailySurplus *
          days;


        /*
         * Charge-power limit.
         *
         * This prevents a battery from
         * absorbing more solar during the
         * month than its charge-power and
         * sunlight-window assumptions
         * would allow.
         */
        const monthlyChargeLimit =
          battery.chargeKw *
          Math.max(
            0,
            approximateSunHours[
              monthIndex
            ] - 2
          ) *
          days;


        /*
         * The battery can cycle through
         * multiple days during a month,
         * but it can only charge from the
         * solar surplus that actually
         * exists in that month.
         */
        const monthlyCapacityLimit =
          battery.dispatchable *
          days;


        const chargeInput =
          Math.min(
            monthlySolarSurplus,
            monthlyChargeLimit,
            monthlyCapacityLimit
          );


        const possibleDelivery =
          chargeInput *
          battery.efficiency;


        const monthlyNonSolarNeed =
          nonSolarNeed *
          days;


        const deliveredFromBattery =
          Math.min(
            monthlyNonSolarNeed,
            possibleDelivery
          );


        const daytimeGridImport =
          Math.max(
            0,
            daytimeNeed -
            dailyDirectSolar
          ) *
          days;


        const nighttimeGridImport =
          Math.max(
            0,
            monthlyNonSolarNeed -
            deliveredFromBattery
          );


        const monthlyGridImport =
          daytimeGridImport +
          nighttimeGridImport;


        const monthlyExport =
          Math.max(
            0,
            monthlySolarSurplus -
            chargeInput
          );


        directSolar.push(
          dailyDirectSolar *
          days
        );


        batteryDelivered.push(
          deliveredFromBattery
        );


        imports.push(
          monthlyGridImport
        );


        exports.push(
          monthlyExport
        );

      }


      const importKwh =
        imports.reduce(
          (total, value) =>
            total + value,
          0
        );


      const exportKwh =
        exports.reduce(
          (total, value) =>
            total + value,
          0
        );


      const importCost =
        importKwh *
        calc.utilityRate();


      const exportCredit =
        exportKwh *
        (
          Number(
            SWP.data.planning
              .exportRate
          ) ||
          0.07
        );


      return {

        offset,

        use,

        prod:
          production,

        directSolar,

        batteryDelivered,

        imports,

        exports,

        annualProduction:
          production.reduce(
            (total, value) =>
              total + value,
            0
          ),

        importKwh,

        exportKwh,

        importCost,

        exportCredit,

        trueUp:
          Math.max(
            0,
            importCost -
            exportCredit
          )

      };

    };


  /* =========================================================
     30-YEAR COST LAB
     ========================================================= */

  calc.costLab =
    (years = 30) => {

      const currentAnnual =
        calc.currentAnnual();


      const futureAnnual =
        calc.futureMonthly() *
        12;


      const totalAnnual =
        currentAnnual +
        futureAnnual;


      const startingUtilityRate =
        calc.utilityRate();


      const utilityGrowth =
        (
          Number(
            SWP.data.planning
              .utilityGrowth
          ) || 0
        ) / 100;


      const startingSolarRate =
        Number(
          SWP.data.planning
            .solarStartRate
        ) ||
        0.24;


      const solarGrowth =
        (
          Number(
            SWP.data.planning
              .solarEscalator
          ) || 0
        ) / 100;


      const battery =
        calc.battery();


      const batteryRateAdder =
        battery.count *
        battery.rateAdder;


      const initialSolarRate =
        startingSolarRate +
        batteryRateAdder;


      const selectedOffset =
        Number(
          SWP.data.scenarios
            .selected
        ) ||
        1.25;


      const scenario =
        calc.scenario(
          selectedOffset
        );


      const rows = [];


      /*
       * These MUST be let because they
       * accumulate once per year.
       *
       * This corrects the prior:
       * "Assignment to constant variable"
       * failure.
       */
      let cumulativeUtility = 0;

      let cumulativeSolar = 0;


      for (
        let year = 0;
        year <= years;
        year += 1
      ) {

        const projectedUtilityRate =
          startingUtilityRate *
          Math.pow(
            1 + utilityGrowth,
            year
          );


        const projectedSolarRate =
          initialSolarRate *
          Math.pow(
            1 + solarGrowth,
            year
          );


        const utilityAnnualCost =
          totalAnnual *
          projectedUtilityRate;


        /*
         * Solar path:
         *
         * planned electricity at the
         * selected solar rate
         *
         * plus remaining grid imports
         * at the projected utility rate
         *
         * minus the current preliminary
         * export-credit estimate.
         */
        const solarAnnualCost =
          (
            totalAnnual *
            projectedSolarRate
          ) +
          (
            scenario.importKwh *
            projectedUtilityRate
          ) -
          scenario.exportCredit;


        cumulativeUtility +=
          utilityAnnualCost;


        cumulativeSolar +=
          solarAnnualCost;


        rows.push({

          year,

          utilityRate:
            projectedUtilityRate,

          solarRate:
            projectedSolarRate,

          utilityAnnual:
            utilityAnnualCost,

          solarAnnual:
            solarAnnualCost,

          cumUtility:
            cumulativeUtility,

          cumSolar:
            cumulativeSolar

        });

      }


      return rows;

    };

})();
