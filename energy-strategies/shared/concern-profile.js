(function(){
const KEY='swp_energy_strategies_profile_v1';
const blank={version:'1.0',updatedAt:null,section1:{},section2:{},section3:{},section4:{},section5:{outcomes:{},barriers:{}},section6:{resolutions:{},direction:''}};
function clone(x){return JSON.parse(JSON.stringify(x))} function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=a[k]||{};merge(a[k],b[k])}else a[k]=b[k]}return a}
let profile=clone(blank); try{const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved) profile=merge(profile,saved)}catch(e){}
function save(){profile.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(profile));document.dispatchEvent(new CustomEvent('swp:profile',{detail:clone(profile)}))}
function set(section,data){profile[section]=merge(profile[section]||{},data||{});save()}
function get(){return clone(profile)}
function download(){save();const blob=new Blob([JSON.stringify(profile,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Concern_Profile.swp';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},200)}
window.SWPProfile={get,set,save,download,reset(){profile=clone(blank);save()}};
})();
