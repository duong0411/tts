<script setup>
import { ref, onMounted } from 'vue';
import { Loader2Icon, RefreshCwIcon, ShieldIcon } from 'lucide-vue-next';
import { useAuth } from '../stores/auth.js';
import { useRouter } from 'vue-router';

const { state } = useAuth();
const router = useRouter();

const users = ref([]);
const total = ref(0);
const queueJobs = ref([]);
const usersLoading = ref(false);
const queueLoading = ref(false);
const search = ref('');
const activeTab = ref('users');

async function fetchUsers() {
  usersLoading.value = true;
  try {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search.value)}&limit=50`, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); users.value = d.users; total.value = d.total; }
  } finally { usersLoading.value = false; }
}

async function fetchQueue() {
  queueLoading.value = true;
  try {
    const res = await fetch('/api/queue?limit=50', { credentials: 'include' });
    if (res.ok) { const d = await res.json(); queueJobs.value = d.jobs ?? []; }
  } finally { queueLoading.value = false; }
}

async function updateUser(id, patch) {
  await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, ...patch }),
  });
  await fetchUsers();
}

function relTime(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  return `${Math.floor(s/3600)}h`;
}

onMounted(async () => {
  if (!state.user || state.user.role !== 'admin') { router.push('/'); return; }
  fetchUsers();
  fetchQueue();
});
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <ShieldIcon class="w-6 h-6" style="color:var(--accent);" />
        <h1 class="page-title">Admin</h1>
        <div class="page-title-bar"></div>
      </div>
      <p class="page-desc">Quản lý người dùng & hàng chờ xử lý</p>
    </div>

    <!-- Tabs -->
    <div class="admin-tabs">
      <button class="admin-tab" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        👥 Người dùng <span class="tab-count">{{ total }}</span>
      </button>
      <button class="admin-tab" :class="{ active: activeTab === 'queue' }" @click="activeTab = 'queue'; fetchQueue()">
        ⚙️ Queue <span class="tab-count">{{ queueJobs.length }}</span>
      </button>
    </div>

    <!-- Users Table -->
    <div v-if="activeTab === 'users'" class="vs-card">
      <div class="vs-card-header" style="display:flex;gap:0.75rem;align-items:center;">
        <input v-model="search" @input="fetchUsers" placeholder="Tìm email / tên..." class="vs-textarea" style="height:2.25rem;padding:0.4rem 0.75rem;flex:1;min-height:unset;resize:none;" />
        <button class="vs-btn-secondary" @click="fetchUsers" :disabled="usersLoading" style="padding:0.45rem 0.75rem;">
          <RefreshCwIcon class="w-4 h-4" :class="{ spin: usersLoading }" />
        </button>
      </div>

      <div v-if="usersLoading" class="center-loader"><Loader2Icon class="w-5 h-5 spin" style="color:var(--accent);" /></div>
      <div v-else-if="users.length === 0" class="empty-state">Không tìm thấy user</div>

      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th><th>Plan</th><th>Role</th><th>Quota</th>
              <th>Dùng hôm nay</th><th>Jobs</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="admin-row">
              <td>
                <div class="user-cell">
                  <img v-if="u.avatar_url" :src="u.avatar_url" class="user-avatar-sm" />
                  <div class="user-cell-info">
                    <p class="user-name-sm">{{ u.name ?? '—' }}</p>
                    <p class="user-email-sm">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <select class="vs-select" :value="u.plan" @change="updateUser(u.id, { plan: $event.target.value })" style="font-size:0.75rem;padding:0.25rem 0.5rem;">
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                </select>
              </td>
              <td>
                <select class="vs-select" :value="u.role" @change="updateUser(u.id, { role: $event.target.value })" style="font-size:0.75rem;padding:0.25rem 0.5rem;">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <input type="number" class="vs-select" :value="u.quota_daily" @change="updateUser(u.id, { quota_daily: parseInt($event.target.value) })" style="width:6rem;font-size:0.75rem;padding:0.25rem 0.5rem;" />
              </td>
              <td class="text-right">
                <span :style="u.used_today >= u.quota_daily ? 'color:var(--accent);font-weight:700' : ''">
                  {{ u.used_today.toLocaleString() }}
                </span>
              </td>
              <td class="text-right">{{ u.total_jobs }}</td>
              <td>
                <button class="status-toggle" :class="u.is_active ? 'toggle-active' : 'toggle-banned'"
                  @click="updateUser(u.id, { is_active: u.is_active ? 0 : 1 })">
                  {{ u.is_active ? 'Active' : 'Banned' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Queue Table -->
    <div v-if="activeTab === 'queue'" class="vs-card">
      <div class="vs-card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.875rem;font-weight:600;color:var(--text-primary);">Hàng chờ xử lý</span>
        <button class="vs-btn-secondary" @click="fetchQueue" :disabled="queueLoading" style="padding:0.45rem 0.75rem;font-size:0.75rem;">
          <RefreshCwIcon class="w-4 h-4" :class="{ spin: queueLoading }" /> Refresh
        </button>
      </div>
      <div v-if="queueLoading" class="center-loader"><Loader2Icon class="w-5 h-5 spin" style="color:var(--accent);" /></div>
      <div v-else-if="queueJobs.length === 0" class="empty-state">Queue trống</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Text</th><th>Model</th><th>Chars</th><th>Priority</th><th>Status</th><th>Thời gian</th></tr></thead>
          <tbody>
            <tr v-for="j in queueJobs" :key="j.id" class="admin-row">
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ j.text }}</td>
              <td><span class="vs-badge">{{ j.model }}</span></td>
              <td class="text-right">{{ j.char_count.toLocaleString() }}</td>
              <td class="text-right">{{ j.priority }}</td>
              <td><span class="vs-badge" :class="`badge-${j.status}`">{{ j.status }}</span></td>
              <td style="color:var(--text-muted);font-size:0.75rem;">{{ relTime(j.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { margin-bottom: 0.25rem; }
.page-title-wrap { display: flex; align-items: center; gap: 0.625rem; }
.page-title { font-size: 2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em; }
.page-title-bar { flex:1; height: 2px; background: linear-gradient(90deg, var(--accent), transparent); border-radius: 999px; max-width: 100px; }
.page-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.4rem; }

.admin-tabs { display: flex; gap: 0.5rem; }
.admin-tab { padding: 0.55rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); background: var(--card-bg); border: 1.5px solid var(--card-border); cursor: pointer; transition: all 0.12s; }
.admin-tab:hover { color: var(--text-primary); }
.admin-tab.active { background: var(--accent-light); color: var(--accent); border-color: var(--badge-border); font-weight: 700; }
.tab-count { margin-left: 0.375rem; background: var(--nav-hover-bg); border-radius: 999px; padding: 0.1rem 0.45rem; font-size: 0.7rem; font-weight: 700; }

.center-loader { display: flex; justify-content: center; padding: 3rem 0; }
.empty-state { padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }

.table-wrap { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.admin-table thead th { text-align: left; padding: 0.6rem 1rem; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); border-bottom: 1.5px solid var(--card-border); }
.admin-row td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--card-border); vertical-align: middle; color: var(--text-primary); }
.admin-row:last-child td { border-bottom: none; }
.admin-row:hover { background: var(--nav-hover-bg); }
.text-right { text-align: right; }

.user-cell { display: flex; align-items: center; gap: 0.625rem; }
.user-avatar-sm { width: 2rem; height: 2rem; border-radius: 50%; border: 1px solid var(--card-border); }
.user-name-sm { font-weight: 600; font-size: 0.8125rem; color: var(--text-primary); }
.user-email-sm { font-size: 0.7rem; color: var(--text-muted); }

.status-toggle { padding: 0.2rem 0.625rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.12s; }
.toggle-active { background: #f0fdf4; color: #16a34a; }
.toggle-active:hover { background: #dcfce7; }
.toggle-banned { background: #fff5f5; color: #c0392b; }
.toggle-banned:hover { background: #fee2e2; }

.badge-done { background: #f0fdf4 !important; color: #16a34a !important; border-color: #bbf7d0 !important; }
.badge-error { background: #fff5f5 !important; color: #c0392b !important; border-color: #fecaca !important; }
.badge-processing { background: #fff7ed !important; color: #ea580c !important; border-color: #fed7aa !important; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
