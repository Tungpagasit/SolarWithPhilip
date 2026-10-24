const crypto = require('crypto');
const contractIndex = require('../contract/enfin-lease-2.2-index.js');

const json = (statusCode, value) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  },
  body: JSON.stringify(value)
});

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');

  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function flatten(value, prefix = '', result = []) {
  if (value == null) return result;

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    result.push({ key: prefix, value: String(value) });
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, result));
    return result;
  }

  for (const [key, item] of Object.entries(value)) {
    flatten(item, prefix ? `${prefix}.${key}` : key, result);
  }

  return result;
}

function selectedConcerns(profile) {
  const decisionProfile = profile.decisionProfile || {};
  const flattened = flatten(decisionProfile);
  const candidates = [];

  for (const item of flattened) {
    const key = item.key.toLowerCase();
    const value = item.value.trim();

    if (!value) continue;

    if (
      /concern|barrier|deal.breaker|need.more|discuss|could.stop|resolution/.test(key) ||
      /need more information|still a deal-breaker|discuss with philip|could stop me/i.test(value)
    ) {
      candidates.push({ label: item.key, value });
    }
  }

  return candidates;
}

function matchAnswers(concerns) {
  const text = concerns
    .map(item => `${item.label} ${item.value}`)
    .join(' ')
    .toLowerCase();

  const matches = contractIndex.filter(entry =>
    entry.keywords.some(keyword => text.includes(keyword))
  );

  if (matches.length) return matches;

  return contractIndex.filter(entry =>
    [
      'ownership',
      'maintenance',
      'transfer',
      'purchase',
      'production_guarantee',
      'battery_backup',
      'arbitration',
      'cancellation'
    ].includes(entry.id)
  );
}

