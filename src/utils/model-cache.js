// Simple IndexedDB cache for model files
class ModelCache {
  constructor() {
    this.dbName = 'piper-tts-cache';
    this.storeName = 'models';
    this.version = 2; // Increment version to trigger upgrade
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        } else {
          // Upgrade existing store - add contentHash field if needed
          const store = event.target.transaction.objectStore(this.storeName);
          if (!store.indexNames.contains('contentHash')) {
            store.createIndex('contentHash', 'contentHash', { unique: false });
          }
        }
      };
    });
  }

  /**
   * Calculate a simple hash of the file content for change detection
   * Uses first 1KB + last 1KB + total size as a fingerprint
   */
  async calculateContentHash(arrayBuffer) {
    try {
      // Use SubtleCrypto for SHA-256 hash (more reliable)
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback: simple hash using size + first/last bytes
      const view = new Uint8Array(arrayBuffer);
      const size = view.length;
      const firstBytes = Array.from(view.slice(0, Math.min(100, size))).join(',');
      const lastBytes = Array.from(view.slice(Math.max(0, size - 100), size)).join(',');
      return `${size}-${firstBytes}-${lastBytes}`;
    }
  }

  async get(url) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (7 days)
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          if (Date.now() - result.timestamp < maxAge) {
            // Return cached data with its hash for comparison
            resolve({
              data: result.data,
              contentHash: result.contentHash || null
            });
            return;
          } else {
            // Cache expired, remove it
            this.delete(url);
          }
        }
        resolve(null);
      };
    });
  }

  async set(url, data, contentHash) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        url,
        data,
        contentHash: contentHash || null,
        timestamp: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(url) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(url);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Cached fetch function for model files
// onProgress(ratio) — ratio is 0..1 representing download progress
export async function cachedFetch(url, onProgress = null) {
  const cache = new ModelCache();

  // ── 1) Cache-first: return immediately if valid ──
  try {
    const cached = await cache.get(url);
    if (cached) {
      if (onProgress) onProgress(1);
      return new Response(cached.data);
    }
  } catch (err) {
    console.warn('Cache read failed, will fetch from network:', err);
  }

  // ── 2) Fetch from network with streaming progress ──
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const contentLength = Number(response.headers.get('Content-Length')) || 0;
  const reader = response.body?.getReader();

  // Fallback: if ReadableStream not supported (rare), use arrayBuffer directly
  if (!reader) {
    const data = await response.arrayBuffer();
    try { await cache.set(url, data, null); } catch (_) { /* ignore cache write errors */ }
    if (onProgress) onProgress(1);
    return new Response(data);
  }

  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress && contentLength) {
      onProgress(Math.min(received / contentLength, 1));
    }
  }

  // Merge chunks into a single ArrayBuffer
  const merged = new Uint8Array(received);
  let pos = 0;
  for (const chunk of chunks) {
    merged.set(chunk, pos);
    pos += chunk.length;
  }
  const data = merged.buffer;

  // Store in cache for next time (fire-and-forget)
  try { await cache.set(url, data, null); } catch (_) { /* ignore */ }
  if (onProgress) onProgress(1);

  return new Response(data);
}

export default ModelCache;