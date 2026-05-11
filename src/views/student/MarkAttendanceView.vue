<template>
  <div class="rs-page">

    <header class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-dot"></div>
        RaySense
      </div>
      <button class="btn btn-ghost btn--sm" @click="$router.push('/student/dashboard')">
        ← Back
      </button>
    </header>

    <main class="rs-main">

      <!-- SESSION BANNER -->
      <div v-if="sessionInfo" class="rs-card session-banner">
        <div>
          <span class="rs-badge rs-badge--accent" style="margin-bottom: 6px; display: inline-block;">
            {{ sessionInfo.sectionName }}
          </span>
          <p class="session-name">{{ sessionInfo.moduleName }}</p>
          <p class="session-lecturer">{{ sessionInfo.lecturerName }}</p>
        </div>
        <div class="live-indicator">
          <span class="rs-dot rs-dot--success rs-dot--pulse"></span>
          <span class="live-text">Live</span>
        </div>
      </div>

      <!-- SUCCESS -->
      <div v-if="success" class="success-state">
        <div class="success-icon">✓</div>
        <h2 class="success-title">Attendance marked</h2>
        <p class="success-sub">{{ successMessage }}</p>
        <button class="btn btn-accent btn--lg" @click="$router.push('/student/dashboard')">
          Back to dashboard
        </button>
      </div>

      <!-- CAMERA -->
      <div v-else class="camera-section">

        <div class="camera-frame">
          <video v-if="!photo" ref="video" autoplay playsinline class="camera-feed"></video>
          <img v-else :src="photo" class="camera-feed" />

          <div v-if="!photo" class="scanner-overlay">
            <div class="face-oval"></div>
            <p class="scanner-hint">Align your face within the oval</p>
          </div>

          <div v-if="processing" class="processing-overlay">
            <div class="rs-spinner rs-spinner--lg"></div>
            <p>Verifying identity...</p>
          </div>
        </div>

        <div v-if="error" class="rs-alert rs-alert--error" style="margin-bottom: 12px;">{{ error }}</div>

        <div class="btn-row">
          <button
            v-if="!photo"
            class="btn btn-accent btn--lg"
            @click="capturePhoto"
            :disabled="!cameraReady"
          >
            Capture photo
          </button>

          <template v-else>
            <button class="btn btn-ghost" style="flex: 0 0 auto;" @click="retake" :disabled="processing">
              Retake
            </button>
            <button class="btn btn-accent" style="flex: 1;" @click="submitAttendance" :disabled="processing">
              <span v-if="!processing">Submit</span>
              <span v-else class="loading-row">
                <span class="rs-spinner rs-spinner--sm"></span>
                Verifying...
              </span>
            </button>
          </template>
        </div>

      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route     = useRoute()
const router    = useRouter()
const sessionId = route.params.sessionId

const video          = ref(null)
const stream         = ref(null)
const photo          = ref(null)
const cameraReady    = ref(false)
const processing     = ref(false)
const error          = ref('')
const success        = ref(false)
const successMessage = ref('')
const sessionInfo    = ref(null)

onMounted(async () => {
  try {
    const res = await api.get('/attendance/active-sessions')
    sessionInfo.value = res.data.find(s => s.sessionId == sessionId) || null
    if (!sessionInfo.value) { error.value = 'This session is no longer active.'; return }
  } catch {
    error.value = 'Failed to load session info.'
  }

  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream.value
    video.value.onloadedmetadata = () => { cameraReady.value = true }
  } catch {
    error.value = 'Camera access denied. Please allow camera and refresh.'
  }
})

onUnmounted(() => stream.value?.getTracks().forEach(t => t.stop()))

const capturePhoto = () => {
  const canvas = document.createElement('canvas')
  canvas.width  = video.value.videoWidth
  canvas.height = video.value.videoHeight
  canvas.getContext('2d').drawImage(video.value, 0, 0)
  photo.value = canvas.toDataURL('image/jpeg')
  error.value = ''
}

const retake = async () => {
  photo.value = null
  

  await nextTick()

  if (video.value && stream.value) {
    video.value.srcObject = stream.value

    try {
      await video.value.play()
      cameraReady.value = true
    } catch {
      error.value = 'Failed to restart camera.'
    }
  }
}

const submitAttendance = async () => {
  processing.value = true
  error.value = ''
  try {
    const base64Data     = photo.value.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteArray      = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i)
    const blob     = new Blob([byteArray], { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('photo', blob, 'attendance.jpg')
    const res    = await api.post(`/attendance/sessions/${sessionId}/mark-by-face`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const result = res.data
    if (result.success) {
      success.value = true
      successMessage.value = `${result.moduleName} · ${result.time}`
      stream.value?.getTracks().forEach(t => t.stop())
    } else {
      error.value = result.message
      await retake()
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Something went wrong. Please try again.'

  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.session-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-color: var(--brand-border);
  
  margin-bottom: 20px;
}

.session-name     { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.session-lecturer { font-size: 12px; color: var(--text-secondary); }

.live-indicator { display: flex; align-items: center; gap: 7px; }
.live-text { font-size: 11px; font-weight: 600; color: var(--success); }

/* SUCCESS */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  width: 64px;
  height: 64px;
  background: var(--success-dim);
  border: 1px solid var(--success-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: var(--success);
  margin-bottom: 20px;
}

.success-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
.success-sub   { font-size: 13px; color: var(--text-secondary); margin-bottom: 28px; max-width: 260px; }

/* CAMERA */
.camera-section { display: flex; flex-direction: column; gap: 14px; }

.camera-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border-default);
}

.camera-feed { width: 100%; height: 100%; object-fit: cover; display: block; }

.scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
}

.face-oval {
  width: 48%;
  aspect-ratio: 3 / 4;
  border: 2px dashed var(--accent-border);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.3);
  animation: oval-pulse 2.8s ease-in-out infinite;
}

@keyframes oval-pulse {
  0%, 100% { border-color: var(--accent-border); }
  50%       { border-color: rgba(0,216,240,0.55); }
}

.scanner-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  background: rgba(0,0,0,0.5);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
}

.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5,7,10,0.82);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 13px;
  color: var(--text-secondary);
}

.btn-row { display: flex; gap: 10px; }

.loading-row { display: flex; align-items: center; gap: 8px; }

.rs-dot--danger { background: var(--danger); }
</style>