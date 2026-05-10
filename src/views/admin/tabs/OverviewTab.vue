<template>
  <div>
    <h2 class="tab-title">System Overview</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else class="stats-grid">
      <div class="stat-card">
        <p class="stat-icon">🎓</p>
        <p class="stat-value">{{ stats.totalStudents }}</p>
        <p class="stat-label">Students</p>
      </div>
      <div class="stat-card">
        <p class="stat-icon">👨‍🏫</p>
        <p class="stat-value">{{ stats.totalLecturers }}</p>
        <p class="stat-label">Lecturers</p>
      </div>
      <div class="stat-card">
        <p class="stat-icon">📚</p>
        <p class="stat-value">{{ stats.totalModules }}</p>
        <p class="stat-label">Modules</p>
      </div>
      <div class="stat-card">
        <p class="stat-icon">🏫</p>
        <p class="stat-value">{{ stats.totalSections }}</p>
        <p class="stat-label">Sections</p>
      </div>
      <div class="stat-card">
        <p class="stat-icon">🟢</p>
        <p class="stat-value cyan">{{ stats.activeSessions }}</p>
        <p class="stat-label">Live Sessions</p>
      </div>
      <div class="stat-card">
        <p class="stat-icon">📋</p>
        <p class="stat-value">{{ stats.totalAttendanceRecords }}</p>
        <p class="stat-label">Attendance Records</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const stats   = ref({})

onMounted(async () => {
  try {
    const response = await api.get('/admin/dashboard')
    stats.value = response.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tab-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }

.loading-state { display: flex; justify-content: center; padding: 40px; }

.spinner {
  width: 28px; height: 28px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 20px;
  text-align: center;
}

.stat-icon { font-size: 24px; margin-bottom: 8px; }

.stat-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }

.stat-value.cyan { color: #00F0FF; }

.stat-label { font-size: 12px; color: #6b7280; }

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>