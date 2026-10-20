const PAGE_MAP={
  home:'index.html',
  start:'start-here.html',
  proposal:'proposal.html',
  review:'proposal.html',
  strategies:'energy-strategies.html',
  guide:'california-guide.html',
  costs:'energy-costs.html',
  faq:'faq.html',
  about:'about.html',
  reviews:'reviews.html',
  contact:'contact.html'
};

document.querySelectorAll('[data-page],[data-p]').forEach(el=>{
  el.addEventListener('click',event=>{
    event.preventDefault();
    const key=el.dataset.page||el.dataset.p;
    if(PAGE_MAP[key]) location.href=PAGE_MAP[key];
  });
});

window.SWP={
  modules:new Map(),
  state:null,
  proposalLoaded:false,
  register(name,module){this.modules.set(name,module);},
  setStatus(){}
};

const SHARED_SCRIPTS=[
  'proposal/shared/proposal-data.js',
  'proposal/shared/proposal-calculations.js',
  'proposal/shared/concern-profile.js',
  'proposal/shared/component-loader.js'
];

function loadScript(src){
  return new Promise((resolve,reject)=>{
    if(document.querySelector(`script[data-src="${src}"]`)){
      resolve();
      return;
    }
    const script=document.createElement('script');
    script.src=src;
    script.dataset.src=src;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function openProposal(path){
  const builder=document.getElementById('proposal-builder');
  const message=document.getElementById('proposal-path-message');
  const app=document.getElementById('proposal-app');

  localStorage.setItem('swp_proposal_path',path);
  builder.hidden=false;

  if(path==='strategy'){
    message.textContent='Your saved Energy Strategies work will guide this proposal so we can begin connecting your priorities to your home and energy picture.';
  }else{
    message.textContent='We will begin with a focused proposal-comparison intake, then show the planning questions and assumptions behind the numbers.';
  }

  builder.scrollIntoView({behavior:'smooth',block:'start'});

  if(window.SWP.proposalLoaded) return;

  app.innerHTML='<div class="proposal-loading-card"><strong>Opening your proposal experience…</strong><span>Bringing the pieces together around your home.</span></div>';

  try{
    for(const src of SHARED_SCRIPTS){
      await loadScript(src);
    }
    await window.SWP.loadProposal();
    window.SWP.proposalLoaded=true;
  }catch(error){
    console.error(error);
    app.innerHTML='<div class="proposal-loading-card"><strong>Proposal could not load.</strong><span>Please refresh the page or contact Philip.</span></div>';
  }
}

document.querySelectorAll('[data-proposal-path]').forEach(button=>{
  button.addEventListener('click',()=>openProposal(button.dataset.proposalPath));
});
