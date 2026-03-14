<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  CheckIcon,
  Loader2Icon,
  AlertTriangleIcon,
} from 'lucide-vue-next';
import TextStatistics from '../components/TextStatistics.vue';
import SpeedControl from '../components/SpeedControl.vue';
import AudioChunk from '../components/AudioChunk.vue';
import ModelSelector from '../components/ModelSelector.vue';
import DemoTable from '../components/DemoTable.vue';
import { fetchAvailableModels } from '../utils/model-detector.js';
import { addEntry } from '../utils/history-store.js';
import { DEFAULT_MODEL } from '../config.js';

const text = ref("Adam Phùng là người vip");
const lastGeneration = ref(null);
const isPlaying = ref(false);
const currentChunkIndex = ref(-1);
const speed = ref(1);
const copied = ref(false);
const status = ref("idle");
const error = ref(null);
const worker = ref(null);
const voices = ref(null);
const selectedVoice = ref(0);
const chunks = ref([]);
const result = ref(null);
const availableModels = ref([]);
const selectedModel = ref("None");
const modelsLoading = ref(false);
const loadingProgress = ref(0);

const processed = computed(() =>
  lastGeneration.value &&
  lastGeneration.value.text === text.value &&
  lastGeneration.value.speed === speed.value &&
  lastGeneration.value.voice === selectedVoice.value
);

const setSpeed = (s) => { speed.value = s; };

const restartWorker = (modelName = null) => {
  if (worker.value) worker.value.terminate();
  status.value = "loading";
  loadingProgress.value = 0;
  voices.value = null;
  chunks.value = [];
  result.value = null;
  lastGeneration.value = null;
  isPlaying.value = false;
  currentChunkIndex.value = -1;

  worker.value = new Worker(new URL("../workers/tts-worker.js", import.meta.url), { type: "module" });
  worker.value.addEventListener("message", onMessageReceived);
  worker.value.addEventListener("error", onErrorReceived);
  const modelToLoad = modelName || selectedModel.value;
  worker.value.postMessage({ type: 'init', model: modelToLoad });
};

const setCurrentChunkIndex = (i) => { currentChunkIndex.value = i; };
const setIsPlaying = (p) => { isPlaying.value = p; };

const handleChunkEnd = () => {
  if (status.value !== "generating" && currentChunkIndex.value === chunks.value.length - 1) {
    isPlaying.value = false;
    currentChunkIndex.value = -1;
  } else {
    currentChunkIndex.value++;
  }
};

const handlePlayPause = () => {
  if (!isPlaying.value && status.value === "ready" && !processed.value) {
    status.value = "generating";
    chunks.value = [];
    currentChunkIndex.value = 0;
    const params = { text: text.value, voice: selectedVoice.value, speed: speed.value };
    lastGeneration.value = params;
    worker.value?.postMessage(params);
  }
  if (currentChunkIndex.value === -1) currentChunkIndex.value = 0;
  isPlaying.value = !isPlaying.value;
};

const downloadAudio = () => {
  if (!result.value) return;
  const url = URL.createObjectURL(result.value);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audio.wav";
  link.click();
  URL.revokeObjectURL(url);
};

