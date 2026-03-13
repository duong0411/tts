<script setup>
import { ref, onMounted } from 'vue';
import { PlayCircleIcon } from 'lucide-vue-next';

const emit = defineEmits(['text-click']);
const demos = ref([]);
const loading = ref(true);

const loadDemos = async () => {
  loading.value = true;
  const demoFiles = [
    { filename: 'duy_oryx_demo', speaker: 'Duy Oryx' },
    { filename: 'manh_dung_demo', speaker: 'Mạnh Dũng' },
    { filename: 'my_tam_demo', speaker: 'Mỹ Tâm' },
    { filename: 'ngoc_huyen_moi_demo', speaker: 'Ngọc Huyền (mới)' },
    { filename: 'ngoc_ngan_demo', speaker: 'Ngọc Ngạn' },
  ];

  const results = await Promise.all(
    demoFiles.map(async ({ filename, speaker }) => {
      try {
        const res = await fetch(`/demo/${filename}.txt`);
        if (!res.ok) throw new Error();
        const text = await res.text();
        return { text: text.trim(), speaker, audioUrl: `/demo/${filename}.wav` };
      } catch { return null; }
    })
  );
  demos.value = results.filter(Boolean);
  loading.value = false;
};

const handleTextClick = (t) => emit('text-click', t);
onMounted(loadDemos);
</script>

<template>
  <div class="vs-card">
    <!-- Header -->
    <div class="vs-card-header demo-header">
      <div>
        <h2 class="demo-title">Voice Samples</h2>
        <p class="demo-desc">Click vào text để dùng trong ô nhập · Nghe thử từng giọng</p>
      </div>
      <span class="vs-badge" v-if="demos.length">{{ demos.length }} giọng</span>
    </div>

    <!-- Body -->
    <div class="vs-card-body">
      <!-- Loading -->
      <div v-if="loading" class="demo-loading">
        <div class="demo-spinner"></div>
        <span>Đang tải...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="demos.length === 0" class="demo-empty">
        Chưa có demo mẫu nào
      </div>

      <!-- Table -->
      <div v-else class="demo-table-wrap">
        <table class="demo-table">
          <thead>
            <tr>
              <th>Nội dung</th>
              <th>Giọng</th>
              <th>Nghe thử</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(demo, i) in demos"
              :key="i"
              class="demo-row"
              @click="handleTextClick(demo.text)"
            >
              <td class="demo-text-cell">
                <PlayCircleIcon class="demo-play-icon" />
                <span>{{ demo.text }}</span>
              </td>
              <td>
                <span class="vs-badge">{{ demo.speaker }}</span>
              </td>
              <td class="demo-audio-cell" @click.stop>
                <audio :src="demo.audioUrl" controls preload="metadata" class="demo-audio">
                  Your browser does not support the audio element.
                </audio>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.demo-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.demo-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
}

.demo-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}
.demo-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--card-border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.demo-empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.demo-table-wrap { overflow-x: auto; margin: -0.25rem; }
.demo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.demo-table thead th {
  text-align: left;
  padding: 0 0.75rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  border-bottom: 1.5px solid var(--card-border);
}

.demo-row {
  cursor: pointer;
  transition: background 0.12s;
}
.demo-row:hover { background: var(--nav-hover-bg); }
.demo-row:hover .demo-play-icon { opacity: 1; }

.demo-row td { padding: 0.875rem 0.75rem; border-bottom: 1px solid var(--card-border); vertical-align: middle; }
.demo-row:last-child td { border-bottom: none; }

.demo-text-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: var(--text-primary);
  line-height: 1.5;
  max-width: 340px;
}
.demo-row:hover .demo-text-cell { color: var(--accent); }

.demo-play-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: var(--accent);
  opacity: 0;
  transition: opacity 0.15s;
}

.demo-audio-cell { min-width: 260px; }
.demo-audio { width: 100%; height: 32px; }
</style>
