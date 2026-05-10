// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ── Lazy-loaded views ────────────────────────────────
const HomeView            = () => import('@/views/HomeView.vue')
const LoginView           = () => import('@/views/auth/LoginView.vue')
const RegisterView        = () => import('@/views/student/RegisterView.vue')
const StudentDashboard    = () => import('@/views/student/DashboardView.vue')
const MarkAttendanceView  = () => import('@/views/student/MarkAttendanceView.vue')
const UnauthorizedView    = () => import('@/views/auth/UnauthorizedView.vue')
// Lazy-loaded admin view
const AdminDashboard      = () => import('@/views/admin/AdminDashboard.vue')
const LecturerDashboard = () => import('@/views/lecturer/LecturerDashboardView.vue')
const ActiveSessionView  = () => import('@/views/lecturer/ActiveSessionView.vue')

// ── Route definitions ────────────────────────────────
const routes = [

  // ── Public routes (no login required) ──
  {
  path: '/',
  name: 'Home',
  component: HomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }   
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: UnauthorizedView
  },

  // ── Student routes ──
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: {
      requiresAuth: true,
      roles: ['STUDENT']
    }
  },
  {
    path: '/student/mark-attendance/:sessionId',
    name: 'MarkAttendance',
    component: MarkAttendanceView,
    meta: { requiresAuth: true,
           roles: ['STUDENT'] }
  },
  {
    path: '/lecturer/dashboard',
    name: 'LecturerDashboard',
    component: LecturerDashboard,
    meta: {
      requiresAuth: true,
      roles: ['LECTURER']
    }
  },
  {
  path: '/lecturer/sessions/:sessionId/live',
  name: 'ActiveSession',
  component: ActiveSessionView,
  meta: { 
    requiresAuth: true,
    roles: ['LECTURER'] }
  },
  {
    path: '/attendance/mark',
    name: 'QuickMarkAttendance',
    component: MarkAttendanceView,
    meta: {
      requiresAuth: true,
      roles: ['STUDENT']
    }
  },
  {
  path: '/admin/dashboard',
  name: 'AdminDashboard',
  component: AdminDashboard,
  meta: {
    requiresAuth: true,
    roles: ['ADMIN']
  }
  },

  // ── Catch-all 404 ──
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// ── Navigation Guard ─────────────────────────────────
// Runs before EVERY route change
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  console.log('TO:', to.path)
  console.log('isAuthenticated:', auth.isAuthenticated)
  console.log('role:', auth.role)

  // 1. Auth required routes
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      return next({ path: '/login', query: { reason: 'auth_required' } })
    }

    if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
      return next('/unauthorized')
    }
  }

  // 2. Guest-only routes
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    const target = auth.getHomeRoute()
    console.log('Redirecting authenticated user to:', target)
    // prevent loop
    if (to.path === target) {
      return next()
    }

    // safety: route exists check
    const resolved = router.resolve(target)
    if (!resolved.matched.length) {
      return next('/login')
    }

    return next(target)
  }

  // 3. default allow
  return next()
})

export default router