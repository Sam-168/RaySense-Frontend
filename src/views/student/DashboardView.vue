<template>
  <div class="rs-page">

    <header class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-dot"></div>
        RaySense
      </div>
      <div class="header-right">
        <span class="welcome-text">{{ auth.fullName }}</span>
        <button class="rs-logout" @click="handleLogout">Logout</button>
      </div>
    </header>

    <main class="rs-main">

      <div v-if="loading" class="rs-loading">
        <div class="rs-spinner rs-spinner--lg"></div>
        <p>Loading your attendance...</p>
      </div>

      <div v-else-if="error" class="rs-alert rs-alert--error">{{ error }}</div>

      <div v-else class="content">

        <!-- STUDENT INFO -->
        <div class="student-info">
          <h1 class="page-title">Welcome back, {{ data.studentName }}</h1>
          <p class="page-sub">{{ data.studentNumber }} · {{ data.classId || 'No class assigned' }}</p>
        </div>

        <!-- STATS -->
        <div class="stats-grid">
          <div class="rs-card stat-card">
            <p class="stat-label">Attendance rate</p>
            <p class="stat-value accent">{{ data.attendancePercentage }}%</p>
          </div>
          <div class="rs-card stat-card">
            <p class="stat-label">Days present</p>
            <p class="stat-value">{{ data.totalPresent }}</p>
          </div>
          <div class="rs-card stat-card">
            <p class="stat-label">Total sessions</p>
            <p class="stat-value">{{ data.totalRecords }}</p>
          </div>
        </div>

        <!-- ACTIVE SESSIONS -->
        <div class="section-block">
          <h2 class="section-label">Active sessions</h2>

          <div v-if="loadingSessions" class="rs-loading" style="padding: 20px 0;">
            <div class="rs-spinner rs-spinner--sm"></div>
          </div>

          <div v-else-if="activeSessions.length === 0" class="rs-card empty-card">
            <p>No active sessions right now.</p>
            <p class="empty-sub">Your lecturer will start one when class begins.</p>
          </div>

          <div v-else class="sessions-list">
            <div v-for="session in activeSessions" :key="session.sessionId" class="rs-card session-card">
              <div class="session-left">
                <span class="rs-badge rs-badge--accent" style="margin-bottom: 6px; display: inline-block;">
                  {{ session.sectionName }}
                </span>
                <p class="session-name">{{ session.moduleName }}</p>
                <p class="session-lecturer">{{ session.lecturerName }}</p>
              </div>
              <span v-if="session.alreadyMarked" class="rs-badge rs-badge--success">Marked</span>
              <router-link
                v-else
                :to="{ name: 'MarkAttendance', params: { sessionId: session.sessionId } }"
                class="btn btn-primary"
              >
                Mark attendance
              </router-link>
            </div>
          </div>
        </div>

        <!-- RECENT ATTENDANCE -->
        <div class="section-block">
          <h2 class="section-label">Recent attendance</h2>

          <div v-if="data.records.length === 0" class="rs-card empty-card">
            <p>No attendance records yet.</p>
          </div>

          <div v-else class="records-list">
            <div v-for="record in data.records" :key="record.id" class="record-row">
              <div class="record-left">
                <span class="rs-dot" :class="record.status === 'PRESENT' ? 'rs-dot--success' : 'rs-dot--danger'"></span>
                <div>
                  <p class="record-date">{{ formatDate(record.date) }}</p>
                  <p class="record-time">{{ formatTime(record.time) }}</p>
                </div>
              </div>
              <span class="rs-badge" :class="record.status === 'PRESENT' ? 'rs-badge--success' : 'rs-badge--danger'">
                {{ record.status }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const auth   = useAuthStore()

const loading = ref(true)
const error   = ref('')
const data    = ref({ studentName: '', studentNumber: '', classId: '', totalPresent: 0, totalRecords: 0, attendancePercentage: 0, records: [] })

const loadingSessions = ref(true)
const activeSessions  = ref([])
let   sessionPollTimer = null

const fetchActiveSessions = async () => {
  try {
    const res = await api.get('/attendance/active-sessions')
    activeSessions.value = res.data
  } catch (err) {
    console.error('Failed to load active sessions', err)
  } finally {
    loadingSessions.value = false
  }
}

onMounted(async () => {
  try {
    const res = await api.get('/attendance/my-attendance')
    data.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load attendance data'
  } finally {
    loading.value = false
  }
  await fetchActiveSessions()
  sessionPollTimer = setInterval(fetchActiveSessions, 10000)
})

onUnmounted(() => { if (sessionPollTimer) clearInterval(sessionPollTimer) })

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':')
  const d = new Date()
  d.setHours(+h, +m)
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

const handleLogout = () => { auth.clearSession(); router.push('/login') }
</script>

<style scoped>
.header-right { display: flex; align-items: center; gap: 14px; }
.welcome-text { font-size: 13px; color: var(--text-secondary); }

.student-info { margin-bottom: 24px; }
.page-title   { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
.page-sub     { font-size: 13px; color: var(--text-secondary); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.stat-card { text-align: center; }
.stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
.stat-value { font-size: 26px; font-weight: 700; }
.stat-value.accent { color: var(--accent); }

.section-block { margin-bottom: 28px; }

.section-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.empty-card { padding: 24px; text-align: center; font-size: 13px; color: var(--text-muted); }
.empty-sub  { font-size: 12px; margin-top: 4px; }

.sessions-list { display: flex; flex-direction: column; gap: 10px; }

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-color: var(--brand-border);
  
}

.session-name     { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.session-lecturer { font-size: 12px; color: var(--text-secondary); }

.records-list { display: flex; flex-direction: column; gap: 7px; }

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 11px 14px;
}

.record-left  { display: flex; align-items: center; gap: 10px; }
.record-date  { font-size: 13px; font-weight: 500; }
.record-time  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.rs-dot--danger { background: var(--danger); }

@media (max-width: 400px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>