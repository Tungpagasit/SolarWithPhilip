'use strict';
/* Internal lead notifications for lead_intake, sent through hidden Netlify Forms (recipients are set in the Netlify dashboard, never in code).
   Best effort only: the database is the source of truth, so every failure is logged (status only, no secrets) and swallowed.
   Never includes enrich_token, submission_key, raw attribution, storage paths (outside a signed URL) or credentials. */

const BUCKET = 'proposal-uploads';
const SIGNED_SECONDS = 1209600; // 14 days
const FORM_PATH = '/form-registry.html';
const TIMEOUT_MS = 5000;

const BILL = { lt150: 'Under $150', '150_249': '$150-$249', '250_349': '$250-$349', '350_499': '$350-$499', '500_749': '$500-$749', '750_plus': '$750 or more', not_sure: 'Not sure' };
const UTILITY = { pge: 'PG&E', sce: 'SCE', sdge: 'SDG&E', smud: 'SMUD', other: 'Other', not_sure: 'Not sure' };
const GOAL = { lower_costs: 'Lower my electric costs', solar: 'Solar', solar_battery: 'Solar + battery', backup: 'Backup power', add_replace: 'Add to or replace an existing system', compare_quote: 'Compare a quote I already have', not_sure: 'Not sure' };
const CONCERN = { price: 'Price', size_production: 'System size / production', battery: 'Battery', equipment: 'Equipment', financing: 'Financing', lease_ppa: 'Lease / PPA', multiple: 'Multiple concerns', contract_terms: 'Contract terms', everything: 'Everything', not_sure: 'Not sure' };
const LEAD_TYPE = { get_started: 'Get Started', quote_compare: 'Compare My Quote' };
const SOURCE = { homepage_primary: 'Homepage form', get_started_page: 'Get Started page', compare_my_quote: 'Compare My Quote page' };

let origin = '';
// Runtime has no DEPLOY_PRIME_URL; trust the request host only for this site's own domain or its branch/preview subdomains.
function setOrigin(headers) {
  origin = '';
  const h = String((headers && (headers['x-forwarded-host'] || headers.host)) || '').split(',')[0].trim().toLowerCase();
  let own = ''; try { own = new URL(process.env.URL || '').host.toLowerCase(); } catch (e) { /* unset */ }
  if (h && (h === own || /^[a-z0-9-]+--solarwithphilip\.netlify\.app$/.test(h))) origin = 'https://' + h;
}
const base = () => String(origin || process.env.DEPLOY_PRIME_URL || process.env.URL || '').replace(/\/+$/, '');
const clean = v => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const pacific = d => { try { return new Date(d).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' }) + ' Pacific'; } catch (e) { return String(d); } };
function prettyPhone(p) { const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(p || ''); return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (p || ''); }

async function postForm(name, fields) {
  const root = base();
  if (!root) { console.error('notify failed:', name, 'no_site_url'); return false; }
  const body = new URLSearchParams({ 'form-name': name });
  Object.keys(fields).forEach(k => { const v = fields[k]; if (v !== '' && v != null) body.append(k, String(v)); });
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  try {
    const r = await fetch(root + FORM_PATH, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Mozilla/5.0 (compatible; SolarWithPhilip-Notify/1.0; +https://solarwithphilip.com)', referer: root + '/', origin: root }, body: body.toString(), redirect: 'manual', signal: ctl ? ctl.signal : undefined });
    const ok = r.status >= 200 && r.status < 400;
    if (!ok) console.error('notify failed:', name, 'status=' + r.status);
    return ok;
  } catch (e) {
    console.error('notify failed:', name, e && e.name === 'AbortError' ? 'timeout' : 'network');
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function signDownload(url, key, path) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  try {
    const r = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path}`, { method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ expiresIn: SIGNED_SECONDS }), signal: ctl ? ctl.signal : undefined });
    if (!r.ok) { console.error('notify sign failed: status=' + r.status); return ''; }
    const d = await r.json();
    return d && d.signedURL ? `${url}/storage/v1${d.signedURL}` : '';
  } catch (e) {
    console.error('notify sign failed:', e && e.name === 'AbortError' ? 'timeout' : 'network');
    return '';
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function notifyNewLead(row, saved) {
  try {
    const first = clean(row.first_name), zip = clean(row.zip);
    const subject = `${row.lead_type === 'quote_compare' ? 'New Quote Review Lead' : 'New Get Started Lead'} - ${first} - ${zip}`;
    const created = (saved && saved.created_at) || new Date().toISOString();
    return await postForm('swp-new-lead', {
      subject,
      name: [first, clean(row.last_name)].filter(Boolean).join(' '),
      preferred_contact: row.preferred_contact === 'phone' ? 'Phone' : 'Email',
      phone: prettyPhone(row.phone_normalized),
      email: clean(row.email_normalized),
      zip,
      primary_goal: GOAL[row.primary_goal] || '',
      utility: UTILITY[row.utility] || '',
      electricity_bill_range: BILL[row.bill_band] || '',
      existing_quote: row.existing_quote ? 'Yes' : 'No',
      review_concern: CONCERN[row.review_concern] || '',
      property_address: clean(row.property_address),
      message: clean(row.message),
      quote_uploaded: row.quote_upload_path ? 'Yes' : 'No',
      bill_uploaded: row.bill_upload_path ? 'Yes' : 'No',
      upload_note: 'Files uploaded after this request arrive in a separate Document Added email.',
      intake_id: saved && saved.id != null ? String(saved.id) : '',
      submitted_at: pacific(created),
      lead_type: LEAD_TYPE[row.lead_type] || '',
      form_source: SOURCE[row.form_source] || '',
      source_page: clean(row.source_page),
      conversion_page: clean(row.conversion_page),
      lead_status: 'New'
    });
  } catch (e) {
    console.error('notify failed: swp-new-lead', 'error');
    return false;
  }
}

async function notifyDocument(url, key, lead, kind, path) {
  try {
    const link = await signDownload(url, key, path);
    if (!link) return false;
    const label = kind === 'quote' ? 'Solar Proposal' : 'Electric Bill';
    const first = clean(lead.first_name), zip = clean(lead.zip);
    const fields = {
      subject: `Document Added - ${first} - ${zip} - ${label}`,
      intake_id: String(lead.id),
      name: [first, clean(lead.last_name)].filter(Boolean).join(' '),
      email: clean(lead.email_normalized),
      phone: prettyPhone(lead.phone_normalized),
      zip,
      document_type: label,
      uploaded_at: pacific(new Date().toISOString())
    };
    fields[kind === 'quote' ? 'download_solar_proposal' : 'download_electric_bill'] = link;
    fields.link_note = 'Private link, expires in 14 days.';
    return await postForm('swp-document-added', fields);
  } catch (e) {
    console.error('notify failed: swp-document-added', 'error');
    return false;
  }
}

module.exports = { setOrigin, notifyNewLead, notifyDocument, signDownload, SIGNED_SECONDS, FORM_PATH };
