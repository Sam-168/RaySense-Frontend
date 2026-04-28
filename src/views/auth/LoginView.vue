<template>
  <div class="login-page">

    <!-- HEADER -->
    <header class="page-header">
      <div class="logo-mark">
        <div class="logo-dot"></div>
        <span class="logo-text">RaySense</span>
      </div>
      <div class="header-chip">Secure Access</div>
    </header>

    <main class="page-main">

      <!-- LOGIN CARD -->
      <div class="login-card">

        <!-- Title -->
        <div class="card-header">
          <h1 class="title">Welcome Back</h1>
          <p class="subtitle">Sign in to access RaySense</p>
        </div>

        <!-- SESSION EXPIRED BANNER -->
        <!-- Shows when user is redirected here because token expired -->
        <div v-if="sessionExpired" class="banner-warning">
          ⚠️ Your session expired. Please sign in again.
        </div>

        <!-- BACKEND ERROR BANNER -->
        <!-- Shows when login fails (wrong password, account disabled, etc.) -->
        <div v-if="apiError" class="banner-error">
          {{ apiError }}
        </div>

        <!-- FORM -->
        <form class="form" @submit.prevent="handleLogin">

          <!-- Email -->
          <div class="field">
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              :class="{ 'input-error': errors.email }"
              placeholder="you@example.com"
              autocomplete="email"
            />
            <p v-if="errors.email" class="error">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div class="field">
            <label>Password</label>
            <div class="password-wrapper">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': errors.password }"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <!-- Show/hide password toggle -->
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <p v-if="errors.password" class="error">{{ errors.password }}</p>
          </div>

          <!-- LOGIN BUTTON -->
          <button class="btn-primary" :disabled="loading">
            <span v-if="!loading">Login</span>
            <span v-else class="loading-row">
              <span class="spinner"></span>
              Authenticating...
            </span>
          </button>

        </form>

        <!-- REGISTER LINK -->
        <!-- Only students self-register. Lecturers/Admins are created by admin. -->
        <p class="register-text">
          New student?
          <router-link to="/register" class="register-link">
            Create your account
          </router-link>
        </p>

        <!-- FOOTER -->
        <p class="footer-text">
          Secure biometric attendance system
        </p>

      </div>

    </main>

  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/services/authService'

const router  = useRouter()
const route   = useRoute()
const auth    = useAuthStore()

// ── State ────────────────────────────────────────────
const loading       = ref(false)
const showPassword  = ref(false)
const apiError      = ref('')        // Backend error message
const sessionExpired = ref(false)    // Show session expired banner

// ── Form ─────────────────────────────────────────────
const form = reactive({
  email:    '',
  password: ''
})

const errors = reactive({
  email:    '',
  password: ''
})

// ── Check if redirected here due to session expiry ───
onMounted(() => {
  // If already logged in, redirect to home
  if (auth.isAuthenticated) {
    router.push(auth.getHomeRoute())
    return
  }

  // Check if redirected because session expired
  if (route.query.reason === 'session_expired') {
    sessionExpired.value = true
  }
})

// ── Validation ───────────────────────────────────────
const validate = () => {
  // Clear previous errors
  errors.email    = ''
  errors.password = ''
  apiError.value  = ''

  let valid = true

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email) {
    errors.email = 'Email is required'
    valid = false
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    valid = false
  }

  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }

  return valid
}

// ── Login Handler ─────────────────────────────────────
const handleLogin = async () => {
  // Step 1: Validate form
  if (!validate()) return

  loading.value = true
  apiError.value = ''

  try {
    // Step 2: Call backend
    const { token, user } = await login(form.email, form.password)

    // Step 3: Store session in Pinia + localStorage
    auth.setSession(token, user)

    // Step 4: Route based on role
    router.push(auth.getHomeRoute())

  } catch (err) {
    // Step 5: Handle errors from backend
    const status = err.response?.status
    const message = err.response?.data?.message

    if (status === 401) {
      // Wrong email or password
      apiError.value = message || 'Invalid email or password'
    } else if (status === 403) {
      // Account deactivated
      apiError.value = 'Your account has been deactivated. Please contact support.'
    } else if (status === 0 || !err.response) {
      // Network error (backend not running)
      apiError.value = 'Cannot connect to server. Please check your connection.'
    } else {
      // Any other error
      apiError.value = message || 'Login failed. Please try again.'
    }

  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* PAGE */
.login-page {
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
  padding: 60px 16px;
}

/* CARD */
.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(0,240,255,0.08);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0,240,255,0.05);
}

/* BANNERS */
.banner-warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 16px;
}

.banner-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 16px;
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

/* INPUT */
.input {
  width: 100%;
  padding: 10px;
  margin-top: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(0,240,255,0.15);
  border-radius: 10px;
  color: white;
  outline: none;
  transition: 0.2s;
  box-sizing: border-box;
}

.input:focus {
  border-color: #00F0FF;
  box-shadow: 0 0 0 2px rgba(0,240,255,0.15);
}

.input-error {
  border-color: rgba(239, 68, 68, 0.6) !important;
}

/* PASSWORD WRAPPER */
.password-wrapper {
  position: relative;
}

.password-wrapper .input {
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  margin-top: 2px;
}

/* ERROR TEXT */
.error {
  font-size: 11px;
  color: #f87171;
  margin-top: 4px;
}

/* BUTTON */
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
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.btn-primary:hover {
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
  color: #ffffff;
}

.btn-primary:active {
  transform: scale(0.98);
  border-color: #00F0FF;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* LOADING */
.loading-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 240, 255, 0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  box-shadow: 0 0 6px rgba(0,240,255,0.15);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* REGISTER LINK */
.register-text {
  margin-top: 16px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.register-link {
  color: #00F0FF;
  text-decoration: none;
  font-weight: 500;
}

.register-link:hover {
  text-decoration: underline;
}

/* FOOTER */
.footer-text {
  margin-top: 10px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}
</style>