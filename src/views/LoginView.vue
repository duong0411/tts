<script setup>
import { ref, watch } from 'vue';
import { useAuth } from '../stores/auth.js';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeftIcon, MailIcon, LockIcon, UserIcon, ArrowRightIcon, UserPlusIcon, Loader2Icon } from 'lucide-vue-next';

const { loginWithGoogle, fetchMe } = useAuth();
const router = useRouter();
const route = useRoute();

const mode = ref(route.query.mode === 'register' ? 'register' : 'login'); // 'login' | 'register'
const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

watch(
  () => route.query.mode,
  (val) => {
    if (val === 'register' || val === 'login') {
      mode.value = val;
      error.value = '';
      password.value = '';
    }
  },
);

function switchMode(m) {
  mode.value = m;
  error.value = '';
  password.value = '';
}

async function handleLogin() {
  error.value = '';
  if (!email.value || !password.value) { error.value = 'Vui lòng điền đầy đủ thông tin.'; return; }
  loading.value = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const data = await res.json();
    if (!res.ok) { error.value = data.error ?? 'Đăng nhập thất bại.'; return; }
    await fetchMe();
    router.push('/tts');
  } catch { error.value = 'Không thể kết nối đến máy chủ.'; }
  finally { loading.value = false; }
}

async function handleRegister() {
  error.value = '';
  if (!email.value || !password.value) { error.value = 'Vui lòng điền đầy đủ thông tin.'; return; }
  if (password.value.length < 6) { error.value = 'Mật khẩu tối thiểu 6 ký tự.'; return; }
  loading.value = true;
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.value, password: password.value, name: name.value }),
    });
    const data = await res.json();
    if (!res.ok) { error.value = data.error ?? 'Đăng ký thất bại.'; return; }
    await fetchMe();
    router.push('/tts');
  } catch { error.value = 'Không thể kết nối đến máy chủ.'; }
  finally { loading.value = false; }
}
</script>

<template>
  <div class="auth-root">
    <!-- Background glow blobs -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <!-- Back button -->
    <router-link to="/" class="back-btn">
      <ArrowLeftIcon class="w-4 h-4" />
      Về trang chủ
    </router-link>

    <!-- Card -->
    <div class="auth-card">
      <!-- ── LOGIN ─────────────────────────────────── -->
      <template v-if="mode === 'login'">
        <h1 class="auth-title">Chào Mừng!</h1>
        <p class="auth-sub">Đăng nhập để tiếp tục hành trình tổng hợp giọng nói<br>tại VoiceStudio</p>

        <form class="auth-form" @submit.prevent="handleLogin">
          <div class="field-group">
            <label class="field-label">ĐỊA CHỈ EMAIL</label>
            <div class="input-wrap">
              <MailIcon class="input-icon" />
              <input v-model="email" type="email" placeholder="adamphung@example.com"
                class="pill-input" autocomplete="email" :disabled="loading" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">MẬT KHẨU</label>
            <div class="input-wrap">
              <LockIcon class="input-icon" />
              <input v-model="password" type="password" placeholder="••••••••"
                class="pill-input" autocomplete="current-password" :disabled="loading" />
            </div>
          </div>

          <p v-if="error" class="err-msg">{{ error }}</p>

          <button type="submit" class="purple-btn" :disabled="loading">
            <Loader2Icon v-if="loading" class="w-5 h-5 spin" />
            <ArrowRightIcon v-else class="w-5 h-5" />
            {{ loading ? 'Đang đăng nhập…' : 'Đăng Nhập' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="or-divider"><span>hoặc</span></div>

        <!-- Google -->
        <button class="google-btn" @click="loginWithGoogle" :disabled="loading">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Tiếp tục với Google
        </button>

        <p class="switch-text">
          Thành viên mới?
          <button class="switch-link" @click="switchMode('register')">Tạo tài khoản</button>
        </p>
      </template>

      <!-- ── REGISTER ──────────────────────────────── -->
      <template v-else>
        <h1 class="auth-title">Bắt Đầu Thôi!</h1>
        <p class="auth-sub">Gia nhập VoiceStudio để tổng hợp và lưu trữ<br>âm thanh của bạn</p>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="field-group">
            <label class="field-label">TÊN HIỂN THỊ</label>
            <div class="input-wrap">
              <UserIcon class="input-icon" />
              <input v-model="name" type="text" placeholder="Biệt hiệu của bạn"
                class="pill-input" autocomplete="name" :disabled="loading" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">EMAIL ĐĂNG KÝ</label>
            <div class="input-wrap">
              <MailIcon class="input-icon" />
              <input v-model="email" type="email" placeholder="name@domain.com"
                class="pill-input" autocomplete="email" :disabled="loading" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">MẬT KHẨU</label>
            <div class="input-wrap">
              <LockIcon class="input-icon" />
              <input v-model="password" type="password" placeholder="Tối thiểu 6 ký tự"
                class="pill-input" autocomplete="new-password" :disabled="loading" />
            </div>
          </div>

          <p v-if="error" class="err-msg">{{ error }}</p>

          <button type="submit" class="purple-btn" :disabled="loading">
            <Loader2Icon v-if="loading" class="w-5 h-5 spin" />
            <UserPlusIcon v-else class="w-5 h-5" />
            {{ loading ? 'Đang tạo tài khoản…' : 'Tạo Tài Khoản' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="or-divider"><span>hoặc</span></div>

        <!-- Google -->
        <button class="google-btn" @click="loginWithGoogle" :disabled="loading">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Đăng ký với Google
        </button>

        <p class="switch-text">
          Đã là thành viên?
          <button class="switch-link" @click="switchMode('login')">Đăng nhập</button>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────── */
.auth-root {
  min-height: 100vh;
  background: #0d0b14;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 2rem 1rem;
}

/* Background glow */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
}
.blob-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #7c3aed, transparent 70%);
  top: -100px; right: -100px;
}
.blob-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #4f46e5, transparent 70%);
  bottom: -80px; left: -80px;
}

/* ── Back button ──────────────────────────────────── */
.back-btn {
  position: fixed;
  top: 1.25rem; left: 1.25rem;
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.75);
  font-size: 0.875rem; font-weight: 500;
  text-decoration: none;
  backdrop-filter: blur(8px);
  transition: all 0.15s;
  z-index: 10;
}
.back-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

