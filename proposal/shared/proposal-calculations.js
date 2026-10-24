window.SWP = window.SWP || {};

(() => {
  const C = SWP.calc = {};
  C.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  C.defaults = {'PG&E':0.30,'SCE':0.30,'SDG&E':0.30,'Other':0.30};

  C.panel = {
    model: 'Qcells Q.TRON BLK M-G2+/AC 430',
    dcWatts: 430,
    lengthMeters: 1.722,
    widthMeters: 1.134,
    areaMeters2: 1.722 * 1.134,
    technology: 'Q.ANTUM NEO / TOPCon N-type',
    sourceNote: 'Standard planning module: Qcells Q.TRON BLK M-G2+/AC 430. Final panel count and placement require approved design.'
  };

  C.catalog = {
    'tesla-pw3': {label:'Tesla Powerwall 3',nominalKwh:13.5,usableKwh:13.5,chargeKw:5,dischargeKw:11.5,efficiency:0.89,rateAdder:0.01,note:'13.5 kWh battery energy. Reserve is applied separately. The model uses 5 kW maximum continuous charge power, output configuration up to 11.5 kW AC, and 89% solar-to-battery-to-home/grid efficiency.',sourceNote:'Source: Tesla Powerwall 3 U.S. datasheet. Final configuration is controlled by approved design and current product documentation.'},
    'qhome-core': {label:'Qcells Q.HOME CORE H3S / H7S',nominalKwh:10,usableKwh:9,chargeKw:5,dischargeKw:5,efficiency:0.90,rateAdder:0.01,note:'Aurora planning uses a 10.0 kWh nominal bank and 9.0 kWh usable energy. Not Q.HOME CORE G3.',sourceNote:'Planning value supplied for the Q.HOME CORE H3S / H7S configuration used in Aurora.'}
  };

  C.futureLoads = () => {
    const p=SWP.data.decisionProfile||{}, s1=p.sections?.section1||p.section1||{}, src=s1.futureLoads||s1.loads||p.futureEnergy?.loads||{}, out={};
    for(const [k,v] of Object.entries(src)){
      const n=typeof v==='object'?Number(v.monthlyKwh??v.kwh??v.value??0):Number(v);
      if(Number.isFinite(n)&&n>0) out[k]=n;
    }
    return out;
  };
  C.futureMonthly=()=>Object.values(C.futureLoads()).reduce((a,b)=>a+b,0);
  C.currentAnnual=()=>SWP.data.currentEnergy.monthlyKwh.reduce((a,b)=>a+(Number(b)||0),0);
  C.currentMonthlyAverage=()=>C.currentAnnual()/12;
  C.plannedMonthly=()=>SWP.data.currentEnergy.monthlyKwh.map(v=>(Number(v)||0)+C.futureMonthly());
  C.plannedAnnual=()=>C.plannedMonthly().reduce((a,b)=>a+b,0);
  C.utilityRate=()=>Number(SWP.data.planning.utilityRate)||0.30;

  C.battery=()=>{
    const m=C.catalog[SWP.data.planning.batteryModel]||C.catalog['tesla-pw3'], count=Number(SWP.data.planning.batteryCount)||0, reserve=Number(SWP.data.planning.reserve)||0;
    return {...m,count,reserve,installedNominal:m.nominalKwh*count,installedUsable:m.usableKwh*count,dispatchable:m.usableKwh*count*(1-reserve),totalChargeKw:m.chargeKw*count,totalDischargeKw:m.dischargeKw*count};
  };

  const regionalShares=[0.052,0.064,0.088,0.101,0.112,0.117,0.119,0.112,0.093,0.067,0.040,0.035];
  const daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31];
  const representativeDayOfYear=[15,46,74,105,135,166,196,227,258,288,319,349];
  const rawLoad=[0.026,0.023,0.021,0.020,0.021,0.027,0.041,0.052,0.047,0.039,0.035,0.034,0.035,0.036,0.037,0.039,0.046,0.061,0.073,0.078,0.071,0.057,0.044,0.037];
  const loadSum=rawLoad.reduce((a,b)=>a+b,0);
  const hourlyLoad=rawLoad.map(v=>v/loadSum);

  C.targetAnnual=offset=>C.plannedAnnual()*offset;
  C.googleConfigurations=()=>SWP.data.property?.solar?.solarPotential?.solarPanelConfigs||[];
  C.googleConfig=offset=>{
    const configs=C.googleConfigurations(), target=C.targetAnnual(offset);
    if(!configs.length) return null;
    return configs.reduce((best,x)=>Math.abs(Number(x.yearlyEnergyDcKwh||0)-target)<Math.abs(Number(best.yearlyEnergyDcKwh||0)-target)?x:best,configs[0]);
  };
  C.googlePanelAssumptions=()=>{const s=SWP.data.property?.solar?.solarPotential||{};return{watts:Number(s.panelCapacityWatts)||0,heightMeters:Number(s.panelHeightMeters)||0,widthMeters:Number(s.panelWidthMeters)||0};};

  C.qtronPanelPlan=offset=>{
    const target=C.targetAnnual(offset), configs=C.googleConfigurations(), closest=C.googleConfig(offset), maximum=configs.length?configs.reduce((best,x)=>Number(x.yearlyEnergyDcKwh||0)>Number(best.yearlyEnergyDcKwh||0)?x:best,configs[0]):null;
    const ga=C.googlePanelAssumptions(), reference=closest||maximum, refPanels=Number(reference?.panelsCount)||0, refAnnual=Number(reference?.yearlyEnergyDcKwh)||0, googleWatts=ga.watts||C.panel.dcWatts;
    const googleAnnualPerPanel=refPanels?refAnnual/refPanels:0;
    const qtronAnnualPerPanel=googleAnnualPerPanel?googleAnnualPerPanel*(C.panel.dcWatts/googleWatts):0;
    const panelsNeeded=qtronAnnualPerPanel>0?Math.ceil(target/qtronAnnualPerPanel):(refPanels||null);
    // Roof support stays internal only. Homeowner-facing output does not claim a maximum fit before Aurora/final design.
    const googlePanelArea=ga.heightMeters&&ga.widthMeters?ga.heightMeters*ga.widthMeters:C.panel.areaMeters2;
    const maxGooglePanels=Number(maximum?.panelsCount)||refPanels||0;
    const internalRoofEstimate=maxGooglePanels?Math.floor(maxGooglePanels*googlePanelArea/C.panel.areaMeters2):null;
    const modeledPanels=panelsNeeded&&internalRoofEstimate?Math.min(panelsNeeded,internalRoofEstimate):(panelsNeeded||internalRoofEstimate);
    const modeledAnnual=modeledPanels&&qtronAnnualPerPanel?modeledPanels*qtronAnnualPerPanel:(refAnnual||target);
    return{targetAnnualKwh:target,closestGoogleConfig:closest,maximumGoogleConfig:maximum,qtronAnnualPerPanel,panelsNeeded,internalRoofEstimate,modeledPanels,modeledAnnualKwh:modeledAnnual,roofConstrained:Boolean(panelsNeeded&&internalRoofEstimate&&panelsNeeded>internalRoofEstimate),googleAssumptions:ga};
  };

  C.monthlyProduction=offset=>{
    const plan=C.qtronPanelPlan(offset), custom=SWP.data.property?.monthlyProductionShares, shares=Array.isArray(custom)&&custom.length===12?custom:regionalShares;
    return shares.map(share=>plan.modeledAnnualKwh*share);
  };

  function daylightWindow(latitudeDegrees,dayOfYear){
    const lat=latitudeDegrees*Math.PI/180, dec=23.44*Math.PI/180*Math.sin((2*Math.PI/365)*(dayOfYear-81)), cosH=Math.max(-1,Math.min(1,-Math.tan(lat)*Math.tan(dec))), h=Math.acos(cosH), length=24*h/Math.PI;
    return{sunrise:12-length/2,sunset:12+length/2,dayLength:length};
  }
  function hourlySolarShape(monthIndex){
    const lat=Number(SWP.data.property?.lat)||38.8, win=daylightWindow(lat,representativeDayOfYear[monthIndex]);
    const raw=Array.from({length:24},(_,hour)=>{const mid=hour+.5;if(mid<=win.sunrise||mid>=win.sunset)return 0;const progress=(mid-win.sunrise)/win.dayLength;return Math.pow(Math.sin(Math.PI*progress),1.35);});
    const sum=raw.reduce((a,b)=>a+b,0)||1;return raw.map(v=>v/sum);
  }

  function simulateOneDay(dailyUse,dailySolar,solarShape,battery,startSoc){
    let soc=Math.max(0,Math.min(battery.dispatchable,startSoc||0)), direct=0, delivered=0, charged=0, imported=0, exported=0;
    for(let hour=0;hour<24;hour++){
      const load=dailyUse*hourlyLoad[hour], solar=dailySolar*solarShape[hour], useDirect=Math.min(load,solar);
      let remaining=load-useDirect, surplus=solar-useDirect;direct+=useDirect;
      if(surplus>0&&battery.count>0){const capacityInput=Math.max(0,(battery.dispatchable-soc)/battery.efficiency),charge=Math.min(surplus,battery.totalChargeKw,capacityInput);soc+=charge*battery.efficiency;surplus-=charge;charged+=charge;}
      if(remaining>0&&battery.count>0&&soc>0){const discharge=Math.min(remaining,battery.totalDischargeKw,soc);soc-=discharge;remaining-=discharge;delivered+=discharge;}
      imported+=Math.max(0,remaining);exported+=Math.max(0,surplus);
    }
    return{endSoc:soc,direct,delivered,charged,imported,exported};
  }

  C.scenario=offset=>{
    const monthlyUse=C.plannedMonthly(), monthlyProduction=C.monthlyProduction(offset), battery=C.battery(), panelPlan=C.qtronPanelPlan(offset), directSolar=[],batteryDelivered=[],batteryCharged=[],imports=[],exports=[],monthlyDetails=[];
    let carrySoc=0;
    for(let m=0;m<12;m++){
      const days=daysInMonth[m], dailyUse=monthlyUse[m]/days, dailySolar=monthlyProduction[m]/days, shape=hourlySolarShape(m);
      // Warm-up for three representative days so the battery can carry solar through midnight and settle into a stable daily cycle.
      let soc=carrySoc;
      for(let warm=0;warm<3;warm++) soc=simulateOneDay(dailyUse,dailySolar,shape,battery,soc).endSoc;
      const rep=simulateOneDay(dailyUse,dailySolar,shape,battery,soc);
      carrySoc=rep.endSoc;
      const md=rep.direct*days, mb=rep.delivered*days, mc=rep.charged*days, mi=rep.imported*days, me=rep.exported*days;
      directSolar.push(md);batteryDelivered.push(mb);batteryCharged.push(mc);imports.push(mi);exports.push(me);
      monthlyDetails.push({month:C.months[m],usageKwh:monthlyUse[m],productionKwh:monthlyProduction[m],directSolarKwh:md,batteryChargeInputKwh:mc,batteryDeliveredKwh:mb,importKwh:mi,exportKwh:me});
    }
    const importKwh=imports.reduce((a,b)=>a+b,0), exportKwh=exports.reduce((a,b)=>a+b,0), importCost=importKwh*C.utilityRate(), exportCredit=exportKwh*(Number(SWP.data.planning.exportRate)||.07);
    return{offset,use:monthlyUse,prod:monthlyProduction,directSolar,batteryCharged,batteryDelivered,imports,exports,monthlyDetails,annualProduction:monthlyProduction.reduce((a,b)=>a+b,0),importKwh,exportKwh,importCost,exportCredit,remainingUtility:Math.max(0,importCost-exportCredit),googleConfig:panelPlan.closestGoogleConfig,panelPlan};
  };

  C.costLab=(years=30)=>{
    const plannedUsage=C.plannedAnnual(), u0=C.utilityRate(), ug=(Number(SWP.data.planning.utilityGrowth)||0)/100, s0=Number(SWP.data.planning.solarRate)||.20, sg=(Number(SWP.data.planning.solarEscalator)||0)/100, offset=Number(SWP.data.scenarios.selected)||1.25, scenario=C.scenario(offset), battery=C.battery(), batteryAdder=battery.count?(Number(SWP.data.planning.batteryRateAdder)||.01):0, solar0=s0+batteryAdder, rows=[];
    let cumUtility=0,cumSolar=0;
    for(let year=0;year<=years;year++){
      const utilityRate=u0*Math.pow(1+ug,year), solarRate=solar0*Math.pow(1+sg,year);
      // Utility-only always prices 100% of planned household usage.
      const utilityAnnual=plannedUsage*utilityRate;
      // Solar cost responds to selected 100/125/160 production strategy, while Remaining Utility comes from that same scenario.
      const remainingUtility=Math.max(0,scenario.importKwh*utilityRate-scenario.exportCredit);
      const solarAnnual=scenario.annualProduction*solarRate+remainingUtility;
      cumUtility+=utilityAnnual;cumSolar+=solarAnnual;
      rows.push({year,utilityRate,solarRate,utilityAnnual,solarAnnual,cumUtility,cumSolar,remainingUtility});
    }
    return rows;
  };
})();
