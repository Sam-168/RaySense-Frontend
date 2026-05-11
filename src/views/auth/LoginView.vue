<template>
  <div class="rs-page login-page">

    <header class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-dot"></div>
        RaySense
      </div>
      <span class="header-chip">Secure Access</span>
    </header>

    <main class="login-main">
      <div class="login-card rs-card rs-card--accent">

        <div class="card-header">
          <h1 class="card-title">Welcome back</h1>
          <p class="card-sub">Sign in to access RaySense</p>
        </div>

        <div v-if="sessionExpired" class="rs-alert rs-alert--warning mb-3">
          Your session expired. Please sign in again.
        </div>

        <div v-if="apiError" class="rs-alert rs-alert--error mb-3">
          {{ apiError }}
        </div>

        <form class="form" @submit.prevent="handleLogin">

          <div class="rs-field">
            <label class="rs-label">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="rs-input"
              :class="{ 'rs-input--error': errors.email }"
              placeholder="you@university.ac.za"
              autocomplete="email"
            />
            <p v-if="errors.email" class="rs-field-error">{{ errors.email }}</p>
          </div>

          <div class="rs-field">
            <label class="rs-label">Password</label>
            <div class="pw-wrap">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="rs-input"
                :class="{ 'rs-input--error': errors.password }"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button type="button" class="pw-toggle" @click="showPassword = !showPassword">
                {{ showPassword ? '○' : '●' }}
              </button>
            </div>
            <p v-if="errors.password" class="rs-field-error">{{ errors.password }}</p>
          </div>

          <button class="btn btn-accent btn--lg" :disabled="loading" type="submit">
            <span v-if="!loading">Sign In</span>
            <span v-else class="loading-row">
              <span class="rs-spinner rs-spinner--sm"></span>
              Authenticating...
            </span>
          </button>

        </form>

        <p class="register-text">
          New student?
          <router-link to="/register" class="link">Create your account</router-link>
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

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const loading        = ref(false)
const showPassword   = ref(false)
const apiError       = ref('')
const sessionExpired = ref(false)

const form   = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })

onMounted(() => {
  if (auth.isAuthenticated) router.replace(auth.getHomeRoute())
  if (route.query.reason === 'session_expired') sessionExpired.value = true
})

const validate = () => {
  errors.email = errors.password = ''
  apiError.value = ''
  let valid = true
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email || !emailRe.test(form.email)) { errors.email = 'Valid email required'; valid = false }
  if (!form.password || form.password.length < 6) { errors.password = 'Min 6 characters'; valid = false }
  return valid
}

const handleLogin = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const { token, user } = await login(form.email, form.password)
    auth.setSession(token, user)
    router.push(auth.getHomeRoute())
  } catch (err) {
    const status = err.response?.status
    const msg    = err.response?.data?.message
    if (status === 401)      apiError.value = msg || 'Invalid email or password'
    else if (status === 403) apiError.value = 'Your account has been deactivated.'
    else if (!err.response)  apiError.value = 'Cannot connect to server.'
    else                     apiError.value = msg || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { display: flex; flex-direction: column; }

.header-chip {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
}

.login-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.card-header { margin-bottom: 24px; }

.card-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.card-sub {
  font-size: 13px;
  color: var(--text-secondary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pw-wrap { position: relative; }

.pw-wrap .rs-input { padding-right: 40px; }

.pw-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 10px;
  padding: 4px;
}

.pw-toggle:hover { color: var(--text-secondary); }

.loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-3 { margin-bottom: 14px; }

.register-text {
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.link { color: var(--accent); text-decoration: none; font-weight: 500; }
.link:hover { text-decoration: underline; }
</style>