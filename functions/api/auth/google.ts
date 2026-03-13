/**
 * GET /api/auth/google
 * Redirects the browser to the Google OAuth consent screen.
 */
import { Env, randomHex } from '../../_auth.js';

export async function onRequestGet(ctx: { env: Env; request: Request }): Promise<Response> {
    const { env } = ctx;
    const state = randomHex(16);

    // Store state in KV for 10 minutes to prevent CSRF
    await env.SESSION_STORE.put(`oauth_state:${state}`, '1', { expirationTtl: 600 });

    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${env.BASE_URL}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'online',
        state,
        prompt: 'select_account',
    });

    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
}
