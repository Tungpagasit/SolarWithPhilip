window.SWP.register('energy-summary',{mount(root){
  const draw=()=>{
    const s=window.SWP.calc.refresh(false);
    const months=(s.currentEnergy.monthlyKwh||[]).filter(v=>v!==null&&v!==''&&Number.isFinite(Number(v))).length;
    root.querySelector('[data-v="kwh"]').textContent=s.currentEnergy.annualKwh!==null?new Intl.NumberFormat('en-US').format(s.currentEnergy.annualKwh)+' kWh':'Pending';
    root.querySelector('[data-v="cost"]').textContent=s.currentEnergy.annualCost!==null?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(s.currentEnergy.annualCost):'Pending';
    root.querySelector('[data-v="rate"]').textContent=s.currentEnergy.effectiveRate!==null?'$'+s.currentEnergy.effectiveRate.toFixed(2)+'/kWh':'Pending';
    root.querySelector('[data-kwh-note]').textContent=months===12?'Calculated from all 12 monthly kWh entries':`${months} of 12 kWh months entered`;
    root.querySelector('[data-cost-note]').textContent=s.currentEnergy.monthlyCost?.filter(v=>v!==null&&v!=='').length===12?'Calculated from 12 monthly costs':'Uses average monthly electricity cost when monthly costs are incomplete';
  };
  draw();document.addEventListener('swp:data',draw);
}});
