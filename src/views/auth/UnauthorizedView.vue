<template>
  <div class="unauth-page">
    <div class="unauth-card">
      <div class="icon">🚫</div>
      <h1>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
      <button class="btn" @click="goHome">Go Back Home</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const goHome = () => {
  router.push(auth.getHomeRoute())
}
</script>

<style scoped>
.unauth-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b0f14, #05070a);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}

.unauth-card {
  text-align: center;
  padding: 40px;
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}

h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

p {
  color: #9ca3af;
  margin-bottom: 24px;
}

.btn {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(0,240,255,0.25);
  color: #00F0FF;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:hover {
  border-color: rgba(0,240,255,0.6);
  box-shadow: 0 0 10px rgba(0,240,255,0.15);
}
</style>