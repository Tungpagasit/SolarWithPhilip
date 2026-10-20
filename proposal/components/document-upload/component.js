window.SWP.register('document-upload',{mount(root){
  root.querySelectorAll('[data-file]').forEach(input=>input.addEventListener('change',()=>{
    const f=input.files[0],key=input.dataset.file;
    window.SWP.state.uploads[key]=f?{name:f.name,size:f.size,type:f.type,file:f}:null;
    root.querySelector(`[data-name="${key}"]`).textContent=f?f.name:'No file selected';
    window.SWP.state.authorization.accepted=false;window.SWP.state.authorization.timestamp=null;window.SWP.save();
    document.dispatchEvent(new CustomEvent('swp:consent-reset'));
  }));
}});
