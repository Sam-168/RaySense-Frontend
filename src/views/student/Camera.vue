<template>
  <div class="camera-wrapper">
    <!-- State: No photo captured yet -->
    <div v-if="!capturedPhoto" class="camera-container">
      <!-- Live video feed -->
      <div class="video-frame">
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="video-feed"
          :class="{ 'mirror': mirrorMode }"
        />

        <!-- Overlay: loading / error -->
        <div v-if="cameraState === 'loading'" class="camera-overlay">
          <div class="spinner" />
          <p class="overlay-text">Starting camera…</p>
        </div>

        <div v-if="cameraState === 'error'" class="camera-overlay camera-overlay--error">
          <svg class="overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.95 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p class="overlay-text">{{ errorMessage }}</p>
          <button class="retry-btn" @click="startCamera">Try Again</button>
        </div>

        <!-- Face guide overlay when camera is ready -->
        <div v-if="cameraState === 'ready'" class="face-guide">
          <div class="face-oval" />
          <p class="guide-hint">Position your face in the oval</p>
        </div>
      </div>

      <!-- Controls -->
      <div class="camera-controls">
        <button
          v-if="cameraState === 'ready'"
          class="capture-btn"
          @click="capturePhoto"
          :disabled="isCapturing"
        >
          <span class="capture-btn__ring" />
          <span class="capture-btn__inner" />
        </button>

        <label v-if="cameraState === 'error'" class="upload-fallback">
          <input type="file" accept="image/*" capture="user" class="sr-only" @change="handleFileUpload" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload Photo Instead
        </label>
      </div>

      <!-- Mirror toggle -->
      <button class="mirror-toggle" @click="mirrorMode = !mirrorMode" title="Flip camera">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </button>
    </div>

    <!-- State: Photo captured — preview -->
    <div v-else class="preview-container">
      <div class="preview-frame">
        <img :src="capturedPhoto" alt="Captured photo" class="preview-img" :class="{ 'mirror': mirrorMode }" />
        <div class="preview-badge">
          <svg viewBox="0 0 20 20" fill="currentColor" class="badge-icon">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd" />
          </svg>
          Photo captured
        </div>
      </div>

      <div class="preview-actions">
        <button class="retake-btn" @click="retakePhoto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Retake
        </button>
        <button class="use-btn" @click="usePhoto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Use This Photo
        </button>
      </div>
    </div>

    <!-- Hidden canvas for capture -->
    <canvas ref="canvasRef" class="sr-only" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'photo-captured', 'photo-cleared'])

// Refs
const videoRef = ref(null)
const canvasRef = ref(null)
const capturedPhoto = ref(props.modelValue || null)
const cameraState = ref('loading') // 'loading' | 'ready' | 'error'
const errorMessage = ref('')
const isCapturing = ref(false)
const mirrorMode = ref(true)
let stream = null

// Start camera
async function startCamera() {
  cameraState.value = 'loading'
  errorMessage.value = ''

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
      cameraState.value = 'ready'
    }
  } catch (err) {
    cameraState.value = 'error'
    if (err.name === 'NotAllowedError') {
      errorMessage.value = 'Camera access denied. Please allow camera access and try again.'
    } else if (err.name === 'NotFoundError') {
      errorMessage.value = 'No camera found. Please use the upload option below.'
    } else {
      errorMessage.value = 'Could not start camera. Please try again.'
    }
  }
}

// Capture photo from video
function capturePhoto() {
  if (!videoRef.value || !canvasRef.value || isCapturing.value) return

  isCapturing.value = true
  const video = videoRef.value
  const canvas = canvasRef.value

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')

  // Mirror the capture to match the preview
  if (mirrorMode.value) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }

  ctx.drawImage(video, 0, 0)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  capturedPhoto.value = dataUrl

  // Stop camera stream
  stopCamera()
  isCapturing.value = false
}

// Handle file upload fallback
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    capturedPhoto.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Retake — restart camera
async function retakePhoto() {
  capturedPhoto.value = null
  emit('update:modelValue', null)
  emit('photo-cleared')
  await startCamera()
}

