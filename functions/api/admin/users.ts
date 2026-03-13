/**
 * GET  /api/admin/users — list all users with usage stats
 * PATCH /api/admin/users/:id — update role/plan/quota
 */
import { Env, getSessionUser, requireAdmin, json } from '../../_auth.js';

export async function onRequestGet(ctx: { env: Env; request: Request }): Promise<Response> {
    const user = await getSessionUser(ctx.request, ctx.env);
    const err = requireAdmin(user);
    if (err) return err;

    const url = new URL(ctx.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');
    const search = url.searchParams.get('q') ?? '';

    const today = new Date().toISOString().slice(0, 10);

    const users = await ctx.env.DB
        .prepare(`
      SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.plan, u.quota_daily,
             u.is_active, u.created_at,
             COALESCE(ul.char_count, 0) AS used_today,
             (SELECT COUNT(*) FROM tts_queue q WHERE q.user_id=u.id) AS total_jobs
      FROM users u
      LEFT JOIN usage_logs ul ON ul.user_id=u.id AND ul.date=?
      WHERE u.email LIKE ? OR u.name LIKE ?
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `)
        .bind(today, `%${search}%`, `%${search}%`, limit, offset)
        .all();

    const total = await ctx.env.DB
        .prepare('SELECT COUNT(*) AS n FROM users')
        .first<{ n: number }>();

    return json({ users: users.results, total: total?.n ?? 0, limit, offset });
}

export async function onRequestPatch(ctx: { env: Env; request: Request }): Promise<Response> {
    const user = await getSessionUser(ctx.request, ctx.env);
    const err = requireAdmin(user);
    if (err) return err;

    let body: { id?: string; role?: string; plan?: string; quota_daily?: number; is_active?: number };
    try { body = await ctx.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const { id, role, plan, quota_daily, is_active } = body;
    if (!id) return json({ error: 'id required' }, 400);

    const updates: string[] = [];
    const params: unknown[] = [];
    if (role !== undefined) { updates.push('role=?'); params.push(role); }
    if (plan !== undefined) { updates.push('plan=?'); params.push(plan); }
    if (quota_daily !== undefined) { updates.push('quota_daily=?'); params.push(quota_daily); }
    if (is_active !== undefined) { updates.push('is_active=?'); params.push(is_active); }
    if (!updates.length) return json({ error: 'Nothing to update' }, 400);

    updates.push('updated_at=?');
    params.push(Date.now());
    params.push(id);

    await ctx.env.DB
        .prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`)
        .bind(...params)
        .run();

    return json({ ok: true });
}
