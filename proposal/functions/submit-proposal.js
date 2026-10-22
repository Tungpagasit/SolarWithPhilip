const crypto = require('crypto');

const response = (statusCode, value) => ({
  statusCode,
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify(value)
});

async function uploadFile(
  supabaseUrl,
  serviceKey,
  submissionId,
  fileType,
  file
) {
  if (!file || !file.data) {
    return null;
  }

  const cleanName = String(
    file.name || fileType
  ).replace(
    /[^a-zA-Z0-9._-]/g,
    '_'
  );

  const path =
    `${submissionId}/${fileType}-${cleanName}`;

  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/proposal-uploads/${path}`,
    {
      method: 'POST',

      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        'content-type':
          file.type ||
          'application/octet-stream',
        'x-upsert': 'true'
      },

      body: Buffer.from(
        file.data,
        'base64'
      )
    }
  );

  if (!uploadResponse.ok) {
    const message =
      await uploadResponse.text();

    throw new Error(
      `Could not upload ${file.name || fileType}: ${message}`
    );
  }

  return {
    name: file.name || fileType,
    path,
    type: file.type || '',
    size: file.size || 0
  };
}

async function saveJsonFile(
  supabaseUrl,
  serviceKey,
  submissionId,
  filename,
  object
) {
  const json = JSON.stringify(
    object,
    null,
    2
  );

  const path =
    `${submissionId}/${filename}`;

  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/proposal-uploads/${path}`,
    {
      method: 'POST',

      headers: {
        apikey: serviceKey,
        authorization:
          `Bearer ${serviceKey}`,
        'content-type':
          'application/json',
        'x-upsert': 'true'
      },

      body: Buffer.from(
        json,
        'utf8'
      )
    }
  );

  if (!uploadResponse.ok) {
    const message =
      await uploadResponse.text();

    throw new Error(
      `Could not save Full Decision Profile: ${message}`
    );
  }

  return {
    name: filename,
    path,
    type: 'application/json',
    size: Buffer.byteLength(
      json,
      'utf8'
    )
  };
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return response(
      405,
      {
        error: 'Method not allowed.'
      }
    );
  }

  try {
    const payload =
      JSON.parse(
        event.body || '{}'
      );

    const supabaseUrl =
      process.env.SUPABASE_URL;

    const serviceKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceKey
    ) {
      throw new Error(
        'Supabase environment variables are not configured.'
      );
    }

    const submissionId =
      crypto.randomUUID();

    const uploads = {};

    /*
     * Utility bill
     */
    uploads.utilityBill =
      await uploadFile(
        supabaseUrl,
        serviceKey,
        submissionId,
        'utilityBill',
        payload.files?.utilityBill
      );

    /*
     * Original Energy Strategies
     * Decision_Profile.json
     */
    uploads.decisionProfile =
      await uploadFile(
        supabaseUrl,
        serviceKey,
        submissionId,
        'decisionProfile',
        payload.files?.decisionProfile
      );

    /*
     * Create the complete portable record.
     *
     * Remove base64 upload bodies from the
     * JSON so the complete record contains
     * the actual planning information rather
     * than duplicate binary files.
     */
    const fullDecisionProfile = {
      schemaVersion:
        payload.schemaVersion ||
        '1.0',

      profileType:
        'SolarWithPhilipFullDecisionProfile',

      savedAt:
        new Date().toISOString(),

      submissionId,

      source: {
        application:
          'Solar With Philip',

        experience:
          'Preliminary Property and Energy Analysis'
      },

      homeowner:
        payload.homeowner || {},

      decisionProfile:
        payload.decisionProfile || null,

      currentEnergy:
        payload.currentEnergy || {},

      futureEnergy:
        payload.futureEnergy || {},

      property:
        payload.property || {},

      planning:
        payload.planning || {},

      scenarios:
        payload.scenarios || {},

      concernSummary:
        payload.concernSummary || {},

      authorization:
        payload.authorization || {},

      report:
        {
          ...(payload.report || {}),

          commercialReuseAuthorized:
            false,

          homeownerSharingAllowed:
            true
        }
    };

    /*
     * Save the Full Decision Profile
     * JSON into Supabase Storage.
     */
    uploads.fullDecisionProfile =
      await saveJsonFile(
        supabaseUrl,
        serviceKey,
        submissionId,
        'SolarWithPhilip_Full_Decision_Profile.json',
        fullDecisionProfile
      );

    /*
     * Preserve compatibility with the
     * existing proposals table.
     *
     * concern_profile retains its existing
     * database column name even though the
     * homeowner-facing system is now called
     * Decision_Profile.
     */
    const row = {
      id:
        submissionId,

      homeowner:
        payload.homeowner || {},

      concern_profile:
        payload.decisionProfile || {},

      current_energy:
        payload.currentEnergy || {},

      future_energy:
        payload.futureEnergy || {},

      property:
        payload.property || {},

      planning: {
        ...(payload.planning || {}),

        scenarios:
          payload.scenarios || {},

        fullDecisionProfile: {
          profileType:
            fullDecisionProfile
              .profileType,

          schemaVersion:
            fullDecisionProfile
              .schemaVersion,

          concernSummary:
            fullDecisionProfile
              .concernSummary,

          report:
            fullDecisionProfile
              .report
        }
      },

      comparison: {
        note: ''
      },

      uploads,

      authorization:
        payload.authorization || {},

      submission: {
        kind:
          'preliminary-analysis',

        submittedAt:
          new Date()
            .toISOString()
      },

      status:
        'submitted'
    };

    const databaseResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/proposals`,
        {
          method: 'POST',

          headers: {
            apikey:
              serviceKey,

            authorization:
              `Bearer ${serviceKey}`,

            'content-type':
              'application/json',

            prefer:
              'return=minimal'
          },

          body:
            JSON.stringify(row)
        }
      );

    if (!databaseResponse.ok) {
      throw new Error(
        await databaseResponse.text()
      );
    }

    /*
     * IMPORTANT:
     *
     * Email delivery is deliberately
     * NOT performed here.
     *
     * The submission has been safely
     * stored in Supabase.
     */
    return response(
      200,
      {
        ok: true,

        id:
          submissionId,

        savedToSupabase:
          true,

        fullDecisionProfileSaved:
          true,

        emailSent:
          false
      }
    );

  } catch (error) {
    return response(
      500,
      {
        error:
          error.message ||
          'Submission failed.'
      }
    );
  }
};
