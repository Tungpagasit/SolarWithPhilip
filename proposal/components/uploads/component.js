function extractLoads(profile) {

  const p = profile?.sections || profile || {};

  const sectionSources = [
    p.section1,
    p.section2,
    p.section3,
    p.section4,
    p.section5,
    p.section6
  ];

  let source = {};

  for (const section of sectionSources) {

    const candidate =
      section?.futureEnergy?.loads ||
      section?.futureLoads ||
      section?.energyProfile?.futureLoads ||
      section?.futureUsage;

    if (candidate && typeof candidate === 'object') {
      source = candidate;
      break;
    }
  }

  const aliases = {
    ev: [
      'ev',
      'evCharging',
      'electricVehicle'
    ],

    hvac: [
      'hvac',
      'heatPump',
      'heatPumpHvac'
    ],

    pool: [
      'pool',
      'poolSpa'
    ],

    waterHeating: [
      'waterHeating',
      'waterHeater'
    ],

    appliances: [
      'appliances',
      'electricAppliances'
    ],

    addition: [
      'addition',
      'homeAddition'
    ],

    other: [
      'other'
    ]
  };

  const out = {};

  for (const [key, names] of Object.entries(aliases)) {

    for (const name of names) {

      if (Number.isFinite(Number(source[name]))) {
        out[key] = Number(source[name]);
        break;
      }

    }
  }

  return out;
}


function validateDecisionProfile(profile) {

  if (
    !profile ||
    typeof profile !== 'object'
  ) {
    throw new Error(
      'The selected file is not a valid Decision_Profile.'
    );
  }

  if (
    profile.profileType !==
    'SolarWithPhilipDecisionProfile'
  ) {
    throw new Error(
      'This file is not a Solar With Philip Decision_Profile.'
    );
  }

  if (
    profile.schemaVersion !== '2.0'
  ) {
    throw new Error(
      'This Decision_Profile version is not supported.'
    );
  }

  if (
    !profile.sections ||
    typeof profile.sections !== 'object'
  ) {
    throw new Error(
      'This Decision_Profile does not contain the required Energy Strategies data.'
    );
  }

  return true;
}


root.querySelectorAll('[data-u]').forEach(input => {

  input.onchange = () => {

    const file = input.files[0];
    const key = input.dataset.u;

    SWP.data.uploads[key] = file
      ? {
          name: file.name,
          type: file.type,
          size: file.size,
          file: file
        }
      : null;

    const fileName =
      root.querySelector(
        `[data-n="${key}"]`
      );

    if (fileName) {
      fileName.textContent =
        file ? file.name : 'No file selected';
    }


    /*
     * DECISION_PROFILE
     */

    if (
      key === 'decisionProfileFile' &&
      file
    ) {

      const reader = new FileReader();

      reader.onload = () => {

        try {

          const decisionProfile =
            JSON.parse(reader.result);

          validateDecisionProfile(
            decisionProfile
          );

          /*
           * Store the complete, validated
           * Decision_Profile.
           */

          SWP.data.decisionProfile =
            decisionProfile;


          /*
           * Make the individual Energy Strategies
           * sections directly available to the
           * Proposal system.
           */

          SWP.data.energyStrategies = {
            section1:
              decisionProfile.sections.section1 || {},

            section2:
              decisionProfile.sections.section2 || {},

            section3:
              decisionProfile.sections.section3 || {},

            section4:
              decisionProfile.sections.section4 || {},

            section5:
              decisionProfile.sections.section5 || {},

            section6:
              decisionProfile.sections.section6 || {}
          };


          /*
           * Carry proposal requirement/status
           * information forward.
           */

          SWP.data.decisionProfileRequirements =
            decisionProfile.proposalRequirements || {};


          /*
           * Extract planned future electricity
           * loads for Proposal calculations.
           */

          SWP.data.futureEnergy =
            SWP.data.futureEnergy || {};

          SWP.data.futureEnergy.loads =
            extractLoads(decisionProfile);


          /*
           * Save the Proposal state.
           */

          SWP.save();


          /*
           * Notify other Proposal components that
           * the Decision_Profile is now available.
           */

          document.dispatchEvent(
            new CustomEvent(
              'swp:profile-loaded',
              {
                detail: {
                  profile:
                    decisionProfile
                }
              }
            )
          );

        } catch (error) {

          console.warn(
            'Decision_Profile import failed:',
            error
          );

          SWP.data.decisionProfile = null;
          SWP.data.energyStrategies = null;

          input.value = '';

          SWP.data.uploads[key] = null;

          if (fileName) {
            fileName.textContent =
              'Invalid Decision_Profile';
          }

          if (
            typeof window.toast ===
            'function'
          ) {
            window.toast(
              'This file could not be read as a Decision_Profile.'
            );
          }

        }

      };

      reader.readAsText(file);

    }


    /*
     * Any uploaded/replaced file requires
     * authorization again.
     */

    SWP.resetConsent();

  };

});
