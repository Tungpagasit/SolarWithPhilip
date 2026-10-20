window.SWP.register('home-intake',{mount(root){
  const preview=root.querySelector('[data-address-preview] p');
  root.querySelectorAll('[data-field]').forEach(el=>{const path=el.dataset.field,v=window.SWP.get(path);if(v!==null&&typeof v!=='undefined')el.value=v;el.addEventListener('input',()=>{window.SWP.patch(path,el.type==='number'?(el.value===''?null:Number(el.value)):el.value);const s=window.SWP.state.homeowner,a=[s.street,s.city,s.state,s.zip].filter(Boolean).join(', ');preview.textContent=a?`Ready to connect: ${a}`:'Complete the address and we will be ready to request available Google property and solar information in the property section.'})});
}});
