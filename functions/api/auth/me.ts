/**
 * GET /api/auth/me
 * Returns current authenticated user info.
 */
import { Env, getSessionUser, requireUser, json } from '../../_auth.js';

export async function onRequestGet(ctx: { env: Env; request: Request }): Promise<Response> {
    const user = await getSessionUser(ctx.request, ctx.env);
    const err = requireUser(user);
    if (err) return err;

    // Also return today's usage
    const today = new Date().toISOString().slice(0, 10);
    const usage = await ctx.env.DB
        .prepare('SELECT char_count FROM usage_logs WHERE user_id=? AND date=?')
        .bind(user!.id, today)
        .first<{ char_count: number }>();

    return json({
        id: user!.id,
        email: user!.email,
        name: user!.name,
        avatar_url: user!.avatar_url,
        role: user!.role,
        plan: user!.plan,
        quota_daily: user!.quota_daily,
        used_today: usage?.char_count ?? 0,
    });
}
