const decisionInput = root.querySelector('[data-decision]');
const fileName = root.querySelector('[data-name]');
const loaded = root.querySelector('[data-loaded]');

function restoreHomeowner(homeowner) {
  if (!homeowner || typeof homeowner !== 'object') return;
  SWP.data.homeowner = { ...SWP.data.homeowner, ...homeowner };
}

function restoreMonthlyEnergy(profile) {
  const monthly = profile.currentEnergy?.monthlyKwh;
  if (Array.isArray(monthly) && monthly.length === 12) {
    SWP.data.currentEnergy.monthlyKwh = monthly.map(value => value == null ? null : Number(value));
  }
}

function enterPhilipMode() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('philip')) {
    url.searchParams.set('philip', '');
    window.history.replaceState({}, '', `${url.pathname}?philip${url.hash}`);
  }
}

function restoreFullProfile(profile) {
  SWP.data.decisionProfile = profile.decisionProfile || null;
  restoreHomeowner(profile.homeowner);
  restoreMonthlyEnergy(profile);
  if (profile.futureEnergy) SWP.data.futureEnergy = { ...SWP.data.futureEnergy, ...profile.futureEnergy };
  if (profile.property) SWP.data.property = profile.property;
  if (profile.planning) SWP.data.planning = { ...SWP.data.planning, ...profile.planning };
  if (profile.scenarios) SWP.data.scenarios = { ...SWP.data.scenarios, ...profile.scenarios };
  if (profile.selectedProductionStrategy) SWP.data.scenarios.selected = Number(profile.selectedProductionStrategy);
  if (profile.authorization) SWP.data.authorization = profile.authorization;
  SWP.data.savedProposalId = profile.savedProposalId || null;
  SWP.data.lastFullDecisionProfile = profile;
  SWP.data.analysisBuilt = true;
}

decisionInput.addEventListener('change', async () => {
  const file = decisionInput.files[0];
  SWP.data.files.decision = file || null;
  fileName.textContent = file ? file.name : 'No file selected';
  if (!file) return;

  try {
    const profile = JSON.parse(await file.text());
    const schemaVersion = Number(profile.schemaVersion);
    const isEnergyStrategy = profile.profileType === 'SolarWithPhilipDecisionProfile';
    const isFullProfile = profile.profileType === 'SolarWithPhilipFullDecisionProfile';

    if (!isEnergyStrategy && !isFullProfile) {
      throw new Error('This file is not a supported Solar With Philip Decision Profile.');
    }
    if (!Number.isFinite(schemaVersion) || schemaVersion < 1 || schemaVersion >= 3) {
      throw new Error('This Decision_Profile version is not supported.');
    }

    if (isFullProfile) {
      restoreFullProfile(profile);
      enterPhilipMode();
      loaded.innerHTML = '<b>Your Confirmed Full Decision Profile Is Here ✓</b><p>The saved homeowner, energy, property, planning, strategy, and confirmed-choice information was restored. Solution Simplified is now available. Reconfirm only if you intentionally make changes and want a new version.</p>';
      loaded.hidden = false;
      SWP.save();
      SWP.showAnalysis?.();
      document.dispatchEvent(new CustomEvent('swp:full-profile-loaded', { detail: profile }));
    } else {
      SWP.data.decisionProfile = profile;
      loaded.innerHTML = '<b>Your Energy Strategy Is Here ✓</b><p>Your priorities, concerns, and direction are now part of this analysis.</p>';
      loaded.hidden = false;
      SWP.save();
    }
  } catch (error) {
    SWP.data.decisionProfile = null;
    SWP.data.lastFullDecisionProfile = null;
    loaded.hidden = true;
    fileName.textContent = error.message;
  }
});
