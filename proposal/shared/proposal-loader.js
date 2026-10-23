window.SWP = window.SWP || {};

(() => {
  const intakeComponents = new Set([
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

    if (!app) {
      throw new Error('Proposal app container was not found.');
    }

    const manifestResponse = await fetch('proposal/manifest.json');

    if (!manifestResponse.ok) {
      throw new Error(`manifest ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json();
    app.innerHTML = '';

    for (const name of manifest.components) {
      const base = `proposal/components/${name}/component`;
      const root = document.createElement('section');

      root.className = 'component-section';
      root.dataset.component = name;
      root.dataset.stage = intakeComponents.has(name) ? 'intake' : 'analysis';

      // Every fresh page visit begins with intake only.
      // Do not restore the analytical sections from localStorage.
      root.hidden = !intakeComponents.has(name);

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

      const componentJs = await jsResponse.text();

      if (componentJs.trim()) {
        try {
          const runComponent = new Function(
            'root',
            'SWP',
            `"use strict"; { ${componentJs}\n }`
          );
          runComponent(root, SWP);
        } catch (error) {
          throw new Error(`${name}: ${error.message}`);
        }
      }
    }

    return true;
  };

  SWP.bindGlobalActions = () => {
    document.querySelector('#solution-simplified')?.addEventListener('click', async () => {
      if (!new URLSearchParams(location.search).has('philip')) return;
      if (!SWP.data.decisionProfile) {
        alert('Load the Decision_Profile first.');
        return;
      }

      const secret = prompt('Philip access code');
      if (!secret) return;

      const response = await fetch('/.netlify/functions/solution-simplified', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-philip-secret': secret
        },
        body: JSON.stringify(SWP.fullProfile())
      });

      const result = await response.json();
      alert(response.ok
        ? `Solution Simplified brief saved. Reference: ${result.id}`
        : (result.error || 'Could not create brief.'));
    });
  };
})();
