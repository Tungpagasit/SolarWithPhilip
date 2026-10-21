(function () {
  const root = document.getElementById('s6');
  const L = window.SWPConcernLibrary;

  if (!root || !window.SWPProfile || !L) return;

  const groupsEl = document.getElementById('s6-groups');
  const summaryEl = document.getElementById('s6-summary');

  const guidance = {
    roof_condition:
      'Verify roof age, present condition, remaining life, and whether roofing work should happen before solar.',

    roof_responsibility:
      'Review mounting, penetrations, leak/workmanship coverage, and removal/reinstallation responsibility for future roof work.',

    property_fit:
      'Confirm usable roof area, shade/orientation, structural conditions, equipment locations, appearance, and any HOA requirements.',

    electrical_upgrades:
      'Identify any panel, service, trenching, structural, or property work and who pays before final pricing.',

    usage_design:
      'Use actual 12-month usage plus documented future loads and timing before final system sizing.',

    production_expectations:
      'Review the production model, assumptions, shading inputs, degradation assumptions, and any written production guarantee.',

    battery_backup:
      'Match usable battery capacity and power to selected backup circuits, expected duration, reserve settings, and recharge strategy.',

    utility_interaction:
      'Model self-consumption, expected imports, exports, export credits, fixed charges, and other remaining utility costs.',

    technology_change:
      'Confirm today’s design meets the objectives and document how expansion, replacement, or compatible upgrades would work.',

    project_execution:
      'Verify installer/provider responsibility, workmanship standards, damage responsibility, communication, and what happens if a provider becomes unavailable.',

    project_timeline:
      'Review realistic permitting, installation, inspection, interconnection, and permission-to-operate dependencies.',

    equipment_warranty:
      'Review manufacturer, equipment, workmanship, battery, roof, and production warranty terms plus exclusions.',

    service_replacement:
      'Identify monitoring access, service contact, response expectations, repair/replacement responsibility, and labor or shipping costs.',

    upfront_monthly:
      'Compare upfront requirement, starting payment or PPA rate, escalation if any, and remaining utility costs.',

    financing_total:
      'Review APR, fees, term, prepayment rules, total scheduled payments, project adders, and the value of cash used or preserved.',

    ownership_responsibility:
      'Confirm who owns the equipment, who receives applicable benefits, and each party’s maintenance/service obligations.',

    agreement_terms:
      'Read the actual contract for term length, cancellation/default, buyout, purchase, removal, renewal, and end-of-term choices.',

    home_transfer:
      'Review assumption, transfer approval, payoff/buyout, refinancing, trust/estate, and failed-transfer provisions in the actual agreement.',

    utility_rules:
      'Confirm the applicable tariff, time-of-use plan, fixed charges, export-credit treatment, interconnection rules, and annual billing treatment.',

    decision_confidence:
      'Separate unanswered facts from general uncertainty. Compare actual proposals and documents where that is what the decision requires.',

    other_concern:
      'Write down exactly what must be answered or documented before you are comfortable deciding.'
  };

  const labels = {};

  L.categories.forEach(group => {
    group.concerns.forEach(concern => {
      labels[concern.id] = concern;
    });
  });

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[character]));
  }

  function subLabel(value) {
    return String(value || '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, character => character.toUpperCase())
      .replace('Ppa', 'PPA')
      .replace('Apr', 'APR')
      .replace('Hoa', 'HOA')
      .replace('Pto', 'PTO');
  }

  function activeProfile() {
    const profile = SWPProfile.get();
    const concerns = profile.section5?.concerns || {};

    const active = Object.keys(concerns).filter(id =>
      [
        'Could Stop Me',
        'Okay If Resolved',
        'I’m Not Sure'
      ].includes(concerns[id])
    );

    return {
      profile,
      active
    };
  }

  function render() {
    const { profile, active } = activeProfile();

    const concerns =
      profile.section5?.concerns || {};

    const concernDetails =
      profile.section5?.concernDetails || {};

    const resolutions =
      profile.section6?.resolutions || {};

    const notes =
      profile.section6?.notes || {};

    groupsEl.innerHTML = '';

    if (!active.length) {
      groupsEl.innerHTML = `
        <div class="s6-empty">
          <b>No concerns are waiting for resolution.</b><br>
          Finish Section 5 or classify a concern as Could Stop Me,
          Okay If Resolved, or I’m Not Sure.
        </div>
      `;
    } else {
      L.categories.forEach(group => {
        const ids = group.concerns
          .map(concern => concern.id)
          .filter(id => active.includes(id));

        if (!ids.length) return;

        const wrapper = document.createElement('div');
        wrapper.className = 's6-group';

        const cards = ids.map(id => {
          const concern = labels[id];
          const level = concerns[id];

          const cardClass =
            level === 'Could Stop Me'
              ? 'stop'
              : level === 'I’m Not Sure'
              ? 'unsure'
              : 'resolve';

          const details = (concernDetails[id] || [])
            .map(detail => {
              return `<li>${escapeHtml(subLabel(detail))}</li>`;
            })
            .join('');

          const otherConcern =
            id === 'other_concern' &&
            profile.section5?.otherConcern
              ? `<li>${escapeHtml(profile.section5.otherConcern)}</li>`
              : '';

          const detailList =
            details || otherConcern
              ? `
                <ul class="s6-details">
                  ${details}
                  ${otherConcern}
                </ul>
              `
              : '';

          const statusOptions = L.resolutionStatuses
            .map(status => {
              const selected =
                resolutions[id] === status
                  ? 'selected'
                  : '';

              return `
                <option
                  value="${escapeHtml(status)}"
                  ${selected}
                >
                  ${escapeHtml(status)}
                </option>
              `;
            })
            .join('');

          return `
            <article class="s6-card ${cardClass}">
              <div class="s6-card-top">

                <div>
                  <h4>${escapeHtml(concern.label)}</h4>

                  <span class="s6-level">
                    ${escapeHtml(level)}
                  </span>

                  <p class="s6-why">
                    ${escapeHtml(concern.help)}
                  </p>

                  <div class="s6-check">
                    <b>What should resolve this</b>

                    ${escapeHtml(
                      guidance[id] ||
                      'Verify the exact design, price, responsibility, or written term that controls this concern before deciding.'
                    )}

                    ${detailList}
                  </div>

                  <div class="s6-note">
                    <label>
                      Your note or question for Philip
                    </label>

                    <textarea
                      data-note="${escapeHtml(id)}"
                      placeholder="Optional"
                    >${escapeHtml(notes[id] || '')}</textarea>
                  </div>
                </div>

                <div class="s6-status">
                  <select data-resolution="${escapeHtml(id)}">
                    <option value="">
                      Choose status...
                    </option>

                    ${statusOptions}
                  </select>
                </div>

              </div>
            </article>
          `;
        }).join('');

        wrapper.innerHTML = `
          <div class="s6-group-head">
            <h3>${escapeHtml(group.label)}</h3>
            <span>${ids.length} to review</span>
          </div>

          ${cards}
        `;

        groupsEl.appendChild(wrapper);
      });
    }

    bindConcernInputs();
    updateSummary();
    restoreDirection();
  }

  function bindConcernInputs() {
    groupsEl
      .querySelectorAll('select[data-resolution]')
      .forEach(select => {
        select.addEventListener('change', saveConcernResponses);
      });

    groupsEl
      .querySelectorAll('textarea[data-note]')
      .forEach(textarea => {
        textarea.addEventListener('input', saveConcernResponses);
      });
  }

  function saveConcernResponses() {
    const { profile, active } = activeProfile();

    const existingResolutions =
      profile.section6?.resolutions || {};

    const existingNotes =
      profile.section6?.notes || {};

    const resolutions = {};
    const notes = {};

    active.forEach(id => {
      const select = groupsEl.querySelector(
        `[data-resolution="${id}"]`
      );

      const textarea = groupsEl.querySelector(
        `[data-note="${id}"]`
      );

      const resolution =
        select
          ? select.value
          : existingResolutions[id] || '';

      const note =
        textarea
          ? textarea.value.trim()
          : existingNotes[id] || '';

      if (resolution) {
        resolutions[id] = resolution;
      }

      if (note) {
        notes[id] = note;
      }
    });

    SWPProfile.set('section6', {
      resolutions,
      notes
    });

    updateSummary();
  }

  function updateSummary() {
    const { profile, active } = activeProfile();

    const resolutions =
      profile.section6?.resolutions || {};

    const counts = {
      resolved: 0,
      more: 0,
      deal: 0,
      discuss: 0,
      compare: 0
    };

    active.forEach(id => {
      const status = resolutions[id];

      if (status === 'Resolved Enough') {
        counts.resolved += 1;
      }

      if (status === 'Need More Information') {
        counts.more += 1;
      }

      if (status === 'Still a Deal-Breaker') {
        counts.deal += 1;
      }

      if (status === 'Discuss With Philip') {
        counts.discuss += 1;
      }

      if (status === 'Compare Between Proposals') {
        counts.compare += 1;
      }
    });

    const completed = active.filter(id =>
      Boolean(resolutions[id])
    ).length;

    const percent = active.length
      ? Math.round(
          completed / active.length * 100
        )
      : 0;

    const progressText =
      document.getElementById('s6-progress-text');

    const progressBar =
      document.getElementById('s6-progress-bar');

    if (progressText) {
      progressText.textContent = active.length
        ? `${completed} of ${active.length} selected concerns reviewed`
        : 'Nothing to review yet';
    }

    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }

    summaryEl.innerHTML = `
      <div class="s6-summary-grid">

        <div class="s6-stat">
          <b>${counts.resolved}</b>
          <span>Resolved Enough</span>
        </div>

        <div class="s6-stat">
          <b>${counts.more}</b>
          <span>Need Information</span>
        </div>

        <div class="s6-stat">
          <b>${counts.deal}</b>
          <span>Deal-Breaker</span>
        </div>

        <div class="s6-stat">
          <b>${counts.discuss}</b>
          <span>Discuss With Philip</span>
        </div>

        <div class="s6-stat">
          <b>${counts.compare}</b>
          <span>Compare Proposals</span>
        </div>

      </div>
    `;
  }

  const directionButtons = Array.from(
    root.querySelectorAll(
      '#s6-directions .direction'
    )
  );

  function restoreDirection() {
    const direction =
      SWPProfile.get().section6?.direction || '';

    directionButtons.forEach(button => {
      button.classList.toggle(
        'selected',
        button.dataset.value === direction
      );
    });
  }

  directionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const direction = button.dataset.value;

      const allowedDirections = [
        'Utility',
        'Purchase/Ownership',
        'Lease/PPA',
        'Philip Help'
      ];

      if (!allowedDirections.includes(direction)) {
        return;
      }

      directionButtons.forEach(item => {
        item.classList.toggle(
          'selected',
          item === button
        );
      });

      SWPProfile.set('section6', {
        direction
      });
    });
  });

  const downloadButton =
    document.getElementById('s6-download');

  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      if (
        typeof SWPProfile.downloadDecisionProfile ===
        'function'
      ) {
        SWPProfile.downloadDecisionProfile();
      } else {
        console.error(
          'SWPProfile.downloadDecisionProfile is not available.'
        );
      }
    });
  }

  document.addEventListener(
    'swp:profile',
    event => {
      if (
        !event.detail?.section5 ||
        !document.body.contains(root)
      ) {
        return;
      }

      const concerns =
        event.detail.section5.concerns || {};

      const signature =
        JSON.stringify(concerns);

      if (
        signature !==
        root.dataset.lastConcernSignature
      ) {
        root.dataset.lastConcernSignature =
          signature;

        render();
      }
    }
  );

  const startingConcerns =
    SWPProfile.get().section5?.concerns || {};

  root.dataset.lastConcernSignature =
    JSON.stringify(startingConcerns);

  render();
})();
