(function () {

  const root = document.getElementById('s6');
  const L = window.SWPConcernLibrary;

  if (!root || !window.SWPProfile || !L) return;

  const groupsEl = document.getElementById('s6-groups');
  const summaryEl = document.getElementById('s6-summary');

  const guidance = {
    roof_condition: 'Verify roof age, present condition, remaining life, and whether roofing work should happen before solar.',

    roof_responsibility: 'Review mounting, penetrations, leak/workmanship coverage, and removal/reinstallation responsibility for future roof work.',

    property_fit: 'Confirm usable roof area, shade/orientation, structural conditions, equipment locations, appearance, and any HOA requirements.',

    electrical_upgrades: 'Identify any panel, service, trenching, structural, or property work and who pays before final pricing.',

    usage_design: 'Use actual 12-month usage plus documented future loads and timing before final system sizing.',

    production_expectations: 'Review the production model, assumptions, shading inputs, degradation assumptions, and any written production guarantee.',

    battery_backup: 'Match usable battery capacity and power to selected backup circuits, expected duration, reserve settings, and recharge strategy.',

    utility_interaction: 'Model self-consumption, expected imports, exports, export credits, fixed charges, and other remaining utility costs.',

    technology_change: 'Confirm today’s design meets the objectives and document how expansion, replacement, or compatible upgrades would work.',

    project_execution: 'Verify installer/provider responsibility, workmanship standards, damage responsibility, communication, and what happens if a provider becomes unavailable.',

    project_timeline: 'Review realistic permitting, installation, inspection, interconnection, and permission-to-operate dependencies.',

    equipment_warranty: 'Review manufacturer, equipment, workmanship, battery, roof, and production warranty terms plus exclusions.',

    service_replacement: 'Identify monitoring access, service contact, response expectations, repair/replacement responsibility, and labor or shipping costs.',

    upfront_monthly: 'Compare upfront requirement, starting payment or PPA rate, escalation if any, and remaining utility costs.',

    financing_total: 'Review APR, fees, term, prepayment rules, total scheduled payments, project adders, and the value of cash used or preserved.',

    ownership_responsibility: 'Confirm who owns the equipment, who receives applicable benefits, and each party’s maintenance/service obligations.',

    agreement_terms: 'Read the actual contract for term length, cancellation/default, buyout, purchase, removal, renewal, and end-of-term choices.',

    home_transfer: 'Review assumption, transfer approval, payoff/buyout, refinancing, trust/estate, and failed-transfer provisions in the actual agreement.',

    utility_rules: 'Confirm the applicable tariff, time-of-use plan, fixed charges, export-credit treatment, interconnection rules, and annual billing treatment.',

    decision_confidence: 'Separate unanswered facts from general uncertainty. Compare actual proposals and documents where that is what the decision requires.',

    other_concern: 'Write down exactly what must be answered or documented before you are comfortable deciding.'
  };

  const labels = {};

  L.categories.forEach(g =>
    g.concerns.forEach(c => labels[c.id] = c)
  );

  function subLabel(s) {
    return s
      .replaceAll('_', ' ')
      .replace(/\b\w/g, x => x.toUpperCase())
      .replace('Ppa', 'PPA')
      .replace('Apr', 'APR')
      .replace('Hoa', 'HOA')
      .replace('Pto', 'PTO');
  }

  function activeProfile() {

    const p = SWPProfile.get();
    const c = p.section5?.concerns || {};

    return {
      p,
      active: Object.keys(c).filter(id =>
        [
          'Could Stop Me',
          'Okay If Resolved',
          'I’m Not Sure'
        ].includes(c[id])
      )
    };
  }

  function render() {

    const { p, active } = activeProfile();

    const C = p.section5?.concerns || {};
    const D = p.section5?.concernDetails || {};
    const R = p.section6?.resolutions || {};
    const N = p.section6?.notes || {};

    groupsEl.innerHTML = '';

    if (!active.length) {

      groupsEl.innerHTML =
        '<div class="s6-empty">' +
          '<b>No concerns are waiting for resolution.</b><br>' +
          'Finish Section 5 or classify a concern as Could Stop Me, Okay If Resolved, or I’m Not Sure.' +
        '</div>';

    } else {

      L.categories.forEach(g => {

        const ids = g.concerns
          .map(c => c.id)
          .filter(id => active.includes(id));

        if (!ids.length) return;

        const wrap = document.createElement('div');

        wrap.className = 's6-group';

        wrap.innerHTML =
          `<div class="s6-group-head">
            <h3>${g.label}</h3>
            <span>${ids.length} to review</span>
          </div>` +

          ids.map(id => {

            const c = labels[id];
            const level = C[id];

            const klass =
              level === 'Could Stop Me'
                ? 'stop'
                : level === 'I’m Not Sure'
                ? 'unsure'
                : 'resolve';

            const details = (D[id] || [])
              .map(x => `<li>${subLabel(x)}</li>`)
              .join('');

            const other =
              id === 'other_concern' && p.section5?.otherConcern
                ? `<li>${esc(p.section5.otherConcern)}</li>`
                : '';

            return `
              <article class="s6-card ${klass}">

                <div class="s6-card-top">

                  <div>

                    <h4>${c.label}</h4>

                    <span class="s6-level">
                      ${level}
                    </span>

                    <p class="s6-why">
                      ${c.help}
                    </p>

                    <div class="s6-check">

                      <b>What should resolve this</b>

                      ${
                        guidance[id] ||
                        'Verify the exact design, price, responsibility, or written term that controls this concern before deciding.'
                      }

                      ${
                        details || other
                          ? `<ul class="s6-details">${details}${other}</ul>`
                          : ''
                      }

                    </div>

                    <div class="s6-note">

                      <label>
                        Your note or question for Philip
                      </label>

                      <textarea
                        data-note="${id}"
                        placeholder="Optional"
                      >${esc(N[id] || '')}</textarea>

                    </div>

                  </div>

                  <div class="s6-status">

                    <select data-resolution="${id}">

                      <option value="">
         
