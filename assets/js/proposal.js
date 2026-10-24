window.SWP = window.SWP || {};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await SWP.loadProposal();
    SWP.bindGlobalActions();
  } catch (error) {
    console.error(error);
    document.querySelector('#proposal-app').innerHTML = `<div class="loading-card error">Proposal could not load. ${SWP.esc ? SWP.esc(error.message) : error.message}</div>`;
  }
});
