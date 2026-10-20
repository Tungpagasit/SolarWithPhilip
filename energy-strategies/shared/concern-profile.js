(function(){
const KEY='swp_energy_strategies_profile_v2';
const OLD='swp_energy_strategies_profile_v1';
const blank={schemaVersion:'2.0',profileType:'SolarWithPhilipConcernProfile',createdAt:new Date().toISOString(),updatedAt:null,section1:{},section2:{},section3:{},section4:{},section5:{outcomes:{},concerns:{},concernDetails:{},otherConcern:''},section6:{resolutions:{},direction:''},proposalRequirements:{monthlyUsageComplete:false,utilityBillUploaded:false,propertyReviewComplete:false,designComplete:false,pricingComplete:false,philipRecommendationComplete:false}};
const clone=x=>JSON.parse(JSON.stringify(x));
function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=a[k]||{};merge(a[k],b[k])}else a[k]=b[k]}return a}
let profile=clone(blank);try{const saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD)||'null');if(saved)profile=merge(profile,saved)}catch(e){}
function save(){profile.schemaVersion='2.0';profile.profileType='SolarWithPhilipConcernProfile';profile.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(profile));document.dispatchEvent(new CustomEvent('swp:profile',{detail:clone(profile)}))}
function set(section,data){profile[section]=merge(profile[section]||{},data||{});save()}
function get(){return clone(profile)}
function download(){save();const portable={schemaVersion:profile.schemaVersion,profileType:profile.profileType,createdAt:profile.createdAt,updatedAt:profile.updatedAt,sections:{section1:profile.section1,section2:profile.section2,section3:profile.section3,section4:profile.section4,section5:profile.section5,section6:profile.section6},proposalRequirements:profile.proposalRequirements};const blob=new Blob([JSON.stringify(portable)],{type:'application/vnd.solarwithphilip.profile+json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Concern_Profile.swp';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},200)}
window.SWPProfile={get,set,save,download,reset(){profile=clone(blank);save()}};
})();
