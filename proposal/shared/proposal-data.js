(()=>{
  const defaults={
    version:'2.0',
    path:localStorage.getItem('swp_proposal_path')||'unknown',
    homeowner:{name:'',email:'',phone:'',street:'',city:'',state:'CA',zip:'',utility:'',averageMonthlyBill:null},
    currentEnergy:{monthlyKwh:Array(12).fill(null),monthlyCost:Array(12).fill(null),annualKwh:null,annualCost:null,effectiveRate:null,source:'not-entered'},
    comparison:{futureNote:'',quoteFile:null,status:'draft'},
    futureEnergy:{loads:{ev:0,hvac:0,pool:0,waterHeating:0,appliances:0,addition:0,other:0},otherNote:'',annualAddedKwh:0,planningKwh:0},
    property:{lat:null,lng:null,placeId:null,formattedAddress:'',solar:null,status:'not-requested'},
    planning:{scenario100:null,scenario125:null,scenario150:null,utilityGrowthAssumption:4},
    concernProfile:{},
    uploads:{utilityBill:null,proposalQuote:null},
    authorization:{accepted:false,timestamp:null},
    submission:{status:'draft',id:null,submittedAt:null},
    ui:{activeSection:'section-01'}
  };
  const saved=localStorage.getItem('swp_proposal_data_v2');
  const merge=(base,add)=>{if(!add||typeof add!=='object')return base;Object.keys(add).forEach(k=>{if(add[k]&&typeof add[k]==='object'&&!Array.isArray(add[k])&&base[k])merge(base[k],add[k]);else base[k]=add[k]});return base};
  window.SWP.state=merge(defaults,saved?JSON.parse(saved):{});
  window.SWP.save=()=>{localStorage.setItem('swp_proposal_data_v2',JSON.stringify(window.SWP.state));document.dispatchEvent(new CustomEvent('swp:data',{detail:window.SWP.state}))};
  window.SWP.get=path=>path.split('.').reduce((o,k)=>o?.[k],window.SWP.state);
  window.SWP.patch=(path,value)=>{const keys=path.split('.');let obj=window.SWP.state;keys.slice(0,-1).forEach(k=>obj=obj[k]??={});obj[keys.at(-1)]=value;window.SWP.save()};
  window.SWP.setPath=path=>{window.SWP.state.path=path;localStorage.setItem('swp_proposal_path',path);window.SWP.save();document.dispatchEvent(new CustomEvent('swp:path',{detail:path}))};
})();
