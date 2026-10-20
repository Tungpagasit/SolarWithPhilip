const helpers=window.SWP.componentHelpers??=( {
 bindFields(root){root.querySelectorAll('[data-field]').forEach(el=>{const path=el.dataset.field;const value=path.split('.').reduce((o,k)=>o?.[k],window.SWP.state);if(value!=null)el.value=value;el.addEventListener('input',()=>window.SWP.patch(path,el.type==='number'?(el.value===''?null:Number(el.value)):el.value))})},
 money(v){return Number.isFinite(v)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v):'Not available'},
 number(v){return Number.isFinite(v)?new Intl.NumberFormat('en-US').format(v):'Pending'}
});
window.SWP.register('recommendation-summary',{mount(){}});