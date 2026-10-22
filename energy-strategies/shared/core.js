(async function(){
  const root=document.getElementById('energy-sections');
  const base='energy-strategies/sections/';
  for(let i=1;i<=6;i++){
    const n=String(i).padStart(2,'0'),dir=`section-${n}`;
    try{
      const html=await fetch(`${base}${dir}/${dir}.html`).then(r=>{if(!r.ok)throw Error(r.status);return r.text();});
      const holder=document.createElement('div');holder.innerHTML=html;while(holder.firstChild)root.appendChild(holder.firstChild);
      const css=document.createElement('link');css.rel='stylesheet';css.href=`${base}${dir}/${dir}.css`;document.head.appendChild(css);
      const js=document.createElement('script');js.src=`${base}${dir}/${dir}.js`;js.defer=false;document.body.appendChild(js);
      await new Promise(res=>{js.onload=res;js.onerror=res;});
    }catch(e){root.insertAdjacentHTML('beforeend',`<div class="loaderror">Section ${i} could not load. Serve the site through Netlify/GitHub Pages rather than opening the HTML directly from your computer.</div>`);}
  }

  const toastEl=document.getElementById('toast');
  window.toast=function(text){toastEl.textContent=text;toastEl.style.display='block';clearTimeout(window.__swpToast);window.__swpToast=setTimeout(()=>toastEl.style.display='none',2200);};
  document.getElementById('download-profile')?.addEventListener('click',()=>{SWPProfile.download();toast('Decision_Profile.json downloaded');});
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.go)?.scrollIntoView({behavior:'smooth'})));

  const messages=[
    ['Let’s build this the right way.','Six thoughtful steps will help your eventual proposal begin with the right priorities.'],
    ['Good start.','You’re building from your actual home-energy situation.'],
    ['Your priorities are becoming clearer.','You’ve identified what you want an energy solution to change.'],
    ['Halfway there.','You’ve reviewed the practical energy paths available to a California home.'],
    ['The planning picture is taking shape.','You now understand how solar, storage, and the grid work together.'],
    ['Almost there.','You’ve identified what matters and what still needs clarity.'],
    ['Your Energy Strategy is complete.','You’ve done the due diligence. Now let’s put it all together.']
  ];

  function concernCount(){return (window.SWPConcernLibrary?.categories||[]).reduce((sum,c)=>sum+(c.concerns||[]).length,0);}
  function surfacedConcerns(p){return Object.keys(p.section5?.concerns||{}).filter(id=>p.section5.concerns[id]&&p.section5.concerns[id]!=='Not a Concern');}
  function completion(p){
    const s1=p.section1||{},s2=p.section2||{},s5=p.section5||{},s6=p.section6||{};
    const output=[];
    output[0]=Number(s1.bill)>0;
    output[1]=Array.isArray(s2.desiredChangeKeys)?s2.desiredChangeKeys.length>0:Array.isArray(s2.desiredChanges)&&s2.desiredChanges.length>0;
    output[2]=s3Read||s1.__section3Reviewed||p.section3?.reviewed===true;
    output[3]=s4Read||s1.__section4Reviewed||p.section4?.reviewed===true;
    output[4]=Object.keys(s5.outcomes||{}).length>0&&Object.keys(s5.concerns||{}).length>=concernCount();
    const surfaced=surfacedConcerns(p);output[5]=Boolean(s6.direction)&&surfaced.every(id=>Boolean(s6.resolutions?.[id]));
    return output;
  }

  let s3Read=false,s4Read=false;
  function markReading(sectionNumber){
    const el=document.getElementById(`s${sectionNumber}`);if(!el)return;
    let timer;
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      clearTimeout(timer);
      if(entry.isIntersecting&&entry.intersectionRatio>=.35){timer=setTimeout(()=>{
        if(sectionNumber===3)s3Read=true;else s4Read=true;
        SWPProfile.set(`section${sectionNumber}`,{reviewed:true,reviewedAt:new Date().toISOString()});
        observer.disconnect();
      },1800);}
    }),{threshold:[.35]});observer.observe(el);
  }
  markReading(3);markReading(4);

  const companion=document.getElementById('strategy-companion'),body=document.getElementById('companion-body'),toggle=document.getElementById('companion-toggle');
  toggle?.addEventListener('click',()=>{const open=!companion.classList.toggle('is-collapsed');toggle.setAttribute('aria-expanded',String(open));});
  function updateCompanion(){
    const p=SWPProfile.get(),states=completion(p),count=states.filter(Boolean).length;
    document.getElementById('companion-mini-count').textContent=`${count} of 6`;
    const dots=document.getElementById('companion-dots');dots.innerHTML=states.map((done,i)=>`<span class="${done?'done':''}" title="Step ${i+1}${done?' complete':''}"></span>`).join('');
    document.getElementById('companion-title').textContent=messages[count][0];document.getElementById('companion-message').textContent=messages[count][1];
    const action=document.getElementById('companion-action');
    if(count===6){companion.classList.add('is-complete');action.textContent='Request My Complimentary Strategy Review';action.href='contact.html';}
    else{companion.classList.remove('is-complete');action.textContent='Need help? Talk to Philip';action.href='contact.html';}
  }
  document.addEventListener('swp:profile',updateCompanion);updateCompanion();
})();
