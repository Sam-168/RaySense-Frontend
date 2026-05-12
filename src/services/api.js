// src/services/api.js
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// ── Base Axios instance ──────────────────────────
const api = axios.create({
  baseURL: 'import.meta.env.VITE_API_BASE_URL',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ── Request Interceptor ──────────────────────────
// Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage directly
    // (avoids circular dependency with the store)
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ─────────────────────────
// Handle token expiry and auth errors globally
api.interceptors.response.use(
  // Success - just return response
  (response) => response,

  // Error - handle auth errors
  async (error) => {
    const status = error.response?.status

    // 401 = Unauthorized (token expired or invalid)
    if (status === 401) {
      const authStore = useAuthStore()
      authStore.clearSession()

      // Redirect to login page
      router.push({
        path: '/login',
        query: { reason: 'session_expired' }
      })
    }

    // 403 = Forbidden (wrong role)
    if (status === 403) {
      router.push('/unauthorized')
    }

    return Promise.reject(error)
  }
)

export default api