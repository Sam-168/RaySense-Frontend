<template>
  <div class="register-page">

    <!-- Header -->
    <header class="page-header">
      <div class="logo-mark">
        <div class="logo-dot"></div>
        <span class="logo-text">RaySense</span>
      </div>
      <div class="header-chip">Student Registration</div>
    </header>

    <main class="page-main">

      <!-- Card -->
      <div class="register-card">
      
        <!-- Title -->
        <div class="card-header">
          <h1 class="title">Register Student</h1>
          <p class="subtitle">Enroll a new student with biometric face data</p>
        </div>
        <div v-if="apiError" class="banner-error">
          {{ apiError }}
        </div>
        <!-- FORM -->
        <form class="form" @submit.prevent="handleSubmit">

          <!-- Full Name -->
          <div class="field">
            <label>Full Name</label>
            <input v-model="form.fullName" class="input" />
            <p v-if="errors.fullName" class="error">{{ errors.fullName }}</p>
          </div>

          <!-- Student Number -->
          <div class="field">
            <label>Student Number</label>
            <input v-model="form.studentNumber" class="input" />
            <p v-if="errors.studentNumber" class="error">{{ errors.studentNumber }}</p>
          </div>

          <!-- Class ID -->
          <div class="field">
            <label>Class ID (optional)</label>
            <input v-model="form.classId" class="input" />
          </div>
          <!-- Email -->
          <div class="field">
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="you@example.com"
            />
            <p v-if="errors.email" class="error">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div class="field">
            <label>Password</label>
            <input
              v-model="form.password"
              type="password"
              class="input"
              placeholder="Min 6 characters"
            />
            <p v-if="errors.password" class="error">{{ errors.password }}</p>
          </div>

          <!-- CAMERA -->
          <div class="camera-section">

            <label class="camera-label">Biometric Scan</label>

            <div class="camera-frame">

              <!-- VIDEO -->
              <video
                v-if="!photo"
                ref="video"
                autoplay
                class="video"
              ></video>

              <!-- PHOTO -->
              <img
                v-else
                :src="photo"
                class="video"
              />

              <!-- SCANNER OVERLAY -->
              <div v-if="!photo" class="scanner-overlay">

                <div class="scanner-box">
                  <div class="scanner-line"></div>
                </div>

                <p class="scanner-text">
                  Align face inside frame
                </p>

              </div>

            </div>

            <p v-if="photo" class="success-text">Face captured successfully</p>

            <!-- BUTTONS -->
            <div class="btn-row">

              <button
                type="button"
                class="btn-secondary"
                @click="capturePhoto"
                v-if="!photo"
              >
                Capture
              </button>

              <button
                type="button"
                class="btn-secondary"
                @click="retake"
                v-else
              >
                Retake
              </button>

            </div>

          </div>

          <!-- SUBMIT -->
          <button class="btn-primary" :disabled="loading">
            {{ loading ? "Registering..." : "Register Student" }}
          </button>

        </form>

      </div>

    </main>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const auth   = useAuthStore()

const video   = ref(null)
const stream  = ref(null)
const photo   = ref(null)
const loading = ref(false)
const apiError = ref('')

const form = reactive({
  email:         '',
  password:      '',
  fullName:      '',
  studentNumber: '',
  classId:       ''
})

const errors = reactive({
  email:         '',
  password:      '',
  fullName:      '',
  studentNumber: ''
})

// Start camera
onMounted(async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream.value
  } catch (err) {
    apiError.value = 'Camera access denied. Please allow camera access.'
  }
})

const capturePhoto = () => {
  const canvas = document.createElement('canvas')
  canvas.width  = video.value.videoWidth
  canvas.height = video.value.videoHeight
  canvas.getContext('2d').drawImage(video.value, 0, 0)
  photo.value = canvas.toDataURL('image/jpeg')
}

const retake = () => { photo.value = null }

