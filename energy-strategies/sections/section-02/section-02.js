(function(){
  const section=document.getElementById('s2');if(!section||!window.SWPProfile)return;
  const choices=Array.from(section.querySelectorAll('.choice')),summary=document.getElementById('s2-summary');
  const labels=Object.fromEntries(choices.map(c=>[c.dataset.key,c.textContent.trim()]));
  const profile=SWPProfile.get(),s2=profile.section2||{};
  let previous=Array.isArray(s2.desiredChangeKeys)?s2.desiredChangeKeys:[];
  if(!previous.length&&Array.isArray(s2.desiredChanges))previous=choices.filter(c=>s2.desiredChanges.includes(c.textContent.trim())).map(c=>c.dataset.key);
  choices.forEach(choice=>{if(previous.includes(choice.dataset.key))choice.classList.add('selected');choice.setAttribute('aria-pressed',String(choice.classList.contains('selected')));choice.addEventListener('click',()=>{choice.classList.toggle('selected');choice.setAttribute('aria-pressed',String(choice.classList.contains('selected')));update();});});
  const selectedKeys=()=>choices.filter(x=>x.classList.contains('selected')).map(x=>x.dataset.key);
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
  function loadNames(loads){const map={ev:'EV charging',hvac:'HVAC / heat pump',pool:'Pool / spa',adu:'ADU / added space',appliances:'Electric appliances',people:'More people at home',wfh:'Work from home',high:'Other high use'};return Object.keys(loads||{}).filter(k=>loads[k]?.selected).map(k=>map[k]||k);}
  function update(){
    const keys=selectedKeys(),wanted=keys.map(k=>labels[k]),p=SWPProfile.get(),s1=p.section1||{},loads=loadNames(s1.futureLoads),blocks=[];
    const add=(key,text)=>{if(keys.includes(key))blocks.push(`<div class="s2-summary-item"><strong>${labels[key]}</strong><span>${text}</span></div>`);};
    add('lower-cost',`Your current electric cost entered in Step 1 is ${money(s1.bill||0)} per month.`);
    add('utility-exposure',`Your total planned electricity use is ${Math.round(Number(s1.totalPlannedKwh)||0).toLocaleString()} kWh/month.`);
    add('future-use',loads.length?`You identified these added or future loads: ${loads.join(', ')}.`:'No added or future loads were selected in Step 1.');
    add('backup',`Your Step 1 backup goal is ${s1.backup||'not selected'} for ${s1.duration||'a duration not selected'}.`);
    add('clear-path','You want the available energy paths explained clearly enough to compare what each option can and cannot do.');
    add('use-money','You want the financial structure compared as part of the complete energy strategy, not just the equipment.');
    add('not-sure','That is a useful answer. Philip can help identify which changes deserve priority during your Strategy Review.');
    summary.innerHTML=blocks.length?`<div class="s2-summary-list">${blocks.join('')}</div>`:'Select the changes you want your strategy to address.';
    SWPProfile.set('section2',{desiredChangeKeys:keys,desiredChanges:wanted,needsGuidance:keys.includes('not-sure'),summaryContext:{currentMonthlyCost:Number(s1.bill)||0,totalPlannedKwh:Number(s1.totalPlannedKwh)||0,addedLoads:loads,backup:s1.backup||'',duration:s1.duration||''}});
  }
  update();
})();
