(()=>{
  const cssSet=new Set(),scriptSet=new Set();
  const addCss=h=>{if(cssSet.has(h))return;cssSet.add(h);const l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l)};
  const getHtml=async p=>{const r=await fetch(p);if(!r.ok)throw new Error(`${p} ${r.status}`);return r.text()};
  const addScript=s=>new Promise((ok,fail)=>{if(scriptSet.has(s))return ok();scriptSet.add(s);const x=document.createElement('script');x.src=s;x.onload=ok;x.onerror=()=>fail(new Error(`Failed ${s}`));document.body.appendChild(x)});
  const canShow=(section,path,advanced)=>{
    if(section.id==='section-01')return true;
    if(path==='comparison-submitted')return section.id==='comparison-complete';
    if(path==='comparison')return advanced&&section.id==='section-03';
    if(path==='strategy')return advanced&&section.showFor.includes('strategy');
    return false;
  };
  window.SWP.loadProposal=async()=>{
    window.SWP.loadConcernProfile();
    const manifest=await(await fetch('proposal/manifest.json')).json();
    window.SWP.manifestSections=manifest.sections;
    window.SWP.advancedStarted=false;
    const app=document.getElementById('proposal-app');app.innerHTML='';
    for(const sec of manifest.sections){
      addCss(`proposal/sections/${sec.id}/${sec.id}.css`);
      const el=document.createElement('section');el.className='proposal-section';el.id=sec.id;el.hidden=!canShow(sec,window.SWP.state.path,false);
      el.innerHTML=`<header class="section-head"><div class="section-kicker">${sec.kicker}</div><h2>${sec.title}</h2></header><div class="section-body"></div>`;app.appendChild(el);
      for(const name of sec.components){const slot=document.createElement('div');slot.className='component-slot';slot.dataset.component=name;el.querySelector('.section-body').appendChild(slot);addCss(`proposal/components/${name}/component.css`);slot.innerHTML=await getHtml(`proposal/components/${name}/component.html`);await addScript(`proposal/components/${name}/component.js`);window.SWP.modules.get(name)?.mount?.(slot,window.SWP.state)}
    }
  };
  window.SWP.advanceProposal=path=>{window.SWP.state.path=path;localStorage.setItem('swp_proposal_path',path);window.SWP.advancedStarted=true;window.SWP.save();document.querySelectorAll('.proposal-section').forEach(el=>{const sec=window.SWP.manifestSections.find(s=>s.id===el.id);el.hidden=!canShow(sec,path,true)});const target=path==='comparison'?'section-03':'section-02';document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'})};
  window.SWP.refreshSections=()=>{const p=window.SWP.state.path;document.querySelectorAll('.proposal-section').forEach(el=>{const sec=window.SWP.manifestSections.find(s=>s.id===el.id);el.hidden=!canShow(sec,p,window.SWP.advancedStarted)})};
})();
