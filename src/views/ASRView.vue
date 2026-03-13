<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { MicIcon, SquareIcon, Trash2Icon, UploadIcon, DownloadIcon, Loader2Icon } from 'lucide-vue-next';
import { getASRAssetUrl, ASR_CODE_BASE, getASRModelsListUrl, DEFAULT_ASR_MODEL, ASR_MODELS_FALLBACK, ASR_MODEL_STORAGE_KEY } from '../config.js';

const sharedScriptUrls = [
  `${ASR_CODE_BASE}sherpa-onnx-asr.js`,
  `${ASR_CODE_BASE}sherpa-onnx-vad.js`,
  `${ASR_CODE_BASE}app-vad-asr.js`,
];

const loadedScripts = ref([]);
const asrMode = ref('mic');
const asrModels = ref([]);
const selectedModel = ref(DEFAULT_ASR_MODEL);
const selectedFile = ref(null);
const uploadStatus = ref('');
const isProcessing = ref(false);
const asrReady = ref(false);

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src; script.async = false;
    script.onload = () => { loadedScripts.value.push(script); resolve(); };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function onFileChange(e) { selectedFile.value = e.target.files?.[0] || null; uploadStatus.value = ''; }

async function processUpload() {
  if (!selectedFile.value || isProcessing.value) return;
  const startBtn = document.getElementById('startBtn');
  if (startBtn?.disabled) { uploadStatus.value = 'Tắt microphone trước.'; return; }
  const fn = window.processUploadedAudio;
  if (typeof fn !== 'function') return;
  uploadStatus.value = 'Đang xử lý...';
  isProcessing.value = true; window.asrUploadInProgress = true;
  try { const buf = await selectedFile.value.arrayBuffer(); await fn(buf); uploadStatus.value = 'Hoàn thành'; }
  catch (err) { uploadStatus.value = err?.message || 'Lỗi'; }
  finally { isProcessing.value = false; window.asrUploadInProgress = false; }
}

function downloadSubtitle(ext) {
  const getSRT = window.getASRSubtitleSRT;
  if (typeof getSRT !== 'function') return;
  const content = getSRT();
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ext === 'srt' ? 'subtitles.srt' : 'subtitles.txt';
  a.click(); URL.revokeObjectURL(a.href);
}

function onAsrReady() { asrReady.value = true; }
function setMode(mode) { asrMode.value = mode; if (typeof window !== 'undefined') window.asrCurrentMode = mode; }

function onAsrModelChange(e) {
  const value = e?.target?.value;
  if (!value || value === selectedModel.value) return;
  try { localStorage.setItem(ASR_MODEL_STORAGE_KEY, value); } catch (_) {}
  window.location.reload();
}

function clearUpload() {
  if (typeof window !== 'undefined') window.asrCurrentMode = 'upload';
  document.getElementById('clearBtn')?.click();
}

onMounted(async () => {
  if (typeof window !== 'undefined') window.asrCurrentMode = 'mic';
  try { const saved = localStorage.getItem(ASR_MODEL_STORAGE_KEY); if (saved) selectedModel.value = saved; } catch (_) {}
  try {
    const res = await fetch(getASRModelsListUrl());
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data?.models) ? data.models : [];
    asrModels.value = list.length > 0 ? list : ASR_MODELS_FALLBACK;
    if (asrModels.value.length && !asrModels.value.includes(selectedModel.value)) {
      selectedModel.value = asrModels.value[0];
      try { localStorage.setItem(ASR_MODEL_STORAGE_KEY, selectedModel.value); } catch (_) {}
    }
  } catch (_) { asrModels.value = ASR_MODELS_FALLBACK; }

  window.addEventListener('asr-ready', onAsrReady);
  const model = selectedModel.value;
  const getUrl = (f) => getASRAssetUrl(f, model);
  try {
    await loadScript(sharedScriptUrls[0]);
    await loadScript(sharedScriptUrls[1]);
    await loadScript(sharedScriptUrls[2]);
    if (window.Module) window.Module.locateFile = (p) => getUrl(p);
    const wasmUrl = getUrl('sherpa-onnx-wasm-main-vad-asr.wasm');
    const r = await fetch(wasmUrl);
    const ct = r.headers.get('Content-Type') || '';
    if (ct.includes('text/html') || r.status === 404) {
      const el = document.getElementById('status');
      if (el) el.textContent = `ASR model "${model}" không tìm thấy.`;
      return;
    }
    await loadScript(getUrl('sherpa-onnx-wasm-main-vad-asr.js'));
    if (window.asrReady) asrReady.value = true;
  } catch (e) {
    console.error('ASR WASM load error:', e);
    const el = document.getElementById('status');
    if (el) el.textContent = 'Không tải được ASR.';
  }
});

onUnmounted(() => {
  window.removeEventListener('asr-ready', onAsrReady);
  loadedScripts.value.forEach((s) => { if (s.parentNode) s.parentNode.removeChild(s); });
  loadedScripts.value = [];
});
</script>

