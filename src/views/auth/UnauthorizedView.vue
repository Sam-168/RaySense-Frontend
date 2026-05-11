<template>
  <div class="rs-page unauth-page">
    <div class="unauth-card rs-card">
      <p class="unauth-code">403</p>
      <h1 class="unauth-title">Access denied</h1>
      <p class="unauth-sub">You don't have permission to view this page.</p>
      <button class="btn btn-ghost" @click="goHome">Go back home</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()
const goHome = () => router.push(auth.getHomeRoute())
</script>

<style scoped>
.unauth-page {
  display: flex;
  justify-content: center;
  align-items: center;
}

.unauth-card {
  text-align: center;
  padding: 48px 32px;
  max-width: 360px;
  width: 100%;
}

.unauth-code {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--border-strong);
  margin-bottom: 8px;
}

.unauth-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.unauth-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
</style>