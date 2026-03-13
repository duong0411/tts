<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  MessageCircleIcon,
  MicIcon,
  TypeIcon,
  LogInIcon,
  UserPlusIcon,
} from 'lucide-vue-next';
import { useAuth } from '../stores/auth.js';

const router = useRouter();
const { state, loginWithGoogle } = useAuth();

const isLoggedIn = computed(() => !!state.user);

function goLogin(mode = 'login') {
  router.push({ path: '/login', query: { mode } });
}

function goTTS() {
  router.push('/tts');
}
</script>

<template>
  <div class="home-root">
    <!-- Background: grid tinh tế -->
    <div class="bg-grid" aria-hidden="true"></div>
    <!-- Background blobs (có float) -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <!-- Animated robot chạy trên giao diện -->
    <div class="robot-track">
      <div class="robot">
        <div class="robot-head">
          <div class="robot-eye robot-eye-l"></div>
          <div class="robot-eye robot-eye-r"></div>
          <div class="robot-antenna"></div>
        </div>
        <div class="robot-body"></div>
        <div class="robot-legs">
          <div class="robot-leg robot-leg-l"></div>
          <div class="robot-leg robot-leg-r"></div>
        </div>
      </div>
    </div>

    <!-- Centered content container -->
    <div class="home-shell">
      <header class="home-nav animate-in">
        <div class="nav-left">
          <div class="logo-dot"></div>
          <span class="logo-text">VoiceStudio</span>
        </div>

        <div class="nav-right">
          <!-- Chưa đăng nhập: chỉ còn nút Đăng nhập, đăng ký sẽ chọn trong màn Login -->
          <template v-if="!isLoggedIn">
            <button class="nav-link" @click="goLogin('login')">
              Đăng nhập
            </button>
          </template>

          <!-- Đã đăng nhập -->
          <button
            v-else
            class="nav-btn primary"
            @click="goTTS"
          >
            Vào TTS
          </button>
        </div>
      </header>

      <main class="home-main animate-in" style="animation-delay: 0.05s;">
        <!-- Left: hero copy -->
        <section class="hero">
          <p class="eyebrow hero-item" style="animation-delay: 0.1s;">CONVERSATION AI · VIETNAMESE</p>
          <h1 class="hero-title hero-item" style="animation-delay: 0.2s;">
            Tạo giọng nói &amp; nhận diện
            <br />
            <span class="gradient-text gradient-animate">tiếng Việt thông minh</span>
          </h1>
          <p class="hero-sub hero-item" style="animation-delay: 0.35s;">
            Nền tảng giọng nói tiếng Việt giúp bạn tạo voice‑over tự nhiên từ văn bản
            và chuyển file ghi âm thành phụ đề, transcript chỉ trong vài bước.
          </p>

          <div class="hero-features">
            <div class="feature-pill hero-item" style="animation-delay: 0.5s;">
              <TypeIcon class="icon small" />
              TTS tiếng Việt tự nhiên
            </div>
            <div class="feature-pill hero-item" style="animation-delay: 0.6s;">
              <MicIcon class="icon small" />
              Xuất file audio chất lượng cao
            </div>
            <div class="feature-pill hero-item" style="animation-delay: 0.7s;">
              <MessageCircleIcon class="icon small" />
              Tối ưu cho hội thoại AI
            </div>
          </div>
        </section>

        <!-- Right: conversation style preview -->
        <section class="chat-preview hero-item" style="animation-delay: 0.4s;">
          <div class="chat-card">
            <div class="chat-header">
              <div class="chat-status-dot"></div>
              <span>Conversation AI</span>
            </div>

            <div class="chat-body">
              <div class="bubble user bubble-in" style="animation-delay: 0.5s;">
              <p>
                Xin chào, mình muốn tạo giọng nói tiếng Việt tự nhiên cho video.
              </p>
              <span class="bubble-meta">Bạn · TTS</span>
            </div>

            <div class="bubble ai bubble-in" style="animation-delay: 0.6s;">
              <p>
                Tuyệt vời! Hãy nhập đoạn script của bạn, chọn giọng và tốc độ,
                VoiceStudio sẽ tạo file âm thanh chất lượng cao chỉ sau vài giây.
              </p>
              <span class="bubble-meta">VoiceStudio · AI</span>
            </div>

            <div class="bubble user bubble-in" style="animation-delay: 0.7s;">
              <p>Mình cũng có file ghi âm cuộc họp, có thể chuyển thành text được không?</p>
              <span class="bubble-meta">Bạn · ASR</span>
            </div>

            <div class="bubble ai bubble-in" style="animation-delay: 0.8s;">
              <p>
                Có chứ! Tải file lên mục ASR, chúng tôi sẽ tự động tạo transcript
                và phụ đề SRT để bạn dùng cho video hoặc lưu trữ.
              </p>
              <span class="bubble-meta">VoiceStudio · AI</span>
            </div>
          </div>

          <!-- Footer điều hướng TTS/ASR được bỏ theo yêu cầu,
               trang chính chỉ dùng để quảng bá + đăng nhập/đăng ký -->
        </div>
      </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.home-root {
  min-height: 100vh;
  color: #e5e7eb;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 1.5rem 1.2rem 2rem;
  background: linear-gradient(180deg, #0f172a 0%, #020617 40%, #0c1222 100%);
  background-image:
    radial-gradient(ellipse 80% 50% at 20% 20%, rgba(124, 58, 237, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(34, 197, 94, 0.12), transparent),
    radial-gradient(circle at top left, #1f2937 0, #020617 45%, #020617 100%);
}

/* Nền grid tinh tế */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

.home-shell {
  width: 100%;
  max-width: 1160px;
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  position: relative;
  z-index: 1;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.35;
  pointer-events: none;
  animation: blob-float 8s ease-in-out infinite;
}
.blob-1 {
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, #7c3aed, transparent 70%);
  top: -160px;
  right: -160px;
  animation-delay: 0s;
}
.blob-2 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, #22c55e, transparent 70%);
  bottom: -180px;
  left: -120px;
  animation-delay: -4s;
}
@keyframes blob-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -15px) scale(1.02); }
  66% { transform: translate(-10px, 10px) scale(0.98); }
}

