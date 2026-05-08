<template>
  <div class="page">

    <!-- HEADER -->
    <header class="header">
      <div class="brand">
        <div class="dot"></div>
        <div>
          <h1>RaySense</h1>
          <p>Biometric Verification Module</p>
        </div>
      </div>

      <div class="time">
        {{ now }}
      </div>
    </header>

    <!-- MAIN -->
    <main class="main">

      <div class="container">

        <!-- CAMERA BOX -->
        <div class="camera">

          <!-- VIDEO -->
          <video
            v-if="scanState !== 'success'"
            ref="videoRef"
            autoplay
            playsinline
            muted
          ></video>

          <!-- SUCCESS IMAGE -->
          <img
            v-else
            :src="previewImage"
          />

          <!-- OVERLAY -->
          <div v-if="scanState !== 'success'" class="overlay">

            <div class="frame">

              <!-- SCAN LINE -->
              <div v-if="scanState === 'scanning'" class="scan-line"></div>

              <!-- CORNERS -->
              <div class="corner tl"></div>
              <div class="corner tr"></div>
              <div class="corner bl"></div>
              <div class="corner br"></div>

            </div>

            <p class="status">{{ statusText }}</p>

          </div>

        </div>

        <!-- BUTTONS -->
        <div class="actions">

          <button
            class="btn-primary flex-1"
            @click="handleScan"
            :disabled="scanState === 'scanning'"
          >
            <span v-if="scanState !== 'scanning'">Scan Face</span>

            <span v-else class="loading">
              <span class="spinner"></span>
              Scanning...
            </span>
          </button>

          <button
            class="btn-secondary"
            @click="resetToIdle"
          >
            Reset
          </button>

        </div>

        <!-- RESULT -->
        <div v-if="scanState === 'success'" class="result success">
          <h2>Attendance Marked</h2>
          <p>Hi {{ attendanceResult?.studentName || 'Student' }}</p>
        </div>

        <div v-if="scanState === 'error'" class="result error">
          <h2>Scan Failed</h2>
          <p>{{ errorMessage }}</p>
        </div>

      </div>

    </main>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'

const videoRef = ref(null)
let stream = null

const scanState = ref('idle')
const previewImage = ref(null)
const attendanceResult = ref(null)
const errorMessage = ref('')
const statusText = ref('Position your face inside the frame')

const now = computed(() =>
  new Date().toLocaleString()
)

// CAMERA
onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoRef.value.srcObject = stream
  } catch (e) {
    scanState.value = 'error'
    errorMessage.value = 'Camera access denied or unavailable'
  }
})

onBeforeUnmount(() => {
  if (stream) stream.getTracks().forEach(t => t.stop())
})

// CAPTURE
function captureFrame() {
  const video = videoRef.value
  const canvas = document.createElement('canvas')

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)

  return canvas.toDataURL('image/jpeg').split(',')[1]
}

// SCAN
async function handleScan() {
  if (scanState.value === 'scanning') return

  scanState.value = 'scanning'
  statusText.value = 'Scanning biometric data...'

  const base64 = captureFrame()
  previewImage.value = `data:image/jpeg;base64,${base64}`

  try {
    const token = localStorage.getItem('token') 

    const res = await axios.post(
      'http://localhost:8080/api/attendance/mark-by-face',
      base64,
      {
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Bearer ${token}` // 🔐 IMPORTANT FIX
        }
      }
    )

    attendanceResult.value = res.data
    scanState.value = 'success'
    statusText.value = 'Access Granted'

  } catch (err) {
    scanState.value = 'error'
    errorMessage.value =
      err.response?.data?.message || 'Face not recognized or server error'

    statusText.value = 'Access Denied'
  }
}

// RESET
function resetToIdle() {
  scanState.value = 'idle'
  attendanceResult.value = null
  errorMessage.value = ''
  statusText.value = 'Position your face inside the frame'
}
</script>

<style scoped>

/* PAGE */
.page {
  min-height: 100vh;
  background: #05070a;
  color: white;
  display: flex;
  flex-direction: column;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 12px #00F0FF;
}

.brand h1 {
  font-size: 14px;
  margin: 0;
}

.brand p {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
}

.time {
  font-size: 11px;
  color: #6b7280;
}

/* MAIN */
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.container {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* CAMERA */
.camera {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,240,255,0.08);
  background: #0b0f14;
}

video,
img {
  width: 100%;
  height: 420px;
  object-fit: cover;
}

/* OVERLAY */
.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.frame {
  position: relative;
  width: 240px;
  height: 280px;
  border: 1px solid rgba(0,240,255,0.4);
  border-radius: 14px;
}

/* SCAN LINE */
.scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: #00F0FF;
  box-shadow: 0 0 10px #00F0FF;
  animation: scan 1.6s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

/* CORNERS */
.corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid #00F0FF;
}

.tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.tr { top: 0; right: 0; border-left: none; border-bottom: none; }
.bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.br { bottom: 0; right: 0; border-left: none; border-top: none; }

/* STATUS */
.status {
  margin-top: 12px;
  font-size: 12px;
  color: #00F0FF;
}

/* BUTTONS */
.actions {
  display: flex;
  gap: 12px;
}

/* PRIMARY BUTTON (LOGIN STYLE) */
.btn-primary {
  flex: 1;
  padding: 12px;
  border-radius: 10px;

  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(0,240,255,0.25);

  color: #00F0FF;
  font-weight: 600;

  cursor: pointer;
  transition: 0.2s;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(0,240,255,0.08), transparent);
  transform: translateX(-100%);
  animation: sweep 3.5s linear infinite;
}

@keyframes sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.btn-primary:hover {
  border-color: rgba(0,240,255,0.6);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* SECONDARY */
.btn-secondary {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  color: #9ca3af;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: rgba(0,240,255,0.25);
  color: #00F0FF;
}

/* LOADING */
.loading {
  display: flex;
  gap: 8px;
  align-items: center;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* RESULT */
.result {
  text-align: center;
  padding: 10px;
}

.result.success h2 { color: #00F0FF; }
.result.error h2 { color: #ef4444; }

</style>