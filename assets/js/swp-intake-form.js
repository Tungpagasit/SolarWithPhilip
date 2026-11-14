/* Solar With Philip intake form (Phase 2B). Shared by the homepage form, Get Started and Compare My Quote.
   Progressive enhancement: the forms are static HTML. The backend save (save-intake) is the source of truth;
   analytics fire only after the server returns an id and never receive entered values. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var ENDPOINT = '/.netlify/functions/save-intake';
  var UPLOAD = '/.netlify/functions/intake-upload';
  var MAX_BYTES = 10 * 1024 * 1024;
  var TIMEOUT_MS = 20000;
  var DRAFT = 'swp_intake_draft';
  var CONTACT = '916-524-7187';
  var FILE_OK = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

  var MSG = {
    missing_name: 'Please enter your first name.',
    missing_zip: 'Please enter your 5-digit ZIP code.',
    invalid_zip: 'Please enter a 5-digit ZIP code, like 95630.',
    invalid_email: 'Please enter a valid email address, like name@example.com.',
    invalid_phone: 'Please enter a 10-digit phone number, like 916-555-0123.',
    missing_email: 'Please add your email so we can reach you that way.',
    missing_phone: 'Please add your phone number so we can reach you that way.',
    missing_contact: 'Please choose how we should reach you.',
    missing_consent: 'Please check the box so we know it is OK to contact you about this request.',
    missing_file: 'Please choose your solar quote file (PDF, PNG or JPG).',
    unsupported_type: 'That file type is not supported. Please upload a PDF, PNG or JPG.',
    file_too_large: 'That file is larger than 10 MB. Please choose a smaller file or a PDF export.',
    server_error: 'We could not send your request just now. Please try again in a moment, or call or text ' + CONTACT + '.',
    rate_limited: 'We have received several requests recently. Please try again in a little while, or call or text ' + CONTACT + '.',
    network_timeout: 'That took longer than expected. Please try once more. If your first attempt went through, we will not create a duplicate.'
  };

  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function track(name, params) {
    try { if (typeof window.swpTrack === 'function') window.swpTrack(name, params || {}); } catch (e) { /* analytics must never affect the form */ }
  }
  function uuid() {
    try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (e) { /* fall through */ }
    var s = '';
    for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
  function normalizeZip(v) {
    var m = String(v || '').trim().match(/^(\d{5})(?:-?\d{4})?$/);
    return m ? m[1] : '';
  }
  function validEmail(v) { return /^[^\s@,()<>"';:\\]+@[^\s@,()<>"';:\\]+\.[^\s@,()<>"';:\\]{2,}$/.test(v); }
  function validPhone(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    return /^[2-9]\d{2}[2-9]\d{6}$/.test(d);
  }
  function extOf(name) { var m = /\.([A-Za-z0-9]+)$/.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function sizeBand(n) { return n < 1048576 ? 'lt1mb' : n < 5242880 ? '1_5mb' : '5_10mb'; }
  function fileProblem(f) {
    if (!f) return 'missing_file';
    var e = extOf(f.name);
    if (!FILE_OK[e]) return 'unsupported_type';
    if (f.type && f.type !== FILE_OK[e]) return 'unsupported_type';
    if (f.size > MAX_BYTES) return 'file_too_large';
    if (f.size <= 0) return 'missing_file';
    return '';
  }

  function postJson(url, body) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, TIMEOUT_MS) : null;
    return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, data: d }; }); })
      .then(function (x) { if (timer) clearTimeout(timer); return x; }, function (e) { if (timer) clearTimeout(timer); var err = new Error(e && e.name === 'AbortError' ? 'network_timeout' : 'server_error'); err.category = err.message; throw err; });
  }

  function setBusy(btn, busy, busyLabel) {
    if (!btn) return;
    if (busy) { btn.setAttribute('data-label', btn.textContent); btn.textContent = busyLabel; btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
    else { btn.textContent = btn.getAttribute('data-label') || btn.textContent; btn.disabled = false; btn.removeAttribute('aria-disabled'); }
  }

  function init(form) {
    var leadType = form.getAttribute('data-lead-type');
    var source = form.getAttribute('data-form-source');
    var isCompare = leadType === 'quote_compare';
    var summary = $(form, '[data-summary]');
    var status = $(form, '[data-status]');
    var submitBtn = $(form, '[data-submit]');
    var successEl = form.parentNode.querySelector('[data-success]');
    var state = { started: false, busy: false, key: null, ref: null, submitted: false };
    var fileInput = $(form, '[name="quoteFile"]');

    function field(name) { return $(form, '[name="' + name + '"]'); }
    function val(name) { var el = field(name); return el ? String(el.value || '').trim() : ''; }
    function errEl(name) { return $(form, '[data-err-for="' + name + '"]'); }

    function clearErrors() {
      $$(form, '[data-err-for]').forEach(function (e) { e.hidden = true; e.textContent = ''; });
      $$(form, '[aria-invalid="true"]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
      if (summary) { summary.hidden = true; summary.innerHTML = ''; }
    }
    function showErrors(errs) {
      var list = [];
      Object.keys(errs).forEach(function (name) {
        var el = errEl(name), input = name === 'preferred' ? $(form, '[name="preferred"]') : field(name);
        var text = 'Error: ' + (MSG[errs[name]] || MSG.server_error);
        if (el) { el.textContent = text; el.hidden = false; }
        if (input && name !== 'preferred') input.setAttribute('aria-invalid', 'true');
        list.push({ name: name, text: text.replace(/^Error: /, ''), input: input });
      });
      if (summary && list.length) {
        summary.innerHTML = '<p class="swp-form__summary-title">A couple of things need your attention.</p><p class="swp-form__summary-sub">Check the highlighted fields below.</p><ul>' + list.map(function (i) { return '<li><a href="#' + (i.input && i.input.id ? i.input.id : '') + '" data-focus="' + i.name + '">' + i.text.replace(/</g, '&lt;') + '</a></li>'; }).join('') + '</ul>';
        summary.hidden = false;
        summary.focus();
      }
    }
    if (summary) summary.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-focus]');
      if (!a) return;
      e.preventDefault();
      var n = a.getAttribute('data-focus'), el = n === 'preferred' ? $(form, '[name="preferred"]') : field(n);
      if (el) el.focus();
    });

    function category(errs) { var k = Object.keys(errs)[0]; return errs[k]; }

    function preferred() { var r = $(form, '[name="preferred"]:checked'); return r ? r.value : ''; }
    function updateContactHints() {
      var p = preferred();
      var needEmail = p === 'email', needPhone = p === 'phone';
      var e = field('email'), ph = field('phone');
      if (e) { e.required = needEmail; e.setAttribute('aria-required', needEmail ? 'true' : 'false'); }
      if (ph) { ph.required = needPhone; ph.setAttribute('aria-required', needPhone ? 'true' : 'false'); }
      var er = $(form, '[data-req-for="email"]'), pr = $(form, '[data-req-for="phone"]');
      if (er) er.textContent = needEmail ? '(required)' : '(optional)';
      if (pr) pr.textContent = needPhone ? '(required)' : '(optional)';
    }
    $$(form, '[name="preferred"]').forEach(function (r) { r.addEventListener('change', updateContactHints); });
    updateContactHints();

    function validateStage1() {
      var errs = {};
      if (!val('firstName')) errs.firstName = 'missing_name';
      var z = val('zip');
      if (!z) errs.zip = 'missing_zip';
      else if (!normalizeZip(z)) errs.zip = 'invalid_zip';
      return errs;
    }
    function validateAll() {
      var errs = validateStage1();
      var p = preferred(), em = val('email'), ph = val('phone');
      if (!p) errs.preferred = 'missing_contact';
      var needEmail = p === 'email', needPhone = p === 'phone';
      if (needEmail && !em) errs.email = 'missing_email';
      else if (em && !validEmail(em)) errs.email = 'invalid_email';
      if (needPhone && !ph) errs.phone = 'missing_phone';
      else if (ph && !validPhone(ph)) errs.phone = 'invalid_phone';
      if (p && !em && !ph && !errs.email && !errs.phone) errs.preferred = 'missing_contact';
      if (isCompare) { var fp = fileProblem(fileInput && fileInput.files && fileInput.files[0]); if (fp) errs.quoteFile = fp; }
      var c = field('consent');
      if (c && !c.checked) errs.consent = 'missing_consent';
      return errs;
    }

    function ctx(extra) {
      var o = { form_id: source, lead_type: leadType };
      var b = val('billBand'), g = val('goal');
      if (b) o.bill_band = b;
      if (g) o.goal = g;
      o.has_utility = !!val('utility');
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      return o;
    }
    function startEvent() {
      if (state.started) return;
      state.started = true;
      track(isCompare ? 'quote_compare_start' : 'contact_form_start', { form_id: source, lead_type: leadType });
    }
    form.addEventListener('focusin', startEvent);
    form.addEventListener('input', startEvent);

    // Stage 1 -> 2 (progressive disclosure)
    var stage2 = $(form, '[data-stage="2"]'), nextBtn = $(form, '[data-next]');
    if (stage2 && nextBtn) {
      stage2.hidden = true;
      nextBtn.addEventListener('click', function () {
        clearErrors();
        var errs = validateStage1();
        if (Object.keys(errs).length) { showErrors(errs); track('form_error', { form_id: source, lead_type: leadType, error_category: category(errs) }); return; }
        stage2.hidden = false;
        nextBtn.hidden = true;
        var t = $(stage2, '[data-stage-title]');
        if (t) t.focus();
      });
    }

    // ZIP: quietly normalize ZIP+4 and say so
    var zipEl = field('zip'), zipHint = $(form, '[data-zip-note]');
    if (zipEl) zipEl.addEventListener('blur', function () {
      var raw = zipEl.value.trim(), n = normalizeZip(raw);
      if (n && n !== raw) { zipEl.value = n; if (zipHint) zipHint.textContent = 'Using 5-digit ZIP ' + n + '.'; }
      else if (zipHint) zipHint.textContent = '';
    });

    // Goal = compare quote: offer an obvious route without discarding anything
    var goalEl = field('goal'), quoteNote = $(form, '[data-quote-note]');
    function saveDraft() {
      try { sessionStorage.setItem(DRAFT, JSON.stringify({ firstName: val('firstName'), zip: normalizeZip(val('zip')) || val('zip'), billBand: val('billBand'), utility: val('utility'), goal: val('goal') })); } catch (e) { /* storage unavailable */ }
    }
    if (goalEl && quoteNote) {
      goalEl.addEventListener('change', function () { quoteNote.hidden = goalEl.value !== 'compare_quote'; });
      var link = $(quoteNote, 'a');
      if (link) link.addEventListener('click', saveDraft);
    }
    if (isCompare) {
      try {
        var d = JSON.parse(sessionStorage.getItem(DRAFT) || 'null');
        if (d) {
          ['firstName', 'zip', 'utility'].forEach(function (k) { var el = field(k); if (el && !el.value && d[k]) el.value = d[k]; });
        }
      } catch (e) { /* ignore bad draft */ }
    }

    function payload() {
      var attr = null;
      try { attr = window.swpAttribution && window.swpAttribution.get ? window.swpAttribution.get() : null; } catch (e) { attr = null; }
      return {
        submissionKey: state.key,
        firstName: val('firstName'), lastName: val('lastName'), zip: val('zip'),
        billBand: val('billBand'), goal: val('goal'), utility: val('utility'), concern: val('concern'), message: val('message'),
        preferred: preferred(), email: val('email'), phone: val('phone'),
        consent: !!(field('consent') && field('consent').checked),
        leadType: leadType, formSource: source,
        sourcePage: location.pathname, conversionPage: location.pathname,
        attribution: attr ? { first: attr.first, current: attr.current } : null,
        hp_fax: val('hp_fax')
      };
    }

    function say(msg) { if (status) status.textContent = msg; }

    function uploadFile(kind, file) {
      return postJson(UPLOAD, { action: 'sign', id: state.ref.id, token: state.ref.token, kind: kind, name: file.name, size: file.size, type: file.type }).then(function (s) {
        if (!s.data || !s.data.ok || !s.data.signedUrl) { var e = new Error(s.data && s.data.error || 'upload_failed'); e.category = e.message === 'unsupported_type' || e.message === 'file_too_large' ? e.message : 'upload_failed'; throw e; }
        return fetch(s.data.signedUrl, { method: 'PUT', headers: { 'content-type': file.type || 'application/octet-stream' }, body: file }).then(function (p) {
          if (!p.ok) { var e2 = new Error('upload_failed'); e2.category = 'upload_failed'; throw e2; }
          return postJson(UPLOAD, { action: 'confirm', id: state.ref.id, token: state.ref.token, kind: kind, path: s.data.path, name: file.name });
        }, function () { var e3 = new Error('upload_failed'); e3.category = 'upload_failed'; throw e3; });
      }).then(function (c) {
        if (!c.data || !c.data.ok) { var e = new Error('upload_failed'); e.category = c.data && (c.data.error === 'file_too_large' || c.data.error === 'invalid_file') ? 'unsupported_type' : 'upload_failed'; throw e; }
        track('quote_upload', { form_id: source, lead_type: leadType, file_type: c.data.fileType, size_band: sizeBand(file.size) });
        return c.data;
      });
    }

    function showSuccess() {
      state.submitted = true;
      try { sessionStorage.removeItem(DRAFT); } catch (e) { /* ignore */ }
      form.hidden = true;
      if (successEl) { successEl.hidden = false; var h = $(successEl, '[data-success-title]'); if (h) h.focus(); }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.busy || state.submitted) return;
      clearErrors();
      var errs = validateAll();
      track('form_submit_attempt', { form_id: source, lead_type: leadType });
      if (Object.keys(errs).length) {
        showErrors(errs);
        track('form_error', { form_id: source, lead_type: leadType, error_category: category(errs) });
        return;
      }
      state.busy = true;
      setBusy(submitBtn, true, 'Sending…');
      say('Sending your request…');
      if (!state.key) state.key = uuid().replace(/[^A-Za-z0-9_-]/g, '') + Date.now().toString(36);
      var file = isCompare ? fileInput.files[0] : null;
      var fail = function (cat) {
        state.busy = false;
        setBusy(submitBtn, false);
        say('');
        var key = cat === 'rate_limited' ? 'rate_limited' : cat === 'network_timeout' ? 'network_timeout' : 'server_error';
        if (summary) { summary.innerHTML = '<p class="swp-form__summary-title">' + MSG[key].replace(/</g, '&lt;') + '</p>'; summary.hidden = false; summary.focus(); }
        track('form_error', { form_id: source, lead_type: leadType, error_category: key });
      };
      postJson(ENDPOINT, payload()).then(function (r) {
        var d = r.data || {};
        if (r.status === 400 && d.fields) {
          state.busy = false; setBusy(submitBtn, false); say('');
          var mapped = {};
          Object.keys(d.fields).forEach(function (k) { mapped[k === 'form' ? 'firstName' : k] = d.fields[k] === 'invalid_form' ? 'server_error' : d.fields[k]; });
          showErrors(mapped);
          track('form_error', { form_id: source, lead_type: leadType, error_category: category(mapped) });
          return;
        }
        if (r.status === 429) return fail('rate_limited');
        if (!d.ok || d.id == null) return fail('server_error');
        state.ref = d.token ? { id: d.id, token: d.token } : null;
        var done = function (uploaded) {
          var p = ctx({ has_upload: uploaded });
          track(isCompare ? 'quote_compare_submit' : 'contact_form_submit', p);
        };
        if (isCompare && state.ref) {
          say('Your information was received. Uploading your quote…');
          return uploadFile('quote', file).then(function () {
            done(true); state.busy = false; showSuccess();
          }, function (err) {
            done(false); state.busy = false; showSuccess();
            showCompareUploadRetry(err && err.category || 'upload_failed');
          });
        }
        done(false); state.busy = false; showSuccess();
      }, function (err) { fail(err && err.category); });
    });

    function showCompareUploadRetry(cat) {
      var box = successEl && $(successEl, '[data-upload-retry]');
      if (!box) return;
      var msg = box.querySelector('[data-retry-msg]');
      if (msg) msg.textContent = (cat === 'unsupported_type' ? MSG.unsupported_type + ' ' : '') + 'Your information was received, but the quote file did not upload. You can try again or continue without it.';
      box.hidden = false;
      var title = $(successEl, '[data-success-title]');
      if (title) title.textContent = 'We Have Your Request. One More Step.';
    }

    // Post-submit enrichment + retry (shared markup in the success state)
    if (successEl) {
      $$(successEl, '[data-enrich]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var which = btn.getAttribute('data-enrich');
          track('enrichment_select', { form_id: source, lead_type: leadType, enrichment: which });
          var panel = $(successEl, '[data-panel="' + which + '"]');
          if (which === 'done') { $$(successEl, '[data-panel]').forEach(function (p) { p.hidden = true; }); if (panel) { panel.hidden = false; panel.focus(); } return; }
          if (panel) { $$(successEl, '[data-panel]').forEach(function (p) { p.hidden = p !== panel; }); panel.hidden = false; var f = panel.querySelector('input'); if (f) f.focus(); }
        });
      });
      $$(successEl, 'a[data-enrich-link]').forEach(function (a) {
        a.addEventListener('click', function () {
          var which = a.getAttribute('data-enrich-link');
          track('enrichment_select', { form_id: source, lead_type: leadType, enrichment: which });
          if (which === 'existing_quote' && state.ref) {
            try { fetch(ENDPOINT, { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'enrich', id: state.ref.id, token: state.ref.token, existingQuote: true }) }); } catch (e) { /* best effort */ }
          }
        });
      });
      var panelMsg = function (panel, text, ok) { var m = $(panel, '[data-panel-msg]'); if (m) { m.textContent = text; m.className = 'swp-form__panel-msg ' + (ok ? 'is-ok' : 'is-warn'); } };
      var billPanel = $(successEl, '[data-panel="bill"]');
      if (billPanel) $(billPanel, '[data-go]').addEventListener('click', function () {
        var btn = this, f = $(billPanel, 'input[type="file"]').files[0], p = fileProblem(f);
        if (p) { panelMsg(billPanel, MSG[p === 'missing_file' ? 'missing_file' : p].replace('solar quote file', 'electric bill'), false); return; }
        if (!state.ref) { panelMsg(billPanel, 'Your information was received, but the file did not upload. You can try again or continue without it.', false); return; }
        setBusy(btn, true, 'Uploading…');
        uploadFile('bill', f).then(function () { setBusy(btn, false); panelMsg(billPanel, 'Your electric bill was added. Thank you.', true); },
          function () { setBusy(btn, false); panelMsg(billPanel, 'Your information was received, but the file did not upload. You can try again or continue without it.', false); });
      });
      var addrPanel = $(successEl, '[data-panel="address"]');
      if (addrPanel) $(addrPanel, '[data-go]').addEventListener('click', function () {
        var btn = this, a = String($(addrPanel, 'input').value || '').trim();
        if (a.length < 8) { panelMsg(addrPanel, 'Please enter your street address, city and ZIP.', false); return; }
        if (!state.ref) { panelMsg(addrPanel, 'Your information was received, but the address was not saved. You can try again or continue without it.', false); return; }
        setBusy(btn, true, 'Saving…');
        postJson(ENDPOINT, { action: 'enrich', id: state.ref.id, token: state.ref.token, propertyAddress: a }).then(function (r) {
          setBusy(btn, false);
          panelMsg(addrPanel, r.data && r.data.ok ? 'Your property address was added. Thank you.' : 'Your information was received, but the address was not saved. You can try again or continue without it.', !!(r.data && r.data.ok));
        }, function () { setBusy(btn, false); panelMsg(addrPanel, 'Your information was received, but the address was not saved. You can try again or continue without it.', false); });
      });
      var retry = $(successEl, '[data-upload-retry]');
      if (retry) $(retry, '[data-go]').addEventListener('click', function () {
        var btn = this, f = $(retry, 'input[type="file"]').files[0], p = fileProblem(f), msg = $(retry, '[data-retry-msg]');
        if (p) { msg.textContent = MSG[p]; return; }
        setBusy(btn, true, 'Uploading…');
        uploadFile('quote', f).then(function () {
          setBusy(btn, false);
          msg.textContent = 'Your quote file was added. Thank you.';
          var title = $(successEl, '[data-success-title]'); if (title) title.textContent = 'We Received Your Quote.';
          var inputs = $(retry, '[data-retry-inputs]'); if (inputs) inputs.hidden = true;
        }, function () { setBusy(btn, false); msg.textContent = 'Your information was received, but the file did not upload. You can try again or continue without it.'; });
      });
    }
  }

  $$(document, 'form[data-swp-intake]').forEach(init);

  // Restrained mobile action bar (home only): appears after the hero, hides while the form is in view or a field has focus.
  var bar = document.querySelector('[data-mobile-bar]');
  if (bar && 'IntersectionObserver' in window) {
    var hero = document.querySelector('[data-hero]'), formSec = document.querySelector('[data-form-section]');
    var past = false, inForm = false, typing = false;
    var update = function () { var show = past && !inForm && !typing; bar.classList.toggle('is-visible', show); document.body.classList.toggle('swp-has-bar', show); };
    if (hero) new IntersectionObserver(function (es) { past = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; update(); }, { threshold: 0 }).observe(hero);
    if (formSec) new IntersectionObserver(function (es) { inForm = es[0].isIntersecting; update(); }, { threshold: 0 }).observe(formSec);
    document.addEventListener('focusin', function (e) { typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName); update(); });
    document.addEventListener('focusout', function () { typing = false; update(); });
  }
})();
