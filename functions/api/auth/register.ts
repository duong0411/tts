/**
 * POST /api/auth/register
 * Creates a new account with email + password.
 */
import {
    Env, json, uuidv4, hashPassword, createSession, sessionCookie, SESSION_TTL_SEC,
} from '../../_auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(ctx: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = ctx;

    let body: { name?: string; email?: string; password?: string };
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const { name, email, password } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !EMAIL_RE.test(email)) return json({ error: 'Email không hợp lệ' }, 400);
    if (!password || password.length < 8) return json({ error: 'Mật khẩu tối thiểu 8 ký tự' }, 400);
    if (password.length > 128) return json({ error: 'Mật khẩu quá dài' }, 400);

    // ── Check duplicate email ─────────────────────────────────────────────────
    const existing = await env.DB
        .prepare('SELECT id FROM users WHERE email=?')
        .bind(email.toLowerCase())
        .first<{ id: string }>();

    if (existing) return json({ error: 'Email đã được đăng ký' }, 409);

    // ── Create user ───────────────────────────────────────────────────────────
    const userId = uuidv4();
    const now = Date.now();
    const passwordHash = await hashPassword(password);

    await env.DB
        .prepare(`INSERT INTO users (id,email,name,avatar_url,password_hash,role,plan,quota_daily,is_active,created_at,updated_at)
                  VALUES (?,?,?,NULL,?,'user','free',5000,1,?,?)`)
        .bind(userId, email.toLowerCase(), name?.trim() || null, passwordHash, now, now)
        .run();

    // ── Auto-login ────────────────────────────────────────────────────────────
    const token = await createSession(env, userId);

    return new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': sessionCookie(token, SESSION_TTL_SEC),
        },
    });
}

// Allow preflight
export async function onRequestOptions(): Promise<Response> {
    return new Response(null, { status: 204 });
}
