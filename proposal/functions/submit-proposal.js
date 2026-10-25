const crypto = require('crypto');
const response = (statusCode, value) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(value)
});

async function uploadFile(supabaseUrl, serviceKey, submissionId, fileType, file) {
  if (!file || !file.data) return null;
  const cleanName = String(file.name || fileType).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${submissionId}/${fileType}-${cleanName}`;
  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/proposal-uploads/${path}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': file.type || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: Buffer.from(file.data, 'base64')
  });
  if (!uploadResponse.ok) throw new Error(`Could not upload ${file.name || fileType}: ${await uploadResponse.text()}`);
  return { name: file.name || fileType, path, type: file.type || '', size: file.size || 0 };
}

async function saveJsonFile(supabaseUrl, serviceKey, submissionId, filename, object) {
  const content = JSON.stringify(object, null, 2);
  const path = `${submissionId}/${filename}`;
  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/proposal-uploads/${path}`, {
    method: 'POST',
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json', 'x-upsert': 'true' },
    body: Buffer.from(content, 'utf8')
  });
  if (!uploadResponse.ok) throw new Error(`Could not save Full Decision Profile: ${await uploadResponse.text()}`);
  return { name: filename, path, type: 'application/json', size: Buffer.byteLength(content, 'utf8') };
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed.' });
  try {
    const payload = JSON.parse(event.body || '{}');
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase is not configured.');

    const id = crypto.randomUUID();
    const fullProfile = { ...payload, files: undefined, savedProposalId: id, savedAt: new Date().toISOString() };
    const uploads = {
      utilityBill: await uploadFile(supabaseUrl, serviceKey, id, 'utilityBill', payload.files?.utilityBill),
      decisionProfile: await uploadFile(supabaseUrl, serviceKey, id, 'decisionProfile', payload.files?.decisionProfile),
      fullDecisionProfile: await saveJsonFile(supabaseUrl, serviceKey, id, 'SolarWithPhilip_Full_Decision_Profile.json', fullProfile)
    };

    const row = {
      id,
      homeowner: payload.homeowner || {},
      concern_profile: payload.decisionProfile || {},
      current_energy: payload.currentEnergy || {},
      future_energy: payload.futureEnergy || {},
      property: payload.property || {},
      planning: { ...(payload.planning || {}), scenarios: payload.scenarios || {} },
      comparison: payload.selectedScenario || {},
      uploads,
      authorization: payload.authorization || {},
      submission: { kind: 'confirmed-choice', submittedAt: new Date().toISOString(), fullProfile },
      status: 'confirmed'
    };

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/proposals`, {
      method: 'POST',
      headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json', prefer: 'return=minimal' },
      body: JSON.stringify(row)
    });
    if (!saveResponse.ok) throw new Error(await saveResponse.text());

    return response(200, { ok: true, id, uploads, emailSent: false, fullProfile });
  } catch (error) {
    return response(500, { error: error.message });
  }
};
