(() => {
  /*
   * ============================================================
   * SOLAR WITH PHILIP — PROPOSAL CALCULATIONS
   * ============================================================
   *
   * All Proposal components should read calculations from SWP.calc.
   *
   * Seasonal-import model:
   * 1. Home usage is divided by the actual days in each month.
   * 2. Usage is divided between the solar-production period and
   *    the non-solar period.
   * 3. Solar supplies the home directly first.
   * 4. Remaining solar charges the battery.
   * 5. The battery supplies non-solar-period usage.
   * 6. Remaining shortages are imported from PG&E.
   * 7. Remaining solar after battery charging is exported.
   *
   * This is a preliminary planning estimate. It is not a substitute
   * for interval utility data, tariff modeling, or final engineering.
   */

  const defaults = {
    'PG&E': 0.406,
    'SCE': 0.344,
    'SDG&E': 0.455,
    'Other': 0.30
  };

  /*
   * ============================================================
   * SEASONAL MODEL ASSUMPTIONS
   * ============================================================
   */

  const DAYS_IN_MONTH = [
    31, // January
    28, // February
    31, // March
    30, // April
    31, // May
    30, // June
    31, // July
    31, // August
    30, // September
    31, // October
    30, // November
    31  // December
  ];

  /*
   * Existing monthly solar-production pattern.
   *
   * These weights distribute annual solar production across the
   * 12 months. Higher values represent stronger solar-production
   * months; lower values represent weaker winter production.
   */
  const SOLAR_PRODUCTION_WEIGHTS = [
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

  /*
   * Estimated portion of household electricity consumed during
   * the meaningful solar-production period for each month.
   *
   * Winter has a shorter solar-production period, so a larger
   * portion of usage occurs outside that period.
   *
   * These are SWP preliminary planning assumptions, not measured
   * hourly consumption and not a California-required standard.
   */
  const SOLAR_PERIOD_USAGE_SHARE = [
    0.40, // January
    0.42, // February
    0.46, // March
    0.50, // April
    0.53, // May
    0.55, // June
    0.55, // July
    0.53, // August
    0.50, // September
    0.46, // October
    0.42, // November
    0.39  // December
  ];

  /*
   * Default battery assumptions.
   *
   * The model first looks for a battery capacity already stored
   * in SWP.data. If none is found, it uses 20 kWh as the preliminary
   * battery planning capacity.
   */
  const DEFAULT_BATTERY_CAPACITY_KWH = 20;
  const DEFAULT_MINIMUM_SOC_PERCENT = 20;
  const DEFAULT_ROUND_TRIP_EFFICIENCY = 0.90;
  const DEFAULT_EXPORT_RATE = 0.07;

  /*
   * ============================================================
   * CURRENT ENERGY USAGE
   * ============================================================
   */

  const rawUsage = () =>
    Array.from({ length: 12 }, (_, i) => {
      const value =
        SWP.data.currentEnergy?.monthlyKwh?.[i];

      if (
        value === null ||
        value === '' ||
        typeof value === 'undefined'
      ) {
        return null;
      }

      return Number(value);
    });

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
              (total, value) => total + value,
              0
            )
          : null
    };
  }

  function usageComplete() {
    return usageStatus().complete;
  }

  function annualKwh() {
    return usageStatus().annual;
  }

  function monthlyUsage() {
    return usageStatus().values.map(value =>
      Number.isFinite(value) ? value : 0
    );
  }

  /*
   * ============================================================
   * UTILITY RATE AND CURRENT COST
   * ============================================================
   */

  function utilityRate() {
    let rate =
    
