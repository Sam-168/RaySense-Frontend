import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/student/RegisterView.vue')
    },
    {
      path: '/attendance/mark',
      name: 'mark attendance',
      component: () => import('../views/student/MarkAttendanceView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue')
      //meta: { requiresGuest: true }   // Redirect if already logged in
    },
    {
    path: '/student/dashboard',
      name: 'dashboard',
      component: () => import('../views/student/DashboardView.vue')
    }
  ],
})

export default router