/* ── Robot chạy động ───────────────────────────────────────────────────── */
.robot-track {
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  height: 80px;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}
.robot {
  position: absolute;
  left: -60px;
  bottom: 0;
  animation: robot-run 12s linear infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.robot-head {
  width: 36px;
  height: 36px;
  background: linear-gradient(145deg, #64748b, #475569);
  border-radius: 8px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
  border: 2px solid rgba(148, 163, 184, 0.5);
  animation: robot-bounce 0.4s ease-in-out infinite alternate;
}
.robot-eye {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  position: absolute;
  top: 10px;
  box-shadow: 0 0 8px #22c55e;
  animation: robot-blink 2s ease-in-out infinite;
}
.robot-eye-l { left: 8px; }
.robot-eye-r { right: 8px; }
.robot-antenna {
  width: 2px;
  height: 10px;
  background: #94a3b8;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 1px;
}
.robot-antenna::after {
  content: '';
  width: 6px;
  height: 6px;
  background: #a855f7;
  border-radius: 50%;
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  animation: antenna-pulse 1s ease-in-out infinite;
}
.robot-body {
  width: 28px;
  height: 24px;
  background: linear-gradient(145deg, #475569, #334155);
  border-radius: 6px;
  margin-top: -2px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid rgba(148, 163, 184, 0.3);
}
.robot-legs {
  display: flex;
  gap: 4px;
  margin-top: -2px;
}
.robot-leg {
  width: 10px;
  height: 14px;
  background: linear-gradient(180deg, #64748b, #475569);
  border-radius: 4px;
  animation: robot-leg-run 0.2s ease-in-out infinite alternate;
}
.robot-leg-r { animation-delay: -0.1s; }

@keyframes robot-run {
  0% { left: -60px; }
  100% { left: 100%; }
}
@keyframes robot-bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-4px); }
}
@keyframes robot-leg-run {
  from { transform: rotate(-8deg); }
  to { transform: rotate(8deg); }
}
@keyframes robot-blink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.2; }
}
@keyframes antenna-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #a855f7; }
  50% { opacity: 0.6; box-shadow: 0 0 12px #a855f7; }
}