const handleCopy = async () => {
  await navigator.clipboard.writeText(text.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

const handleDemoTextClick = (demoText) => { text.value = demoText; };

const fetchModels = async () => {
  modelsLoading.value = true;
  try {
    const models = await fetchAvailableModels();
    availableModels.value = models;
    if (selectedModel.value && selectedModel.value !== "None" && !models.includes(selectedModel.value)) {
      selectedModel.value = "None";
      if (worker.value) { worker.value.terminate(); worker.value = null; status.value = "loading"; voices.value = null; }
    }
    if (selectedModel.value === "None" && models.length > 0) {
      const defaultModel = (DEFAULT_MODEL.vi && models.includes(DEFAULT_MODEL.vi)) ? DEFAULT_MODEL.vi : models[0];
      selectedModel.value = defaultModel;
      restartWorker(defaultModel);
    }
  } catch (err) {
    error.value = `Failed to load models: ${err.message}`;
  } finally {
    modelsLoading.value = false;
  }
};

const handleModelChange = (modelName) => {
  if (modelName !== selectedModel.value) {
    selectedModel.value = modelName;
    if (modelName === "None") {
      if (worker.value) { worker.value.terminate(); worker.value = null; }
      status.value = "loading"; voices.value = null; chunks.value = []; result.value = null; lastGeneration.value = null; isPlaying.value = false; currentChunkIndex.value = -1;
    } else {
      restartWorker(modelName);
    }
  }
};

const onMessageReceived = ({ data }) => {
  switch (data.status) {
    case "progress":
      loadingProgress.value = Math.round((data.progress ?? 0) * 100);
      break;
    case "ready":
      loadingProgress.value = 100;
      setTimeout(() => { status.value = "ready"; loadingProgress.value = 0; }, 300);
      voices.value = data.voices;
      break;
    case "error":
      loadingProgress.value = 0; status.value = "error"; error.value = data.data;
      break;
    case "stream":
      chunks.value = [...chunks.value, data.chunk];
      break;
    case "complete":
      status.value = "ready"; result.value = data.audio;
      if (data.audio && lastGeneration.value && selectedModel.value) {
        addEntry({ text: lastGeneration.value.text, voice: lastGeneration.value.voice, speed: lastGeneration.value.speed, model: selectedModel.value, lang: 'vi', audio: data.audio }).catch(console.error);
      }
      break;
    case "preview":
      if (data.audio) {
        const audioUrl = URL.createObjectURL(data.audio);
        const audio = new Audio(audioUrl);
        audio.play().then(() => { setTimeout(() => URL.revokeObjectURL(audioUrl), 1000); }).catch(console.error);
      }
      break;
  }
};

const onErrorReceived = (e) => { error.value = e.message; };
onMounted(async () => { await fetchModels(); });
onUnmounted(() => { if (worker.value) worker.value.terminate(); });
</script>

<template>
  <div class="tts-page">

    <!-- Page Title -->
    <div class="page-header">
      <div class="page-title-wrap">
        <h1 class="page-title">Text to Speech</h1>
        <div class="page-title-bar"></div>
      </div>
      <p class="page-desc">Chuyển văn bản tiếng Việt thành giọng nói chất lượng cao</p>
    </div>

    <!-- Main Card -->
    <div class="vs-card">
      <div class="vs-card-body" style="display: flex; flex-direction: column; gap: 0;">

        <!-- ① Input Section -->
        <div class="card-section">
          <div style="position: relative;">
            <textarea
              v-model="text"
              placeholder="Nhập hoặc dán văn bản vào đây..."
              class="vs-textarea"
              style="min-height: 220px; padding-right: 3rem;"
              :style="voices ? '' : 'opacity: 0.6;'"
            ></textarea>
            <button class="copy-btn" @click="handleCopy" :title="copied ? 'Copied!' : 'Copy'">
              <CheckIcon v-if="copied" class="w-4 h-4" style="color: #16a34a;" />
              <CopyIcon v-else class="w-4 h-4" />
            </button>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
            <TextStatistics :text="text" />
          </div>
        </div>

        <!-- Divider -->
        <div class="card-divider"></div>

        <!-- ② Settings Section -->
        <div class="card-section" style="display: flex; flex-direction: column; gap: 0.875rem;">
          <div v-if="availableModels.length > 0" class="control-row">
            <label class="control-label">Model</label>
            <ModelSelector :models="availableModels" :selected-model="selectedModel" @model-change="handleModelChange" />
          </div>
          <div v-if="modelsLoading" class="status-info">
            <Loader2Icon class="w-4 h-4 spin" style="color: var(--accent);" />
            <span>Loading models...</span>
          </div>
          <div v-if="voices" class="control-row">
            <label class="control-label">Speed</label>
            <SpeedControl :speed="speed" @speed-change="setSpeed" />
          </div>
          <div v-if="error" class="status-error">
            <AlertTriangleIcon class="w-4 h-4" style="flex-shrink: 0;" />
            <span>{{ error }}</span>
          </div>
          <div v-else-if="selectedModel === 'None'" class="status-info">
            Chọn model để bắt đầu dùng TTS
          </div>
          <div v-else-if="!voices && status === 'loading'" class="progress-wrap">
            <div class="progress-labels">
              <span>Đang tải model...</span>
              <span class="progress-pct">{{ Math.round(loadingProgress) }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: `${loadingProgress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="card-divider"></div>

        <!-- ③ Action Section -->
        <div class="card-section action-section">
          <button
            class="vs-btn-primary action-play"
            :class="{ 'btn-pause': isPlaying }"
            @click="handlePlayPause"
            :disabled="(status === 'ready' && !isPlaying && !text) || (status !== 'ready' && chunks.length === 0)"
          >
            <PauseIcon v-if="isPlaying" class="w-4 h-4" />
            <PlayIcon v-else class="w-4 h-4" />
            <span v-if="isPlaying">Tạm dừng</span>
            <span v-else>{{ processed || status === 'generating' ? 'Phát lại' : 'Tạo giọng nói' }}</span>
          </button>

          <button class="vs-btn-secondary" @click="downloadAudio" :disabled="!result || status !== 'ready'">
            <DownloadIcon class="w-4 h-4" />
            Tải xuống .wav
          </button>
        </div>

        <!-- Hidden Audio -->
        <div style="display: none;">
          <AudioChunk
            v-for="(chunk, index) in chunks"
            :key="index"
            :audio="chunk.audio"
            :active="currentChunkIndex === index"
            :playing="isPlaying"
            @start="() => setCurrentChunkIndex(index)"
            @pause="() => { if (currentChunkIndex === index) setIsPlaying(false) }"
            @end="handleChunkEnd"
          />
        </div>
      </div>
    </div>

    <!-- Demo -->
    <DemoTable @text-click="handleDemoTextClick" />
  </div>
</template>

<style scoped>
.tts-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header { margin-bottom: 0.25rem; }
.page-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.04em;
  line-height: 1.15;
  white-space: nowrap;
}
.page-title-bar {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  border-radius: 999px;
  max-width: 120px;
}
.page-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.4rem;
}

/* Card sections */
.card-section { padding: 1.375rem 1.5rem; }
.card-divider { height: 1px; background: var(--card-border); margin: 0; }
.action-section { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; background: var(--nav-hover-bg); }

/* Copy button */
.copy-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.copy-btn:hover { background: var(--nav-hover-bg); color: var(--text-primary); }

/* Controls */
.control-row { display: flex; align-items: center; gap: 0.75rem; }
.control-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); min-width: 2.5rem; }

/* Status */
.status-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  background: var(--nav-hover-bg);
  border: 1px solid var(--card-border);
}
.status-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  color: #c0392b;
}
.dark .status-error { background: #2c1714; border-color: #5c2a24; color: #e05a4d; }

/* Progress */
.progress-wrap { display: flex; flex-direction: column; gap: 0.375rem; }
.progress-labels { display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--text-secondary); }
.progress-pct { font-weight: 700; color: var(--accent); }
.progress-track { height: 6px; background: var(--nav-hover-bg); border-radius: 999px; overflow: hidden; border: 1px solid var(--card-border); }
.progress-bar { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.3s ease-out; }

/* Actions */
.action-play { flex: 1; min-width: 140px; }
.btn-pause { background: #ea580c !important; }
.btn-pause:hover:not(:disabled) { background: #c2410c !important; box-shadow: 0 4px 12px rgba(234,88,12,.3) !important; }

/* Spinner */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
