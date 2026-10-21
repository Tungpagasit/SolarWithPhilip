(function () {
  function validateDecisionProfile(profile) {
    if (
      !profile ||
      typeof profile !== 'object' ||
      Array.isArray(profile)
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

    if (profile.schemaVersion !== '2.0') {
      throw new Error(
        'This Decision_Profile version is not supported.'
      );
    }

    if (
      !profile.sections ||
      typeof profile.sections !== 'object' ||
      Array.isArray(profile.sections)
    ) {
      throw new Error(
        'This Decision_Profile does not contain the required Energy Strategies sections.'
      );
    }

    const requiredSections = [
      'section1',
      'section2',
      'section3',
      'section4',
      'section5',
      'section6'
    ];

    const missingSections = requiredSections.filter(
      sectionName =>
        !profile.sections[sectionName] ||
        typeof profile.sections[sectionName] !== 'object'
    );

    if (missingSections.length) {
      throw new Error(
        `This Decision_Profile is missing: ${missingSections.join(', ')}.`
      );
    }

    return profile;
  }

  function extractFutureLoads(decisionProfile) {
    const source =
      decisionProfile.sections.section1.futureLoads || {};

    const out = {};

    Object.entries(source).forEach(
      ([key, load]) => {
        if (
          !load ||
          typeof load !== 'object' ||
          !load.selected
        ) {
          return;
        }

        const kwh = Number(load.kwh);

        if (
          Number.isFinite(kwh) &&
          kwh >= 0
        ) {
          out[key] = kwh;
        }
      }
    );

    return out;
  }

  function buildEnergyStrategiesData(
    decisionProfile
  ) {
    return {
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
  }

  function applyDecisionProfile(
    decisionProfile
  ) {
    const sections =
      decisionProfile.sections;

    const section1 =
      sections.section1 || {};

    const section2 =
      sections.section2 || {};

    const section5 =
      sections.section5 || {};

    const section6 =
      sections.section6 || {};

    /*
     * Preserve the complete imported file.
     */
    SWP.data.decisionProfile =
      decisionProfile;

    /*
     * Make all six Energy Strategies sections
     * directly available to Proposal components.
     */
    SWP.data.energyStrategies =
      buildEnergyStrategiesData(
        decisionProfile
      );

    /*
     * Carry Energy Strategies completion and
     * Proposal-status fields forward.
     */
    SWP.data.decisionProfileRequirements =
      decisionProfile.proposalRequirements || {};

    /*
     * Section 1 is the authoritative source
     * for the Energy Strategies energy baseline.
     */
    SWP.data.energyStrategiesBaseline = {
      currentMonthlyCost:
        Number(section1.bill) || 0,

      assumedRate:
        Number(section1.assumedRate) || 0,

      estimatedCurrentKwh:
        Number(section1.estimatedCurrentKwh) || 0,

      utilityGrowth:
        Number(section1.utilityGrowth) || 0,

      usageGrowth:
        Number(section1.usageGrowth) || 0,

      combinedGrowth:
        Number(section1.combinedGrowth) || 0,

      totalAddedKwh:
        Number(section1.totalAddedKwh) || 0,

      totalPlannedKwh:
        Number(section1.totalPlannedKwh) || 0,

      addedMonthlyCost:
        Number(section1.addedMonthlyCost) || 0,

      currentEquivalentCost:
        Number(section1.currentEquivalentCost) || 0,

      backup:
        section1.backup || '',

      duration:
        section1.duration || '',

      otherFutureChanges:
        section1.future || ''
    };

    /*
     * Section 1 is also the authoritative source
     * for planned future electricity loads.
     */
    SWP.data.futureEnergy =
      SWP.data.futureEnergy || {};

    SWP.data.futureEnergy.loads =
      extractFutureLoads(
        decisionProfile
      );

    SWP.data.futureEnergy.totalAddedKwh =
      Number(section1.totalAddedKwh) || 0;

    SWP.data.futureEnergy.totalPlannedKwh =
      Number(section1.totalPlannedKwh) || 0;

    SWP.data.futureEnergy.backup =
      section1.backup || '';

    SWP.data.futureEnergy.duration =
      section1.duration || '';

    SWP.data.futureEnergy.other =
      section1.future || '';

    /*
     * Section 2 is authoritative for the
     * homeowner's desired changes.
     */
    SWP.data.desiredChanges =
      Array.isArray(section2.desiredChanges)
        ? [...section2.desiredChanges]
        : [];

    /*
     * Section 5 is authoritative for priorities,
     * classifications, detail IDs, and concerns
     * requiring resolution.
     */
    SWP.data.decisionPriorities = {
      outcomes:
        section5.outcomes || {},

      concerns:
        section5.concerns || {},

      concernDetails:
        section5.concernDetails || {},

      otherConcern:
        section5.otherConcern || '',

      requiresResolution:
        Array.isArray(
          section5.requiresResolution
        )
          ? [...section5.requiresResolution]
          : [],

      libraryVersion:
        section5.libraryVersion || ''
    };

    /*
     * Section 6 is authoritative for resolutions,
     * homeowner notes, and current direction.
     */
    SWP.data.decisionResolutions = {
      resolutions:
        section6.resolutions || {},

      notes:
        section6.notes || {},

      direction:
        section6.direction || ''
    };

    SWP.save();

    document.dispatchEvent(
      new CustomEvent(
        'swp:profile-loaded',
        {
          detail: {
            profile:
              decisionProfile,

            sections:
              SWP.data.energyStrategies
          }
        }
      )
    );
  }

  function clearDecisionProfileImport() {
    SWP.data.decisionProfile = null;
    SWP.data.energyStrategies = null;
    SWP.data.energyStrategiesBaseline = null;
    SWP.data.decisionProfileRequirements = null;
    SWP.data.desiredChanges = [];
    SWP.data.decisionPriorities = null;
    SWP.data.decisionResolutions = null;

    SWP.data.futureEnergy =
      SWP.data.futureEnergy || {};

    SWP.data.futureEnergy.loads = {};
    SWP.data.futureEnergy.totalAddedKwh = 0;
    SWP.data.futureEnergy.totalPlannedKwh = 0;
    SWP.data.futureEnergy.backup = '';
    SWP.data.futureEnergy.duration = '';
    SWP.data.futureEnergy.other = '';
  }

  function showUploadMessage(
    element,
    message,
    isError
  ) {
    if (!element) return;

    element.textContent = message;

    element.classList.toggle(
      'upload-error',
      Boolean(isError)
    );
  }

  root
    .querySelectorAll('[data-u]')
    .forEach(input => {
      input.addEventListener(
        'change',
        () => {
          const file =
            input.files &&
            input.files.length
              ? input.files[0]
              : null;

          const key =
            input.dataset.u;

          const fileNameElement =
            root.querySelector(
              `[data-n="${key}"]`
            );

          SWP.data.uploads =
            SWP.data.uploads || {};

          SWP.data.uploads[key] =
            file
              ? {
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  file
                }
              : null;

          showUploadMessage(
            fileNameElement,
            file
              ? file.name
              : 'No file selected',
            false
          );

          /*
           * If the Decision_Profile is removed,
           * clear the previously imported profile.
           */
          if (
            key === 'decisionProfileFile' &&
            !file
          ) {
            clearDecisionProfileImport();
            SWP.save();
            SWP.resetConsent();
            return;
          }

          /*
           * Read and validate Decision_Profile.json.
           */
          if (
            key === 'decisionProfileFile' &&
            file
          ) {
            const fileName =
              String(file.name || '')
                .toLowerCase();

            if (
              !fileName.endsWith('.json')
            ) {
              clearDecisionProfileImport();

              input.value = '';

              SWP.data.uploads[key] = null;

              showUploadMessage(
                fileNameElement,
                'Please select Decision_Profile.json',
                true
              );

              SWP.save();
              SWP.resetConsent();
              return;
            }

            const reader =
              new FileReader();

            reader.onload = () => {
              try {
                const parsed =
                  JSON.parse(
                    String(reader.result || '')
                  );

                const decisionProfile =
                  validateDecisionProfile(
                    parsed
                  );

                applyDecisionProfile(
                  decisionProfile
                );

                showUploadMessage(
                  fileNameElement,
                  `${file.name} — Decision_Profile loaded`,
                  false
                );
              } catch (error) {
                console.warn(
                  'Decision_Profile import failed:',
                  error
                );

                clearDecisionProfileImport();

                input.value = '';

                SWP.data.uploads[key] = null;

                showUploadMessage(
                  fileNameElement,
                  error.message ||
                    'Invalid Decision_Profile',
                  true
                );

                SWP.save();
              }

              SWP.resetConsent();
            };

            reader.onerror = () => {
              console.warn(
                'Decision_Profile file could not be read.'
              );

              clearDecisionProfileImport();

              input.value = '';

              SWP.data.uploads[key] = null;

              showUploadMessage(
                fileNameElement,
                'Decision_Profile could not be read',
                true
              );

              SWP.save();
              SWP.resetConsent();
            };

            reader.readAsText(file);

            return;
          }

          /*
           * Save non-profile uploads such as
           * the utility bill.
           */
          SWP.save();
          SWP.resetConsent();
        }
      );
    });
})();
