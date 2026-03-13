/**
 * src/stores/auth.js
 * Reactive auth state — fetches /api/auth/me on load, exposes login/logout helpers.
 */
import { reactive, readonly } from 'vue';

const state = reactive({
    user: null,       // null = not logged in | object = logged in
    loading: true,    // true during initial fetch
    checked: false,   // has /me been called yet?
});

/** Fetch current user from backend. Called once on app boot & after login. */
async function fetchMe() {
    state.loading = true;
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
            state.user = await res.json();
        } else {
            state.user = null;
        }
    } catch {
        state.user = null;
    } finally {
        state.loading = false;
        state.checked = true;
    }
}

/** Redirect to Google OAuth flow. */
function loginWithGoogle() {
    window.location.href = '/api/auth/google';
}

/** Call logout endpoint then clear local state. */
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    state.user = null;
}

// Auto-fetch on import (runs once)
fetchMe();

export const useAuth = () => ({
    state: readonly(state),
    fetchMe,
    loginWithGoogle,
    logout,
});
