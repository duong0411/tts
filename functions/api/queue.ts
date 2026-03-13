/**
 * GET  /api/queue  — list user's queue jobs (paginated)
 * POST /api/queue  — create new TTS job (with quota check)
 */
import { Env, getSessionUser, requireUser, json, uuidv4 } from '../_auth.js';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function onRequestGet(ctx: { env: Env; request: Request }): Promise<Response> {
    const user = await getSessionUser(ctx.request, ctx.env);
    const err = requireUser(user);
    if (err) return err;

    const url = new URL(ctx.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    const jobs = await ctx.env.DB
        .prepare(`SELECT id,status,text,model,char_count,priority,created_at,done_at,result_key,error_msg
              FROM tts_queue WHERE user_id=?
              ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(user!.id, limit, offset)
        .all();

    return json({ jobs: jobs.results, limit, offset });
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function onRequestPost(ctx: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = ctx;
    const user = await getSessionUser(request, env);
    const err = requireUser(user);
    if (err) return err;

    let body: { text?: string; model?: string; voice?: string; speed?: number; lang?: string; };
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const { text, model, voice, speed = 1.0, lang = 'vi' } = body;
    if (!text || !model) return json({ error: 'text and model are required' }, 400);
    if (text.length > 10000) return json({ error: 'Text too long (max 10000 chars)' }, 400);

    const charCount = text.length;

    // ── Quota check ───────────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const usage = await env.DB
        .prepare('SELECT char_count FROM usage_logs WHERE user_id=? AND date=?')
        .bind(user!.id, today)
        .first<{ char_count: number }>();

    const usedToday = usage?.char_count ?? 0;
    if (usedToday + charCount > user!.quota_daily) {
        return json({
            error: 'Daily quota exceeded',
            quota_daily: user!.quota_daily,
            used_today: usedToday,
            requested: charCount,
        }, 429);
    }

    // ── Priority by plan ──────────────────────────────────────────────────────
    const priorityMap: Record<string, number> = { free: 0, pro: 1, admin: 2 };
    const priority = priorityMap[user!.plan] ?? 0;

    const jobId = uuidv4();
    const now = Date.now();

    await env.DB
        .prepare(`INSERT INTO tts_queue (id,user_id,text,model,voice,speed,lang,status,priority,char_count,created_at)
              VALUES (?,?,?,?,?,?,?,'pending',?,?,?)`)
        .bind(jobId, user!.id, text, model, voice ?? null, speed, lang, priority, charCount, now)
        .run();

    // Update usage log (upsert)
    await env.DB
        .prepare(`INSERT INTO usage_logs (id,user_id,date,char_count) VALUES (?,?,?,?)
              ON CONFLICT(user_id,date) DO UPDATE SET char_count=char_count+excluded.char_count`)
        .bind(uuidv4(), user!.id, today, charCount)
        .run();

    return json({ id: jobId, status: 'pending', priority, char_count: charCount }, 201);
}
