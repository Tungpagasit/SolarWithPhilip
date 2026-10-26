window.SWP = window.SWP || {};
(() => {
  const intake = new Set(['uploads','home-and-property','energy-history','authorization','section1-actions']);
  SWP.billReady = () => !!SWP.data.files.bill || !!SWP.data.savedReferences?.utilityBill?.path;
  SWP.showAnalysis = () => {
    SWP.data.analysisBuilt = SWP.billReady();
    if (!SWP.data.analysisBuilt) { SWP.save(); return; }
    document.querySelectorAll('.component-section[data-stage="analysis"]').forEach(section => { section.hidden = false; });
    SWP.save();
    document.dispatchEvent(new CustomEvent('swp:analysis-opened'));
  };
  SWP.loadProposal = async () => {
    const app = document.querySelector('#proposal-app');
    const response = await fetch('proposal/manifest.json');
    if (!response.ok) throw new Error(`manifest ${response.status}`);
    const manifest = await response.json();
    app.innerHTML = '';
    for (const name of manifest.components) {
      const base = `proposal/components/${name}/component`;
      const root = document.createElement('section');
      root.className = 'component-section';
      root.dataset.component = name;
      root.dataset.stage = intake.has(name) ? 'intake' : 'analysis';
      root.hidden = !intake.has(name) && !(SWP.data.analysisBuilt && SWP.billReady());
      const htmlResponse = await fetch(`${base}.html`);
      if (!htmlResponse.ok) throw new Error(`${name} HTML ${htmlResponse.status}`);
      root.innerHTML = ` ${await htmlResponse.text()} `;
      app.appendChild(root);
      if (!document.querySelector(`link[data-proposal-css="${name}"]`)) {
        const link = document.createElement('link'); link.rel='stylesheet'; link.href=`${base}.css`; link.dataset.proposalCss=name; document.head.appendChild(link);
      }
      const jsResponse = await fetch(`${base}.js`);
      if (!jsResponse.ok) throw new Error(`${name} JS ${jsResponse.status}`);
      const code = await jsResponse.text();
      if (code.trim()) new Function('root','SWP',`"use strict";{${code}\n}`)(root,SWP);
    }
    return true;
  };
  function downloadBrief(html, profile) {
    const name=String(profile?.homeowner?.name||'Homeowner').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'')||'Homeowner';
    const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`Solution-Simplified-${name}.html`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  SWP.bindGlobalActions = () => {
    const button=document.querySelector('#solution-simplified');
    if (!button || button.dataset.bound==='true') return;
    button.dataset.bound='true';
    button.addEventListener('click',async()=>{
      if (!SWP.data.philipMode && !new URLSearchParams(location.search).has('philip')) return;
      const profile=SWP.data.lastFullDecisionProfile||null;
      const proposalId=profile?.savedProposalId||SWP.data.savedProposalId||null;
      if (!profile) return alert('Upload SolarWithPhilip_Full_Decision_Profile.json first. Reconfirmation is not required.');
      const secret=prompt('Philip access code'); if(!secret)return;
      const original=button.textContent;button.textContent='Preparing private brief…';button.disabled=true;
      try{
        const response=await fetch('/.netlify/functions/solution-simplified',{method:'POST',headers:{'content-type':'application/json','x-philip-secret':secret},body:JSON.stringify({proposalId,profile})});
        const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not create the private brief.');
        if(result.briefHtml)downloadBrief(result.briefHtml,profile);
        alert(`Solution Simplified completed. Email sent: ${result.emailSent?'Yes':'No'}.`);
      }catch(error){alert(error.message);}finally{button.textContent=original;button.disabled=false;}
    });
  };
})();