// Confirm use of photo
function usePhoto() {
  if (!capturedPhoto.value) return

  // Strip the data URI prefix — send only the base64 string
  const base64 = capturedPhoto.value.includes(',')
    ? capturedPhoto.value.split(',')[1]
    : capturedPhoto.value

  emit('update:modelValue', base64)
  emit('photo-captured', base64)
}

// Stop the stream
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
}

onMounted(startCamera)
onBeforeUnmount(stopCamera)

// Watch for external clear
watch(() => props.modelValue, (val) => {
  if (!val && capturedPhoto.value) retakePhoto()
})
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.camera-wrapper {
  width: 100%;
  position: relative;
}

/* ── Video container ─────────────────────────── */
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.video-frame {
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;
  background: #0A0A0A;
  border: 2px solid #E6F0FF;
  box-shadow: 0 4px 24px rgba(0, 102, 255, 0.12);
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-feed.mirror {
  transform: scaleX(-1);
}

/* ── Overlays ─────────────────────────────────── */
.camera-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(10, 10, 10, 0.75);
  backdrop-filter: blur(4px);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.camera-overlay--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.overlay-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #EF4444;
}

.overlay-text {
  font-size: 0.875rem;
  color: #F3F4F6;
  max-width: 260px;
  line-height: 1.5;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #0066FF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 0.25rem;
  padding: 0.5rem 1.25rem;
  background: #0066FF;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.retry-btn:hover { background: #0052CC; }

/* ── Face guide ───────────────────────────────── */
.face-guide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.face-oval {
  width: 48%;
  aspect-ratio: 3 / 4;
  border: 2.5px dashed rgba(0, 240, 255, 0.7);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25);
  animation: pulse-oval 2.5s ease-in-out infinite;
}

@keyframes pulse-oval {
  0%, 100% { border-color: rgba(0, 240, 255, 0.7); }
  50% { border-color: rgba(0, 102, 255, 0.9); }
}

.guide-hint {
  margin-top: 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.45);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  letter-spacing: 0.01em;
}

/* ── Controls ─────────────────────────────────── */
.camera-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.capture-btn {
  position: relative;
  width: 64px;
  height: 64px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}
.capture-btn:active { transform: scale(0.93); }
.capture-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.capture-btn__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid #0066FF;
  transition: border-color 0.2s;
}
.capture-btn:hover .capture-btn__ring { border-color: #00F0FF; }

.capture-btn__inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0066FF;
  transition: background 0.2s, transform 0.1s;
}
.capture-btn:hover .capture-btn__inner { background: #0052CC; }

.upload-fallback {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 1.5px solid #D1D5DB;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1F2937;
  cursor: pointer;
  background: white;
  transition: border-color 0.15s, background 0.15s;
}
.upload-fallback:hover { border-color: #0066FF; background: #E6F0FF; }

.upload-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #0066FF;
}

/* ── Mirror toggle ────────────────────────────── */
.mirror-toggle {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}
.mirror-toggle:hover { background: rgba(255, 255, 255, 0.3); }
.mirror-toggle svg { width: 1rem; height: 1rem; }

/* ── Preview ─────────────────────────────────── */
.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.preview-frame {
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 1rem;
  overflow: hidden;
  border: 2px solid #10B981;
  box-shadow: 0 4px 24px rgba(16, 185, 129, 0.15);
}

.preview-img {
  width: 100%;
  display: block;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.preview-img.mirror {
  transform: scaleX(-1);
}

.preview-badge {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: #10B981;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}

.badge-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 420px;
}

.retake-btn,
.use-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, box-shadow 0.15s;
}

.retake-btn {
  background: #F3F4F6;
  color: #1F2937;
  border: 1.5px solid #D1D5DB;
}
.retake-btn:hover { background: #E5E7EB; border-color: #9CA3AF; }

.use-btn {
  background: #0066FF;
  color: white;
}
.use-btn:hover { background: #0052CC; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3); }

.btn-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}
</style>