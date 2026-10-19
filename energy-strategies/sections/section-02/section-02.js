(function(){
  var section=document.getElementById('s2');
  if(!section||!window.SWPProfile)return;
  var choices=Array.from(section.querySelectorAll('.choice'));
  var summary=document.getElementById('s2-summary');
  var profile=SWPProfile.get();
  var previous=(profile.section2&&profile.section2.desiredChanges)||[];

  choices.forEach(function(choice){
    if(previous.indexOf(choice.textContent.trim())!==-1){choice.classList.add('selected');}
    choice.addEventListener('click',function(){choice.classList.toggle('selected');update();});
  });

  function selected(){return choices.filter(function(x){return x.classList.contains('selected');}).map(function(x){return x.textContent.trim();});}
  function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);}
  function loadNames(loads){var labels={ev:'EV charging',hvac:'HVAC / heat pump',pool:'Pool / spa',adu:'ADU / added space',appliances:'Electric appliances',people:'More people at home',wfh:'Work from home',high:'Other high use'};return Object.keys(loads||{}).filter(function(k){return loads[k]&&loads[k].selected;}).map(function(k){return labels[k]||k;});}

  function update(){
    var wanted=selected();
    var p=SWPProfile.get();
    var s1=p.section1||{};
    var loads=loadNames(s1.futureLoads);
    var blocks=[];

    if(wanted.indexOf('Reduce current electricity spending')!==-1){
      blocks.push('<div class="s2-summary-item"><strong>Reduce current electricity spending</strong><span>Your current electric cost entered in Section 1 is '+money(s1.bill||0)+' per month.</span></div>');
    }
    if(wanted.indexOf('Reduce exposure to future utility increases')!==-1){
      blocks.push('<div class="s2-summary-item"><strong>Reduce exposure to future utility increases</strong><span>Your total planned electricity use is '+Math.round(Number(s1.totalPlannedKwh)||0).toLocaleString()+' kWh/month.</span></div>');
    }
    if(wanted.indexOf('Support additional electricity use')!==-1){
      blocks.push('<div class="s2-summary-item"><strong>Support additional electricity use</strong><span>'+(loads.length?'You identified these added or future loads: '+loads.join(', ')+'.':'No added or future loads were selected in Section 1.')+'</span></div>');
    }
    if(wanted.indexOf('Provide the backup capability I need')!==-1){
      var backup=s1.backup||'Backup load not selected';
      var duration=s1.duration||'duration not selected';
      blocks.push('<div class="s2-summary-item"><strong>Provide the backup capability I need</strong><span>Your Section 1 backup goal is '+backup+' for '+duration+'.</span></div>');
    }
    if(wanted.indexOf('Create a more understandable energy path')!==-1){
      blocks.push('<div class="s2-summary-item"><strong>Create a more understandable energy path</strong><span>You want the available energy paths explained clearly enough to compare what each option can and cannot do.</span></div>');
    }
    if(wanted.indexOf('Use my available money efficiently')!==-1){
      blocks.push('<div class="s2-summary-item"><strong>Use my available money efficiently</strong><span>You want the financial structure compared as part of the complete energy strategy, not just the equipment.</span></div>');
    }

    summary.innerHTML=blocks.length?'<div class="s2-summary-list">'+blocks.join('')+'</div>':'Select the changes you want your strategy to address.';
    SWPProfile.set('section2',{desiredChanges:wanted,summaryContext:{currentMonthlyCost:Number(s1.bill)||0,totalPlannedKwh:Number(s1.totalPlannedKwh)||0,addedLoads:loads,backup:s1.backup||'',duration:s1.duration||''}});
  }

  document.addEventListener('swp:profile',function(e){if(e.detail&&e.detail.section1)update();});
  update();
})();
