<template>
  <div class="mark-page">

    <!-- HEADER -->
    <header class="page-header">
      <div class="logo-mark">
        <div class="logo-dot"></div>
        <span class="logo-text">RaySense</span>
      </div>
      <button class="back-btn" @click="$router.push('/student/dashboard')">
        ← Back
      </button>
    </header>

    <main class="page-main">

      <!-- SESSION INFO -->
      <div v-if="sessionInfo" class="session-banner">
        <div>
          <span class="session-module">{{ sessionInfo.sectionName }}</span>
          <p class="session-name">{{ sessionInfo.moduleName }}</p>
          <p class="session-lecturer">{{ sessionInfo.lecturerName }}</p>
        </div>
        <div class="pulse-wrap">
          <span class="pulse-dot"></span>
          <span class="live-text">LIVE</span>
        </div>
      </div>

      <!-- SUCCESS STATE -->
      <div v-if="success" class="success-state">
        <div class="success-icon">✓</div>
        <h2 class="success-title">Attendance Marked!</h2>
        <p class="success-sub">{{ successMessage }}</p>
        <button class="done-btn" @click="$router.push('/student/dashboard')">
          Back to Dashboard
        </button>
      </div>

      <!-- CAMERA -->
      <div v-else class="camera-section">

        <div class="camera-frame">

          <!-- VIDEO -->
          <video
            v-if="!photo"
            ref="video"
            autoplay
            playsinline
            class="video"
          ></video>

          <!-- PHOTO PREVIEW -->
          <img v-else :src="photo" class="video" />

          <!-- SCANNER OVERLAY -->
          <div v-if="!photo" class="scanner-overlay">
            <div class="scanner-box">
              <div class="scanner-line"></div>
            </div>
            <p class="scanner-text">Align your face in the frame</p>
          </div>

          <!-- PROCESSING OVERLAY -->
          <div v-if="processing" class="processing-overlay">
            <div class="spinner"></div>
            <p>Verifying identity...</p>
          </div>

        </div>

        <!-- ERROR -->
        <div v-if="error" class="banner-error">{{ error }}</div>

        <!-- BUTTONS -->
        <div class="btn-row">
          <button
            v-if="!photo"
            class="capture-btn"
            @click="capturePhoto"
            :disabled="!cameraReady"
          >
            📸 Capture
          </button>

          <template v-else>
            <button class="retake-btn" @click="retake" :disabled="processing">
              Retake
            </button>
            <button class="submit-btn" @click="submitAttendance" :disabled="processing">
              {{ processing ? 'Verifying...' : 'Submit' }}
            </button>
          </template>
        </div>

      </div>

    </main>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route  = useRoute()
const router = useRouter()

const sessionId = route.params.sessionId

const video       = ref(null)
const stream      = ref(null)
const photo       = ref(null)
const cameraReady = ref(false)
const processing  = ref(false)
const error       = ref('')
const success     = ref(false)
const successMessage = ref('')
const sessionInfo = ref(null)

// ── Load session info ────────────────────────────────────────────────────────
onMounted(async () => {
  // Load session details from active sessions
  try {
    const response = await api.get('/attendance/active-sessions')
    const sessions = response.data
    sessionInfo.value = sessions.find(s => s.sessionId == sessionId) || null

    if (!sessionInfo.value) {
      error.value = 'This session is no longer active.'
      return
    }
  } catch (err) {
    error.value = 'Failed to load session info.'
  }

  // Start camera
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream.value
    video.value.onloadedmetadata = () => { cameraReady.value = true }
  } catch (err) {
    error.value = 'Camera access denied. Please allow camera and refresh.'
  }
})

// Stop camera on unmount
onUnmounted(() => {
  stream.value?.getTracks().forEach(t => t.stop())
})

