window.SWP.calc={
  valid(values){return (values||[]).map(Number).filter(v=>Number.isFinite(v)&&v>=0)},
  annualKwh(s){const v=this.valid(s.currentEnergy.monthlyKwh);return v.length===12?v.reduce((a,b)=>a+b,0):null},
  annualCost(s){const v=this.valid(s.currentEnergy.monthlyCost);if(v.length===12)return v.reduce((a,b)=>a+b,0);const bill=Number(s.homeowner.averageMonthlyBill);return Number.isFinite(bill)&&bill>=0?bill*12:null},
  futureLoads(s){return Object.values(s.futureEnergy.loads||{}).reduce((sum,v)=>sum+(Number(v)||0),0)},
  refresh(save=true){
    const s=window.SWP.state;
    const kwh=this.annualKwh(s),cost=this.annualCost(s),future=this.futureLoads(s);
    s.currentEnergy.annualKwh=kwh?Math.round(kwh):null;
    s.currentEnergy.annualCost=cost?Math.round(cost):null;
    s.currentEnergy.effectiveRate=kwh&&cost?cost/kwh:null;
    s.currentEnergy.source=kwh?'12-month-kwh':cost?'monthly-cost-estimate':'not-entered';
    s.futureEnergy.annualAddedKwh=Math.round(future);
    const base=(s.currentEnergy.annualKwh||0)+future;
    s.futureEnergy.planningKwh=Math.round(base);
    s.planning.scenario100=base?Math.round(base):null;
    s.planning.scenario125=base?Math.round(base*1.25):null;
    s.planning.scenario150=base?Math.round(base*1.5):null;
    if(save)window.SWP.save();
    return s;
  }
};
