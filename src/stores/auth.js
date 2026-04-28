// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {

  // ── State ──────────────────────────────────────────
  const token = ref(localStorage.getItem('token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // ── Getters ────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin         = computed(() => user.value?.role === 'ADMIN')
  const isStudent       = computed(() => user.value?.role === 'STUDENT')
  const isLecturer      = computed(() => user.value?.role === 'LECTURER') // NEW
  const fullName        = computed(() => user.value?.fullName || '')
  const role            = computed(() => user.value?.role || null)         // NEW

  // Role-specific IDs
  const studentId       = computed(() => user.value?.studentId || null)   // NEW
  const lecturerId      = computed(() => user.value?.lecturerId || null)  // NEW
  const adminId         = computed(() => user.value?.adminId || null)     // NEW

  // ── Actions ────────────────────────────────────────

  /**
   * Called after successful login or registration
   * Stores token and user data in memory and localStorage
   */
  function setSession(tokenValue, userData) {
    token.value = tokenValue
    user.value  = userData
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  /**
   * Called on logout or when token expires
   * Clears everything from memory and localStorage
   */
  function clearSession() {
    token.value = null
    user.value  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * Get the role-based home route
   * Used for redirecting after login
   */
  function getHomeRoute() {
    switch (user.value?.role) {
      case 'STUDENT':  return '/student/dashboard'
      case 'LECTURER': return '/lecturer/dashboard'
      case 'ADMIN':    return '/admin/dashboard'
      default:         return '/login'
    }
  }

  return {
    // State
    token,
    user,

    // Getters
    isAuthenticated,
    isAdmin,
    isStudent,
    isLecturer,
    fullName,
    role,
    studentId,
    lecturerId,
    adminId,

    // Actions
    setSession,
    clearSession,
    getHomeRoute
  }
})