// Validation
const validate = () => {
  errors.email         = ''
  errors.password      = ''
  errors.fullName      = ''
  errors.studentNumber = ''
  apiError.value       = ''

  let valid = true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!form.email || !emailRegex.test(form.email)) {
    errors.email = 'Valid email is required'
    valid = false
  }
  if (!form.password || form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }
  if (form.fullName.length < 2) {
    errors.fullName = 'Name too short'
    valid = false
  }
  if (form.studentNumber.length < 3) {
    errors.studentNumber = 'Invalid student number'
    valid = false
  }

  return valid
}

// Submit
const handleSubmit = async () => {
  if (!validate()) return
  if (!photo.value) return (apiError.value = 'Please capture a photo first')

  loading.value = true

  try {
    const payload = {
      email:         form.email,
      password:      form.password,
      fullName:      form.fullName,
      studentNumber: form.studentNumber,
      classId:       form.classId,
      photo:         photo.value.split(',')[1]  // strip base64 prefix
    }

    // Hits POST /api/students/register-with-photo
    const response = await api.post('/students/register-with-photo', payload)

    // Auto-login: store the token + user returned from backend
    const { token, ...userData } = response.data
    auth.setSession(token, userData)

    // Stop camera
    stream.value?.getTracks().forEach(t => t.stop())

    // Redirect to student dashboard
    router.push('/student/dashboard')

  } catch (err) {
    const status  = err.response?.status
    const message = err.response?.data?.message

    if (status === 409) {
      apiError.value = message || 'Email or student number already exists'
    } else if (status === 422) {
      apiError.value = message || 'Face registration failed. Please retake photo.'
    } else {
      apiError.value = message || 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* PAGE */
.register-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b0f14, #05070a);
  color: white;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo-mark {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-dot {
  width: 10px;
  height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 12px #00F0FF;
  
}

.logo-text {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-chip {
  font-size: 12px;
  color: #9ca3af;
  padding: 6px 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
}

/* MAIN */
.page-main {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}

/* CARD */
.register-card {
  width: 100%;
  max-width: 520px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

/* HEADER */
.card-header {
  margin-bottom: 18px;
}

.title {
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  font-size: 13px;
  color: #9ca3af;
}

/* FORM */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field label {
  font-size: 12px;
  color: #9ca3af;
}

.input {
  width: 100%;
  padding: 10px;
  margin-top: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(0,240,255,0.15);
  border-radius: 10px;
  color: white;
  outline: none;
}

.input:focus {
  border-color: #00F0FF;
  box-shadow: 0 0 0 2px rgba(0,240,255,0.1);
}

.error {
  font-size: 11px;
  color: #f87171;
  margin-top: 4px;
}

/* CAMERA */
.camera-section {
  margin-top: 8px;
}

.camera-label {
  font-size: 12px;
  color: #9ca3af;
}

.camera-frame {
  position: relative;
  height: 320px;
  margin-top: 8px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0,240,255,0.15);
  box-shadow: 0 0 20px rgba(0,240,255,0.08);
  background: black;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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
  width: 180px;
  height: 240px;
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
  0% { transform: translateY(0); }
  100% { transform: translateY(240px); }
}

.scanner-text {
  font-size: 12px;
  margin-top: 10px;
  color: #9ca3af;
}

/* SUCCESS */
.success-text {
  font-size: 12px;
  color: #34d399;
  text-align: center;
  margin-top: 6px;
}

/* BUTTONS */
.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-secondary {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: white;
  cursor: pointer;
}

.btn-primary {
  margin-top: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;

  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.25);

  color: #00F0FF;
  font-weight: 600;
  letter-spacing: 0.5px;

  cursor: pointer;

  transition: all 0.2s ease;

  position: relative;
  overflow: hidden;
}

/* subtle scan glow (NOT flashy) */
.btn-primary::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(0, 240, 255, 0.08),
    transparent
  );
  transform: translateX(-100%);
  animation: scanSweep 3.5s linear infinite;
}

@keyframes scanSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* hover feels like system activation */
.btn-primary:hover {
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
  color: #ffffff;
}

/* active press feel */
.btn-primary:active {
  transform: scale(0.98);
  border-color: #00F0FF;
}

/* disabled */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.banner-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}
</style>