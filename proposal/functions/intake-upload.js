'use strict';
/* Phase 2B: private document upload for lead_intake (quote / utility bill). Separate from the protected Proposal bill-upload pipeline.
   Flow: sign (validate request, issue signed upload URL to a randomized private path) -> browser PUTs file -> confirm (server verifies magic bytes + size, then links the path to the intake row).
   Uses the existing private proposal-uploads bucket under the intake-uploads/ prefix. Files are never given public URLs and are not malware-scanned. */
const crypto = require('crypto');
const { notifyDocument } = require('./_lib/notify');

const json = (statusCode, value) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(value) });
const BUCKET = 'proposal-uploads';
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = { pdf: ['application/pdf'], png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'] };
const KINDS = { quote: 'quote', bill: 'bill' };
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PATH_RE = new RegExp(`^intake-uploads/${UUID}/(quote|bill)\\.(pdf|png|jpg)$`);

function cleanName(v) {
  return String(v == null ? '' : v).split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').replace(/[^A-Za-z0-9._ -]/g, '_').replace(/^\.+/, '').trim().slice(0, 120);
}
function extOf(name) { const m = /\.([A-Za-z0-9]+)$/.exec(name); return m ? m[1].toLowerCase() : ''; }
function normExt(e) { return e === 'jpeg' ? 'jpg' : e; }
function sniff(bytes) {
  if (bytes.length >= 5 && bytes.slice(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (bytes.length >= 8 && bytes.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  return '';
}
function authOk(p) {
  return /^\d{1,18}$/.test(String(p.id == null ? '' : p.id)) && new RegExp(`^${UUID}$`, 'i').test(String(p.token == null ? '' : p.token));
}

async function owns(url, key, p, cols) {
  const r = await fetch(`${url}/rest/v1/lead_intake?select=${cols || 'id'}&id=eq.${String(p.id)}&enrich_token=eq.${encodeURIComponent(String(p.token))}&limit=1`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error('lookup_failed');
  const rows = await r.json();
  return (rows && rows[0]) || null;
}

async function sign(url, key, p) {
  const kind = KINDS[p.kind];
  const name = cleanName(p.name), ext = normExt(extOf(name)), size = Number(p.size);
  if (!kind) return json(400, { ok: false, error: 'invalid' });
  if (!TYPES[ext] && !TYPES[extOf(name)]) return json(400, { ok: false, error: 'unsupported_type' });
  if (!Number.isFinite(size) || size <= 0) return json(400, { ok: false, error: 'invalid' });
  if (size > MAX_BYTES) return json(400, { ok: false, error: 'file_too_large' });
  const declared = String(p.type || '').toLowerCase();
  if (declared && !(TYPES[extOf(name)] || []).includes(declared)) return json(400, { ok: false, error: 'unsupported_type' });
  if (!(await owns(url, key, p))) return json(404, { ok: false, error: 'not_found' });
  const path = `intake-uploads/${crypto.randomUUID()}/${kind}.${ext}`;
  const r = await fetch(`${url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, { method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: '{}' });
  if (!r.ok) throw new Error('sign_failed');
  const d = await r.json();
  if (!d.url) throw new Error('sign_failed');
  return json(200, { ok: true, path, signedUrl: `${url}/storage/v1${d.url}` });
}

async function confirm(url, key, p) {
  const kind = KINDS[p.kind];
  const path = String(p.path || '');
  if (!kind || !PATH_RE.test(path) || !path.includes(`/${kind}.`)) return json(400, { ok: false, error: 'invalid' });
  const lead = await owns(url, key, p, `id,first_name,last_name,zip,email_normalized,phone_normalized,${kind}_upload_path`);
  if (!lead) return json(404, { ok: false, error: 'not_found' });
  const headers = { apikey: key, authorization: `Bearer ${key}` };
  const g = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, { headers: { ...headers, range: 'bytes=0-1023' } });
  if (!g.ok) return json(422, { ok: false, error: 'upload_missing' });
  const buf = Buffer.from(await g.arrayBuffer());
  const cr = /\/(\d+)\s*$/.exec(g.headers && g.headers.get ? g.headers.get('content-range') || '' : '');
  const total = cr ? Number(cr[1]) : buf.length;
  const kindSniffed = sniff(buf), pathExt = path.split('.').pop();
  const bad = !kindSniffed || kindSniffed !== pathExt || total > MAX_BYTES || total <= 0;
  if (bad) {
    try { await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', headers }); } catch (e) { /* best effort */ }
    return json(422, { ok: false, error: total > MAX_BYTES ? 'file_too_large' : 'invalid_file' });
  }
  const mime = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg' }[kindSniffed];
  const row = { updated_at: new Date().toISOString(), [`${kind}_upload_path`]: path, [`${kind}_upload_name`]: cleanName(p.name) || null, [`${kind}_upload_type`]: mime, [`${kind}_upload_size`]: total };
  if (kind === 'quote') row.existing_quote = true;
  const r = await fetch(`${url}/rest/v1/lead_intake?id=eq.${String(p.id)}&enrich_token=eq.${encodeURIComponent(String(p.token))}&select=id`, { method: 'PATCH', headers: { ...headers, 'content-type': 'application/json', prefer: 'return=representation' }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error('patch_failed');
  const rows = await r.json();
  if (!rows || !rows[0]) return json(404, { ok: false, error: 'not_found' });
  if (lead[`${kind}_upload_path`] !== path) await notifyDocument(url, key, lead, kind, path);
  return json(200, { ok: true, fileType: kindSniffed, size: total });
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  try {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('not_configured');
    if (String(event.body || '').length > 5000) return json(413, { ok: false, error: 'too_large' });
    let p;
    try { p = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { ok: false, error: 'invalid_json' }); }
    if (!p || typeof p !== 'object' || !authOk(p)) return json(400, { ok: false, error: 'invalid' });
    if (p.action === 'sign') return await sign(url, key, p);
    if (p.action === 'confirm') return await confirm(url, key, p);
    return json(400, { ok: false, error: 'invalid' });
  } catch (e) {
    console.error('intake-upload failed:', e && e.message);
    return json(500, { ok: false, error: 'server_error' });
  }
};
exports._test = { cleanName, sniff, PATH_RE };
