#!/usr/bin/env node
/* Development-only: stamps the shared intake form markup into the homepage, Get Started and Compare My Quote.
   The HTML is committed static markup (works without JS for reading/layout; submission requires JS and the Netlify function).
   Idempotent via marker comments. Usage: node scripts/sync-forms.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const BILL = [['lt150', 'Under $150'], ['150_249', '$150–$249'], ['250_349', '$250–$349'], ['350_499', '$350–$499'], ['500_749', '$500–$749'], ['750_plus', '$750+'], ['not_sure', 'Not sure']];
const GOAL = [['lower_costs', 'Lower my electricity costs'], ['solar', 'Solar for my home'], ['solar_battery', 'Solar and battery'], ['backup', 'Backup power'], ['add_replace', 'Add to or replace an existing solar system'], ['compare_quote', 'Compare an existing solar quote'], ['not_sure', 'Not sure yet']];
// Utility choices must be confirmed against the utilities/areas the team can actually support before launch.
const UTIL = [['pge', 'PG&amp;E'], ['sce', 'Southern California Edison'], ['sdge', 'San Diego Gas &amp; Electric'], ['smud', 'SMUD'], ['other', 'Other'], ['not_sure', 'Not sure']];
const CONCERN = [['price', 'Total price or monthly payment'], ['size_production', 'System size / projected production'], ['battery', 'Battery'], ['equipment', 'Equipment'], ['financing', 'Financing'], ['lease_ppa', 'Lease / PPA'], ['multiple', 'Compare multiple quotes'], ['contract_terms', 'Contract terms I want to understand'], ['everything', 'Everything'], ['not_sure', 'Not sure']];

const opts = (list, placeholder) => `<option value="">${placeholder}</option>` + list.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
const err = (p, n) => `<p class="swp-err" id="${p}-${n}-err" data-err-for="${n}" hidden></p>`;
function text(p, n, label, o = {}) {
  const req = o.required ? ' <span class="swp-req">(required)</span>' : ' <span class="swp-req">(optional)</span>';
  const desc = [`${p}-${n}-err`].concat(o.hint ? [`${p}-${n}-hint`] : []).join(' ');
  return `<div class="swp-field"><label for="${p}-${n}">${label}${o.dynamic ? ` <span class="swp-req" data-req-for="${n}">(optional)</span>` : req}</label>` +
    `<input type="${o.type || 'text'}" id="${p}-${n}" name="${n}"${o.auto ? ` autocomplete="${o.auto}"` : ''}${o.mode ? ` inputmode="${o.mode}"` : ''}${o.max ? ` maxlength="${o.max}"` : ''}${o.required ? ' required aria-required="true"' : ''} aria-describedby="${desc}">` +
    (o.hint ? `<span class="swp-hint" id="${p}-${n}-hint">${o.hint}</span>` : '') + err(p, n) + '</div>';
}
function select(p, n, label, html, o = {}) {
  const desc = [`${p}-${n}-err`].concat(o.hint ? [`${p}-${n}-hint`] : []).join(' ');
  return `<div class="swp-field"><label for="${p}-${n}">${label} <span class="swp-req">(optional)</span></label><select id="${p}-${n}" name="${n}" aria-describedby="${desc}">${html}</select>` +
    (o.hint ? `<span class="swp-hint" id="${p}-${n}-hint">${o.hint}</span>` : '') + err(p, n) + '</div>';
}
function preferred(p) {
  const r = [['email', 'Email'], ['text', 'Text'], ['phone', 'Phone'], ['email_text', 'Email + Text']];
  return `<fieldset class="swp-field" aria-describedby="${p}-preferred-err"><legend>Preferred contact method <span class="swp-req">(required)</span></legend><div class="swp-choices">` +
    r.map(([v, l], i) => `<label class="swp-choice"><input type="radio" name="preferred" value="${v}" id="${p}-preferred-${v}"${i === 0 ? ' required' : ''}><span>${l}</span></label>`).join('') +
    `</div>${err(p, 'preferred')}</fieldset>`;
}
const honeypot = p => `<div class="swp-hp" aria-hidden="true"><label for="${p}-hp">Leave this field empty</label><input type="text" id="${p}-hp" name="hp_fax" tabindex="-1" autocomplete="off"></div>`;
// Consent wording is a DRAFT (version draft-2026-11-v1) and needs owner/legal approval before launch.
const consent = p => `<div class="swp-field"><div class="swp-consent"><input type="checkbox" id="${p}-consent" name="consent" aria-describedby="${p}-consent-err"><label for="${p}-consent">I agree that Philip or a qualified member of the Solar With Philip team may contact me about this request using the method I selected.</label></div>${err(p, 'consent')}</div>`;

function intake(source) {
  const p = 'gs';
  return `<div class="swp-formwrap">
<form class="swp-form" id="swp-intake-form" data-swp-intake data-lead-type="get_started" data-form-source="${source}" aria-label="Get started request form" novalidate>
<div class="swp-form__summary" data-summary tabindex="-1" hidden></div>
<div data-stage="1">
${text(p, 'firstName', 'First name', { required: true, auto: 'given-name' })}
${text(p, 'zip', 'ZIP code', { required: true, auto: 'postal-code', mode: 'numeric', max: 10, hint: 'We use your ZIP to understand your area. We do not assume your utility from it.' })}
<p class="swp-hint" data-zip-note aria-live="polite" style="margin:-14px 0 20px"></p>
${select(p, 'billBand', 'Typical monthly electricity bill', opts(BILL, 'Choose a range'))}
${select(p, 'goal', 'What would you most like to do?', opts(GOAL, 'Choose one'))}
<p class="swp-form__note" data-quote-note hidden>Already have a quote? <a href="/compare-my-quote/">Go to Compare My Quote</a>. We will carry over what you have entered.</p>
${select(p, 'utility', 'Electric utility', opts(UTIL, 'Choose your utility'), { hint: 'Optional. Choose Not sure if you are unsure.' })}
<button type="button" class="swp-btn swp-btn--navy swp-form__submit" data-next>Continue</button>
</div>
<div data-stage="2">
<h3 class="swp-form__stage-title" data-stage-title tabindex="-1">How Should We Reach You?</h3>
<p>Philip or a qualified member of the Solar With Philip team may follow up about your request using the contact method you choose.</p>
${preferred(p)}
${text(p, 'email', 'Email', { type: 'email', dynamic: true, auto: 'email', max: 254 })}
${text(p, 'phone', 'Mobile or phone number', { type: 'tel', dynamic: true, auto: 'tel', mode: 'tel', max: 40 })}
${consent(p)}
${honeypot(p)}
<button type="submit" class="swp-btn swp-btn--primary swp-form__submit" data-submit>Review My Options</button>
<p class="swp-status" data-status role="status" aria-live="polite"></p>
<p class="swp-form__assure">No obligation. Your information helps us understand what you're looking for before we follow up.</p>
</div>
<noscript><p class="swp-form__note">This form needs JavaScript. You can always call or text Philip at <a href="tel:+19165247187">916-524-7187</a> or email <a href="mailto:vt@wegreenourworld.com">vt@wegreenourworld.com</a>.</p></noscript>
</form>
<div class="swp-success" data-success hidden>
<h3 data-success-title tabindex="-1">Got It. Want a More Useful Review?</h3>
<p>The basics have been received. If you would like a more useful review, you can add more below. None of it is required.</p>
<ul class="swp-options">
<li><button type="button" class="swp-btn swp-btn--outline" data-enrich="bill">Upload an electric bill</button></li>
<li><button type="button" class="swp-btn swp-btn--outline" data-enrich="address">Add property address</button></li>
<li><a class="swp-btn swp-btn--outline" href="/compare-my-quote/" data-enrich-link="existing_quote">I already have a solar quote</a></li>
<li><a class="swp-btn swp-btn--outline" href="/energy-strategies.html" data-enrich-link="build_plan">Build My Solar Plan</a></li>
<li><button type="button" class="swp-btn swp-btn--outline" data-enrich="done">I'm done for now</button></li>
</ul>
<div class="swp-panel" data-panel="bill" tabindex="-1" hidden>
<div class="swp-field"><label for="gs-bill-file">Electric bill (PDF, PNG or JPG, up to 10 MB)</label><input type="file" id="gs-bill-file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"><span class="swp-hint">Please upload only your electric bill. Do not include unrelated sensitive documents.</span></div>
<button type="button" class="swp-btn swp-btn--navy" data-go>Upload bill</button>
<p data-panel-msg role="status" aria-live="polite"></p>
</div>
<div class="swp-panel" data-panel="address" tabindex="-1" hidden>
<div class="swp-field"><label for="gs-address">Property address</label><input type="text" id="gs-address" autocomplete="street-address" maxlength="200"></div>
<button type="button" class="swp-btn swp-btn--navy" data-go>Save address</button>
<p data-panel-msg role="status" aria-live="polite"></p>
</div>
<div class="swp-panel" data-panel="done" tabindex="-1" hidden><p><strong>Thank you.</strong> Your request is in. Philip or a qualified member of the team may follow up using the contact method you chose.</p></div>
</div>
</div>`;
}

function compare() {
  const p = 'cq';
  return `<div class="swp-formwrap">
<form class="swp-form" id="swp-compare-form" data-swp-intake data-lead-type="quote_compare" data-form-source="compare_my_quote" aria-label="Send my quote for review" novalidate>
<div class="swp-form__summary" data-summary tabindex="-1" hidden></div>
${text(p, 'firstName', 'First name', { required: true, auto: 'given-name' })}
${text(p, 'lastName', 'Last name', { auto: 'family-name' })}
${text(p, 'zip', 'ZIP code', { required: true, auto: 'postal-code', mode: 'numeric', max: 10 })}
<p class="swp-hint" data-zip-note aria-live="polite" style="margin:-14px 0 20px"></p>
${preferred(p)}
${text(p, 'email', 'Email', { type: 'email', dynamic: true, auto: 'email', max: 254 })}
${text(p, 'phone', 'Mobile or phone number', { type: 'tel', dynamic: true, auto: 'tel', mode: 'tel', max: 40 })}
${select(p, 'utility', 'Electric utility', opts(UTIL, 'Choose your utility'))}
${select(p, 'concern', 'What would you most like reviewed?', opts(CONCERN, 'Choose one'))}
<div class="swp-field"><label for="cq-message">Anything else we should know? <span class="swp-req">(optional, up to 500 characters)</span></label><textarea id="cq-message" name="message" maxlength="500" aria-describedby="cq-message-err"></textarea>${err(p, 'message')}</div>
<div class="swp-field"><label for="cq-quoteFile">Your solar quote or proposal <span class="swp-req">(required: PDF, PNG or JPG, up to 10 MB)</span></label><input type="file" id="cq-quoteFile" name="quoteFile" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" aria-required="true" aria-describedby="cq-quoteFile-hint cq-quoteFile-err"><span class="swp-hint" id="cq-quoteFile-hint">Please upload only your solar quote or proposal. Do not include unrelated sensitive documents such as ID, bank or tax records.</span>${err(p, 'quoteFile')}</div>
${consent(p)}
${honeypot(p)}
<button type="submit" class="swp-btn swp-btn--primary swp-form__submit" data-submit>Send My Quote for Review</button>
<p class="swp-status" data-status role="status" aria-live="polite"></p>
<p class="swp-form__assure">No obligation. Philip or a qualified member of the Solar With Philip team may follow up about your request using the contact method you choose.</p>
<noscript><p class="swp-form__note">This form needs JavaScript. You can always email your quote to <a href="mailto:vt@wegreenourworld.com">vt@wegreenourworld.com</a> or call or text Philip at <a href="tel:+19165247187">916-524-7187</a>.</p></noscript>
</form>
<div class="swp-success" data-success hidden>
<h3 data-success-title tabindex="-1">Your Quote Is In.</h3>
<p>The information you submitted has been received. Philip or a qualified member of the team may follow up using the contact method you chose.</p>
<div class="swp-panel" data-upload-retry tabindex="-1" hidden>
<p data-retry-msg role="status" aria-live="polite"></p>
<div data-retry-inputs><div class="swp-field"><label for="cq-retry-file">Quote file (PDF, PNG or JPG, up to 10 MB)</label><input type="file" id="cq-retry-file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"></div><button type="button" class="swp-btn swp-btn--navy" data-go>Try upload again</button></div>
</div>
<h3 style="margin-top:28px">Want to understand the numbers yourself while the quote is being reviewed?</h3>
<ul class="swp-options">
<li><a class="swp-btn swp-btn--outline" href="/energy-strategies.html" data-enrich-link="build_plan">Build My Solar Plan</a></li>
<li><a class="swp-btn swp-btn--outline" href="/proposal.html" data-enrich-link="home_energy_analysis">Home Energy Analysis</a></li>
</ul>
</div>
</div>`;
}

const FORMS = {
  'index.html': ['intake', () => intake('homepage_primary')],
  'get-started/index.html': ['intake', () => intake('get_started_page')],
  'compare-my-quote/index.html': ['compare', compare]
};
for (const [file, [name, build]] of Object.entries(FORMS)) {
  const p = path.join(root, file);
  let t = fs.readFileSync(p, 'utf8');
  const eol = t.includes('\r\n') ? '\r\n' : '\n';
  t = t.replace(/\r\n/g, '\n');
  const re = new RegExp(`<!-- swp-form:${name}:start -->[\\s\\S]*?<!-- swp-form:${name}:end -->`);
  if (!re.test(t)) throw new Error(`marker missing in ${file}`);
  t = t.replace(re, () => `<!-- swp-form:${name}:start -->\n${build()}\n<!-- swp-form:${name}:end -->`);
  fs.writeFileSync(p, t.replace(/\n/g, eol));
  console.log('stamped form into', file);
}
