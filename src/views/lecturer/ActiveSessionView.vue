<template>
  <div class="rs-page">

    <header class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-dot"></div>
        RaySense
      </div>
      <div class="live-badge">
        <span class="rs-dot rs-dot--success rs-dot--pulse"></span>
        Live session
      </div>
    </header>

    <main class="rs-main">

      <div v-if="loading && !liveData" class="rs-loading">
        <div class="rs-spinner rs-spinner--lg"></div>
        <p>Loading session...</p>
      </div>

      <div v-else-if="error" class="rs-alert rs-alert--error">{{ error }}</div>

      <div v-else-if="liveData">

        <!-- SESSION INFO -->
        <div class="session-info">
          <div>
            <h1 class="session-title">{{ liveData.moduleName }}</h1>
            <p class="session-sub">{{ liveData.sectionName }} · Started {{ formatTime(liveData.startedAt) }}</p>
          </div>
          <span class="rs-badge" :class="liveData.status === 'ACTIVE' ? 'rs-badge--success' : 'rs-badge--muted'">
            {{ liveData.status }}
          </span>
        </div>

        <!-- STATS -->
        <div class="stats-grid">
          <div class="rs-card stat-card">
            <p class="stat-label">Present</p>
            <p class="stat-value success">{{ liveData.presentCount }}</p>
          </div>
          <div class="rs-card stat-card">
            <p class="stat-label">Absent</p>
            <p class="stat-value danger">{{ liveData.totalStudents - liveData.presentCount }}</p>
          </div>
          <div class="rs-card stat-card">
            <p class="stat-label">Total</p>
            <p class="stat-value">{{ liveData.totalStudents }}</p>
          </div>
          <div class="rs-card stat-card">
            <p class="stat-label">Rate</p>
            <p class="stat-value accent">{{ liveData.attendancePercentage }}%</p>
          </div>
        </div>

        <div class="rs-progress" style="margin-bottom: 14px;">
          <div class="rs-progress-bar" :style="{ width: liveData.attendancePercentage + '%' }"></div>
        </div>

        <!-- AUTO CLOSE TIMER -->
        <div v-if="liveData.status === 'ACTIVE'" class="timer-row rs-card">
          <span class="timer-label">Auto-closes in</span>
          <span class="timer-value">{{ timeUntilAutoClose }}</span>
        </div>

        <input v-model="search" class="rs-search" placeholder="Search student..." style="margin-top: 16px;" />

        <!-- STUDENT LIST -->
        <div class="student-list">
          <div v-for="student in filteredStudents" :key="student.studentId" class="student-row">
            <div class="student-left">
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

        <button
          v-if="liveData.status === 'ACTIVE'"
          class="btn btn-danger btn--lg"
          :disabled="ending"
          @click="confirmEnd"
          style="margin-top: 8px;"
        >
          {{ ending ? 'Ending...' : 'End session' }}
        </button>

        <div v-else class="rs-card session-ended">
          Session ended at {{ formatTime(liveData.endedAt) }}
          <button class="btn btn-ghost btn--sm" @click="$router.push('/lecturer/dashboard')">
            Back to dashboard
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'

const router    = useRouter()
const route     = useRoute()
const sessionId = route.params.sessionId

const loading  = ref(true)
const ending   = ref(false)
const error    = ref('')
const liveData = ref(null)
const search   = ref('')
let   pollTimer = null

const fetchLiveData = async () => {
  try {
    const res = await api.get(`/lecturer/sessions/${sessionId}/live`)
    liveData.value = res.data
    if (liveData.value.status === 'CLOSED') clearInterval(pollTimer)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load session data'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchLiveData()
  pollTimer = setInterval(fetchLiveData, 10000)
})

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

const confirmEnd = async () => {
  if (!confirm('End this session?')) return
  ending.value = true
  try {
    await api.put(`/lecturer/sessions/${sessionId}/end`)
    await fetchLiveData()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to end session'
  } finally {
    ending.value = false
  }
}

const filteredStudents = computed(() => {
  if (!liveData.value) return []
  const q = search.value.toLowerCase()
  return liveData.value.students.filter(s =>
    s.fullName.toLowerCase().includes(q) || s.studentNumber.toLowerCase().includes(q)
  )
})

const timeUntilAutoClose = computed(() => {
  if (!liveData.value) return ''
  const started   = new Date(liveData.value.startedAt)
  const autoClose = new Date(started.getTime() + liveData.value.autoCloseMinutes * 60000)
  const diffMs    = autoClose - new Date()
  if (diffMs <= 0) return 'Closing...'
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return `${mins}m ${secs}s`
})

const formatTime = (val) => {
  if (!val) return ''
  const d = new Date(val)
  return isNaN(d)
    ? val.toString().substring(0, 5)
    : d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.live-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
  background: var(--success-dim);
  border: 1px solid var(--success-border);
  padding: 5px 12px;
  border-radius: var(--radius-pill);
}

.session-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.session-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
.session-sub   { font-size: 13px; color: var(--text-secondary); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card { text-align: center; padding: 12px; }
.stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-value.accent  { color: var(--accent); }
.stat-value.success { color: var(--success); }
.stat-value.danger  { color: var(--danger); }

.timer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-color: var(--warning-border);
  background: var(--warning-dim);
}

.timer-label { font-size: 12px; color: var(--text-secondary); }
.timer-value { font-size: 14px; font-weight: 700; color: var(--warning); }

.student-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 11px 14px;
}

.student-left { display: flex; align-items: center; gap: 10px; }
.student-name { font-size: 13px; font-weight: 500; }
.student-num  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.student-right { display: flex; align-items: center; gap: 10px; }
.time-text { font-size: 11px; color: var(--text-muted); }

.rs-dot--danger { background: var(--danger); }

.session-ended {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>