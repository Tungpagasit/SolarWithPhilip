window.SWP.register('section-one-actions',{mount(root){
  const consent=root.querySelector('[data-consent]');
  const status=root.querySelector('[data-status]');
  consent.checked=window.SWP.state.authorization.accepted;
  consent.addEventListener('change',()=>{window.SWP.state.authorization.accepted=consent.checked;window.SWP.state.authorization.timestamp=consent.checked?new Date().toISOString():null;window.SWP.save()});
  root.querySelector('[data-strategy]').addEventListener('click',()=>{if(!consent.checked){status.textContent='Please check the authorization box first.';return}window.SWP.advanceProposal('strategy')});
  root.querySelector('[data-compare]').addEventListener('click',()=>{if(!consent.checked){status.textContent='Please check the authorization box first.';return}window.SWP.advanceProposal('comparison')});
}});
