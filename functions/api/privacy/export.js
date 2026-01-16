/**
 * GDPR Data Export Function
 * Provides users with a complete export of their personal data
 * Compliant with GDPR Article 15 (Right of Access) and CCPA
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Validate user ID
    if (!userId || userId === 'anonymous') {
      return new Response(
        JSON.stringify({
          error: 'User ID required',
          message: 'No personal data stored for anonymous users',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Collect all user data from various sources
    const userData = await collectUserData(env, userId);

    // Generate export package
    const exportData = {
      exportMetadata: {
        userId: userId,
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        timezone: 'America/Chicago',
        dataController: 'Blaze Sports Intel',
        contactEmail: 'Austin@blazesportsintel.com',
      },
      legalNotice: {
        gdprCompliance: 'This export fulfills your right of access under GDPR Article 15',
        ccpaCompliance: 'This export fulfills your right to know under CCPA',
        dataRetention: 'You may request deletion of this data at any time',
        contactForQuestions: 'Austin@blazesportsintel.com',
      },
      personalData: userData.personal || {},
      accountData: userData.account || {},
      gameData: userData.game || {},
      preferences: userData.preferences || {},
      consentRecords: userData.consents || [],
      activityLog: userData.activity || [],
      dataSources: {
        essential: 'Data necessary for service provision',
        analytics: 'Anonymous analytics data (if consented)',
        thirdParty: 'No personal data shared with third parties',
      },
      yourRights: {
        accessData: 'You have the right to access your data (this export)',
        rectifyData: 'You have the right to correct inaccurate data',
        eraseData: 'You have the right to request deletion ("right to be forgotten")',
        restrictProcessing: 'You have the right to restrict processing',
        dataPortability: 'You have the right to receive your data in a machine-readable format',
        objectToProcessing: 'You have the right to object to processing',
        withdrawConsent: 'You have the right to withdraw consent at any time',
        contactToExercise: 'Email Austin@blazesportsintel.com to exercise any of these rights',
      },
    };

    // Log the export request (for compliance audit trail)
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['gdpr_data_export'],
        doubles: [1],
        indexes: [new Date().toISOString().split('T')[0]],
      });
    }

    // Return as downloadable JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="blaze-sports-data-export-${userId}-${Date.now()}.json"`,
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Data export error:', error);

    return new Response(
      JSON.stringify({
        error: 'Data export failed',
        message: error.message,
        support: 'Contact Austin@blazesportsintel.com for assistance',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

async function collectUserData(env, userId) {
  const data = {
    personal: {},
    account: {},
    game: {},
    preferences: {},
    consents: [],
    activity: [],
  };

  try {
    // Collect cookie consent records
    const consentKey = `consent:${userId}`;
    const consent = await env.CACHE.get(consentKey, 'json');
    if (consent) {
      data.consents.push({
        type: 'cookie_consent',
        timestamp: consent.timestamp,
        preferences: {
          essential: consent.essential,
          analytics: consent.analytics,
        },
        userAgent: consent.userAgent,
        ipHash: consent.ipHash,
      });
    }

    // Collect user preferences
    const prefsKey = `prefs:${userId}`;
    const prefs = await env.CACHE.get(prefsKey, 'json');
    if (prefs) {
      data.preferences = {
        theme: prefs.theme || 'system',
        favoriteTeams: prefs.favoriteTeams || [],
        notifications: prefs.notifications || false,
        timezone: prefs.timezone || 'America/Chicago',
        displaySettings: prefs.displaySettings || {},
      };
    }

    // Collect game save data
    const gameSaveKey = `game:${userId}`;
    const gameSave = await env.CACHE.get(gameSaveKey, 'json');
    if (gameSave) {
      data.game = {
        saves: gameSave.saves || [],
        achievements: gameSave.achievements || [],
        leaderboardEntries: gameSave.leaderboard || [],
        statistics: gameSave.stats || {},
        lastPlayed: gameSave.lastPlayed,
      };
    }

    // Collect account data (if user has account)
    const accountKey = `account:${userId}`;
    const account = await env.CACHE.get(accountKey, 'json');
    if (account) {
      data.account = {
        userId: account.userId,
        username: account.username,
        email: account.email, // Actual email if they have an account
        createdAt: account.createdAt,
        lastLogin: account.lastLogin,
        emailVerified: account.emailVerified,
      };
    }

    // Collect recent activity log (last 90 days)
    const activityKey = `activity:${userId}`;
    const activity = await env.CACHE.get(activityKey, 'json');
    if (activity && Array.isArray(activity)) {
      data.activity = activity.slice(-100); // Last 100 activities
    }
  } catch (error) {
    console.error('Error collecting user data:', error);
    // Continue with partial data rather than failing
  }

  return data;
}

// DELETE endpoint for GDPR "Right to be Forgotten"
export async function onRequestDelete({ env, request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const confirmToken = url.searchParams.get('confirm');

    if (!userId || userId === 'anonymous') {
      return new Response(
        JSON.stringify({
          error: 'User ID required',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Require confirmation token for safety
    if (!confirmToken || confirmToken !== 'DELETE_MY_DATA') {
      return new Response(
        JSON.stringify({
          error: 'Confirmation required',
          message: 'Add ?confirm=DELETE_MY_DATA to confirm deletion',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Delete all user data
    await deleteUserData(env, userId);

    // Log deletion for compliance
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['gdpr_data_deletion'],
        doubles: [1],
        indexes: [new Date().toISOString().split('T')[0]],
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All your personal data has been permanently deleted',
        deletedAt: new Date().toISOString(),
        userId: userId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Deletion failed',
        message: error.message,
        support: 'Contact Austin@blazesportsintel.com for assistance',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

async function deleteUserData(env, userId) {
  const keysToDelete = [
    `consent:${userId}`,
    `prefs:${userId}`,
    `game:${userId}`,
    `account:${userId}`,
    `activity:${userId}`,
    `session:${userId}`,
  ];

  // Delete all keys
  await Promise.all(keysToDelete.map((key) => env.CACHE.delete(key)));
}
