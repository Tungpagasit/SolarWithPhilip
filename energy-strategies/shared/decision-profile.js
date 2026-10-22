(function(){
  const KEY='swp_energy_strategies_profile_v2';
  const OLD='swp_energy_strategies_profile_v1';
  const blank={schemaVersion:'2.1',profileType:'SolarWithPhilipDecisionProfile',createdAt:new Date().toISOString(),updatedAt:null,section1:{},section2:{},section3:{},section4:{},section5:{outcomes:{},concerns:{},concernDetails:{},otherConcern:''},section6:{resolutions:{},notes:{},direction:''},proposalRequirements:{monthlyUsageComplete:false,utilityBillUploaded:false,propertyReviewComplete:false,designComplete:false,pricingComplete:false,philipRecommendationComplete:false}};
  const clone=v=>JSON.parse(JSON.stringify(v));
  function merge(t,s){Object.keys(s||{}).forEach(k=>{if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])){t[k]=t[k]||{};merge(t[k],s[k]);}else{t[k]=s[k];}});return t;}
  let profile=clone(blank);
  try{const saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD)||'null');if(saved)profile=merge(profile,saved);}catch(error){console.error('Solar With Philip profile could not be restored.',error);}
  profile.profileType='SolarWithPhilipDecisionProfile';profile.schemaVersion='2.1';profile.section6=profile.section6||{};profile.section6.resolutions=profile.section6.resolutions||{};profile.section6.notes=profile.section6.notes||{};profile.section6.direction=profile.section6.direction||'';if(profile.section6.direction==='Compare Both')profile.section6.direction='';
  function save(){profile.schemaVersion='2.1';profile.profileType='SolarWithPhilipDecisionProfile';profile.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(profile));document.dispatchEvent(new CustomEvent('swp:profile',{detail:clone(profile)}));}
  function set(section,data){profile[section]=merge(profile[section]||{},data||{});if(section==='section6'&&profile.section6.direction==='Compare Both')profile.section6.direction='';save();}
  function get(){return clone(profile);}
  function portable(){return{schemaVersion:'2.1',profileType:'SolarWithPhilipDecisionProfile',exportedAt:new Date().toISOString(),source:{application:'Solar With Philip',experience:'Energy Strategies'},sections:{section1:clone(profile.section1),section2:clone(profile.section2),section3:clone(profile.section3),section4:clone(profile.section4),section5:clone(profile.section5),section6:clone(profile.section6)},proposalRequirements:clone(profile.proposalRequirements)};}
  function download(){const blob=new Blob([JSON.stringify(portable(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Decision_Profile.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  window.SWPProfile={get,set,save,download,portable,key:KEY};save();
})();
