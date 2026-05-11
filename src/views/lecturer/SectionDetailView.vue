<template>
  <div class="detail-view">

    <div class="detail-header">
      <button class="btn btn-ghost btn--sm" @click="$emit('back')">← Back</button>
      <div>
        <h1 class="detail-title">{{ section.fullSectionName }}</h1>
        <p class="detail-sub">{{ section.moduleName }}</p>
      </div>
    </div>

    <nav class="rs-tabs">
      <button class="rs-tab" :class="{ 'rs-tab--active': activeTab === 'today' }" @click="switchTab('today')">Today</button>
      <button class="rs-tab" :class="{ 'rs-tab--active': activeTab === 'range' }" @click="switchTab('range')">Date range</button>
    </nav>

    <div v-if="activeTab === 'range'" class="date-row">
      <div class="rs-field">
        <label class="rs-label">From</label>
        <input v-model="startDate" type="date" class="rs-input date-input" />
      </div>
      <div class="rs-field">
        <label class="rs-label">To</label>
        <input v-model="endDate" type="date" class="rs-input date-input" />
      </div>
      <button class="btn btn-accent" style="align-self: flex-end;" @click="loadRangeData">Apply</button>
    </div>

    <div v-if="loading" class="rs-loading">
      <div class="rs-spinner"></div>
    </div>

    <div v-else-if="error" class="rs-alert rs-alert--error">{{ error }}</div>

    <!-- TODAY -->
    <div v-else-if="activeTab === 'today' && todayData">
      <div class="summary-grid">
        <div class="rs-card summary-card">
          <p class="sum-label">Present</p>
          <p class="sum-value success">{{ todayData.presentCount }}</p>
        </div>
        <div class="rs-card summary-card">
          <p class="sum-label">Absent</p>
          <p class="sum-value danger">{{ todayData.absentCount }}</p>
        </div>
        <div class="rs-card summary-card">
          <p class="sum-label">Rate</p>
          <p class="sum-value accent">{{ todayData.attendancePercentage }}%</p>
        </div>
      </div>

      <input v-model="search" class="rs-search" placeholder="Search student..." />

      <div class="student-list">
        <div v-for="student in filteredStudents" :key="student.studentId" class="student-row">
          <div class="student-info">
            <span class="rs-dot" :class="student.status === 'PRESENT' ? 'rs-dot--success' : 'rs-dot--danger'"></span>
            <div>
              <p class="student-name">{{ student.fullName }}</p>
              <p class="student-num">{{ student.studentNumber }}</p>
            </div>
          </div>
          <div class="student-right">
            <span v-if="student.time" class="time-text">{{ formatTime(student.time) }}</span>
            <span class="rs-badge" :class="student.status === 'PRESENT' ? 'rs-badge--success' : 'rs-badge--danger'">
              {{ student.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- RANGE -->
    <div v-else-if="activeTab === 'range' && rangeData">
      <div class="rs-card overall-banner">
        <span class="overall-label">Overall attendance rate</span>
        <span class="overall-value">{{ rangeData.overallPercentage }}%</span>
      </div>

      <div class="daily-list">
        <div v-for="day in rangeData.dailySummary" :key="day.date" class="day-row">
          <span class="day-date">{{ formatDate(day.date) }}</span>
          <div class="rs-progress" style="flex: 1;">
            <div class="rs-progress-bar" :style="{ width: day.percentage + '%' }"></div>
          </div>
          <span class="day-stat">{{ day.present }}/{{ day.total }} ({{ day.percentage }}%)</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({ section: { type: Object, required: true } })
defineEmits(['back'])

const loading   = ref(false)
const error     = ref('')
const activeTab = ref('today')
const search    = ref('')
const todayData = ref(null)
const rangeData = ref(null)

const endDate   = ref(new Date().toISOString().split('T')[0])
const startDate = ref(() => {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
})

onMounted(loadTodayData)

const switchTab = async (tab) => {
  activeTab.value = tab
  if (tab === 'today' && !todayData.value) loadTodayData()
}

async function loadTodayData() {
  loading.value = true; error.value = ''
  try {
    const res = await api.get(`/lecturer/sections/${props.section.sectionId}/attendance/today`)
    todayData.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load attendance'
  } finally {
    loading.value = false
  }
}

const loadRangeData = async () => {
  loading.value = true; error.value = ''
  try {
    const res = await api.get(`/lecturer/sections/${props.section.sectionId}/attendance`, { params: { startDate: startDate.value, endDate: endDate.value } })
    rangeData.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

const filteredStudents = computed(() => {
  if (!todayData.value) return []
  const q = search.value.toLowerCase()
  return todayData.value.students.filter(s =>
    s.fullName.toLowerCase().includes(q) || s.studentNumber.toLowerCase().includes(q)
  )
})

const formatDate = (d) => new Date(d).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
const formatTime = (t) => {
  const [h, m] = t.split(':')
  const d = new Date(); d.setHours(+h, +m)
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
.detail-sub   { font-size: 13px; color: var(--text-secondary); }

.date-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-input { width: auto; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card { text-align: center; }
.sum-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
.sum-value { font-size: 30px; font-weight: 700; }
.sum-value.accent  { color: var(--accent); }
.sum-value.success { color: var(--success); }
.sum-value.danger  { color: var(--danger); }

.student-list { display: flex; flex-direction: column; gap: 7px; }

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 11px 14px;
}

.student-info  { display: flex; align-items: center; gap: 10px; }
.student-right { display: flex; align-items: center; gap: 10px; }
.student-name  { font-size: 13px; font-weight: 500; }
.student-num   { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.time-text     { font-size: 11px; color: var(--text-muted); }

.rs-dot--danger { background: var(--danger); }

.overall-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-color: var(--accent-border);
  background: var(--accent-dim);
  margin-bottom: 20px;
}

.overall-label { font-size: 13px; color: var(--text-secondary); }
.overall-value { font-size: 24px; font-weight: 700; color: var(--accent); }

.daily-list { display: flex; flex-direction: column; gap: 10px; }

.day-row { display: grid; grid-template-columns: 110px 1fr 90px; align-items: center; gap: 12px; }
.day-date { font-size: 12px; color: var(--text-secondary); }
.day-stat { font-size: 11px; color: var(--text-muted); text-align: right; }

@media (max-width: 500px) {
  .day-row { grid-template-columns: 80px 1fr 70px; }
}
</style>