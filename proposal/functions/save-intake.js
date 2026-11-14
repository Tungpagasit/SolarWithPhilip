'use strict';
/* Phase 2B: homeowner intake (Get Started / Compare My Quote). Writes ONLY to public.lead_intake.
   Same Supabase REST + env-var pattern as the other functions (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
   Never touches public.solar_leads. Never returns Supabase errors to the browser. */

const { notifyNewLead, setOrigin } = require('./_lib/notify');

const json = (statusCode, value) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(value) });

const CONSENT_VERSION = 'draft-2026-11-v3';
const PRIVACY_VERSION = 'draft-2026-11-v3';
const ENUMS = {
  preferred: ['email', 'phone'],
  utility: ['pge', 'sce', 'sdge', 'smud', 'other', 'not_sure'],
  bill: ['lt150', '150_249', '250_349', '350_499', '500_749', '750_plus', 'not_sure'],
  goal: ['lower_costs', 'solar', 'solar_battery', 'backup', 'add_replace', 'compare_quote', 'not_sure'],
  concern: ['price', 'size_production', 'battery', 'equipment', 'financing', 'lease_ppa', 'multiple', 'contract_terms', 'everything', 'not_sure'],
  leadType: ['get_started', 'quote_compare'],
  source: ['homepage_primary', 'get_started_page', 'compare_my_quote']
};
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'lp_id', 'lp_version', 'lp_key', 'lp_cta'];
const MAX_BODY = 20000;
const IP_LIMIT = 8, IP_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_LIMIT = 5, CONTACT_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map();

const str = (v, max) => (v == null ? '' : String(v)).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const oneOf = (v, list) => (list.includes(String(v == null ? '' : v)) ? String(v) : '');