/* Entrance animations */
.animate-in {
  opacity: 0;
  animation: fade-in-up 0.7s ease-out forwards;
}
.hero-item {
  opacity: 0;
  animation: fade-in-up 0.6s ease-out forwards;
}
.hero-item.gradient-animate { animation-name: fade-in-up; }
.bubble-in {
  opacity: 0;
  animation: bubble-appear 0.5s ease-out forwards;
}
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes bubble-appear {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.home-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.logo-dot {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: conic-gradient(from 140deg, #4f46e5, #22c55e, #a855f7, #4f46e5);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.8), 0 10px 25px rgba(79, 70, 229, 0.7);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.nav-left:hover .logo-dot {
  transform: scale(1.05);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.8), 0 12px 28px rgba(79, 70, 229, 0.5);
}
.logo-text {
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: #f9fafb;
  transition: letter-spacing 0.2s ease, color 0.2s ease;
}
.nav-left:hover .logo-text {
  letter-spacing: 0.1em;
  color: #e0e7ff;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-link {
  background: transparent;
  border: none;
  color: #e5e7eb;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.8;
  padding: 0.35rem 0.6rem;
  transition: opacity 0.2s, color 0.2s, box-shadow 0.2s;
  border-radius: 0.5rem;
  position: relative;
}
.nav-link:hover {
  opacity: 1;
  color: #a5b4fc;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0.6rem;
  right: 0.6rem;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6366f1, transparent);
  border-radius: 1px;
  transform: scaleX(0);
  transition: transform 0.2s ease;
}
.nav-link:hover::after {
  transform: scaleX(1);
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #e5e7eb;
  transition: all 0.15s;
}
.nav-btn .icon {
  width: 16px;
  height: 16px;
}
.nav-btn.ghost {
  border-color: rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.75);
}
.nav-btn.ghost:hover {
  background: rgba(30, 64, 175, 0.65);
  border-color: rgba(129, 140, 248, 0.7);
}
.nav-btn.primary {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-color: transparent;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.6);
}
.nav-btn.primary:hover {
  background: linear-gradient(135deg, #4f46e5, #a855f7);
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(79, 70, 229, 0.5);
}

.home-main {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  column-gap: 3rem;
  align-items: flex-start;
  padding: 1.8rem 2rem;
  border-radius: 1.75rem;
  background: radial-gradient(circle at top left, rgba(15,23,42,0.96), rgba(15,23,42,0.9));
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow:
    0 30px 80px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.4);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.home-main:hover {
  box-shadow:
    0 32px 88px rgba(15, 23, 42, 0.95),
    0 0 0 1px rgba(129, 140, 248, 0.2);
}

.hero {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
.eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #9ca3af;
}
.hero-title {
  font-size: clamp(2.3rem, 3.1vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  color: #f9fafb;
  line-height: 1.1;
}
.gradient-text {
  background: linear-gradient(120deg, #60a5fa, #a855f7, #22c55e, #60a5fa);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.gradient-animate {
  animation: gradient-shift 4s ease-in-out infinite;
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}
.hero-sub {
  font-size: 0.98rem;
  color: #cbd5f5;
  line-height: 1.7;
  max-width: 32rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 0.25rem;
}
.hero-auth {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
}
.cta .icon {
  width: 18px;
  height: 18px;
}
.cta.primary {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #f9fafb;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.7);
}
.cta.primary:hover {
  background: linear-gradient(135deg, #4f46e5, #a855f7);
  transform: translateY(-1px);
}
.cta.outline {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(148, 163, 184, 0.5);
  color: #e5e7eb;
}
.cta.outline:hover {
  background: rgba(30, 64, 175, 0.75);
  border-color: rgba(129, 140, 248, 0.8);
}
.cta.google {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(148, 163, 184, 0.4);
  color: #e5e7eb;
}
.cta.google:hover {
  background: rgba(15, 23, 42, 1);
  border-color: rgba(148, 163, 184, 0.75);
}

.hero-or {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.hero-or::before,
.hero-or::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(148, 163, 184, 0.35);
}

.hero-note {
  font-size: 0.8rem;
  color: #9ca3af;
}

.hero-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.75rem;
}
.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.8);
  font-size: 0.78rem;
  color: #cbd5f5;
  transition: transform 0.2s ease, border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.feature-pill:hover {
  transform: translateY(-2px);
  border-color: rgba(129, 140, 248, 0.5);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.2);
  background: rgba(30, 41, 59, 0.9);
}
.feature-pill .small {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}
.feature-pill:hover .small {
  transform: scale(1.1);
}

.chat-preview {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  min-height: 100%;
}
.chat-card {
  width: 100%;
  max-width: 380px;
  background: radial-gradient(circle at top left, rgba(15,23,42,0.98), rgba(15,23,42,0.96));
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    0 22px 55px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(76, 106, 199, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.chat-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 28px 64px rgba(15, 23, 42, 0.95),
    0 0 0 1px rgba(129, 140, 248, 0.4);
  border-color: rgba(129, 140, 248, 0.3);
}
.chat-header {
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid rgba(31, 41, 55, 1);
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.8rem;
  color: #e5e7eb;
}
.chat-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
  animation: status-pulse 2s ease-in-out infinite;
}
@keyframes status-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25); }
  50% { opacity: 0.85; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.15); }
}
.chat-body {
  padding: 0.9rem 0.9rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 320px;
  overflow: hidden;
}
.bubble {
  max-width: 260px;
  padding: 0.7rem 0.9rem;
  border-radius: 0.95rem;
  font-size: 0.8rem;
  line-height: 1.5;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.bubble:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.bubble.user {
  margin-left: auto;
  background: linear-gradient(135deg, #4f46e5, #22c55e);
  color: #f9fafb;
  border-bottom-right-radius: 0.2rem;
}
.bubble.ai {
  margin-right: auto;
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  border: 1px solid rgba(55, 65, 81, 0.9);
  border-bottom-left-radius: 0.2rem;
}
.bubble-meta {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.7;
}

@media (max-width: 960px) {
  .home-root {
    padding: 1.25rem 1.1rem 1.75rem;
  }
  .home-shell {
    max-width: 100%;
    gap: 1.75rem;
  }
  .home-main {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
    padding: 1.4rem 1.25rem;
  }
  .chat-preview {
    justify-content: flex-start;
  }
  .chat-card {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .home-nav {
    flex-direction: row;
    align-items: center;
  }
  .nav-right {
    gap: 0.5rem;
  }
  .hero {
    gap: 1.25rem;
  }
  .hero-title {
    font-size: 2rem;
  }
}
</style>

