window.SWP.calc={
  numericArray(values){return (values||[]).map(v=>v===null||v===''||typeof v==='undefined'?null:Number(v));},
  annualKwh(state){const a=this.numericArray(state.currentEnergy.monthlyKwh).filter(v=>Number.isFinite(v)&&v>=0);return a.length===12?a.reduce((x,y)=>x+y,0):null;},
  annualCost(state){
    const costs=this.numericArray(state.currentEnergy.monthlyCost).filter(v=>Number.isFinite(v)&&v>=0);
    if(costs.length===12)return {value:costs.reduce((x,y)=>x+y,0),source:'12-month-cost'};
    const avg=state.homeowner.averageMonthlyBill;
    if(avg!==null&&avg!==''&&Number.isFinite(Number(avg))&&Number(avg)>0)return {value:Number(avg)*12,source:'average-monthly-bill'};
    return {value:null,source:'missing'};
  },
  rateForPlanning(state){
    const kwh=this.annualKwh(state),cost=this.annualCost(state);
    if(kwh&&cost.value)return {rate:cost.value/kwh,source:'homeowner-effective'};
    const utility=String(state.homeowner.utility||'').toUpperCase();
    const fallback={'PG&E':0.337,'SCE':0.344,'SDG&E':0.455};
    return fallback[utility]?{rate:fallback[utility],source:'utility-average'}:{rate:null,source:'missing'};
  },
  futureLoads(state){return Object.values(state.futureEnergy.loads||{}).reduce((sum,v)=>sum+(Number(v)||0),0);},
  refresh(save=true){
    const s=window.SWP.state,kwh=this.annualKwh(s),cost=this.annualCost(s),rate=this.rateForPlanning(s),future=this.futureLoads(s);
    s.currentEnergy.annualKwh=kwh===null?null:Math.round(kwh);
    s.currentEnergy.annualCost=cost.value===null?null:Math.round(cost.value);
    s.currentEnergy.costSource=cost.source;
    s.currentEnergy.effectiveRate=rate.rate;
    s.currentEnergy.rateSource=rate.source;
    s.futureEnergy.annualAddedKwh=Math.round(future);
    const base=(s.currentEnergy.annualKwh||0)+future;s.futureEnergy.planningKwh=Math.round(base);
    s.planning.scenario100=base?Math.round(base):null;s.planning.scenario125=base?Math.round(base*1.25):null;s.planning.scenario150=base?Math.round(base*1.5):null;
    if(save&&window.SWP.save)window.SWP.save();return s;
  }
};