function normalizeEmail(v) {
  const e = str(v, 254).toLowerCase();
  return /^[^\s@,()<>"';:\\]+@[^\s@,()<>"';:\\]+\.[^\s@,()<>"';:\\]{2,}$/.test(e) ? e : '';
}
function normalizePhone(v) {
  let d = String(v == null ? '' : v).replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(d) ? '+1' + d : '';
}
function normalizeZip(v) {
  const m = String(v == null ? '' : v).trim().match(/^(\d{5})(?:-?\d{4})?$/);
  return m ? m[1] : '';
}
function cleanAttribution(a) {
  if (!a || typeof a !== 'object') return null;
  const params = {};
  const src = a.params && typeof a.params === 'object' ? a.params : {};
  ATTR_KEYS.forEach(k => { const v = str(src[k], 100).replace(/[^A-Za-z0-9_.\-~+ %]/g, ''); if (v) params[k] = v; });
  const path = typeof a.landing_path === 'string' && a.landing_path[0] === '/' ? str(a.landing_path, 200).split(/[?#]/)[0] : null;
  return { v: Number(a.v) || 1, ts: Number.isFinite(Number(a.ts)) ? Number(a.ts) : null, params, landing_path: path };
}
function cleanPath(v) { const s = str(v, 200); return s[0] === '/' ? s.split(/[?#]/)[0] : ''; }

function validate(p) {
  const f = {};
  const first = str(p.firstName, 60);
  if (!first) f.firstName = 'missing_name';
  const zip = normalizeZip(p.zip);
  if (!zip) f.zip = p.zip ? 'invalid_zip' : 'missing_zip';
  const preferred = oneOf(p.preferred, ENUMS.preferred);
  if (!preferred) f.preferred = 'missing_contact';
  const emailRaw = str(p.email, 254), phoneRaw = str(p.phone, 40);
  const email = normalizeEmail(emailRaw), phone = normalizePhone(phoneRaw);
  if (emailRaw && !email) f.email = 'invalid_email';
  if (phoneRaw && !phone) f.phone = 'invalid_phone';
  const needEmail = preferred === 'email';
  const needPhone = preferred === 'phone';
  if (needEmail && !emailRaw) f.email = 'missing_contact';
  if (needPhone && !phoneRaw) f.phone = 'missing_contact';
  if (!email && !phone && !f.email && !f.phone) f.preferred = 'missing_contact';
  const leadType = oneOf(p.leadType, ENUMS.leadType), source = oneOf(p.formSource, ENUMS.source);
  if (!leadType || !source) f.form = 'invalid_form';
  if (leadType === 'quote_compare' && source !== 'compare_my_quote') f.form = 'invalid_form';
  if (leadType === 'get_started' && source === 'compare_my_quote') f.form = 'invalid_form';
  if (p.consent !== true) f.consent = 'missing_consent';
  const key = str(p.submissionKey, 80);
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(key)) f.form = 'invalid_form';
  if (Object.keys(f).length) return { fields: f };
  const row = {
    submission_key: key,
    first_name: first,
    preferred_contact: preferred,
    zip,
    lead_type: leadType,
    form_source: source,
    existing_quote: leadType === 'quote_compare' || oneOf(p.goal, ENUMS.goal) === 'compare_quote',
    consent_text_version: CONSENT_VERSION,
    privacy_version: PRIVACY_VERSION,
    consent_contact_methods: preferred
  };
  const last = str(p.lastName, 60);
  if (last) row.last_name = last;
  if (email) row.email_normalized = email;
  if (phone) row.phone_normalized = phone;
  const utility = oneOf(p.utility, ENUMS.utility), bill = oneOf(p.billBand, ENUMS.bill), goal = oneOf(p.goal, ENUMS.goal), concern = oneOf(p.concern, ENUMS.concern);
  if (utility) row.utility = utility;
  if (bill) row.bill_band = bill;
  if (goal) row.primary_goal = goal;
  if (concern) row.review_concern = concern;
  const message = str(p.message, 500);
  if (message) row.message = message;
  const sp = cleanPath(p.sourcePage), cp = cleanPath(p.conversionPage);
  if (sp) row.source_page = sp;
  if (cp) row.conversion_page = cp;
  const first1 = cleanAttribution(p.attribution && p.attribution.first), cur = cleanAttribution(p.attribution && p.attribution.current);
  if (first1) { row.attribution_first = first1; if (first1.landing_path) row.landing_path = first1.landing_path; }
  if (cur) row.attribution_current = cur;
  return { row };
}

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < IP_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) for (const [k, v] of hits) if (!v.some(t => now - t < IP_WINDOW_MS)) hits.delete(k);
  return arr.length > IP_LIMIT;
}

async function fail(code, r) {
  let d = '';
  try { d = (await r.text()).slice(0, 300); } catch (e) {}
  return new Error(code + ' status=' + r.status + ' ' + d);
}

function rest(url, key) {
  const headers = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  const base = `${url}/rest/v1/lead_intake`;
  return {
    async select(query) {
      const r = await fetch(`${base}?${query}`, { headers });
      if (!r.ok) throw await fail('select_failed', r);
      return r.json();
    },
    async insert(row) {
      const r = await fetch(`${base}?select=id,enrich_token,created_at`, { method: 'POST', headers: { ...headers, prefer: 'return=representation' }, body: JSON.stringify(row) });
      if (r.status === 409) return { conflict: true };
      if (!r.ok) throw await fail('insert_failed', r);
      const rows = await r.json();
      return { row: rows && rows[0] };
    },
    async patch(filter, row) {
      const r = await fetch(`${base}?${filter}&select=id`, { method: 'PATCH', headers: { ...headers, prefer: 'return=representation' }, body: JSON.stringify(row) });
      if (!r.ok) throw await fail('patch_failed', r);
      return r.json();
    }
  };
}

async function create(db, p, ip) {
  if (str(p.hp_fax, 100)) return json(200, { ok: true, id: 0 });
  const v = validate(p);
  if (v.fields) return json(400, { ok: false, error: 'invalid', fields: v.fields });
  const row = v.row;
  const existing = await db.select(`select=id,enrich_token&submission_key=eq.${encodeURIComponent(row.submission_key)}&limit=1`);
  if (existing && existing[0]) return json(200, { ok: true, id: existing[0].id, token: existing[0].enrich_token, duplicate: true });
  if (limited(ip)) return json(429, { ok: false, error: 'rate_limited' });
  const since = encodeURIComponent(new Date(Date.now() - CONTACT_WINDOW_MS).toISOString());
  for (const [col, val] of [['email_normalized', row.email_normalized], ['phone_normalized', row.phone_normalized]]) {
    if (!val) continue;
    const recent = await db.select(`select=id&${col}=eq.${encodeURIComponent(val)}&created_at=gte.${since}&limit=${CONTACT_LIMIT + 1}`);
    if (recent && recent.length >= CONTACT_LIMIT) return json(429, { ok: false, error: 'rate_limited' });
  }
  let out = await db.insert(row);
  const fresh = !out.conflict;
  if (out.conflict) {
    const again = await db.select(`select=id,enrich_token&submission_key=eq.${encodeURIComponent(row.submission_key)}&limit=1`);
    out = { row: again && again[0] };
  }
  if (!out.row || out.row.id == null) throw new Error('no_id');
  if (fresh) await notifyNewLead(row, out.row);
  return json(200, { ok: true, id: out.row.id, token: out.row.enrich_token });
}

async function enrich(db, p) {
  const id = String(p.id == null ? '' : p.id), token = String(p.token == null ? '' : p.token);
  if (!/^\d{1,18}$/.test(id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return json(400, { ok: false, error: 'invalid' });
  const row = {};
  const addr = str(p.propertyAddress, 200);
  if (p.propertyAddress != null && addr.length < 8) return json(400, { ok: false, error: 'invalid', fields: { propertyAddress: 'invalid_address' } });
  if (addr) row.property_address = addr;
  if (p.existingQuote === true) row.existing_quote = true;
  if (!Object.keys(row).length) return json(400, { ok: false, error: 'invalid' });
  row.updated_at = new Date().toISOString();
  const rows = await db.patch(`id=eq.${id}&enrich_token=eq.${encodeURIComponent(token)}`, row);
  if (!rows || !rows[0]) return json(404, { ok: false, error: 'not_found' });
  return json(200, { ok: true });
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  setOrigin(event.headers);
  try {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('not_configured');
    if (String(event.body || '').length > MAX_BODY) return json(413, { ok: false, error: 'too_large' });
    let p;
    try { p = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { ok: false, error: 'invalid_json' }); }
    if (!p || typeof p !== 'object') return json(400, { ok: false, error: 'invalid_json' });
    const h = event.headers || {};
    const ip = String(h['x-nf-client-connection-ip'] || h['client-ip'] || String(h['x-forwarded-for'] || '').split(',')[0] || 'unknown').trim();
    const db = rest(url, key);
    return p.action === 'enrich' ? await enrich(db, p) : await create(db, p, ip);
  } catch (e) {
    console.error('save-intake failed:', e && e.message);
    return json(500, { ok: false, error: 'server_error' });
  }
};
exports._test = { validate, normalizePhone, normalizeEmail, normalizeZip, hits, CONSENT_VERSION, PRIVACY_VERSION };
