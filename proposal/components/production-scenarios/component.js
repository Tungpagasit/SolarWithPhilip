const helpers=window.SWP.componentHelpers??=( {
 bindFields(root){root.querySelectorAll('[data-field]').forEach(el=>{const path=el.dataset.field;const value=path.split('.').reduce((o,k)=>o?.[k],window.SWP.state);if(value!=null)el.value=value;el.addEventListener('input',()=>window.SWP.patch(path,el.type==='number'?(el.value===''?null:Number(el.value)):el.value))})},
 money(v){return Number.isFinite(v)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v):'Not available'},
 number(v){return Number.isFinite(v)?new Intl.NumberFormat('en-US').format(v):'Pending'}
});
window.SWP.register('production-scenarios',{mount(root){const draw=()=>{const s=window.SWP.calc.refresh();[100,125,150].forEach(n=>root.querySelector(`[data-s="${n}"] [data-value]`).textContent=helpers.number(s.planning['scenario'+n])+' kWh/year')};draw();document.addEventListener('swp:data',draw)}});