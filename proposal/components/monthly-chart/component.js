window.SWP.register('monthly-chart',{mount(root){
  const draw=()=>{
    const vals=(window.SWP.state.currentEnergy.monthlyKwh||[]).map(v=>v===null||v===''?null:Number(v));
    const entered=vals.filter(v=>Number.isFinite(v));
    const chart=root.querySelector('[data-chart]');
    if(!entered.length){chart.innerHTML='<div class="chart-empty">Enter monthly kWh in Section 1 to build this chart.</div>';return;}
    const max=Math.max(...entered,1);const labels=['J','F','M','A','M','J','J','A','S','O','N','D'];
    chart.innerHTML=vals.map((v,i)=>Number.isFinite(v)?`<div class="chart-bar" style="height:${Math.max(4,v/max*190)}px" title="${v} kWh"><small>${labels[i]}</small></div>`:`<div class="chart-bar" style="height:4px;opacity:.18"><small>${labels[i]}</small></div>`).join('');
  };draw();document.addEventListener('swp:data',draw);
}});