async function supabaseGet(url, key, path) {
  const response = await fetch(`${url}${path}`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase read failed: ${await response.text()}`);
  }

  return response;
}

function authoritativeProfileFromRow(row) {
  const savedFullProfile = row?.submission?.fullProfile;

  if (savedFullProfile && typeof savedFullProfile === 'object') {
    return {
      ...savedFullProfile,
      savedProposalId: savedFullProfile.savedProposalId || row.id
    };
  }

  return {
    schemaVersion: 'legacy-supabase-fallback',
    profileType: 'SolarWithPhilipFullDecisionProfile',
    homeowner: row?.homeowner || {},
    decisionProfile: row?.decision_profile || row?.concern_profile || null,
    currentEnergy: row?.current_energy || {},
    futureEnergy: row?.future_energy || {},
    property: row?.property || null,
    planning: row?.planning || {},
    authorization: row?.authorization || {},
    savedProposalId: row?.id || null
  };
}

function validateFullDecisionProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('No saved Full Decision Profile was provided or found.');
  }

  if (profile.profileType !== 'SolarWithPhilipFullDecisionProfile') {
    throw new Error('The saved file is not a SolarWithPhilip Full Decision Profile.');
  }

  const monthly = profile.currentEnergy?.monthlyKwh;
  if (!Array.isArray(monthly) || monthly.length !== 12) {
    throw new Error('The Full Decision Profile does not contain all 12 monthly kWh values.');
  }
}

function createBriefHtml(profile, concerns, answers, proposalId, billFound) {
  const homeowner = profile.homeowner || {};
  const current = profile.currentEnergy || {};
  const future = profile.futureEnergy || {};
  const planning = profile.planning || {};
  const scenario = profile.selectedScenario || profile.scenario || {};
  const monthly = Array.isArray(current.monthlyKwh) ? current.monthlyKwh : [];

  const futureRows = Object.entries(future.loads || {})
    .map(([key, value]) => {
      const amount = typeof value === 'object'
        ? value.monthlyKwh ?? value.kwh ?? value.value ?? ''
        : value;
      return `<li><b>${esc(key)}:</b> ${esc(amount)} kWh/month</li>`;
    })
    .join('') || '<li>No future-load numbers found.</li>';

  const concernHtml = concerns
    .map(item => `<li><b>${esc(item.label)}</b>: ${esc(item.value)}</li>`)
    .join('') || '<li>No unresolved concern selections were detected in the saved profile.</li>';

  const answerHtml = answers
    .map(answer => `
      <div style="margin:18px 0;padding:16px;border:1px solid #dce5e8;border-radius:12px">
        <h3 style="margin:0 0 8px;color:#12324a">${esc(answer.topic)}</h3>
        <blockquote style="margin:8px 0;padding:12px;border-left:4px solid #e8a93a;background:#fff8e7">“${esc(answer.quote)}”</blockquote>
        <p>${esc(answer.explanation)}</p>
        <p style="font-size:12px;color:#61717b"><b>Source:</b> CA EnFin Lease 2.2, PDF page ${esc(answer.page)}, ${esc(answer.section)}, curated excerpt lines ${esc(answer.lines)}. Verify against the completed homeowner contract before advising.</p>
      </div>
    `)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Solution Simplified - ${esc(homeowner.name || 'Homeowner')}</title>
</head>
<body style="font-family:Arial,sans-serif;color:#20313d;background:#f3f7f6;padding:24px">
  <div style="max-width:860px;margin:auto;background:white;border-radius:18px;overflow:hidden">
    <header style="padding:28px;background:linear-gradient(135deg,#071e2e,#0f6a65);color:white">
      <div style="color:#ffd982;font-weight:900">SolarWithPhilip.com</div>
      <h1 style="margin:8px 0">Solution Simplified - Confirmed Homeowner Choice</h1>
      <p style="margin:0">Private consultant brief · Proposal ID ${esc(proposalId)}</p>
    </header>
    <main style="padding:26px">
      <h2>Homeowner and property</h2>
      <p><b>Name:</b> ${esc(homeowner.name)}<br>
      <b>Property:</b> ${esc([homeowner.street, homeowner.city, homeowner.state, homeowner.zip].filter(Boolean).join(', '))}<br>
      <b>Email:</b> ${esc(homeowner.email)}<br>
      <b>Phone:</b> ${esc(homeowner.phone)}<br>
      <b>Utility:</b> ${esc(homeowner.utility)}</p>

      <h2>Energy numbers</h2>
      <p><b>12 monthly usage values:</b> ${esc(monthly.join(', '))} kWh<br>
      <b>Current annual usage:</b> ${esc(current.annualKwh)} kWh<br>
      <b>Current average monthly usage:</b> ${esc(current.averageMonthlyKwh)} kWh</p>

      <h3>Future-use profile</h3>
      <ul>${futureRows}</ul>

      <h2>Confirmed direction</h2>
      <p><b>Direction:</b> ${esc(profile.decisionDirection || profile.direction || 'Not found')}<br>
      <b>Financial product:</b> ${esc(profile.financialProduct || planning.financialProduct || 'Not found')}<br>
      <b>Confirmed production strategy:</b> ${esc(profile.selectedProductionStrategy || scenario.offset || planning.productionStrategy || 'Not found')}<br>
      <b>Solar module:</b> ${esc(profile.systemSpec?.solarModule || 'Qcells Q.TRON BLK M-G2+/AC 430')}<br>
      <b>Panel count:</b> ${esc(profile.systemSpec?.estimatedPanels || 'Preliminary / pending design')}<br>
      <b>Battery:</b> ${esc(profile.systemSpec?.battery || planning.batteryModel || 'Not found')}<br>
      <b>Battery quantity:</b> ${esc(profile.systemSpec?.batteryCount ?? planning.batteryCount ?? 0)}</p>

      <h2>Selected concerns</h2>
      <ul>${concernHtml}</ul>

      <h2>Contract-grounded answers</h2>
      ${answerHtml}

      <p style="padding:14px;background:#e8f4f2;border-radius:10px"><b>Utility bill found in saved proposal:</b> ${billFound ? 'Yes' : 'No'}</p>

      <p style="padding:14px;background:#fff3cd;border-radius:10px"><b>Important:</b> These excerpts come from the sample CA EnFin Lease 2.2. The completed homeowner contract controls. This is a consultant preparation brief and not legal advice.</p>
    </main>
    <footer style="padding:18px 26px;background:#071e2e;color:white">Prepared for Viruk Tungpagasit · Solar Consultant · CSLB HIS #93852 SP · SolarWithPhilip.com</footer>
  </div>
</body>
</html>`;
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  try {
    const configuredSecret = process.env.PHILIP_ACCESS_CODE;
    if (!configuredSecret) {
      throw new Error('PHILIP_ACCESS_CODE is not configured in Netlify.');
    }

    const suppliedSecret = event.headers['x-philip-secret'];
    if (!safeEqual(suppliedSecret, configuredSecret)) {
      return json(401, { error: 'The Philip access code is not valid.' });
    }

    const { proposalId, profile: postedProfile } = JSON.parse(event.body || '{}');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let row = null;
    let profile = postedProfile || null;

    if (proposalId && supabaseUrl && supabaseKey) {
      const response = await supabaseGet(
        supabaseUrl,
        supabaseKey,
        `/rest/v1/proposals?id=eq.${encodeURIComponent(proposalId)}&select=*`
      );
      const rows = await response.json();
      row = rows[0] || null;

      if (row?.submission?.fullProfile) {
        profile = authoritativeProfileFromRow(row);
      } else if (!profile && row) {
        profile = authoritativeProfileFromRow(row);
      }
    }

    validateFullDecisionProfile(profile);

    const id = proposalId || profile.savedProposalId || crypto.randomUUID();
    const concerns = selectedConcerns(profile);
    const answers = matchAnswers(concerns);
    const billFound = Boolean(row?.uploads?.utilityBill?.path);
    const briefHtml = createBriefHtml(profile, concerns, answers, id, billFound);

    return json(200, {
      ok: true,
      id,
      source: row?.submission?.fullProfile
        ? 'supabase-submission-fullProfile'
        : postedProfile
          ? 'confirmed-browser-fullProfile'
          : 'legacy-supabase-fallback',
      contractAnswers: answers.length,
      concernsFound: concerns.length,
      billFound,
      briefHtml,
      profileSummary: {
        homeowner: { name: profile.homeowner?.name || '' },
        savedProposalId: profile.savedProposalId || id
      }
    });
  } catch (error) {
    return json(500, {
      error: error.message || 'Solution Simplified failed.'
    });
  }
};
