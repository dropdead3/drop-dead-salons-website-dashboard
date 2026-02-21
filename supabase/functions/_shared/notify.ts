/**
 * Centralized notification helper with deduplication & throttling.
 *
 * All edge functions that insert into `platform_notifications` should
 * use `createNotification()` instead of direct `.insert()` calls.
 *
 * Deduplication key = type + org_id (from metadata) + title.
 * Default cooldown: 60 minutes — a duplicate notification with the
 * same key won't be inserted within that window.
 */

interface NotificationPayload {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface NotifyOptions {
  /** Minutes to suppress duplicate notifications (default: 60) */
  cooldownMinutes?: number;
  /** Skip dedup check entirely */
  force?: boolean;
}

/**
 * Insert a platform notification with automatic deduplication.
 *
 * Returns `{ inserted: true }` if the notification was created,
 * or `{ inserted: false, reason: string }` if it was suppressed.
 */
export async function createNotification(
  supabaseAdmin: any,
  payload: NotificationPayload,
  options: NotifyOptions = {},
): Promise<{ inserted: boolean; reason?: string }> {
  const { cooldownMinutes = 60, force = false } = options;

  const orgId =
    (payload.metadata?.organization_id as string) ?? null;

  // ── Deduplication check ────────────────────────────────────────────
  if (!force) {
    const since = new Date(
      Date.now() - cooldownMinutes * 60 * 1000,
    ).toISOString();

    let query = supabaseAdmin
      .from('platform_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', payload.type)
      .eq('title', payload.title)
      .gte('created_at', since);

    // Scope to org when available (JSONB ->> operator via textSearch isn't
    // available in PostgREST, so we filter in-memory for small result sets)
    if (orgId) {
      query = query.contains('metadata', { organization_id: orgId });
    }

    const { count } = await query;

    if ((count ?? 0) > 0) {
      return {
        inserted: false,
        reason: `Suppressed: duplicate "${payload.type}" within ${cooldownMinutes}m`,
      };
    }
  }

  // ── Insert ─────────────────────────────────────────────────────────
  const { error } = await supabaseAdmin
    .from('platform_notifications')
    .insert({
      type: payload.type,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata ?? {},
    });

  if (error) {
    console.error('[notify] Insert failed:', error.message);
    return { inserted: false, reason: error.message };
  }

  return { inserted: true };
}
