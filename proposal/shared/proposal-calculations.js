(()=>{
  const defaults={'PG&E':.406,'SCE':.344,'SDG&E':.455,'Other':.30};
  const nums=a=>(a||[]).map(v=>v===null||v===''?null:Number(v));
  function annualKwh(){const a=nums(SWP.data.currentEnergy.monthlyKwh).filter(Number.isFinite);return a.length===12?a.reduce((x,y)=>x+y,0):null}
  function usageComplete(){return annualKwh()!==null}
  function utilityRate(){let r=Number(SWP.data.planning.utilityRate);if(!(r>0)){r=defaults[SWP.data.homeowner.utility]||.406;SWP.data.planning.utilityRate=r}return r}
  function annualCost(){const k=annualKwh();return k===null?null:k*utilityRate()}
  function futureKwh(){return Object.values(SWP.data.futureEnergy.loads||{}).reduce((s,v)=>s+(Number(v)||0),0)}
  function planningKwh(){const k=annualKwh();return k===null?null:k+futureKwh()}
  function monthlyUsage(){return nums(SWP.data.currentEnergy.monthlyKwh).map(v=>Number.isFinite(v)?v:0)}
  function productionTarget(offset=1.25){const k=planningKwh();return k===null?null:k*offset}
  function selectSolarConfig(offset=1.25){const configs=SWP.data.property?.solar?.solarPotential?.solarPanelConfigs||[],target=productionTarget(offset);if(!configs.length||target===null)return null;return configs.reduce((best,c)=>Math.abs((c.yearlyEnergyDcKwh||0)-target)<Math.abs((best.yearlyEnergyDcKwh||0)-target)?c:best,configs[0])}
  function projection(years=30){const k=planningKwh();if(k===null)return null;const mk=k/12,ur=utilityRate(),ug=(Number(SWP.data.planning.utilityGrowth)||4)/100,sr=Number(SWP.data.planning.solarStartRate)||.24,sg=.04,rows=Array.from({length:years+1},(_,y)=>({year:y,utilityRate:ur*Math.pow(1+ug,y),solarRate:sr*Math.pow(1+sg,y),utilityMonthly:mk*ur*Math.pow(1+ug,y),solarMonthly:mk*sr*Math.pow(1+sg,y)}));const total=(key,n)=>rows.slice(0,n).reduce((s,r)=>s+r[key]*12,0);return{rows,monthlyKwh:mk,total}}
  function seasonal(offset){const use=monthlyUsage(),annual=use.reduce((a,b)=>a+b,0),weights=[.74,.76,.98,1.11,1.10,1.19,1.26,1.28,1.10,.95,.81,.68],sum=weights.reduce((a,b)=>a+b,0),prod=weights.map(x=>annual*offset*x/sum),imports=use.map((u,i)=>Math.max(u-prod[i],0)),exports=use.map((u,i)=>Math.max(prod[i]-u,0)),ik=imports.reduce((a,b)=>a+b,0),ek=exports.reduce((a,b)=>a+b,0);return{use,prod,imports,exports,annualProduction:prod.reduce((a,b)=>a+b,0),importKwh:ik,exportKwh:ek,importCost:ik*utilityRate(),exportCredit:ek*(Number(SWP.data.planning.exportRate)||.07),cost:Math.max(0,ik*utilityRate()-ek*(Number(SWP.data.planning.exportRate)||.07))}}
  SWP.calc={annualKwh,usageComplete,utilityRate,annualCost,futureKwh,planningKwh,monthlyUsage,productionTarget,selectSolarConfig,projection,seasonal,utilityDefaults:defaults};
})();
