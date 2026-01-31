/**
 * BSI User Alert Preferences API
 * Persists alert preferences to D1 for cross-device sync.
 *
 * GET /api/user/preferences - Fetch user's alert preferences
 * PUT /api/user/preferences - Update preferences
 */

interface Env {
  DB?: D1Database;
}

interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

interface AlertTypes {
  highLeverage: boolean;
  leadChange: boolean;
  closeGame: boolean;
  upsetAlert: boolean;
  walkOff: boolean;
  momentumShift: boolean;
  gameStart: boolean;
  gameEnd: boolean;
}

interface DeliveryMethods {
  push: boolean;
  email: boolean;
  sms: boolean;
  webSocket: boolean;
}

interface AlertPreferences {
  userId: string;
  alertTypes: AlertTypes;
  minLeverageThreshold: number;
  upsetThreshold: number;
  closeGameMargin: number;
  quietHours: {
    start: string;
    end: string;
  };
  deliveryMethods: DeliveryMethods;
}

interface PreferencesRow {
  id: number;
  user_id: string;
  alert_types_json: string;
  min_leverage_threshold: number;
  upset_threshold: number;
  close_game_margin: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  delivery_methods_json: string;
  updated_at: string;
}

const DEFAULT_ALERT_TYPES: AlertTypes = {
  highLeverage: true,
  leadChange: true,
  closeGame: true,
  upsetAlert: true,
  walkOff: true,
  momentumShift: false,
  gameStart: true,
  gameEnd: true,
};

const DEFAULT_DELIVERY_METHODS: DeliveryMethods = {
  push: true,
  email: false,
  sms: false,
  webSocket: true,
};

function getUserId(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const url = new URL(request.url);
  return url.searchParams.get('userId');
}

function rowToPreferences(row: PreferencesRow): AlertPreferences {
  let alertTypes: AlertTypes;
  let deliveryMethods: DeliveryMethods;

  try {
    alertTypes = JSON.parse(row.alert_types_json);
  } catch {
    alertTypes = DEFAULT_ALERT_TYPES;
  }

  try {
    deliveryMethods = JSON.parse(row.delivery_methods_json);
  } catch {
    deliveryMethods = DEFAULT_DELIVERY_METHODS;
  }

  return {
    userId: row.user_id,
    alertTypes,
    minLeverageThreshold: row.min_leverage_threshold,
    upsetThreshold: row.upset_threshold,
    closeGameMargin: row.close_game_margin,
    quietHours: {
      start: row.quiet_hours_start,
      end: row.quiet_hours_end,
    },
    deliveryMethods,
  };
}

function getDefaultPreferences(userId: string): AlertPreferences {
  return {
    userId,
    alertTypes: DEFAULT_ALERT_TYPES,
    minLeverageThreshold: 1.8,
    upsetThreshold: 0.3,
    closeGameMargin: 0.1,
    quietHours: {
      start: '22:00',
      end: '07:00',
    },
    deliveryMethods: DEFAULT_DELIVERY_METHODS,
  };
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const userId = getUserId(context.request);

  if (!userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!context.env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        data: getDefaultPreferences(userId),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const result = await context.env.DB.prepare(
      `SELECT * FROM user_alert_preferences WHERE user_id = ? LIMIT 1`
    )
      .bind(userId)
      .first<PreferencesRow>();

    if (!result) {
      return new Response(
        JSON.stringify({
          success: true,
          data: getDefaultPreferences(userId),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: rowToPreferences(result),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_ERROR', message },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPut(context: EventContext<Env>): Promise<Response> {
  const userId = getUserId(context.request);

  if (!userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!context.env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: 'Database not available' },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: Partial<AlertPreferences>;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_JSON', message: 'Invalid request body' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const existing = await context.env.DB.prepare(
      `SELECT * FROM user_alert_preferences WHERE user_id = ? LIMIT 1`
    )
      .bind(userId)
      .first<PreferencesRow>();

    const currentPrefs = existing ? rowToPreferences(existing) : getDefaultPreferences(userId);

    const merged: AlertPreferences = {
      ...currentPrefs,
      ...body,
      alertTypes: { ...currentPrefs.alertTypes, ...body.alertTypes },
      quietHours: { ...currentPrefs.quietHours, ...body.quietHours },
      deliveryMethods: { ...currentPrefs.deliveryMethods, ...body.deliveryMethods },
    };

    if (existing) {
      await context.env.DB.prepare(
        `
        UPDATE user_alert_preferences SET
          alert_types_json = ?,
          min_leverage_threshold = ?,
          upset_threshold = ?,
          close_game_margin = ?,
          quiet_hours_start = ?,
          quiet_hours_end = ?,
          delivery_methods_json = ?,
          updated_at = datetime('now')
        WHERE user_id = ?
      `
      )
        .bind(
          JSON.stringify(merged.alertTypes),
          merged.minLeverageThreshold,
          merged.upsetThreshold,
          merged.closeGameMargin,
          merged.quietHours.start,
          merged.quietHours.end,
          JSON.stringify(merged.deliveryMethods),
          userId
        )
        .run();
    } else {
      await context.env.DB.prepare(
        `
        INSERT INTO user_alert_preferences
        (user_id, alert_types_json, min_leverage_threshold, upset_threshold, close_game_margin, quiet_hours_start, quiet_hours_end, delivery_methods_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          userId,
          JSON.stringify(merged.alertTypes),
          merged.minLeverageThreshold,
          merged.upsetThreshold,
          merged.closeGameMargin,
          merged.quietHours.start,
          merged.quietHours.end,
          JSON.stringify(merged.deliveryMethods)
        )
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: merged,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_ERROR', message },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default { onRequestGet, onRequestPut };
