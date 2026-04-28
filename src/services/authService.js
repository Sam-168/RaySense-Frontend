// src/services/authService.js
import api from './api'

// ─────────────────────────────────────────────────────
// REAL implementation - connects to Spring Boot backend
// POST /api/auth/login
// POST /api/auth/register/student
// ─────────────────────────────────────────────────────

/**
 * Login for ALL users (Student, Lecturer, Admin)
 *
 * Backend expects:  { email: string, password: string }
 * Backend returns:  { token, role, userId, email, fullName, studentId?, lecturerId?, adminId? }
 */
export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password })

  // Backend returns everything we need in one response
  const { token, ...userData } = response.data

  return { token, user: userData }
}

/**
 * Register a new student account
 *
 * Backend expects:  { email, password, fullName, studentNumber, classId }
 * Backend returns:  { token, role, userId, email, fullName, studentId }
 */
export async function registerStudent(payload) {
  const response = await api.post('/auth/register/student', payload)

  const { token, ...userData } = response.data

  return { token, user: userData }
}

/**
 * Logout - clears local session
 * Add api.post('/auth/logout') here if you add server-side token invalidation later
 */
export async function logout() {
  // Optional: tell backend to invalidate token
  // await api.post('/auth/logout')

  // For now just clear local storage (handled by store)
}