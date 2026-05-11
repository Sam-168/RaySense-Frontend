<template>
  <div class="rs-page">

    <header class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-dot"></div>
        RaySense
      </div>
      <span class="header-chip">Student Registration</span>
    </header>

    <main class="register-main">
      <div class="rs-card rs-card--accent register-card">

        <div class="card-header">
          <h1 class="card-title">Create account</h1>
          <p class="card-sub">Enroll with biometric face verification</p>
        </div>

        <div v-if="apiError" class="rs-alert rs-alert--error mb-4">
          {{ apiError }}
        </div>

        <form class="form" @submit.prevent="handleSubmit">

          <div class="form-grid">
            <div class="rs-field">
              <label class="rs-label">Full Name</label>
              <input v-model="form.fullName" class="rs-input" :class="{ 'rs-input--error': errors.fullName }" placeholder="Samukelo Ndlela" />
              <p v-if="errors.fullName" class="rs-field-error">{{ errors.fullName }}</p>
            </div>

            <div class="rs-field">
              <label class="rs-label">Student Number</label>
              <input v-model="form.studentNumber" class="rs-input" :class="{ 'rs-input--error': errors.studentNumber }" placeholder="231212126" />
              <p v-if="errors.studentNumber" class="rs-field-error">{{ errors.studentNumber }}</p>
            </div>

            <div class="rs-field">
              <label class="rs-label">Email</label>
              <input v-model="form.email" type="email" class="rs-input" :class="{ 'rs-input--error': errors.email }" placeholder="you@university.ac.za" />
              <p v-if="errors.email" class="rs-field-error">{{ errors.email }}</p>
            </div>

            <div class="rs-field">
              <label class="rs-label">Password</label>
              <input v-model="form.password" type="password" class="rs-input" :class="{ 'rs-input--error': errors.password }" placeholder="Min 6 characters" />
              <p v-if="errors.password" class="rs-field-error">{{ errors.password }}</p>
            </div>

            <div class="rs-field">
              <label class="rs-label">Class Group <span class="optional"></span></label>
              <input v-model="form.classId" class="rs-input" placeholder="3H" />
            </div>
          </div>

          <!-- BIOMETRIC CAPTURE -->
          <div class="biometric-section">
            <label class="rs-label">Biometric scan</label>

            <div class="camera-frame">
              <video v-if="!photo" ref="video" autoplay playsinline class="camera-feed"></video>
              <img v-else :src="photo" class="camera-feed" />

              <div v-if="!photo" class="scanner-overlay">
                <div class="face-oval"></div>
                <p class="scanner-hint">Align your face within the oval</p>
              </div>

              <div v-if="photo" class="captured-overlay">
                <span class="rs-badge rs-badge--success">Face captured</span>
              </div>
            </div>

            <div class="camera-actions">
              <button v-if="!photo" type="button" class="btn btn-ghost" @click="capturePhoto">
                Capture photo
              </button>
              <button v-else type="button" class="btn btn-ghost" @click="retake">
                Retake
              </button>
            </div>
          </div>

          <button class="btn btn-accent btn--lg" :disabled="loading" type="submit">
            <span v-if="!loading">Create account</span>
            <span v-else class="loading-row">
              <span class="rs-spinner rs-spinner--sm"></span>
              Registering...
            </span>
          </button>

        </form>

        <p class="login-text">
          Already registered?
          <router-link to="/login" class="link">Sign in</router-link>
        </p>

      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router   = useRouter()
const auth     = useAuthStore()
const video    = ref(null)
const stream   = ref(null)
const photo    = ref(null)
const loading  = ref(false)
const apiError = ref('')

const form   = reactive({ email: '', password: '', fullName: '', studentNumber: '', classId: '' })
const errors = reactive({ email: '', password: '', fullName: '', studentNumber: '' })

onMounted(async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream.value
  } catch {
    apiError.value = 'Camera access denied. Please allow camera access and reload.'
  }
})

onBeforeUnmount(() => stream.value?.getTracks().forEach(t => t.stop()))

const capturePhoto = () => {
  const canvas = document.createElement('canvas')
  canvas.width  = video.value.videoWidth
  canvas.height = video.value.videoHeight
  canvas.getContext('2d').drawImage(video.value, 0, 0)
  photo.value = canvas.toDataURL('image/jpeg')
}

const retake = async () => {
  photo.value = null

  await nextTick()

  if (video.value && stream.value) {
    video.value.srcObject = stream.value
    await video.value.play()
  }
}

const validate = () => {
  Object.keys(errors).forEach(k => errors[k] = '')
  apiError.value = ''
  let valid = true
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email || !emailRe.test(form.email)) { errors.email = 'Valid email required'; valid = false }
  if (!form.password || form.password.length < 6) { errors.password = 'Min 6 characters'; valid = false }
  if (form.fullName.trim().length < 2) { errors.fullName = 'Name too short'; valid = false }
  if (form.studentNumber.trim().length < 3) { errors.studentNumber = 'Invalid student number'; valid = false }
  return valid
}

const handleSubmit = async () => {
  if (!validate()) return
  if (!photo.value) { apiError.value = 'Please capture a photo first'; return }
  loading.value = true
  try {
    const payload = { ...form, photo: photo.value.split(',')[1] }
    const response = await api.post('/students/register-with-photo', payload)
    const { token, ...userData } = response.data
    auth.setSession(token, userData)
    stream.value?.getTracks().forEach(t => t.stop())
    router.push('/student/dashboard')
  } catch (err) {
    const status = err.response?.status
    const msg    = err.response?.data?.message
    if (status === 409)      apiError.value = msg || 'Email or student number already exists'
    else if (status === 422) apiError.value = msg || 'Face registration failed. Please retake photo.'
    else                     apiError.value = msg || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-main {
  display: flex;
  justify-content: center;
  padding: 40px 16px 60px;
}

.register-card { width: 100%; max-width: 520px; }

.card-header { margin-bottom: 24px; }

.card-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.card-sub { font-size: 13px; color: var(--text-secondary); }

.header-chip {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
}

.form { display: flex; flex-direction: column; gap: 16px; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 480px) { .form-grid { grid-template-columns: 1fr; } }

.optional { color: var(--text-muted); font-weight: 400; }

.mb-4 { margin-bottom: 16px; }

.loading-row { display: flex; align-items: center; gap: 8px; }

/* BIOMETRIC */
.biometric-section { display: flex; flex-direction: column; gap: 10px; }

.camera-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border-default);
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

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
  width: 44%;
  aspect-ratio: 3 / 4;
  border: 2px dashed var(--accent-border);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.28);
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

.captured-overlay {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.camera-actions { display: flex; }

.login-text {
  margin-top: 18px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.link { color: var(--accent); text-decoration: none; font-weight: 500; }
.link:hover { text-decoration: underline; }
</style>