/* ── Card ─────────────────────────────────────────── */
.auth-card {
  width: 100%; max-width: 440px;
  background: rgba(30, 24, 48, 0.85);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1.25rem;
  padding: 2.5rem 2rem 2rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1);
  position: relative;
  z-index: 1;
}

/* ── Title ────────────────────────────────────────── */
.auth-title {
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  text-align: center;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}
.auth-sub {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.45);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

/* ── Form ─────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group { display: flex; flex-direction: column; gap: 0.5rem; }
.field-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.4);
}

/* Pill input */
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 1rem;
  width: 1rem; height: 1rem;
  color: rgba(0,0,0,0.35);
  pointer-events: none;
  flex-shrink: 0;
}
.pill-input {
  width: 100%;
  padding: 0.825rem 1.125rem 0.825rem 2.75rem;
  border-radius: 999px;
  border: none;
  background: rgba(255,255,255,0.92);
  color: #1a1a2e;
  font-size: 0.9375rem;
  font-family: inherit;
  outline: none;
  transition: background 0.15s, box-shadow 0.15s;
}
.pill-input::placeholder { color: rgba(0,0,0,0.35); }
.pill-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(124,58,237,0.5);
}
.pill-input:disabled { opacity: 0.6; cursor: not-allowed; }

/* Error */
.err-msg {
  font-size: 0.8125rem;
  color: #f87171;
  text-align: center;
  padding: 0.375rem 0;
}

/* Purple button */
.purple-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  font-size: 1.0625rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 0.25rem;
  box-shadow: 0 4px 20px rgba(124,58,237,0.4);
}
.purple-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(124,58,237,0.55);
}
.purple-btn:active { transform: translateY(0); }
.purple-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* OR divider */
.or-divider {
  position: relative;
  text-align: center;
  margin: 1.25rem 0 0.875rem;
}
.or-divider::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 1px;
  background: rgba(255,255,255,0.1);
}
.or-divider span {
  position: relative;
  background: rgba(30, 24, 48, 0.85);
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.3);
  font-weight: 500;
}

/* Google button */
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  backdrop-filter: blur(4px);
}
.google-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: #fff;
  transform: translateY(-1px);
}
.google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Switch */
.switch-text {
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255,255,255,0.4);
  margin-top: 1.125rem;
}
.switch-link {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  transition: color 0.12s;
}
.switch-link:hover { color: #a78bfa; }

/* Spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
