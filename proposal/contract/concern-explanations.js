'use strict';
// Complete homeowner explanations and the shared Concerns & Resolutions renderer.
// Used by both the customer report (browser) and the private Solution Simplified brief (Netlify function).
// Contract statements are derived only from the verified quotations in enfin-lease-citations.js and the
// follow-up answers in enfin-concern-answers.js. Nothing here states a price, limit, insurer or remedy the
// sample agreement does not state. The completed homeowner agreement always controls.
(function (g) {
  const node = typeof module !== 'undefined' && module.exports;
  const citations = node ? require('./enfin-lease-citations.js') : g.SWPEnfinCitations || {};
  const answers = node ? require('./enfin-concern-answers.js') : g.SWPEnfinAnswers || {};
  const reference = node ? require('./enfin-concern-reference.js') : {};

  // meaning = what the homeowner is concerned about; story = how the concern is addressed, as [lead-in, text] pairs.
  const E = {
    roof_condition: {
      meaning: 'You want to be sure your roof is in good enough shape to carry a solar system for many years, and you want to know what happens if the roof needs repair or replacement while the system is on it.',
      story: [
        ['What actually happens', 'Solar panels are attached to your roof for the whole agreement term, so roof work during that time affects the system. If you want repairs or improvements that could interfere with the system, such as repairing or replacing the roof under it, you may not remove the system yourself. You work with EnFin to have it removed, stored and reinstalled.'],
        ['Who is responsible', 'The removal, storage and reinstallation is done at your cost. EnFin coordinates the work; your roofer does not remove the equipment.'],
        ['What protections exist', 'The agreement warns that roof penetrations may void your own roof warranty for portions of the roof and tells you to consider the age and remaining life of your roof before installing. That is why roof age and condition matter before you decide.'],
        ['Limits and consequences', 'Lost production while the system is off the roof is excluded from the warranty protections, so expect that cost to be yours. The agreement does not set a dollar amount for removal and reinstallation, which is why the cost question below matters.']
      ]
    },
    roof_responsibility: {
      meaning: 'You want to know who is responsible if the roof leaks where the installer attached the system, and what protects your home if something goes wrong.',
      story: [
        ['What actually happens', 'The system is attached through your roof. EnFin warrants that the roof penetrations made by the Contractor it designates will be weather tight for ten years from the Commercial Operation Date. That is a time-limited protection, and it may be shorter than the system warranty.'],
        ['Who is responsible', 'The Limited Warranty is carried out by a Contractor EnFin designates. On a valid claim, EnFin repairs or replaces covered defects at no cost to you, including labor. If a designated Contractor damages your home, belongings or property, EnFin will make sure the damage is repaired or pay you for it.'],
        ['What you may have to do', 'Make the claim by email to the address at the top of the agreement or by overnight letter. Also carry your own homeowner insurance and call your insurance carrier before signing to confirm whether your policy needs to change.'],
        ['Limits and exceptions', 'The roof-penetration warranty runs ten years. The agreement says penetrations may void your roof warranty for parts of the roof, so check your roofer’s warranty terms too. The agreement does not state the installer insurer, policy type or coverage limits.']
      ]
    },
    property_fit: {
      meaning: 'You want to know whether your roof space, shade, structure and the placement of equipment will actually support the system you are considering.',
      story: [
        ['How it is addressed', 'Suitability is property-specific. It is decided by the site review and the final approved design, not by the sample agreement. The preliminary system shown in this report is a planning estimate based on your property analysis.'],
        ['What to do next', 'Review the final approved plan set for usable roof area, shade, structural needs, equipment locations and any HOA requirements before you sign.']
      ]
    },
    electrical_upgrades: {
      meaning: 'You want to know whether your electrical panel, service or property will need upgrades, and who pays for them.',
      story: [
        ['How it is addressed', 'The sample agreement does not give one universal answer for every property’s electrical or property work. Whether an upgrade is needed, and what it costs, depends on the site review and the final scope of work.'],
        ['What to do next', 'Ask for any required panel, service or property work to be written into the final scope and completed agreement before you sign.']
      ]
    },
    usage_design: {
      meaning: 'You want the system sized for the electricity you use today and for what you expect to add, such as an EV, heat pump, pool or more people at home.',
      story: [
        ['How it is addressed', 'Your selected production target was compared with your recorded current and future electricity use in this Proposal. The target and the future-use assumptions saved in your profile are shown in your Choice Summary.'],
        ['What to do next', 'If your plans change, the system design and production target should be revisited before the agreement is finalized.']
      ]
    },
    production_expectations: {
      meaning: 'You want to know how much electricity the system is expected to produce, what could change that, and what is actually guaranteed if it produces less.',
      story: [
        ['What actually happens', 'Solar production is estimated, not fixed. The agreement adds a defined production guarantee in Exhibit B: at least 90% of the expected annual production in the first year, with performance not declining by more than 0.55% per year, through the Initial Term.'],
        ['What happens if production falls short', 'Actual output is measured by EnFin’s monitoring device. If the system produces less than the guaranteed amount, EnFin issues a refund equal to the shortfall in kWh multiplied by the Refund Rate per kWh, paid within 90 days after the True-Up Term ends. Production above the guarantee is carried over to offset later shortfalls.'],
        ['Your responsibilities and the exclusions', 'You must keep the monitoring internet connection working. Lost production is excluded where someone other than EnFin or its approved providers installed, removed or repaired the system, where the system was misused or altered, where you breach the agreement, or where the system was removed for roof repairs.'],
        ['Limits', 'The guaranteed-kWh and Refund Rate figures are customer-specific and must come from the completed Exhibit B for your system. This cash refund is separate from the equipment warranty.']
      ]
    },
    battery_backup: {
      meaning: 'You want to know what the battery can really do during an outage, how long it will carry your home, and what happens if it fails.',
      story: [
        ['What the battery provides', 'When your system includes a battery, it provides backup power depending on its state of charge and within the limitations of the system as determined by EnFin. You choose the minimum charge to keep in reserve for an outage. After a site review, EnFin may exclude some circuits or move them to a sub-panel.'],
        ['What determines backup performance', 'How long the battery lasts depends on its capacity, your reserve setting, which circuits are backed up, how much you use during the outage and its state of charge when the outage starts.'],
        ['What is not guaranteed', 'EnFin does not guarantee backup capacity will be available without interruption during every outage and is not liable if the battery fails to provide backup power, regardless of the reason. Do not rely on battery backup for life-support or critical medical equipment. Tell EnFin if the battery does not provide backup during an outage.'],
        ['What IS provided', 'The battery is treated as part of the system, so EnFin’s Contractor maintains it and, on a valid claim, repairs or replaces defective parts at no cost for the whole term. You are responsible for damage caused by backing up more loads than EnFin approved or by changing settings from the initial installation. Additional-term payments include a fixed $100 charge for each battery. If you buy the system, EnFin’s warranties end.']
      ]
    },
    utility_interaction: {
      meaning: 'You want to understand what you will still buy from or export to the utility grid, and what utility charges remain after solar.',
      story: [
        ['How it is addressed', 'Imports, exports and remaining utility charges are separate from the lease. They depend on your utility’s rules and your actual use. Your Proposal’s current and future summaries and production-planning scenarios estimate them.'],
        ['What to do next', 'Treat remaining utility costs as an estimate and review the NEM 3 and battery planning explanations in your Proposal.']
      ]
    },
    technology_change: {
      meaning: 'You are worried the system will become outdated, or that you cannot upgrade or expand it later.',
      story: [
        ['How it is addressed', 'The agreement covers the installed system for its term. It does not promise replacement whenever newer technology becomes available.'],
        ['Limits', 'The agreement does not describe expansions or technology upgrades during the term, so confirm with EnFin whether they are available and on what terms.']
      ]
    },
    project_execution: {
      meaning: 'You want confidence in who installs the system, the quality of their work, and who answers for any damage.',
      story: [
        ['How it is addressed', 'EnFin designates the Contractor who installs and maintains the system, and if a designated Contractor damages your property, EnFin repairs it or pays for it. Project-specific milestones must be confirmed from the completed agreement and approved project records.'],
        ['What to do next', 'Ask Philip to confirm the installer’s qualifications and current insurance before relying on them.']
      ]
    },
    project_timeline: {
      meaning: 'You want to know how long permits, installation, inspection and utility approval will take.',
      story: [
        ['How it is addressed', 'The schedule is specific to your property and utility. It should be confirmed from approved project records, not inferred from the sample agreement.'],
        ['What to do next', 'Ask for the expected stages and what could delay permission to operate.']
      ]
    },
    equipment_warranty: {
      meaning: 'You want to know what protection you have if equipment fails, and you want to understand that different warranties protect different things.',
      story: [
        ['Equipment / product warranty', 'The System Warranty covers defects in workmanship, materials or components during the entire term. Separately, manufacturer warranties apply: panels may not degrade by more than 10% in 10 years or 20% in 25 years, and inverters carry a ten-year warranty. If you buy the system, the manufacturer warranties remain but EnFin’s warranties end.'],
        ['Workmanship and roof protection', 'Roof penetrations made by EnFin’s designated Contractor are warranted weather tight for ten years from the Commercial Operation Date. This is a separate, shorter protection than the System Warranty.'],
        ['Maintenance, repair and replacement', 'EnFin designates a Contractor to maintain the system. On a valid claim, EnFin repairs or replaces covered items at no cost, including labor. Make claims by email or overnight letter.'],
        ['Production guarantee', 'The production guarantee in Exhibit B is a separate, output-based cash refund. An equipment warranty and a production guarantee are not automatically the same protection: one covers defective equipment, the other pays when output falls below the guaranteed amount.']
      ]
    },
    service_replacement: {
      meaning: 'You want to know who services the system, who replaces parts that fail, and how you ask for help.',
      story: [
        ['How it is addressed', 'EnFin designates a Contractor to perform all required system maintenance and provides a System Guide. Covered defective parts, materials, components and workmanship are addressed through the System Warranty at no cost to you.'],
        ['What you may have to do', 'Make claims by email to the address at the top of the agreement or by overnight letter, and keep the internet connection working so the monitoring service can alert EnFin when the system operates outside normal ranges.']
      ]
    },
    upfront_monthly: {
      meaning: 'You want to know what you will pay up front, what you will pay each month, and whether anything else is added.',
      story: [
        ['What actually happens', 'The summary table at the start of the agreement states the estimated monthly price, any annual escalator and the estimated total over the term. Billing cycles run monthly from the In-Service Date, and amounts are due within thirty days of the invoice date.'],
        ['What else you pay', 'You also pay applicable taxes assessed related to the lease (other than EnFin’s income taxes), personal property taxes the jurisdiction levies on the system, and any applicable tax on the purchase price if you buy the system.'],
        ['Limits', 'The sample agreement leaves the monthly price, escalator and total customer-specific. Use the completed summary table for your numbers.']
      ]
    },
    financing_total: {
      meaning: 'You want to know the total cost of leasing over time, whether you can buy the system later, and how that price would be set.',
      story: [
        ['Can you buy later, and when', 'Yes, in three situations: after a home sale that occurs after the fifth anniversary of the Commercial Operation Date, if EnFin ceases operations without a substitute provider, or at the end of the Initial Term. You give written notice within sixty days of the applicable date and pay within thirty days of EnFin’s invoice.'],
        ['How the price is set', 'There is no fixed buyout price in the agreement. The price is the lesser of fair market value, set by a third-party independent appraiser, or the Purchase Calculation (ten years of estimated production multiplied by your average utility rate, discounted 10%).'],
        ['Fees, taxes and prepayment', 'You pay applicable tax on the purchase price, and the agreement states no other purchase fees. You may also prepay the remaining Monthly Payments for the Initial Term.'],
        ['What happens after purchase', 'EnFin’s maintenance and repair obligations end when you purchase.']
      ]
    },
    ownership_responsibility: {
      meaning: 'You want to know who owns the system and who is responsible for it.',
      story: [
        ['How it is addressed', 'EnFin owns the system; the lease is not a sale to you. EnFin bears the risk of loss unless you are grossly negligent or intentionally damage it, and is responsible for maintenance, service and repairs through designated contractors.'],
        ['Your responsibilities', 'You keep the system free of liens, pay applicable taxes and meet the obligations listed in the agreement.']
      ]
    },
    agreement_terms: {
      meaning: 'You want to know how long the agreement lasts and exactly what happens when it ends.',
      story: [
        ['What happens at the end of the term', 'The agreement renews automatically for an additional 5-year term, up to two times. EnFin will make commercially reasonable efforts to send a Renewal Notice 15 to 45 days before the term ends, stating the new monthly payments.'],
        ['Your choices', 'You can let it renew, decline renewal by calling EnFin or giving written notice by email at least ten days before the term expires, or buy the system by giving written notice within sixty days. After the second renewal term you can purchase the system or request removal.'],
        ['Removal and ownership', 'If the lease is not renewed, you have not purchased and you are not in default, you contact EnFin within ninety days and EnFin removes the system at no cost to you, without damaging your property. EnFin owns the system, so ownership transfers to you only if you purchase.'],
        ['If you take no action', 'The agreement renews automatically for the next 5-year term.']
      ]
    },
    home_transfer: {
      meaning: 'You want to know what you must do if you sell, refinance, move the home into a trust, or if the homeowner dies.',
      story: [
        ['If you sell', 'You can transfer the agreement to the buyer, purchase the system, or prepay it. To transfer, the buyer must meet EnFin’s requirements, the local utility must permit it, and you give EnFin at least thirty days but not more than three months of written notice. If you cannot comply with any option, you are in default.'],
        ['If you refinance', 'EnFin will not prohibit the sale, conveyance or refinancing of the property. EnFin may file a Fixture Filing that gives notice of its rights and is not a lien, will accommodate reasonable lender or title company requests, and charges a reasonable UCC Notice Removal and Refiling Fee.'],
        ['Estate, death or successor', 'On the homeowner’s death the agreement can be transferred to the estate or heirs as described in Section 13(a).'],
        ['Trust', 'The agreement does not address placing the home in a living trust; confirm the process with EnFin before you transfer title.']
      ]
    },
    utility_rules: {
      meaning: 'You want to know how utility tariffs and interconnection rules affect your system.',
      story: [
        ['How it is addressed', 'Utility tariffs and interconnection rules are controlled by the utility and must be reviewed separately from the sample lease.']
      ]
    },
    decision_confidence: {
      meaning: 'You want to feel sure that the system you selected is the right decision for your household.',
      story: [
        ['How it is addressed', 'Review your selected production target, battery configuration, solar rate, concerns and the completed agreement together before proceeding. Your Choice Summary lists each of these choices.']
      ]
    },
    other_concern: {
      meaning: 'You raised a concern in your own words.',
      story: [
        ['How it is addressed', 'Your own note is shown beside this concern. It is reviewed directly rather than matched to an unrelated contract answer.']
      ]
    }
  };

  const pageLine = c => `${c.pageLabel}${c.lines[0] === c.lines[1] ? `, line ${c.lines[0]}` : `, lines ${c.lines[0]}-${c.lines[1]}`}`;
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const defaultEsc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ESC[c]);
  const INSURANCE_NOTE = 'Philip should verify the installer\u2019s current insurance coverage and applicable property-damage protection before representing that protection to the homeowner.';

  // ctx: {esc, classification, resolution, note, details[], other, audience:'customer'|'philip'}
  function render(cid, ctx) {
    const esc = ctx.esc || defaultEsc, e = E[cid], ref = reference[cid], blocks = answers[cid] || [], philip = ctx.audience === 'philip';
    const quote = id => { const c = citations[id]; return c ? `<blockquote class="enfin-quote"><b>EnFin agreement excerpt</b> - ${esc(c.section)} (${esc(pageLine(c))})<br>\u201c${esc(c.quote)}\u201d</blockquote>` : ''; };
    const gapTitle = philip ? 'For Philip to verify - the sample agreement does not answer:' : 'To confirm with Philip before you sign - the sample agreement does not answer:';
    const meaning = e ? e.meaning : 'You raised this concern.';
    const story = e ? e.story.map(([k, t]) => `<p><b>${esc(k)}:</b> ${esc(t)}</p>`).join('') : `<p>${esc(ref ? ref.response : 'No controlled explanation has been approved for this concern; review it with Philip.')}</p>`;
    const decision = [`<b>Your classification:</b> ${esc(ctx.classification || 'Not recorded')}`, `<b>Your saved resolution:</b> ${esc(ctx.resolution || 'No resolution answer recorded')}`]
      .concat(ctx.note ? [`<b>Your note or question:</b> ${esc(ctx.note)}`] : [], ctx.other ? [`<b>You wrote:</b> ${esc(ctx.other)}`] : [], ctx.details && ctx.details.length ? [`<b>Specific points you selected:</b> ${esc(ctx.details.join('; '))}`] : []).join('<br>');
    const support = blocks.length ? blocks.map(x => {
      const gaps = x.philip.slice();
      if (cid === 'roof_responsibility' && /insurance applies/i.test(x.q)) gaps.push(INSURANCE_NOTE);
      return `<div class="qa"><p class="q">${esc(x.q)}</p><p>${esc(x.a)}</p>${x.cites.map(quote).join('')}${gaps.length ? `<div class="follow"><b>${esc(gapTitle)}</b><ul>${gaps.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}</div>`;
    }).join('') : `<div class="qa"><p>No direct EnFin quotation is assigned to this concern because the sample agreement requires a property-, utility-, customer- or project-specific review.</p></div>`;
    return `<div class="cx"><p class="cx-h">1. What you are concerned about</p><p>${esc(meaning)}</p><p class="cx-h">2. How the concern is addressed</p>${story}<p class="cx-h">3. Your saved decision</p><p>${decision}</p><p class="cx-h">4. Verified EnFin agreement support and the follow-up questions it raises</p>${support}</div>`;
  }

  const api = Object.freeze({ render, explanations: E, citations, answers });
  if (node) module.exports = api; else g.SWPConcernExplain = api;
})(typeof window !== 'undefined' ? window : globalThis);
