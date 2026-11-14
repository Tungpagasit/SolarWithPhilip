#!/usr/bin/env node
/* Development-only mock-fetch tests for proposal/functions/save-intake.js and intake-upload.js. No network, no Supabase.
   Usage: node scripts/test-intake-functions.js */
'use strict';
const path = require('path');
process.env.SUPABASE_URL = 'https://mock.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
process.env.DEPLOY_PRIME_URL = 'https://mock.site.test';
const save = require(path.resolve(__dirname, '../proposal/functions/save-intake.js'));
const up = require(path.resolve(__dirname, '../proposal/functions/intake-upload.js'));

let pass = 0, fail = 0;
const t = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log('FAIL', name, detail || ''); } };
const TOKEN = '11111111-2222-3333-4444-555555555555';
const ev = (body, extra) => ({ httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': '1.2.3.' + (Math.random() * 250 | 0) }, body: JSON.stringify(body), ...extra });
const good = o => ({ firstName: 'Ana', zip: '95667-1234', preferred: 'email', email: ' Ana@Example.COM ', phone: '(916) 555-0123', consent: true, leadType: 'get_started', formSource: 'get_started_page', submissionKey: 'abcdefghijklmnop1234', billBand: '250_349', goal: 'solar', utility: 'pge', ...o });

let calls, db;
function mock() {
  calls = [];
  db = { rows: [], objects: {} };
  global.fetch = async (url, opts = {}) => {
    const m = opts.method || 'GET';
    calls.push({ url, m, body: opts.body, headers: opts.headers });
    const res = (status, data, raw) => ({ ok: status < 300, status, json: async () => data, arrayBuffer: async () => raw || new ArrayBuffer(0), headers: { get: k => (k === 'content-range' && raw ? `bytes 0-${raw.byteLength - 1}/${db.total || raw.byteLength}` : null) } });
    if (url.includes('/rest/v1/lead_intake')) {
      if (m === 'POST') { const r = JSON.parse(opts.body); if (db.rows.find(x => x.submission_key === r.submission_key)) return res(409, {}); const row = { id: db.rows.length + 1, enrich_token: TOKEN, ...r }; db.rows.push(row); return res(201, [row]); }
      if (m === 'PATCH') { db.patched = JSON.parse(opts.body); return res(200, db.noMatch ? [] : [{ id: 1 }]); }
      if (url.includes('submission_key=eq.')) { const k = decodeURIComponent(/submission_key=eq\.([^&]+)/.exec(url)[1]); return res(200, db.rows.filter(r => r.submission_key === k).map(r => ({ id: r.id, enrich_token: r.enrich_token }))); }
      if (/select=id[,&][^ ]*id=eq\./.test(url)) return res(200, db.owner === false ? [] : [{ id: 1, first_name: 'Ana', last_name: 'Lopez', zip: '95667', email_normalized: 'ana@example.com', phone_normalized: '+19165550123', quote_upload_path: db.priorPath || null, bill_upload_path: null }]);
      return res(200, db.recent || []);
    }
    if (url.startsWith('https://mock.site.test/')) { db.forms = db.forms || []; db.forms.push({ url, body: new URLSearchParams(opts.body), redirect: opts.redirect }); return db.formFail ? res(500, {}) : res(200, {}); }
    if (url.includes('/object/sign/proposal-uploads/')) return db.signFail ? res(500, {}) : res(200, { signedURL: '/object/sign/proposal-uploads/' + url.split('/object/sign/proposal-uploads/')[1] + '?token=SIGNEDTOKEN' });
    if (url.includes('/object/upload/sign/')) return res(200, { url: '/object/upload/sign/proposal-uploads/x?token=t' });
    if (url.includes('/storage/v1/object/proposal-uploads/') && m === 'GET') return res(200, null, db.bytes);
    if (url.includes('/storage/v1/object/proposal-uploads/') && m === 'DELETE') { db.deleted = true; return res(200, {}); }
    return res(500, {});
  };
}
const body = r => JSON.parse(r.body);

(async () => {
  mock();
  t('405 non-POST', (await save.handler({ httpMethod: 'GET' })).statusCode === 405);
  t('405 upload non-POST', (await up.handler({ httpMethod: 'GET' })).statusCode === 405);

  let r = await save.handler(ev(good()));
  t('create ok', r.statusCode === 200 && body(r).ok && body(r).id === 1 && body(r).token === TOKEN, r.body);
  const row = db.rows[0];
  t('normalized email/phone/zip', row.email_normalized === 'ana@example.com' && row.phone_normalized === '+19165550123' && row.zip === '95667', JSON.stringify(row));
  t('consent versions stored', row.consent_text_version === save._test.CONSENT_VERSION && !!row.privacy_version);
  t('no unexpected columns', Object.keys(row).every(k => /^(id|enrich_token|submission_key|first_name|last_name|email_normalized|phone_normalized|preferred_contact|zip|utility|bill_band|primary_goal|existing_quote|review_concern|lead_type|form_source|source_page|conversion_page|landing_path|message|attribution_first|attribution_current|consent_text_version|privacy_version|consent_contact_methods)$/.test(k)), Object.keys(row).join());
  t('service key sent as bearer only server-side', calls.every(c => !/mock-service-key/.test(c.body || '')));

  r = await save.handler(ev(good()));
  t('idempotent duplicate returns same id, one row', body(r).id === 1 && db.rows.length === 1, r.body);

  r = await save.handler(ev(good({ submissionKey: 'zzzzzzzzzzzzzzzz9999', hp_fax: 'bot' })));
  t('honeypot silent ok, nothing inserted', body(r).ok && body(r).id === 0 && db.rows.length === 1);

  for (const [name, over, field] of [
    ['missing name', { firstName: '' }, 'firstName'], ['bad zip', { zip: '123' }, 'zip'], ['no consent', { consent: false }, 'consent'],
    ['bad email', { email: 'nope' }, 'email'], ['email required for email pref', { preferred: 'email', email: '' }, 'email'],
    ['phone required for phone pref', { preferred: 'phone', phone: '' }, 'phone'], ['text no longer accepted', { preferred: 'text' }, 'preferred'], ['email_text no longer accepted', { preferred: 'email_text' }, 'preferred'], ['bad preferred', { preferred: 'carrier_pigeon' }, 'preferred'],
    ['compare type wrong source', { leadType: 'quote_compare', formSource: 'get_started_page' }, 'form'], ['short key', { submissionKey: 'short' }, 'form'],
    ['consent string not true', { consent: 'true' }, 'consent']]) {
    r = await save.handler(ev(good({ submissionKey: 'v' + Math.random().toString(36).slice(2, 20).padEnd(16, 'x'), ...over })));
    t('reject ' + name, r.statusCode === 400 && body(r).fields && body(r).fields[field], r.body);
  }
  for (const [pref, needE, needP] of [['email', true, false], ['phone', false, true]]) {
    const k = () => 'm' + Math.random().toString(36).slice(2, 20).padEnd(16, 'x');
    const only = (e, ph) => ({ preferred: pref, email: e ? 'a@example.com' : '', phone: ph ? '916-555-0123' : '' });
    const vOk = save._test.validate(good({ submissionKey: k(), ...only(true, true) }));
    t('contact ' + pref + ': both supplied accepted', !!vOk.row, JSON.stringify(vOk.fields));
    const vE = save._test.validate(good({ submissionKey: k(), ...only(false, true) }));
    t('contact ' + pref + ': email-less ' + (needE ? 'rejected' : 'accepted'), needE ? !!(vE.fields && vE.fields.email) : !!vE.row, JSON.stringify(vE.fields));
    const vP = save._test.validate(good({ submissionKey: k(), ...only(true, false) }));
    t('contact ' + pref + ': phone-less ' + (needP ? 'rejected' : 'accepted'), needP ? !!(vP.fields && vP.fields.phone) : !!vP.row, JSON.stringify(vP.fields));
  }
  t('invalid enum values dropped not stored', (() => { const v = save._test.validate(good({ billBand: 'DROP TABLE', utility: 'x', goal: '<script>' })); return v.row && !v.row.bill_band && !v.row.utility && !v.row.primary_goal; })());
  const v = save._test.validate(good({ attribution: { first: { utm_source: 'g', email: 'a@b.c', gclid: 'x'.repeat(500) }, current: { utm_medium: 'cpc', evil: 1 } }, sourcePage: 'https://evil.example/x', conversionPage: '/get-started/?e=a@b.c' }));
  t('attribution whitelisted and PII keys dropped', v.row && v.row.attribution_first && !('email' in v.row.attribution_first) && !('evil' in (v.row.attribution_current || {})), JSON.stringify(v.row && v.row.attribution_first));
  t('source page absolute URL dropped; query stripped', v.row && !v.row.source_page && v.row.conversion_page === '/get-started/');
  t('phone normalization', save._test.normalizePhone('916-555-0123') === '+19165550123' && !save._test.normalizePhone('12') && save._test.normalizePhone('+1 (916) 555 0123') === '+19165550123');

  r = await save.handler(ev(good({ submissionKey: 'qqqqqqqqqqqqqqqq1111', leadType: 'quote_compare', formSource: 'compare_my_quote', concern: 'battery', preferred: 'email', phone: '' })));
  t('compare create sets existing_quote', body(r).ok && db.rows[db.rows.length - 1].existing_quote === true, r.body);

  r = await save.handler({ httpMethod: 'POST', headers: {}, body: '{bad' });
  t('bad json 400 generic', r.statusCode === 400 && !/Unexpected/.test(r.body));
  r = await save.handler({ httpMethod: 'POST', headers: {}, body: 'x'.repeat(40000) });
  t('oversize 413', r.statusCode === 413);

  // rate limits
  mock(); db.recent = [{}, {}, {}, {}, {}, {}];
  r = await save.handler(ev(good({ submissionKey: 'rate1rate1rate1rate1' })));
  t('per-contact DB limit 429', r.statusCode === 429, r.body);
  mock(); save._test.hits.clear();
  const sameIp = { 'x-nf-client-connection-ip': '9.9.9.9' };
  let last;
  for (let i = 0; i < 10; i++) last = await save.handler({ httpMethod: 'POST', headers: sameIp, body: JSON.stringify(good({ submissionKey: 'ip' + i + 'ipipipipipipipip', email: `u${i}@example.com`, phone: `91655501${10 + i}` })) });
  t('per-IP limit 429', last.statusCode === 429, String(last.statusCode));

  // errors never leak
  mock(); global.fetch = async () => ({ ok: false, status: 500, json: async () => ({ message: 'SECRET relation lead_intake does not exist' }) });
  r = await save.handler(ev(good({ submissionKey: 'err1err1err1err1err1' })));
  t('supabase failure -> generic 500, no leak', r.statusCode === 500 && !/SECRET|relation|lead_intake/.test(r.body), r.body);
  delete process.env.SUPABASE_URL;
  r = await save.handler(ev(good()));
  t('missing env -> generic 500', r.statusCode === 500 && !/SUPABASE/.test(r.body));
  process.env.SUPABASE_URL = 'https://mock.supabase.test';

  // enrich
  mock();
  r = await save.handler(ev({ action: 'enrich', id: 1, token: TOKEN, propertyAddress: '123 Main St, Loomis CA' }));
  t('enrich ok, patches only address', r.statusCode === 200 && db.patched.property_address && !('first_name' in db.patched), r.body);
  r = await save.handler(ev({ action: 'enrich', id: 1, token: 'not-a-uuid', propertyAddress: '123 Main St' }));
  t('enrich bad token 400', r.statusCode === 400);
  db.noMatch = true;
  r = await save.handler(ev({ action: 'enrich', id: 1, token: TOKEN, propertyAddress: '123 Main St' }));
  t('enrich wrong token -> 404', r.statusCode === 404);
  db.noMatch = false;
  r = await save.handler(ev({ action: 'enrich', id: 1, token: TOKEN, propertyAddress: 'x' }));
  t('enrich short address rejected', r.statusCode === 400);
  r = await save.handler(ev({ action: 'enrich', id: '1; drop', token: TOKEN, propertyAddress: '123 Main St' }));
  t('enrich non-numeric id rejected', r.statusCode === 400);

  // upload sign
  mock();
  const sign = o => up.handler(ev({ action: 'sign', id: 1, token: TOKEN, kind: 'quote', name: 'My Quote.pdf', type: 'application/pdf', size: 1000, ...o }));
  r = await sign();
  t('sign ok random intake path', r.statusCode === 200 && up._test.PATH_RE.test(body(r).path) && /^https:\/\/mock\.supabase\.test\/storage\/v1\//.test(body(r).signedUrl), r.body);
  t('sign: filename never in path', !/My/.test(body(r).path));
  for (const [n, o] of [['exe', { name: 'a.exe', type: 'application/octet-stream' }], ['too big', { size: 11 * 1024 * 1024 }], ['mime mismatch', { name: 'a.pdf', type: 'image/png' }], ['bad kind', { kind: '../x' }], ['zero size', { size: 0 }], ['svg', { name: 'a.svg', type: 'image/svg+xml' }]]) {
    r = await sign(o); t('sign rejects ' + n, r.statusCode === 400, r.body);
  }
  db.owner = false; r = await sign(); t('sign wrong token -> 404', r.statusCode === 404); db.owner = true;

  // confirm
  const bytes = a => Uint8Array.from(a).buffer;
  const path1 = 'intake-uploads/11111111-2222-3333-4444-555555555555/quote.pdf';
  const confirm = o => up.handler(ev({ action: 'confirm', id: 1, token: TOKEN, kind: 'quote', path: path1, name: 'q.pdf', ...o }));
  mock(); db.bytes = bytes([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  r = await confirm();
  t('confirm valid pdf ok + patched', r.statusCode === 200 && /quote_upload_path/.test(JSON.stringify(db.patched || {})) || /quote_upload_path/.test((calls.find(c => c.m === 'PATCH') || {}).body || ''), r.body);
  mock(); db.bytes = bytes([0x4d, 0x5a, 0x90, 0x00]);
  r = await confirm();
  t('confirm rejects mismatched magic bytes and deletes object', r.statusCode === 422 && db.deleted === true, r.body);
  mock(); db.bytes = bytes([0x25, 0x50, 0x44, 0x46]);
  r = await confirm({ path: 'intake-uploads/../../etc/passwd' });
  t('confirm rejects traversal path', r.statusCode === 400);
  r = await confirm({ path: 'proposals/abc/quote.pdf' });
  t('confirm rejects foreign prefix', r.statusCode === 400);
  t('sniff png/jpg/pdf', up._test.sniff(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) === 'png' && up._test.sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0])) === 'jpg' && !up._test.sniff(Buffer.from([1, 2, 3, 4])));

  // notifications
  const FORBIDDEN = /enrich_token|submission_key|attribution|service|mock-service-key|apikey|authorization|jj@|vt@|11111111-2222/i;
  mock();
  r = await save.handler(ev(good({ firstName: 'Ana', lastName: 'Lopez', message: 'Call after 5', attribution: { first: { params: { utm_source: 'g' } } } })));
  t('notify: new lead posts exactly one swp-new-lead form', r.statusCode === 200 && db.forms && db.forms.length === 1 && db.forms[0].body.get('form-name') === 'swp-new-lead' && db.forms[0].url === 'https://mock.site.test/form-registry.html', JSON.stringify(db.forms));
  let nf = db.forms[0].body;
  t('notify: subject without phone/email/address', nf.get('subject') === 'New Get Started Lead - Ana - 95667', nf.get('subject'));
  t('notify: actionable fields first', [...nf.keys()].slice(0, 8).join() === 'form-name,subject,name,preferred_contact,phone,email,zip,primary_goal', [...nf.keys()].join());
  t('notify: field values', nf.get('name') === 'Ana Lopez' && nf.get('preferred_contact') === 'Email' && nf.get('phone') === '(916) 555-0123' && nf.get('email') === 'ana@example.com' && nf.get('electricity_bill_range') === '$250-$349' && nf.get('quote_uploaded') === 'No' && nf.get('bill_uploaded') === 'No' && nf.get('lead_status') === 'New' && nf.get('intake_id') === '1' && !!nf.get('submitted_at') && nf.get('message') === 'Call after 5' && nf.get('utility') === 'PG&E', JSON.stringify([...nf]));
  t('notify: no internal/security data in new-lead email', ![...nf.values()].some(v => FORBIDDEN.test(v)) && ![...nf.keys()].some(k => FORBIDDEN.test(k)), JSON.stringify([...nf]));
  r = await save.handler(ev(good()));
  t('notify: idempotent retry sends no second email', db.forms.length === 1 && body(r).duplicate === true);
  mock(); r = await save.handler(ev(good({ formSource: 'compare_my_quote', leadType: 'quote_compare', submissionKey: 'qqqqqqqqqqqqqqqq0001' })));
  t('notify: compare subject', db.forms[0].body.get('subject') === 'New Quote Review Lead - Ana - 95667' && db.forms[0].body.get('existing_quote') === 'Yes');
  mock(); db.formFail = true; r = await save.handler(ev(good()));
  t('notify: failed notification still saves and returns success', r.statusCode === 200 && body(r).ok && body(r).id === 1 && db.rows.length === 1, r.body);
  mock(); global.fetch = (f => async (u, o) => { if (String(u).startsWith('https://mock.site.test/')) throw new Error('boom'); return f(u, o); })(global.fetch);
  r = await save.handler(ev(good()));
  t('notify: network error does not fail the lead', r.statusCode === 200 && body(r).ok);
  mock(); r = await save.handler(ev(good({ firstName: '' })));
  t('notify: invalid lead sends nothing', r.statusCode === 400 && !db.forms);

  // document added
  const pdf = bytes([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  mock(); db.bytes = pdf; r = await confirm();
  t('doc: confirm posts one swp-document-added', r.statusCode === 200 && db.forms && db.forms.length === 1 && db.forms[0].body.get('form-name') === 'swp-document-added', JSON.stringify(db.forms));
  nf = db.forms[0].body; const link = nf.get('download_solar_proposal') || '';
  t('doc: subject', nf.get('subject') === 'Document Added - Ana - 95667 - Solar Proposal', nf.get('subject'));
  t('doc: fields', nf.get('intake_id') === '1' && nf.get('name') === 'Ana Lopez' && nf.get('email') === 'ana@example.com' && nf.get('phone') === '(916) 555-0123' && nf.get('zip') === '95667' && nf.get('document_type') === 'Solar Proposal' && !!nf.get('uploaded_at'));
  const sc = calls.find(c => c.url.includes('/object/sign/proposal-uploads/'));
  t('doc: signed URL requested server-side for exactly that object, 1,209,600 s', sc && sc.m === 'POST' && sc.url.endsWith('/object/sign/proposal-uploads/' + path1) && JSON.parse(sc.body).expiresIn === 1209600, sc && sc.body);
  t('doc: email link targets only that object', link.startsWith('https://mock.supabase.test/storage/v1/object/sign/proposal-uploads/' + path1 + '?token='));
  t('doc: no credentials or tokens in email', ![...nf.entries()].filter(([k]) => k !== 'download_solar_proposal').some(([, v]) => FORBIDDEN.test(v)) && !link.includes('mock-service-key'));
  mock(); db.bytes = pdf; db.priorPath = path1; r = await confirm();
  t('doc: idempotent re-confirm of same object sends no email', r.statusCode === 200 && !db.forms);
  mock(); db.bytes = pdf; db.formFail = true; r = await confirm();
  t('doc: failed notification keeps upload and returns success', r.statusCode === 200 && body(r).ok);
  mock(); db.bytes = pdf; db.signFail = true; r = await confirm();
  t('doc: signing failure keeps upload, no email, success', r.statusCode === 200 && !db.forms);
  mock(); db.bytes = bytes([0x4d, 0x5a, 0x90, 0x00]); r = await confirm();
  t('doc: rejected file sends no email', r.statusCode === 422 && !db.forms);
  mock(); db.bytes = pdf; r = await up.handler(ev({ action: 'confirm', id: 1, token: TOKEN, kind: 'bill', path: 'intake-uploads/11111111-2222-3333-4444-555555555555/bill.pdf', name: 'b.pdf' }));
  t('doc: electric bill subject/link field', db.forms && db.forms[0].body.get('subject') === 'Document Added - Ana - 95667 - Electric Bill' && !!db.forms[0].body.get('download_electric_bill') && !db.forms[0].body.get('download_solar_proposal'));

  // origin allow-list
  const hostPost = async host => { mock(); const urls = []; const f = global.fetch; global.fetch = async (u, o) => { urls.push(String(u)); return f(u, o); }; await save.handler(ev(good(), { headers: { 'x-nf-client-connection-ip': '1.2.3.4', host } })); const o = urls.filter(u => u.endsWith('/form-registry.html')); setOrigin(); return o; };
  const { setOrigin } = require('../proposal/functions/_lib/notify');
  let o1 = await hostPost('redesign-v2--solarwithphilip.netlify.app');
  t('notify: branch-preview host used as form origin', o1.length === 1 && o1[0] === 'https://redesign-v2--solarwithphilip.netlify.app/form-registry.html', JSON.stringify(o1));
  o1 = await hostPost('evil.example.com');
  t('notify: arbitrary Host header is never used as form origin', o1.length === 1 && o1[0] === 'https://mock.site.test/form-registry.html', JSON.stringify(o1));
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
