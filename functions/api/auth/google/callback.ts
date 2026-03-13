/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback: exchange code → access_token → userinfo → upsert user → session.
 */
import {
    Env, sessionCookie, uuidv4, json, createSession, SESSION_TTL_SEC,
} from '../../../_auth.js';

export async function onRequestGet(ctx: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = ctx;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // ── CSRF state check ──────────────────────────────────────────────────────
    if (!state || !code) return redirect('/login?error=missing_params', env);
    const stateValue = await env.SESSION_STORE.get(`oauth_state:${state}`);
    if (!stateValue) return redirect('/login?error=invalid_state', env);
    await env.SESSION_STORE.delete(`oauth_state:${state}`);

    // ── Exchange code for tokens ──────────────────────────────────────────────
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${env.BASE_URL}/api/auth/google/callback`,
            grant_type: 'authorization_code',
        }),
    });
    if (!tokenRes.ok) return redirect('/login?error=token_exchange', env);
    const tokenData = await tokenRes.json<{ access_token: string }>();

    // ── Fetch Google userinfo ─────────────────────────────────────────────────
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) return redirect('/login?error=userinfo_failed', env);
    const g = await userRes.json<{
        sub: string; email: string; name: string; picture: string;
    }>();

    const now = Date.now();

    // ── Upsert user ───────────────────────────────────────────────────────────
    // 1. Find existing oauth link
    let existing = await env.DB
        .prepare('SELECT user_id FROM oauth_providers WHERE provider=? AND provider_uid=?')
        .bind('google', g.sub)
        .first<{ user_id: string }>();

    let userId: string;

    if (existing) {
        userId = existing.user_id;
        // Update name/avatar in case they changed
        await env.DB
            .prepare('UPDATE users SET name=?, avatar_url=?, updated_at=? WHERE id=?')
            .bind(g.name, g.picture, now, userId)
            .run();
    } else {
        // Check if email already registered (linked to another provider later)
        const byEmail = await env.DB
            .prepare('SELECT id FROM users WHERE email=?')
            .bind(g.email)
            .first<{ id: string }>();

        if (byEmail) {
            userId = byEmail.id;
        } else {
            // Brand new user
            userId = uuidv4();
            await env.DB
                .prepare(`INSERT INTO users (id,email,name,avatar_url,role,plan,quota_daily,is_active,created_at,updated_at)
                  VALUES (?,?,?,?,'user','free',5000,1,?,?)`)
                .bind(userId, g.email, g.name, g.picture, now, now)
                .run();
        }

        // Link the OAuth provider
        await env.DB
            .prepare('INSERT OR IGNORE INTO oauth_providers (id,user_id,provider,provider_uid) VALUES (?,?,?,?)')
            .bind(uuidv4(), userId, 'google', g.sub)
            .run();
    }

    // ── Create session ────────────────────────────────────────────────────────
    const token = await createSession(env, userId);

    // ── Redirect to main TTS screen ──────────────────────────────────────────
    return new Response(null, {
        status: 302,
        headers: {
            Location: '/tts',
            'Set-Cookie': sessionCookie(token, SESSION_TTL_SEC),
        },
    });
}

function redirect(to: string, env: Env): Response {
    return new Response(null, {
        status: 302,
        headers: { Location: `${env.BASE_URL}${to}` },
    });
}
