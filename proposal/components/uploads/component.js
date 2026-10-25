const decisionInput = root.querySelector('[data-decision]');
const fileName = root.querySelector('[data-name]');
const loaded = root.querySelector('[data-loaded]');
function restoreHomeowner(homeowner){if(homeowner&&typeof homeowner==='object')SWP.data.homeowner={...SWP.data.homeowner,...homeowner};}
function restoreMonthlyEnergy(profile){const monthly=profile.currentEnergy?.monthlyKwh;if(Array.isArray(monthly)&&monthly.length===12)SWP.data.currentEnergy.monthlyKwh=monthly.map(v=>v==null?null:Number(v));}
function restoreFullProfile(profile){
  SWP.data.decisionProfile=profile.decisionProfile||null;restoreHomeowner(profile.homeowner);restoreMonthlyEnergy(profile);
  if(profile.futureEnergy)SWP.data.futureEnergy={...SWP.data.futureEnergy,...profile.futureEnergy};
  if(profile.property)SWP.data.property=profile.property;
  if(profile.planning)SWP.data.planning={...SWP.data.planning,...profile.planning};
  if(profile.scenarios)SWP.data.scenarios={...SWP.data.scenarios,...profile.scenarios};
  if(profile.selectedProductionStrategy)SWP.data.scenarios.selected=Number(profile.selectedProductionStrategy);
  if(profile.authorization)SWP.data.authorization=profile.authorization;
  SWP.data.savedProposalId=profile.savedProposalId||null;SWP.data.lastFullDecisionProfile=profile;SWP.data.analysisBuilt=true;SWP.data.philipMode=true;
}
decisionInput.addEventListener('change',async()=>{const file=decisionInput.files[0];SWP.data.files.decision=file||null;fileName.textContent=file?file.name:'No file selected';if(!file)return;try{const profile=JSON.parse(await file.text()),schemaVersion=Number(profile.schemaVersion),isEnergyStrategy=profile.profileType==='SolarWithPhilipDecisionProfile',isFullProfile=profile.profileType==='SolarWithPhilipFullDecisionProfile';if(!isEnergyStrategy&&!isFullProfile)throw new Error('This file is not a supported Solar With Philip Decision Profile.');if(!Number.isFinite(schemaVersion)||schemaVersion<1||schemaVersion>=3)throw new Error('This Decision_Profile version is not supported.');if(isFullProfile){restoreFullProfile(profile);loaded.innerHTML='<b>Your Confirmed Full Decision Profile Is Here ✓</b><p>The saved homeowner, energy, property, planning, strategy, and confirmed-choice information was restored in place. Solution Simplified is now available without changing the URL or reloading the page.</p>';loaded.hidden=false;SWP.save();SWP.showAnalysis?.();document.dispatchEvent(new CustomEvent('swp:full-profile-loaded',{detail:profile}));}else{SWP.data.decisionProfile=profile;loaded.innerHTML='<b>Your Energy Strategy Is Here ✓</b><p>Your saved priorities, concerns, answers, and direction are now part of this analysis.</p>';loaded.hidden=false;SWP.save();}}catch(error){SWP.data.decisionProfile=null;SWP.data.lastFullDecisionProfile=null;SWP.data.philipMode=false;loaded.hidden=true;fileName.textContent=error.message;}});
