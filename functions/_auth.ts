/**
 * Shared auth helper — used in all protected Worker functions.
 * Reads session_token cookie → looks up KV (fast path) → falls back to D1.
 */

export interface Env {
    DB: D1Database;
    SESSION_STORE: KVNamespace;
    piper: R2Bucket;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BASE_URL: string;
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
    plan: 'free' | 'pro';
    quota_daily: number;
    is_active: number;
}

export function getCookie(req: Request, name: string): string | null {
    const header = req.headers.get('Cookie') ?? '';
    for (const part of header.split(';')) {
        const [k, v] = part.trim().split('=');
        if (k === name) return decodeURIComponent(v ?? '');
    }
    return null;
}

export function sessionCookie(token: string, maxAgeSec: number): string {
    return `session_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie(): string {
    return `session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Resolves session token → User or null. */
export async function getSessionUser(req: Request, env: Env): Promise<User | null> {
    const token = getCookie(req, 'session_token');
    if (!token) return null;

    // Fast path: KV stores userId for valid tokens
    const userId = await env.SESSION_STORE.get(`sess:${token}`);
    if (!userId) return null;

    const user = await env.DB
        .prepare('SELECT id,email,name,avatar_url,role,plan,quota_daily,is_active FROM users WHERE id=?')
        .bind(userId)
        .first<User>();

    if (!user || !user.is_active) return null;
    return user;
}

export function requireUser(user: User | null): Response | null {
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return null;
}

export function requireAdmin(user: User | null): Response | null {
    const err = requireUser(user);
    if (err) return err;
    if (user!.role !== 'admin') return json({ error: 'Forbidden' }, 403);
    return null;
}

export function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

export function randomHex(bytes = 32): string {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export function uuidv4(): string {
    return randomHex(16).replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-4$3-a$4-$5'
    );
}

// ── Password hashing (PBKDF2 / Web Crypto) ───────────────────────────────────
// Format stored: "pbkdf2:<iterations>:<salt_hex>:<hash_hex>"

const PBKDF2_ITERS = 100_000;

async function deriveKey(password: string, saltHex: string, iterations: number): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const salt = hexToBytes(saltHex);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        keyMaterial, 256
    );
    return bytesToHex(new Uint8Array(bits));
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2)
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Hash a plain-text password. Returns a storable string. */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomHex(16);
    const hash = await deriveKey(password, salt, PBKDF2_ITERS);
    return `pbkdf2:${PBKDF2_ITERS}:${salt}:${hash}`;
}

/** Verify plain-text password against a stored hash. Timing-safe. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const parts = stored.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const [, itersStr, salt, expectedHash] = parts;
    const actualHash = await deriveKey(password, salt, parseInt(itersStr));
    // Constant-time compare
    if (actualHash.length !== expectedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < actualHash.length; i++)
        diff |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    return diff === 0;
}

/** Shared session creation: insert D1 + KV, return token */
export const SESSION_TTL_SEC = 30 * 24 * 3600;

export async function createSession(env: Env, userId: string): Promise<string> {
    const token = randomHex(32);
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_SEC * 1000;
    await env.DB
        .prepare('INSERT INTO sessions (token,user_id,expires_at,created_at) VALUES (?,?,?,?)')
        .bind(token, userId, expiresAt, now)
        .run();
    await env.SESSION_STORE.put(`sess:${token}`, userId, { expirationTtl: SESSION_TTL_SEC });
    return token;
}

