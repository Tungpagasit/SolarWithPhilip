(function () {

  const KEY = 'swp_energy_strategies_profile_v2';
  const OLD = 'swp_energy_strategies_profile_v1';

  const blank = {
    schemaVersion: '2.0',
    profileType: 'SolarWithPhilipDecisionProfile',

    createdAt: new Date().toISOString(),
    updatedAt: null,

    section1: {},
    section2: {},
    section3: {},
    section4: {},

    section5: {
      outcomes: {},
      concerns: {},
      concernDetails: {},
      otherConcern: ''
    },

    section6: {
      resolutions: {},
      notes: {},
      direction: ''
    },

    proposalRequirements: {
      monthlyUsageComplete: false,
      utilityBillUploaded: false,
      propertyReviewComplete: false,
      designComplete: false,
      pricingComplete: false,
      philipRecommendationComplete: false
    }
  };

  const clone = value =>
    JSON.parse(JSON.stringify(value));

  function merge(target, source) {

    for (const key in source) {

      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {

        target[key] = target[key] || {};
        merge(target[key], source[key]);

      } else {

        target[key] = source[key];

      }
    }

    return target;
  }

  let profile = clone(blank);

  try {

    const saved = JSON.parse(
      localStorage.getItem(KEY) ||
      localStorage.getItem(OLD) ||
      'null'
    );

    if (saved) {
      profile = merge(profile, saved);
    }

  } catch (error) {

    console.error(
      'Solar With Philip profile could not be restored.',
      error
    );

  }

  /*
   * Migrate saved profiles from the old Concern_Profile identity.
   * The storage key stays unchanged so existing selections remain available.
   */
  profile.profileType = 'SolarWithPhilipDecisionProfile';
  profile.schemaVersion = '2.0';

  profile.section6 = profile.section6 || {};
  profile.section6.resolutions =
    profile.section6.resolutions || {};
  profile.section6.notes =
    profile.section6.notes || {};
  profile.section6.direction =
    profile.section6.direction || '';

  /*
   * Remove the old Compare Both direction if it exists
   * in previously saved browser data.
   */
  if (profile.section6.direction === 'Compare Both') {
    profile.section6.direction = '';
  }

  function save() {

    profile.schemaVersion = '2.0';
    profile.profileType =
      'SolarWithPhilipDecisionProfile';

    profile.updatedAt =
      new Date().toISOString();

    localStorage.setItem(
      KEY,
      JSON.stringify(profile)
    );

    document.dispatchEvent(
      new CustomEvent(
        'swp:profile',
        {
          detail: clone(profile)
        }
      )
    );
  }

  function set(section, data) {

    profile[section] = merge(
      profile[section] || {},
      data || {}
    );

    /*
     * Prevent Compare Both from returning through
     * old code or previously stored selections.
     */
    if (
      section === 'section6' &&
      profile.section6.direction === 'Compare Both'
    ) {
      profile.section6.direction = '';
    }

    save();
  }

  function get() {
    return clone(profile);
  }

  function createPortableDecisionProfile() {

    return {
      schemaVersion: '2.0',
      profileType: 'SolarWithPhilipDecisionProfile',

      exportedAt: new Date().toISOString(),

      source: {
        application: 'Solar With Philip',
        experience: 'Energy Strategies'
      },

      sections: {
        section1: clone(profile.section1),
        section2: clone(profile.section2),
        section3: clone(profile.section3),
        section4
