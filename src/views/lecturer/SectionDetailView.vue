<template>
  <div class="detail-view">

    <!-- BACK + TITLE -->
    <div class="detail-header">
      <button class="back-btn" @click="$emit('back')">← Back</button>
      <div>
        <h1 class="detail-title">{{ section.fullSectionName }}</h1>
        <p class="detail-subtitle">{{ section.moduleName }}</p>
      </div>
    </div>

    <!-- DATE TABS -->
    <div class="tab-row">
      <button
        class="tab"
        :class="{ active: activeTab === 'today' }"
        @click="switchTab('today')"
      >
        Today
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'range' }"
        @click="switchTab('range')"
      >
        Date Range
      </button>
    </div>

    <!-- DATE RANGE PICKER (only shown on range tab) -->
    <div v-if="activeTab === 'range'" class="date-row">
      <div class="date-field">
        <label>From</label>
        <input v-model="startDate" type="date" class="date-input" />
      </div>
      <div class="date-field">
        <label>To</label>
        <input v-model="endDate" type="date" class="date-input" />
      </div>
      <button class="apply-btn" @click="loadRangeData">Apply</button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="banner-error">{{ error }}</div>

    <!-- TODAY VIEW -->
    <div v-else-if="activeTab === 'today' && todayData">

      <!-- SUMMARY CARDS -->
      <div class="summary-grid">
        <div class="summary-card">
          <p class="sum-label">Present</p>
          <p class="sum-value green">{{ todayData.presentCount }}</p>
        </div>
        <div class="summary-card">
          <p class="sum-label">Absent</p>
          <p class="sum-value red">{{ todayData.absentCount }}</p>
        </div>
        <div class="summary-card">
          <p class="sum-label">Rate</p>
          <p class="sum-value cyan">{{ todayData.attendancePercentage }}%</p>
        </div>
      </div>

      <!-- SEARCH -->
      <input
        v-model="search"
        class="search-input"
        placeholder="Search student..."
      />

      <!-- STUDENT LIST -->
      <div class="student-list">
        <div
          v-for="student in filteredStudents"
          :key="student.studentId"
          class="student-row"
        >
          <div class="student-info">
            <span
              class="status-dot"
              :class="student.status === 'PRESENT' ? 'green' : 'red'"
            ></span>
            <div>
              <p class="student-name">{{ student.fullName }}</p>
              <p class="student-number">{{ student.studentNumber }}</p>
            </div>
          </div>
          <div class="student-right">
            <span class="time-text" v-if="student.time">{{ formatTime(student.time) }}</span>
            <span
              class="status-badge"
              :class="student.status === 'PRESENT' ? 'present' : 'absent'"
            >
              {{ student.status }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- RANGE VIEW -->
    <div v-else-if="activeTab === 'range' && rangeData">

      <!-- OVERALL -->
      <div class="overall-banner">
        <span>Overall Attendance Rate</span>
        <span class="overall-value">{{ rangeData.overallPercentage }}%</span>
      </div>

      <!-- DAILY BREAKDOWN -->
      <div class="daily-list">
        <div
          v-for="day in rangeData.dailySummary"
          :key="day.date"
          class="day-row"
        >
          <span class="day-date">{{ formatDate(day.date) }}</span>
          <div class="day-bar-wrap">
            <div
              class="day-bar"
              :style="{ width: day.percentage + '%' }"
            ></div>
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

const props = defineProps({
  section: { type: Object, required: true }
})

defineEmits(['back'])

const loading    = ref(false)
const error      = ref('')
const activeTab  = ref('today')
const search     = ref('')
const todayData  = ref(null)
const rangeData  = ref(null)

// Default date range: last 30 days
const endDate   = ref(new Date().toISOString().split('T')[0])
const startDate = ref(() => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
})

onMounted(() => loadTodayData())

const switchTab = async (tab) => {
  activeTab.value = tab
  if (tab === 'today' && !todayData.value) loadTodayData()
}

const loadTodayData = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(`/lecturer/sections/${props.section.sectionId}/attendance/today`)
    todayData.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load attendance'
  } finally {
    loading.value = false
  }
}

const loadRangeData = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(
      `/lecturer/sections/${props.section.sectionId}/attendance`,
      { params: { startDate: startDate.value, endDate: endDate.value } }
    )
    rangeData.value = response.data
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
    s.fullName.toLowerCase().includes(q) ||
    s.studentNumber.toLowerCase().includes(q)
  )
})

const formatDate = (d) => new Date(d).toLocaleDateString('en-ZA', {
  weekday: 'short', day: 'numeric', month: 'short'
})

const formatTime = (t) => {
  const [h, m] = t.split(':')
  const date = new Date()
  date.setHours(+h, +m)
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.detail-view { padding-bottom: 40px; }

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #9ca3af;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.back-btn:hover { color: white; border-color: rgba(255,255,255,0.2); }

.detail-title { font-size: 20px; font-weight: 700; }

.detail-subtitle { font-size: 13px; color: #9ca3af; }

/* TABS */
.tab-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.tab.active {
  background: rgba(0,240,255,0.08);
  border-color: rgba(0,240,255,0.3);
  color: #00F0FF;
}

/* DATE ROW */
.date-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-field label {
  font-size: 11px;
  color: #9ca3af;
  display: block;
  margin-bottom: 4px;
}

.date-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: white;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
}

.apply-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0,240,255,0.3);
  background: rgba(0,240,255,0.08);
  color: #00F0FF;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.apply-btn:hover { background: rgba(0,240,255,0.15); }

/* LOADING */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 28px; height: 28px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ERROR */
.banner-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}

/* SUMMARY CARDS */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.sum-label { font-size: 11px; color: #6b7280; margin-bottom: 8px; }

.sum-value { font-size: 28px; font-weight: 700; }

.sum-value.green { color: #10b981; }
.sum-value.red   { color: #ef4444; }
.sum-value.cyan  { color: #00F0FF; }

/* SEARCH */
.search-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: white;
  font-size: 13px;
  outline: none;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.search-input:focus { border-color: rgba(0,240,255,0.3); }

/* STUDENT LIST */
.student-list { display: flex; flex-direction: column; gap: 8px; }

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 12px 16px;
}

.student-info { display: flex; align-items: center; gap: 10px; }

.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot.red   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

.student-name { font-size: 13px; font-weight: 500; }
.student-number { font-size: 11px; color: #6b7280; margin-top: 2px; }

.student-right { display: flex; align-items: center; gap: 10px; }

.time-text { font-size: 11px; color: #6b7280; }

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
}

.status-badge.present {
  background: rgba(16,185,129,0.1);
  color: #34d399;
  border: 1px solid rgba(16,185,129,0.2);
}

.status-badge.absent {
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
}

/* RANGE VIEW */
.overall-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,240,255,0.05);
  border: 1px solid rgba(0,240,255,0.15);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #9ca3af;
}

.overall-value { font-size: 22px; font-weight: 700; color: #00F0FF; }

.daily-list { display: flex; flex-direction: column; gap: 10px; }

.day-row {
  display: grid;
  grid-template-columns: 120px 1fr 100px;
  align-items: center;
  gap: 12px;
}

.day-date { font-size: 12px; color: #9ca3af; }

.day-bar-wrap {
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
  height: 6px;
  overflow: hidden;
}

.day-bar {
  height: 100%;
  background: #00F0FF;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.day-stat { font-size: 11px; color: #6b7280; text-align: right; }

@media (max-width: 500px) {
  .day-row { grid-template-columns: 90px 1fr 80px; }
  .summary-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>