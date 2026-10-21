(() => {
  const defaults = {
    'PG&E': 0.406,
    'SCE': 0.344,
    'SDG&E': 0.455,
    'Other': 0.30
  };

  /*
   * Return all 12 monthly kWh values from the
   * canonical Proposal energy record.
   */
  const rawUsage = () =>
    Array.from({ length: 12 }, (_, index) => {
      const value =
        SWP.data.currentEnergy?.monthlyKwh?.[index];

      if (
        value === null ||
        value === '' ||
        typeof value === 'undefined'
      ) {
        return null;
      }

      return Number(value);
    });

  /*
   * Validate the canonical 12-month usage record.
   */
  function usageStatus() {
    const values = rawUsage();

    const valid = values.filter(
      value =>
        Number.isFinite(value) &&
        value >= 0
    );

    return {
      values,
      validMonths: valid.length,
      complete: valid.length === 12,

      annual:
        valid.length === 12
          ? valid.reduce(
              (total, value) =>
                total + value,
              0
            )
          : null
    };
  }

  function usageComplete() {
    return usageStatus().complete;
  }

  /*
   * Current annual household usage.
   */
  function annualKwh() {
    return usageStatus().annual;
  }

  /*
   * Current utility rate.
   */
  function utilityRate() {
    let rate =
      Number(
        SWP.data.planning.utilityRate
      );

    if (!(rate > 0)) {
      rate =
        defaults[
          SWP.data.homeowner.utility
        ] || 0.406;

      SWP.data.planning.utilityRate =
        rate;
    }

    return rate;
  }

  /*
   * Current annual electricity cost.
   */
  function annualCost() {
    const currentAnnualKwh =
      annualKwh();

    return currentAnnualKwh === null
      ? null
      : currentAnnualKwh *
          utilityRate();
  }

  /*
   * Decision_Profile future-load values are
   * stored as monthly kWh.
   *
   * Sum the monthly additions, then multiply
   * by 12 to return annual future kWh.
   */
  function futureKwh() {
    const monthlyFutureKwh =
      Object.values(
        SWP.data.futureEnergy?.loads || {}
      ).reduce(
        (total, value) =>
          total + (Number(value) || 0),
        0
      );

    return monthlyFutureKwh * 12;
  }

  /*
   * Total annual planning usage:
   * current annual usage plus annual future usage.
   */
  function planningKwh() {
    const currentAnnualKwh =
      annualKwh();

    return currentAnnualKwh === null
      ? null
      : currentAnnualKwh +
          futureKwh();
  }

  /*
   * Canonical monthly usage array.
   */
  function monthlyUsage() {
    return usageStatus().values.map(
      value =>
        Number.isFinite(value)
          ? value
          : 0
    );
  }

  /*
   * Annual solar-production target.
   */
  function productionTarget(
    offset = 1.25
  ) {
    const annualPlanningKwh =
      planningKwh();

    return annualPlanningKwh === null
      ? null
      : annualPlanningKwh * offset;
  }

  /*
   * Select the Google-modeled solar configuration
   * closest to the requested production target.
   */
  function selectSolarConfig(
    offset = 1.25
  ) {
    const configurations =
      SWP.data.property?.solar
        ?.solarPotential
        ?.solarPanelConfigs || [];

    const target =
      productionTarget(offset);

    if (
      !configurations.length ||
      target === null
    ) {
      return null;
    }

    return configurations.reduce(
      (best, configuration) => {
        const configurationDifference =
          Math.abs(
            Number(
              configuration
                .yearlyEnergyDcKwh || 0
            ) - target
          );

        const bestDifference =
          Math.abs(
            Number(
              best.yearlyEnergyDcKwh || 0
            ) - target
          );

        return configurationDifference <
          bestDifference
          ? configuration
          : best;
      },
      configurations[0]
    );
  }

  /*
   * Current-usage utility-cost projection.
   */
  function currentProjection(
    years = 30
  ) {
    const currentAnnualKwh =
      annualKwh();

    if (currentAnnualKwh === null) {
      return null;
    }

    const monthlyKwh =
      currentAnnualKwh / 12;

    const startingUtilityRate =
      utilityRate();

    const utilityGrowth =
      (
        Number(
          SWP.data.planning.utilityGrowth
        ) || 4
      ) / 100;

    const rows = Array.from(
      { length: years + 1 },
      (_, year) => {
        const projectedUtilityRate =
          startingUtilityRate *
          Math.pow(
            1 + utilityGrowth,
            year
          );

        return {
          year,

          utilityRate:
            projectedUtilityRate,

          utilityMonthly:
            monthlyKwh *
            projectedUtilityRate
        };
      }
    );

    return {
      rows,
      monthlyKwh
    };
  }

  /*
   * Utility-versus-solar planning projection.
   */
  function projection(
    years = 30
  ) {
    const annualPlanningKwh =
      planningKwh();

    if (annualPlanningKwh === null) {
      return null;
    }

    const monthlyKwh =
      annualPlanningKwh / 12;

    const startingUtilityRate =
      utilityRate();

    const utilityGrowth =
      (
        Number(
          SWP.data.planning.utilityGrowth
        ) || 4
      ) / 100;

    const startingSolarRate =
      Number(
        SWP.data.planning.solarStartRate
      ) || 0.24;

    const solarGrowth = 0.04;

    const rows = Array.from(
      { length: years + 1 },
      (_, year) => {
        const projectedUtilityRate =
          startingUtilityRate *
          Math.pow(
            1 + utilityGrowth,
            year
          );

        const projectedSolarRate =
          startingSolarRate *
          Math.pow(
            1 + solarGrowth,
            year
          );

        return {
          year,

          utilityRate:
            projectedUtilityRate,

          solarRate:
            projectedSolarRate,

          utilityMonthly:
            monthlyKwh *
            projectedUtilityRate,

          solarMonthly:
            monthlyKwh *
            projectedSolarRate
        };
      }
    );

    const total = (
      key,
      numberOfYears
    ) =>
      rows
        .slice(0, numberOfYears)
        .reduce(
          (sum, row) =>
            sum + row[key] * 12,
          0
        );

    return {
      rows,
      monthlyKwh,
      total
    };
  }

  /*
   * Preliminary seasonal import/export model.
   */
  function seasonal(offset) {
    const status =
      usageStatus();

    if (!status.complete) {
      return null;
    }

    const usage =
      status.values;

    const annualUsage =
      status.annual;

    const weights = [
      0.74,
      0.76,
      0.98,
      1.11,
      1.10,
      1.19,
      1.26,
      1.28,
      1.10,
      0.95,
      0.81,
      0.68
    ];

    const weightTotal =
      weights.reduce(
        (total, value) =>
          total + value,
        0
      );

    const production =
      weights.map(
        weight =>
          annualUsage *
          offset *
          weight /
          weightTotal
      );

    const imports =
      usage.map(
        (monthUsage, index) =>
          Math.max(
            monthUsage -
              production[index],
            0
          )
      );

    const exports =
      usage.map(
        (monthUsage, index) =>
          Math.max(
            production[index] -
              monthUsage,
            0
          )
      );

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
      utilityRate();

    const exportRate =
      Number(
        SWP.data.planning.exportRate
      ) || 0.07;

    const exportCredit =
      exportKwh *
      exportRate;

    return {
      use: usage,
      prod: production,
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

      cost:
        Math.max(
          0,
          importCost -
            exportCredit
        )
    };
  }

  /*
   * Shared Proposal calculation interface.
   */
  SWP.calc = {
    usageStatus,
    usageComplete,
    annualKwh,
    utilityRate,
    annualCost,
    futureKwh,
    planningKwh,
    monthlyUsage,
    productionTarget,
    selectSolarConfig,
    currentProjection,
    projection,
    seasonal,
    utilityDefaults: defaults
  };
})();
