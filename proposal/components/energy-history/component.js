window.SWP.register('energy-history',{mount(root){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const grid=root.querySelector('[data-month-grid]');
  const buttons=root.querySelectorAll('[data-mode]');
  let mode='kwh';
  const values=()=>mode==='kwh'?window.SWP.state.currentEnergy.monthlyKwh:window.SWP.state.currentEnergy.monthlyCost;
  function render(){
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const a=values();
    grid.innerHTML=months.map((month,i)=>`<label class="month-field"><span>${month} ${mode==='kwh'?'kWh':'$'}</span><input type="number" min="0" step="1" inputmode="decimal" data-month="${i}" value="${a[i]??''}"></label>`).join('');
    grid.querySelectorAll('[data-month]').forEach(input=>input.addEventListener('input',e=>{a[Number(e.currentTarget.dataset.month)]=e.currentTarget.value===''?null:Number(e.currentTarget.value);window.SWP.calc.refresh()}));
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;render()}));
  render();
}});
