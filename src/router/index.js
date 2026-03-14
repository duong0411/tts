import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import VietnameseView from '../views/VietnameseView.vue';
import LoginView from '../views/LoginView.vue';
import AdminView from '../views/AdminView.vue';
import { useAuth } from '../stores/auth.js';

const routes = [
  // Public home
  { path: '/', component: HomeView },

  // Auth
  { path: '/login', component: LoginView, meta: { isAuth: true } },

  // Protected — require login
  { path: '/tts', component: VietnameseView, meta: { requiresAuth: true } },
  {
    path: '/admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ── Navigation guard ──────────────────────────────────────────────────────────
async function waitForAuth() {
  const auth = useAuth();
  if (auth.state.checked) return auth;
  // poll until initial /api/auth/me resolves
  await new Promise((resolve) => {
    const t = setInterval(() => {
      if (auth.state.checked) { clearInterval(t); resolve(); }
    }, 50);
  });
  return auth;
}

router.beforeEach(async (to) => {
  const auth = await waitForAuth();

  // Already logged in → skip login / home page
  if (to.meta.isAuth && auth.state.user) return '/tts';
  if (to.path === '/' && auth.state.user) return '/tts';

  // Not logged in → go to login with redirect param
  if (to.meta.requiresAuth && !auth.state.user) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // Admin-only routes
  if (to.meta.requiresAdmin && auth.state.user?.role !== 'admin') return '/tts';

  return true;
});

export default router;