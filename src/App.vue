<script setup>
import { ref, computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import ThemeToggle from './components/ThemeToggle.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import { History, Share2, MessageSquareText, Volume2, ShieldIcon, UserCircle2Icon, LogInIcon, LogOutIcon } from 'lucide-vue-next';
import { useAuth } from './stores/auth.js';

const route = useRoute();
const router = useRouter();
const shareCopied = ref(false);
let shareFeedbackTimer = null;
const historyOpen = ref(false);
const { state, loginWithGoogle, logout } = useAuth();

// Full-screen pages (no sidebar): landing + auth
const isAuthPage = computed(() => route.path === '/login' || route.path === '/');

function copyShareLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    shareCopied.value = true;
    if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer);
    shareFeedbackTimer = setTimeout(() => { shareCopied.value = false; }, 2000);
  });
}

async function handleLogout() {
  await logout();
  router.push('/');
}
</script>

<template>
  <!-- Auth pages: full-screen, no sidebar -->
  <RouterView v-if="isAuthPage" />

  <!-- Normal layout: sidebar + content -->
  <div v-else class="app-root">

    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon"><Volume2 class="w-5 h-5" /></div>
        <span class="logo-text">Voice<span class="logo-accent">Studio</span></span>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <p class="nav-section-label">Tools</p>
        <router-link to="/tts" class="nav-item" :class="{ active: route.path === '/tts' }">
          <MessageSquareText class="w-4 h-4" /><span>TTS Vietnamese</span>
        </router-link>

        <!-- Admin only -->
        <template v-if="state.user?.role === 'admin'">
          <p class="nav-section-label" style="margin-top: 1rem;">Admin</p>
          <router-link to="/admin" class="nav-item" :class="{ active: route.path === '/admin' }">
            <ShieldIcon class="w-4 h-4" /><span>Quản trị</span>
          </router-link>
        </template>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button class="footer-btn" @click="historyOpen = !historyOpen" :class="{ 'footer-btn-active': historyOpen }">
          <History class="w-4 h-4" /><span>History</span>
        </button>
        <button class="footer-btn" @click="copyShareLink" :class="{ 'footer-btn-success': shareCopied }">
          <Share2 class="w-4 h-4" /><span>{{ shareCopied ? 'Copied!' : 'Share' }}</span>
        </button>
        <ThemeToggle />

        <!-- User widget -->
        <div class="sidebar-user-divider"></div>

        <!-- Logged in -->
        <div v-if="state.user" class="user-widget">
          <img v-if="state.user.avatar_url" :src="state.user.avatar_url" :alt="state.user.name" class="user-avatar" />
          <UserCircle2Icon v-else class="w-8 h-8" style="color: var(--text-muted);" />
          <div class="user-widget-info">
            <p class="user-widget-name">{{ state.user.name ?? state.user.email }}</p>
            <p class="user-widget-plan">{{ state.user.plan }}</p>
          </div>
          <button class="logout-chip" @click="handleLogout">
            <LogOutIcon class="w-3 h-3" /> Đăng xuất
          </button>
        </div>

        <!-- Not logged in -->
        <router-link v-else-if="!state.loading" to="/login" class="vs-btn-primary login-btn">
          <LogInIcon class="w-4 h-4" /> Đăng nhập
        </router-link>

      </div>
    </aside>

    <!-- Main scrollable area -->
    <div class="main-scroll">
      <div class="main-content">
        <RouterView />
      </div>
    </div>

    <HistoryPanel :open="historyOpen" @close="historyOpen = false" />
  </div>
</template>

<style scoped>
.app-root { display: flex; min-height: 100vh; background: var(--app-bg); }

/* ── Sidebar ─────────────────────────────── */
.sidebar {
  width: 230px; min-width: 230px;
  display: flex; flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  padding: 1.5rem 1rem 1.25rem;
  gap: 1.75rem;
  position: sticky; top: 0; height: 100vh;
  overflow-y: auto;
}
.sidebar-logo { display: flex; align-items: center; gap: 0.625rem; padding: 0 0.25rem; }
.logo-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(192,57,43,.35); }
.logo-text { font-size: 1.0625rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
.logo-accent { color: var(--accent); }

.sidebar-nav { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
.nav-section-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); padding: 0 0.5rem; margin-bottom: 0.375rem; }
.nav-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.6rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); text-decoration: none; transition: all 0.12s; }
.nav-item:hover { background: var(--nav-hover-bg); color: var(--text-primary); }
.nav-item.active { background: var(--accent-light); color: var(--accent); font-weight: 600; }

.sidebar-footer { display: flex; flex-direction: column; gap: 0.25rem; border-top: 1px solid var(--sidebar-border); padding-top: 1rem; }
.footer-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); background: transparent; border: none; cursor: pointer; transition: all 0.12s; width: 100%; }
.footer-btn:hover { background: var(--nav-hover-bg); color: var(--text-primary); }
.footer-btn-active { background: var(--nav-hover-bg); color: var(--text-primary); }
.footer-btn-success { color: #16a34a !important; }

/* User widget */
.sidebar-user-divider { height: 1px; background: var(--sidebar-border); margin: 0.25rem 0; }
.user-widget { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; border-radius: 0.625rem; text-decoration: none; transition: background 0.12s; cursor: default; }
.user-widget:hover { background: var(--nav-hover-bg); }
.user-avatar { width: 2rem; height: 2rem; border-radius: 50%; border: 1.5px solid var(--card-border); object-fit: cover; }
.user-widget-info { flex: 1; min-width: 0; }
.user-widget-name { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-widget-plan { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.04em; }
.login-btn { width: 100%; margin-top: 0.25rem; }

.logout-chip {
  border: none;
  border-radius: 999px;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--nav-hover-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.logout-chip:hover {
  background: var(--accent-light);
  color: var(--accent);
}

/* ── Main ───────────────────────────────── */
.main-scroll { flex: 1; overflow-y: auto; display: flex; justify-content: center; }
.main-content { width: 100%; max-width: 760px; padding: 2.75rem 2rem 4rem; }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .main-content { padding: 1.5rem 1rem 2rem; }
}
</style>
