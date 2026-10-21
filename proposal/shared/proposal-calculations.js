(()=>{
  const defaults={'PG&E':.406,'SCE':.344,'SDG&E':.455,'Other':.30};
  const rawUsage=()=>Array.from({length:12},(_,i)=>{const v=SWP.data.currentEnergy?.monthlyKwh?.[i];return v===null||v===''||typeof v==='undefined'?null:Number(v)});
  function usageStatus(){const values=rawUsage(),valid=values.filter(v=>Number.isFinite(v)&&v>=0);return{values,validMonths:valid.length,complete:valid.length===12,annual:valid.length===12?valid.reduce((a,b)=>a+b,0):null}}
  function annualKwh(){return usageStatus().annual}
  function utilityRate(){let r=Number(SWP.data.planning.utilityRate);if(!(r>0)){r=defaults[SWP.data.homeowner.utility]||.406;SWP.data.planning.utilityRate=r}return r}
  function annualCost(){const k=annualKwh();return k===null?null:k*utilityRate()}
  function futureKwh(){return Object.values(SWP.data.futureEnergy?.loads||{}).reduce((s,v)=>s+(Number(v)||0),0)}
  function planningKwh(){const k=annualKwh();return k===null?null:k+futureKwh()}
  function monthlyUsage(){return usageStatus().values.map(v=>Number.isFinite(v)?v:0)}
  function productionTarget(offset=1.25){const k=planningKwh();return k===null?null:k*offset}
  function selectSolarConfig(offset=1.25){const configs=SWP.data.property?.solar?.solarPotential?.solarPanelConfigs||[],target=productionTarget(offset);if(!configs.length||target===null)return null;return configs.reduce((best,c)=>Math.abs(Number(c.yearlyEnergyDcKwh||0)-target)<Math.abs(Number(best.yearlyEnergyDcKwh||0)-target)?c:best,configs[0])}
  function projection(years=30){const k=planningKwh();if(k===null)return null;const mk=k/12,ur=utilityRate(),ug=(Number(SWP.data.planning.utilityGrowth)||4)/100,sr=Number(SWP.data.planning.solarStartRate)||.24,sg=.04,rows=Array.from({length:years+1},(_,y)=>({year:y,utilityRate:ur*Math.pow(1+ug,y),solarRate:sr*Math.pow(1+sg,y),utilityMonthly:mk*ur*Math.pow(1+ug,y),solarMonthly:mk*sr*Math.pow(1+sg,y)}));const total=(key,n)=>rows.slice(0,n).reduce((s,r)=>s+r[key]*12,0);return{rows,monthlyKwh:mk,total}}
  function seasonal(offset){const status=usageStatus();if(!status.complete)return null;const use=status.values,annual=status.annual,weights=[.74,.76,.98,1.11,1.10,1.19,1.26,1.28,1.10,.95,.81,.68],sum=weights.reduce((a,b)=>a+b,0),prod=weights.map(x=>annual*offset*x/sum),imports=use.map((u,i)=>Math.max(u-prod[i],0)),exports=use.map((u,i)=>Math.max(prod[i]-u,0)),ik=imports.reduce((a,b)=>a+b,0),ek=exports.reduce((a,b)=>a+b,0),importCost=ik*utilityRate(),exportCredit=ek*(Number(SWP.data.planning.exportRate)||.07);return{use,prod,imports,exports,annualProduction:prod.reduce((a,b)=>a+b,0),importKwh:ik,exportKwh:ek,importCost,exportCredit,cost:Math.max(0,importCost-exportCredit)}}
  SWP.calc={usageStatus,annualKwh,utilityRate,annualCost,futureKwh,planningKwh,monthlyUsage,productionTarget,selectSolarConfig,projection,seasonal,utilityDefaults:defaults};
})();
