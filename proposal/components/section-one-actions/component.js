window.SWP.register('section-one-actions',{mount(root){
  const consent=root.querySelector('[data-consent]'),status=root.querySelector('[data-status]');
  const sync=()=>{consent.checked=Boolean(window.SWP.state.authorization.accepted)};sync();document.addEventListener('swp:consent-reset',()=>{sync();status.textContent='A document changed. Please review and check authorization again.'});
  consent.addEventListener('change',()=>{window.SWP.state.authorization.accepted=consent.checked;window.SWP.state.authorization.timestamp=consent.checked?new Date().toISOString():null;window.SWP.save()});
  root.querySelector('[data-strategy]').addEventListener('click',()=>{if(!consent.checked){status.textContent='Please check the authorization box first.';return}window.SWP.advanceProposal('strategy')});
  root.querySelector('[data-compare]').addEventListener('click',()=>{if(!consent.checked){status.textContent='Please check the authorization box first.';return}window.SWP.advanceProposal('comparison')});
}});
