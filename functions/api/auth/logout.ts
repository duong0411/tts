/**
 * POST /api/auth/logout
 * Deletes the session from KV and D1, clears the cookie.
 */
import { Env, getCookie, clearSessionCookie, json } from '../../_auth.js';

export async function onRequestPost(ctx: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = ctx;
    const token = getCookie(request, 'session_token');

    if (token) {
        await Promise.all([
            env.SESSION_STORE.delete(`sess:${token}`),
            env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(token).run(),
        ]);
    }

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': clearSessionCookie(),
        },
    });
}