// ── Capture ──────────────────────────────────────────────────────────────────
const capturePhoto = () => {
  const canvas = document.createElement('canvas')
  canvas.width  = video.value.videoWidth
  canvas.height = video.value.videoHeight
  canvas.getContext('2d').drawImage(video.value, 0, 0)
  photo.value = canvas.toDataURL('image/jpeg')
  error.value = ''
}

const retake = () => {
  photo.value = null
  error.value = ''
}

// ── Submit ───────────────────────────────────────────────────────────────────
const submitAttendance = async () => {
  processing.value = true
  error.value = ''

  try {
    // Convert base64 to blob for multipart upload
    const base64Data = photo.value.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteArray = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([byteArray], { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('photo', blob, 'attendance.jpg')

    const response = await api.post(
      `/attendance/sessions/${sessionId}/mark-by-face`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    const result = response.data

    if (result.success) {
      success.value = true
      successMessage.value = `${result.moduleName} · ${result.time}`
      // Stop camera
      stream.value?.getTracks().forEach(t => t.stop())
    } else {
      error.value = result.message
      photo.value = null  // Reset to retake
    }

  } catch (err) {
    error.value = err.response?.data?.message || 'Something went wrong. Please try again.'
    photo.value = null
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.mark-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b0f14, #05070a);
  color: white;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo-mark { display: flex; align-items: center; gap: 10px; }

.logo-dot {
  width: 10px; height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 12px #00F0FF;
}

.logo-text { font-weight: 700; }

.back-btn {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #9ca3af;
  cursor: pointer;
}

.page-main {
  padding: 20px 16px;
  max-width: 520px;
  margin: 0 auto;
}

/* SESSION BANNER */
.session-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,102,255,0.06);
  border: 1px solid rgba(0,102,255,0.15);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
}

.session-module {
  font-size: 11px;
  font-weight: 700;
  color: #00F0FF;
  background: rgba(0,240,255,0.08);
  border: 1px solid rgba(0,240,255,0.2);
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  margin-bottom: 4px;
}

.session-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }

.session-lecturer { font-size: 12px; color: #9ca3af; }

.pulse-wrap { display: flex; align-items: center; gap: 6px; }

.pulse-dot {
  width: 8px; height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}

.live-text { font-size: 11px; font-weight: 700; color: #10b981; }

/* SUCCESS */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  width: 64px; height: 64px;
  background: rgba(16,185,129,0.1);
  border: 2px solid rgba(16,185,129,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #10b981;
  margin-bottom: 20px;
}

.success-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }

.success-sub { font-size: 14px; color: #9ca3af; margin-bottom: 28px; }

.done-btn {
  padding: 12px 28px;
  border-radius: 10px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(0,240,255,0.25);
  color: #00F0FF;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.done-btn:hover { border-color: rgba(0,240,255,0.6); }

/* CAMERA */
.camera-section { width: 100%; }

.camera-frame {
  position: relative;
  height: 380px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,240,255,0.15);
  background: black;
  margin-bottom: 14px;
}

.video { width: 100%; height: 100%; object-fit: cover; }

/* SCANNER */
.scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scanner-box {
  width: 200px; height: 260px;
  border: 2px solid rgba(0,240,255,0.6);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.scanner-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: #00F0FF;
  animation: scan 2s linear infinite;
  opacity: 0.8;
}

@keyframes scan {
  0%   { transform: translateY(0); }
  100% { transform: translateY(260px); }
}

.scanner-text {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 12px;
}

/* PROCESSING */
.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 7, 10, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  color: #9ca3af;
}

.spinner {
  width: 32px; height: 32px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ERROR */
.banner-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}

/* BUTTONS */
.btn-row {
  display: flex;
  gap: 10px;
}

.capture-btn {
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(0,240,255,0.25);
  color: #00F0FF;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.capture-btn:hover { border-color: rgba(0,240,255,0.6); }

.capture-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.retake-btn {
  padding: 12px 20px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background: rgba(0,102,255,0.15);
  border: 1px solid rgba(0,102,255,0.4);
  color: #0066FF;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover { background: rgba(0,102,255,0.25); }

.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>