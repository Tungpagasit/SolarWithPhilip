const crypto = require('crypto');

const response = (
  statusCode,
  value
) => ({
  statusCode,

  headers: {
    'content-type':
      'application/json'
  },

  body:
    JSON.stringify(value)
});

/*
 * Contract-reference library.
 *
 * These are consultation references,
 * not automatic determinations that
 * a homeowner concern has been resolved.
 *
 * Philip should review the complete
 * contract provision before discussing
 * the issue with the homeowner.
 */
const contractMap = {

  roof_condition: {
    section:
      'Section 7 / Roof Warranty',

    reference:
      'Review the roof warranty and roof-penetration provisions.'
  },

  roof_responsibility: {
    section:
      'Section 7 / Roof Warranty',

    reference:
      'Review responsibility for roof penetrations, weather-tightness, removal and reinstallation.'
  },

  property_fit: {
    section:
      'System design and installation provisions',

    reference:
      'Review final system design, equipment placement and property requirements.'
  },

  electrical_upgrades: {
    section:
      'Installation / project requirements',

    reference:
      'Confirm whether electrical or property upgrades appear in the final scope of work.'
  },

  usage_design: {
    section:
      'System design and production assumptions',

    reference:
      'Compare the homeowner energy assumptions with the final system design.'
  },

  production_expectations: {
    section:
      'Exhibit B / Performance Guarantee',

    reference:
      'Review the complete performance-guarantee terms, assumptions and exclusions.'
  },

  battery_backup: {
    section:
      'Battery provisions',

    reference:
      'Review battery operating parameters, backup capabilities, reserve settings and applicable limitations.'
  },

  utility_interaction: {
    section:
      'Utility and energy-billing disclosures',

    reference:
      'Review remaining grid imports, exports, utility charges and applicable tariff assumptions.'
  },

  technology_change: {
    section:
      'System equipment and modification provisions',

    reference:
      'Review equipment responsibility and any provisions affecting future modification or expansion.'
  },

  project_execution: {
    section:
      'Installation and service provisions',

    reference:
      'Review installation responsibility, workmanship and service obligations.'
  },

  project_timeline: {
    section:
      'Installation / permitting / interconnection provisions',

    reference:
      'Review responsibilities and dependencies affecting installation and permission to operate.'
  },

  equipment_warranty: {
    section:
      'Warranty provisions',

    reference:
      'Review equipment, workmanship, roof, battery and applicable manufacturer warranty terms.'
  },

  service_replacement: {
    section:
      'Monitoring, maintenance and service provisions',

    reference:
      'Review monitoring, service, repair and replacement responsibilities.'
  },

  upfront_monthly: {
    section:
      'Payment provisions',

    reference:
      'Review initial payment terms, recurring payments and any scheduled changes.'
  },

  financing_total: {
    section:
      'Financial terms',

    reference:
      'Review the complete financial structure and total homeowner obligations.'
  },

  ownership_responsibility: {
    section:
      'Ownership and maintenance provisions',

    reference:
      'Review ownership, maintenance responsibilities and service obligations.'
  },

  agreement_terms: {
    section:
      'Agreement term / purchase / end-of-term provisions',

    reference:
      'Review contract duration, cancellation, purchase, renewal, removal and end-of-term choices.'
  },

  home_transfer: {
    section:
      'Home sale / transfer provisions',

    reference:
      'Review the complete transfer, assumption, purchase and sale-related provisions.'
  },

  utility_rules: {
    section:
      'Utility disclosures and grid-service provisions',

    reference:
      'Review applicable tariff, utility billing, interconnection and grid-program language.'
  },

  decision_confidence: {
    section:
      'Full agreement review',

    reference:
      'Use the complete agreement and homeowner questions to clarify remaining decision concerns.'
  },

  other_concern: {
    section:
      'Manual contract review required',

    reference:
      'Review the homeowner-written concern against the complete contract.'
  }
};