<template>
  <div class="asr-page">

    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Speech Recognition</h1>
      <p class="page-desc">Chuyển giọng nói thành văn bản tiếng Việt</p>
    </div>

    <div class="vs-card">
      <div class="vs-card-body" style="display: flex; flex-direction: column; gap: 1.25rem;">

        <!-- Status + Model -->
        <div class="asr-topbar">
          <div class="asr-status">
            <Loader2Icon v-if="!asrReady" class="w-4 h-4 spin" style="color: var(--accent);" />
            <div v-else class="status-dot"></div>
            <span id="status" class="asr-status-text">{{ asrReady ? 'Sẵn sàng' : 'Đang tải...' }}</span>
          </div>

          <label v-if="asrModels.length" class="asr-model-wrap">
            <span class="control-label">Model</span>
            <select :value="selectedModel" class="vs-select" @change="onAsrModelChange">
              <option v-for="m in asrModels" :key="m" :value="m">{{ m }}</option>
            </select>
          </label>
        </div>

        <!-- Mode Tabs -->
        <div id="singleAudioContent" class="tab-content" :class="{ loading: !asrReady }">
          <div class="asr-tabs">
            <button class="asr-tab" :class="{ 'asr-tab-active': asrMode === 'mic' }" @click="setMode('mic')">
              🎙️ Microphone
            </button>
            <button class="asr-tab" :class="{ 'asr-tab-active': asrMode === 'upload' }" @click="setMode('upload')">
              📁 Tải lên
            </button>
          </div>

          <!-- Mic -->
          <div v-show="asrMode === 'mic'" class="asr-controls">
            <button id="startBtn" disabled class="vs-btn-primary" style="min-width: 130px;">
              <MicIcon class="w-4 h-4" /> Bắt đầu
            </button>
            <button id="stopBtn" disabled class="vs-btn-primary" style="background: #ea580c; min-width: 110px;">
              <SquareIcon class="w-4 h-4" /> Dừng
            </button>
            <button id="clearBtn" class="vs-btn-secondary">
              <Trash2Icon class="w-4 h-4" /> Xóa
            </button>
          </div>

          <!-- Upload -->
          <div v-show="asrMode === 'upload'" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="asr-controls">
              <label class="vs-btn-secondary upload-label">
                <UploadIcon class="w-4 h-4" /><span>Chọn file</span>
                <input type="file" accept="audio/*" class="hidden-input" @change="onFileChange" />
              </label>
              <button class="vs-btn-primary" :disabled="!selectedFile || isProcessing || !asrReady" @click="processUpload" style="min-width: 130px;">
                <Loader2Icon v-if="isProcessing" class="w-4 h-4 spin" />
                Nhận dạng
              </button>
              <button class="vs-btn-secondary" @click="clearUpload">
                <Trash2Icon class="w-4 h-4" /> Xóa
              </button>
            </div>
            <p v-if="selectedFile" class="file-name">📄 {{ selectedFile.name }}</p>
            <p v-if="uploadStatus" class="upload-status" :class="{
              'status-ok': uploadStatus === 'Hoàn thành',
              'status-loading': uploadStatus.startsWith('Đang'),
              'status-err': !uploadStatus.startsWith('Đang') && uploadStatus !== 'Hoàn thành'
            }">{{ uploadStatus }}</p>
          </div>

          <!-- Download -->
          <div class="asr-controls">
            <button class="vs-btn-secondary" @click="downloadSubtitle('srt')">
              <DownloadIcon class="w-4 h-4" /> Tải SRT
            </button>
            <button class="vs-btn-secondary" @click="downloadSubtitle('txt')">
              <DownloadIcon class="w-4 h-4" /> Tải TXT
            </button>
          </div>

          <!-- Transcript Mic -->
          <div v-show="asrMode === 'mic'" class="transcript-wrap">
            <label class="transcript-label">Kết quả (Microphone)</label>
            <textarea id="results-mic" rows="10" placeholder="Kết quả sẽ hiện ở đây..." readonly class="vs-textarea" style="min-height: 200px;" />
          </div>

          <!-- Transcript Upload -->
          <div v-show="asrMode === 'upload'" class="transcript-wrap">
            <label class="transcript-label">Kết quả (File)</label>
            <textarea id="results-upload" rows="10" placeholder="Kết quả sẽ hiện ở đây..." readonly class="vs-textarea" style="min-height: 200px;" />
          </div>

          <section v-show="asrMode === 'mic'" id="sound-clips" class="space-y-2 overflow-auto" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asr-page { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { margin-bottom: 0.25rem; }
.page-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; line-height: 1.2; }
.page-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

.asr-topbar { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.asr-status { display: flex; align-items: center; gap: 0.5rem; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; }
.asr-status-text { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); }
.asr-model-wrap { display: flex; align-items: center; gap: 0.625rem; }
.control-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }

.asr-tabs { display: flex; gap: 0.5rem; border-bottom: 1.5px solid var(--card-border); padding-bottom: 0; margin-bottom: 0.875rem; }
.asr-tab { padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; margin-bottom: -1.5px; }
.asr-tab:hover { color: var(--text-primary); }
.asr-tab-active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

.asr-controls { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
.upload-label { cursor: pointer; }
.hidden-input { display: none; }
.file-name { font-size: 0.8125rem; color: var(--text-secondary); }
.upload-status { font-size: 0.8125rem; font-weight: 500; }
.status-ok { color: #16a34a; }
.status-loading { color: var(--text-muted); }
.status-err { color: var(--accent); }

.transcript-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
.transcript-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }

.tab-content.loading { display: none; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
