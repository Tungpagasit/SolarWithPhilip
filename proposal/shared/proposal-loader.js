window.SWP = window.SWP || {};

(() => {
  const intake = new Set([
    'uploads',
    'home-and-property',
    'energy-history',
    'authorization',
    'section1-actions'
  ]);

  SWP.showAnalysis = () => {
    document
      .querySelectorAll('.component-section[data-stage="analysis"]')
      .forEach(section => {
        section.hidden = false;
      });

    document.dispatchEvent(new CustomEvent('swp:analysis-opened'));
  };

  SWP.loadProposal = async () => {
    const app = document.querySelector('#proposal-app');
    const response = await fetch('proposal/manifest.json');

    if (!response.ok) {
      throw new Error(`manifest ${response.status}`);
    }

    const manifest = await response.json();
    app.innerHTML = '';

    for (const name of manifest.components) {
      const base = `proposal/components/${name}/component`;
      const root = document.createElement('section');

      root.className = 'component-section';
      root.dataset.component = name;
      root.dataset.stage = intake.has(name) ? 'intake' : 'analysis';
      root.hidden = !intake.has(name);

      const htmlResponse = await fetch(`${base}.html`);
      if (!htmlResponse.ok) {
        throw new Error(`${name} HTML ${htmlResponse.status}`);
      }

      root.innerHTML = `<div class="wrap">${await htmlResponse.text()}</div>`;
      app.appendChild(root);

      if (!document.querySelector(`link[data-proposal-css="${name}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${base}.css`;
        link.dataset.proposalCss = name;
        document.head.appendChild(link);
      }

      const jsResponse = await fetch(`${base}.js`);
      if (!jsResponse.ok) {
        throw new Error(`${name} JS ${jsResponse.status}`);
      }

      const code = await jsResponse.text();
      if (code.trim()) {
        new Function('root', 'SWP', `"use strict";{${code}\n}`)(root, SWP);
      }
    }

    return true;
  };

  function downloadPrivateBrief(html, profile) {
    const homeownerName = String(profile?.homeowner?.name || 'Homeowner')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'Homeowner';

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `Solution-Simplified-${homeownerName}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  SWP.bindGlobalActions = () => {
    const button = document.querySelector('#solution-simplified');
    if (!button || button.dataset.bound === 'true') return;

    button.dataset.bound = 'true';

    button.addEventListener('click', async () => {
      if (!new URLSearchParams(window.location.search).has('philip')) {
        return;
      }

      const confirmedProfile = SWP.data.lastFullDecisionProfile || null;
      const proposalId =
        confirmedProfile?.savedProposalId ||
        SWP.data.savedProposalId ||
        null;

      if (!confirmedProfile && !proposalId) {
        alert(
          'First click Confirm My Choice and Save/Create My Choice Report, or load the saved SolarWithPhilip_Full_Decision_Profile.json file.'
        );
        return;
      }

      const secret = prompt('Philip access code');
      if (!secret) return;

      const originalText = button.textContent;
      button.textContent = 'Preparing private brief…';
      button.disabled = true;

      try {
        const response = await fetch('/.netlify/functions/solution-simplified', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-philip-secret': secret
          },
          body: JSON.stringify({
            proposalId,
            profile: confirmedProfile
          })
        });

        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        if (!contentType.includes('application/json')) {
          throw new Error('Solution Simplified returned HTML instead of JSON.');
        }

        const result = JSON.parse(text);
        if (!response.ok) {
          throw new Error(result.error || 'Could not create the private brief.');
        }

        if (!result.briefHtml) {
          throw new Error('The private brief was created without downloadable content.');
        }

        downloadPrivateBrief(result.briefHtml, confirmedProfile || result.profileSummary);

        alert(
          `Solution Simplified is ready. Contract answers: ${result.contractAnswers}. ` +
          `Utility bill found: ${result.billFound ? 'Yes' : 'No'}.`
        );
      } catch (error) {
        alert(error.message || 'Solution Simplified failed.');
      } finally {
        button.textContent = originalText;
        button.disabled = false;
      }
    });
  };
})();
