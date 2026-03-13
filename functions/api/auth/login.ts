/**
 * POST /api/auth/login
 * Authenticates with email + password.
 */
import {
    Env, json, verifyPassword, createSession, sessionCookie, SESSION_TTL_SEC,
} from '../../_auth.js';

export async function onRequestPost(ctx: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = ctx;

    let body: { email?: string; password?: string };
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const { email, password } = body;
    if (!email || !password) return json({ error: 'Email và mật khẩu không được trống' }, 400);

    // ── Lookup user ───────────────────────────────────────────────────────────
    const user = await env.DB
        .prepare('SELECT id,password_hash,is_active FROM users WHERE email=?')
        .bind(email.toLowerCase())
        .first<{ id: string; password_hash: string | null; is_active: number }>();

    // Always verify even if user not found (timing-safe — prevent enumeration)
    const dummyHash = 'pbkdf2:100000:0000000000000000:0000000000000000000000000000000000000000000000000000000000000000';
    const hash = user?.password_hash ?? dummyHash;
    const ok = await verifyPassword(password, hash);

    if (!user || !ok) return json({ error: 'Email hoặc mật khẩu không đúng' }, 401);
    if (!user.is_active) return json({ error: 'Tài khoản đã bị tạm khóa' }, 403);
    if (!user.password_hash) return json({ error: 'Tài khoản này sử dụng đăng nhập Google. Vui lòng dùng "Tiếp tục với Google".' }, 400);

    // ── Create session ────────────────────────────────────────────────────────
    const token = await createSession(env, user.id);

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': sessionCookie(token, SESSION_TTL_SEC),
        },
    });
}

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, { status: 204 });
}
