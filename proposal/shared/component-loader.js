(()=>{
  const cssSet=new Set();
  const scriptSet=new Set();

  const addCss=href=>{
    if(cssSet.has(href)) return;
    cssSet.add(href);
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  };

  const getHtml=async path=>{
    const response=await fetch(path);
    if(!response.ok) throw new Error(`${path} ${response.status}`);
    return response.text();
  };

  /*
    IMPORTANT:
    Every component JavaScript file is loaded as an ES module.
    This gives each component its own scope, so components may safely use
    local names such as const H without colliding with another component.
  */
  const addScript=src=>new Promise((resolve,reject)=>{
    if(scriptSet.has(src)) return resolve();
    scriptSet.add(src);

    const script=document.createElement('script');
    script.type='module';
    script.src=src;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

  const canShow=(section,path,advanced)=>{
    if(section.id==='section-01') return true;
    if(path==='comparison-submitted') return section.id==='comparison-complete';
    if(path==='comparison') return advanced && section.id==='section-03';
    if(path==='strategy') return advanced && section.showFor.includes('strategy');
    return false;
  };

  window.SWP.loadProposal=async()=>{
    window.SWP.loadConcernProfile();

    const manifestResponse=await fetch('proposal/manifest.json');
    if(!manifestResponse.ok) throw new Error(`proposal/manifest.json ${manifestResponse.status}`);
    const manifest=await manifestResponse.json();

    window.SWP.manifestSections=manifest.sections;
    window.SWP.advancedStarted=false;

    const app=document.getElementById('proposal-app');
    app.innerHTML='';

    for(const section of manifest.sections){
      addCss(`proposal/sections/${section.id}/${section.id}.css`);

      const sectionElement=document.createElement('section');
      sectionElement.className='proposal-section';
      sectionElement.id=section.id;
      sectionElement.hidden=!canShow(section,window.SWP.state.path,false);
      sectionElement.innerHTML=`
        <header class="section-head">
          <div class="section-kicker">${section.kicker}</div>
          <h2>${section.title}</h2>
        </header>
        <div class="section-body"></div>`;

      app.appendChild(sectionElement);
      const body=sectionElement.querySelector('.section-body');

      for(const name of section.components){
        const slot=document.createElement('div');
        slot.className='component-slot';
        slot.dataset.component=name;
        body.appendChild(slot);

        addCss(`proposal/components/${name}/component.css`);
        slot.innerHTML=await getHtml(`proposal/components/${name}/component.html`);

        await addScript(`proposal/components/${name}/component.js`);

        const component=window.SWP.modules.get(name);
        if(!component) throw new Error(`Component did not register: ${name}`);
        component.mount?.(slot,window.SWP.state);
      }
    }
  };

  window.SWP.advanceProposal=path=>{
    window.SWP.state.path=path;
    localStorage.setItem('swp_proposal_path',path);
    window.SWP.advancedStarted=true;
    window.SWP.save();

    document.querySelectorAll('.proposal-section').forEach(element=>{
      const section=window.SWP.manifestSections.find(item=>item.id===element.id);
      element.hidden=!canShow(section,path,true);
    });

    const target=path==='comparison'?'section-03':'section-02';
    document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.SWP.refreshSections=()=>{
    const path=window.SWP.state.path;
    document.querySelectorAll('.proposal-section').forEach(element=>{
      const section=window.SWP.manifestSections.find(item=>item.id===element.id);
      element.hidden=!canShow(section,path,window.SWP.advancedStarted);
    });
  };
})();
