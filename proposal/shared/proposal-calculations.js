window.SWP.calc={
  numericArray(values){return (values||[]).map(v=>v===null||v===''||typeof v==='undefined'?null:Number(v));},
  annualKwh(state){
    const values=this.numericArray(state.currentEnergy.monthlyKwh);
    const entered=values.filter(v=>Number.isFinite(v)&&v>=0);
    return entered.length===12?entered.reduce((a,b)=>a+b,0):null;
  },
  annualCost(state){
    const costs=this.numericArray(state.currentEnergy.monthlyCost);
    const entered=costs.filter(v=>Number.isFinite(v)&&v>=0);
    if(entered.length===12)return entered.reduce((a,b)=>a+b,0);
    const avg=Number(state.homeowner.averageMonthlyBill);
    return Number.isFinite(avg)&&avg>=0?avg*12:null;
  },
  futureLoads(state){return Object.values(state.futureEnergy.loads||{}).reduce((sum,v)=>sum+(Number(v)||0),0);},
  refresh(save=true){
    const s=window.SWP.state;
    const annualKwh=this.annualKwh(s);
    const annualCost=this.annualCost(s);
    const future=this.futureLoads(s);
    s.currentEnergy.annualKwh=annualKwh===null?null:Math.round(annualKwh);
    s.currentEnergy.annualCost=annualCost===null?null:Math.round(annualCost);
    s.currentEnergy.effectiveRate=annualKwh&&annualCost?annualCost/annualKwh:null;
    s.currentEnergy.source=annualKwh!==null?'12-month-kwh':annualCost!==null?'monthly-cost-estimate':'not-entered';
    s.futureEnergy.annualAddedKwh=Math.round(future);
    const base=(s.currentEnergy.annualKwh||0)+future;
    s.futureEnergy.planningKwh=Math.round(base);
    s.planning.scenario100=base?Math.round(base):null;
    s.planning.scenario125=base?Math.round(base*1.25):null;
    s.planning.scenario150=base?Math.round(base*1.5):null;
    if(save&&window.SWP.save)window.SWP.save();
    return s;
  }
};
