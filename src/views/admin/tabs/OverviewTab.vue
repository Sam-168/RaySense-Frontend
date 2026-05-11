<template>
  <div>
    <h2 class="section-title">System Overview</h2>

    <div v-if="loading" class="rs-loading">
      <div class="rs-spinner rs-spinner--lg"></div>
    </div>

    <div v-else class="stats-grid">
      <div v-for="item in statItems" :key="item.label" class="rs-card stat-card">
        <p class="stat-value" :class="item.color">{{ item.value }}</p>
        <p class="stat-label">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const stats   = ref({})

onMounted(async () => {
  try {
    const res = await api.get('/admin/dashboard')
    stats.value = res.data
  } finally {
    loading.value = false
  }
})

const statItems = computed(() => [
  { label: 'Students',           value: stats.value.totalStudents,        color: '' },
  { label: 'Lecturers',          value: stats.value.totalLecturers,       color: '' },
  { label: 'Modules',            value: stats.value.totalModules,         color: '' },
  { label: 'Sections',           value: stats.value.totalSections,        color: '' },
  { label: 'Live Sessions',      value: stats.value.activeSessions,       color: 'accent' },
  { label: 'Attendance Records', value: stats.value.totalAttendanceRecords, color: '' },
])
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card { text-align: center; }

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.stat-value.accent { color: var(--accent); }

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>