exports.handler =
async event => {

  if (
    event.httpMethod !== 'POST'
  ) {
    return response(
      405,
      {
        error:
          'Method not allowed.'
      }
    );
  }

  /*
   * Private Philip-only access.
   */
  const expectedSecret =
    process.env
      .SOLUTION_SIMPLIFIED_SECRET;

  const providedSecret =
    event.headers[
      'x-philip-secret'
    ];

  if (
    !expectedSecret ||
    providedSecret !==
      expectedSecret
  ) {
    return response(
      403,
      {
        error:
          'Philip access was not verified.'
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

    if (
      !payload.decisionProfile
    ) {
      throw new Error(
        'A Decision_Profile must be loaded before creating the Solution Simplified brief.'
      );
    }

    const summary =
      payload.concernSummary ||
      {};

    const concerns =
      summary.concerns ||
      {};

    const resolutions =
      summary.resolutions ||
      {};

    const notes =
      summary.notes ||
      {};

    const concernDetails =
      payload.decisionProfile
        ?.sections
        ?.section5
        ?.concernDetails ||
      payload.decisionProfile
        ?.section5
        ?.concernDetails ||
      {};

    const items =
      Object.keys(concerns)

        .filter(
          id =>
            concerns[id] &&
            concerns[id] !==
              'Not a Concern'
        )

        .map(id => {

          const contract =
            contractMap[id] ||
            {
              section:
                'Manual contract review required',

              reference:
                'Review this concern against the complete agreement.'
            };

          return {
            concernId:
              id,

            homeownerClassification:
              concerns[id],

            selectedDetails:
              concernDetails[id] ||
              [],

            currentResolutionStatus:
              resolutions[id] ||
              '',

            homeownerNotes:
              notes[id] ||
              '',

            contractSection:
              contract.section,

            consultationReference:
              contract.reference,

            resolvedAutomatically:
              false
          };
        });

    /*
     * This brief NEVER changes
     * homeowner selections or
     * resolution statuses.
     */
    const brief = {
      schemaVersion:
        '1.0',

      reportType:
        'SolarWithPhilipSolutionSimplifiedConsultationBrief',

      createdAt:
        new Date()
          .toISOString(),

      privateAdvisorUseOnly:
        true,

      homeownerDataChanged:
        false,

      concernsAutomaticallyResolved:
        false,

      homeowner:
        payload.homeowner ||
        {},

      property:
        payload.property ||
        {},

      currentDirection:
        summary.direction ||
        '',

      concerns:
        items,

      advisorInstructions: [
        'Use this brief only as a preparation aid for the Complimentary Strategy Review.',
        'Review the complete agreement provision before relying on a contract reference.',
        'Discuss limitations, defined terms, exhibits and exceptions where applicable.',
        'Do not tell the homeowner that a concern is resolved merely because a relevant contract provision exists.',
        'The homeowner decides whether an explanation resolves the concern.'
      ]
    };

    const briefId =
      crypto.randomUUID();

    const json =
      JSON.stringify(
        brief,
        null,
        2
      );

    const path =
      `solution-simplified/${briefId}/Solution_Simplified_Consultation_Brief.json`;

    /*
     * Save the private brief in
     * Supabase Storage.
     */
    const storageResponse =
      await fetch(
        `${supabaseUrl}/storage/v1/object/proposal-uploads/${path}`,
        {
          method:
            'POST',

          headers: {
            apikey:
              serviceKey,

            authorization:
              `Bearer ${serviceKey}`,

            'content-type':
              'application/json',

            'x-upsert':
              'true'
          },

          body:
            Buffer.from(
              json,
              'utf8'
            )
        }
      );

    if (!storageResponse.ok) {
      throw new Error(
        `Could not save Solution Simplified brief: ${await storageResponse.text()}`
      );
    }

    /*
     * No email provider is being used.
     *
     * The private brief is stored
     * securely in Supabase for Philip.
     */
    return response(
      200,
      {
        ok:
          true,

        id:
          briefId,

        concernCount:
          items.length,

        stored:
          true,

        storagePath:
          path,

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
          'Could not create the Solution Simplified consultation brief.'
      }
    );
  }
};
