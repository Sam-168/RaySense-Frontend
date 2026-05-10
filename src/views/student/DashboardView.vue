<template>
  <div class="dashboard-page">

    <!-- HEADER -->
    <header class="page-header">
      <div class="logo-mark">
        <div class="logo-dot"></div>
        <span class="logo-text">RaySense</span>
      </div>

      <div class="header-right">
        <span class="welcome-text">{{ auth.fullName }}</span>
        <button class="logout-btn" @click="handleLogout">
          Logout
        </button>
      </div>
    </header>

    <main class="page-main">

      <!-- LOADING -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your attendance...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="banner-error">
        {{ error }}
      </div>

      <!-- CONTENT -->
      <div v-else class="content">

        <!-- STUDENT INFO -->
        <div class="student-info">
          <h1 class="title">
            Welcome back, {{ data.studentName }}
          </h1>

          <p class="subtitle">
            {{ data.studentNumber }}
            ·
            {{ data.classId || 'No class assigned' }}
          </p>
        </div>

        <!-- STATS CARDS -->
        <div class="stats-grid">

          <div class="stat-card">
            <p class="stat-label">Attendance Rate</p>
            <p class="stat-value cyan">
              {{ data.attendancePercentage }}%
            </p>
          </div>

          <div class="stat-card">
            <p class="stat-label">Days Present</p>
            <p class="stat-value">
              {{ data.totalPresent }}
            </p>
          </div>

          <div class="stat-card">
            <p class="stat-label">Total Sessions</p>
            <p class="stat-value">
              {{ data.totalRecords }}
            </p>
          </div>

        </div>

        <!-- ACTIVE SESSIONS -->
        <div class="sessions-section">

          <h2 class="section-title">
            Active Sessions
          </h2>

          <!-- Loading sessions -->
          <div v-if="loadingSessions" class="sessions-loading">
            <div class="spinner-sm"></div>
          </div>

          <!-- No active sessions -->
          <div
            v-else-if="activeSessions.length === 0"
            class="no-sessions"
          >
            <p>No active sessions right now.</p>

            <p class="no-sessions-sub">
              Your lecturer will start one when class begins.
            </p>
          </div>

          <!-- Session cards -->
          <div v-else class="sessions-list">

            <div
              v-for="session in activeSessions"
              :key="session.sessionId"
              class="session-card"
            >

              <div class="session-card-left">

                <span class="session-module">
                  {{ session.sectionName }}
                </span>

                <p class="session-module-name">
                  {{ session.moduleName }}
                </p>

                <p class="session-lecturer">
                  Dr. {{ session.lecturerName }}
                </p>

              </div>

              <div class="session-card-right">

                <span
                  v-if="session.alreadyMarked"
                  class="marked-badge"
                >
                  ✓ Marked
                </span>

                <router-link
  v-else
  :to="{
    name: 'MarkAttendance',
    params: { sessionId: session.sessionId }
  }"
  class="attend-btn"
>
  Mark Attendance
</router-link>

              </div>

            </div>

          </div>

        </div>

        <!-- MARK ATTENDANCE BUTTON -->
        <router-link
          to="/attendance/mark"
          class="mark-btn"
        >
          Mark Attendance
        </router-link>

        <!-- ATTENDANCE RECORDS -->
        <div class="records-section">

          <h2 class="section-title">
            Recent Attendance
          </h2>

          <!-- EMPTY STATE -->
          <div
            v-if="data.records.length === 0"
            class="empty-state"
          >
            <p>No attendance records yet.</p>

            <p class="empty-sub">
              Mark your first attendance above!
            </p>
          </div>

          <!-- RECORDS LIST -->
          <div v-else class="records-list">

            <div
              v-for="record in data.records"
              :key="record.id"
              class="record-row"
            >

              <div class="record-left">

                <span
                  class="status-dot"
                  :class="record.status === 'PRESENT'
                    ? 'green'
                    : 'red'"
                ></span>

                <div>
                  <p class="record-date">
                    {{ formatDate(record.date) }}
                  </p>

                  <p class="record-time">
                    {{ formatTime(record.time) }}
                  </p>
                </div>

              </div>

              <span
                class="record-status"
                :class="record.status === 'PRESENT'
                  ? 'present'
                  : 'absent'"
              >
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
const auth = useAuthStore()

/* -----------------------------
   STATE
----------------------------- */

const loading = ref(true)
const error = ref('')

const data = ref({
  studentName: '',
  studentNumber: '',
  classId: '',
  totalPresent: 0,
  totalRecords: 0,
  attendancePercentage: 0,
  records: []
})

/* -----------------------------
   ACTIVE SESSIONS
----------------------------- */

const loadingSessions = ref(true)
const activeSessions = ref([])

/* -----------------------------
   FETCH ACTIVE SESSIONS
----------------------------- */

const fetchActiveSessions = async () => {
  try {
    const response = await api.get('/attendance/active-sessions')
    console.log(response.data)
    activeSessions.value = response.data
  } catch (err) {
    console.error('Failed to load active sessions', err)
  } finally {
    loadingSessions.value = false
  }
}

/* -----------------------------
   SESSION POLLING
----------------------------- */

let sessionPollTimer = null

/* -----------------------------
   FETCH DATA ON MOUNT
----------------------------- */

onMounted(async () => {

  // Load attendance dashboard
  try {
    const response = await api.get('/attendance/my-attendance')
    data.value = response.data
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      'Failed to load attendance data'
  } finally {
    loading.value = false
  }

  // Load active sessions
  await fetchActiveSessions()

  // Poll every 10 seconds
  sessionPollTimer = setInterval(fetchActiveSessions, 10000)

})

/* -----------------------------
   CLEANUP
----------------------------- */

onUnmounted(() => {
  if (sessionPollTimer) {
    clearInterval(sessionPollTimer)
  }
})

/* -----------------------------
   FORMATTERS
----------------------------- */

// Format date: 2026-04-25 → Fri, 25 Apr 2026
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format time: 08:30:00 → 08:30 AM
const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':')

  const date = new Date()
  date.setHours(+h, +m)

  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/* -----------------------------
   LOGOUT
----------------------------- */

const handleLogout = () => {
  auth.clearSession()
  router.push('/login')
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b0f14, #05070a);
  color: white;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo-mark {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-dot {
  width: 10px;
  height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 12px #00F0FF;
}

.logo-text { font-weight: 700; }

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.welcome-text {
  font-size: 13px;
  color: #9ca3af;
}

.logout-btn {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: rgba(239,68,68,0.4);
  color: #f87171;
}

.page-main {
  padding: 32px 16px;
  max-width: 640px;
  margin: 0 auto;
}

/* LOADING */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 80px;
  color: #9ca3af;
}

.spinner {
  width: 28px;
  height: 28px;
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
  padding: 12px 16px;
  font-size: 13px;
}

/* STUDENT INFO */
.student-info { margin-bottom: 24px; }

.title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  color: #9ca3af;
}

/* STATS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-value.cyan { color: #00F0FF; }

/* MARK ATTENDANCE BUTTON */
.mark-btn {
  display: block;
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(0,240,255,0.25);
  color: #00F0FF;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  margin-bottom: 28px;
  transition: all 0.2s;
}

.mark-btn:hover {
  border-color: rgba(0,240,255,0.6);
  box-shadow: 0 0 12px rgba(0,240,255,0.15);
}

/* RECORDS */
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #d1d5db;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #6b7280;
  font-size: 14px;
}

.empty-sub {
  font-size: 12px;
  margin-top: 6px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 12px 16px;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot.red   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

.record-date {
  font-size: 13px;
  font-weight: 500;
}

.record-time {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.record-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
}

.record-status.present {
  background: rgba(16,185,129,0.1);
  color: #34d399;
  border: 1px solid rgba(16,185,129,0.2);
}

.record-status.absent {
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
}
/* SESSIONS SECTION */
.sessions-section { margin-bottom: 28px; }

.sessions-loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.spinner-sm {
  width: 20px; height: 20px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.no-sessions {
  text-align: center;
  padding: 24px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  color: #6b7280;
  font-size: 14px;
}

.no-sessions-sub {
  font-size: 12px;
  margin-top: 4px;
  color: #4b5563;
}

.sessions-list { display: flex; flex-direction: column; gap: 10px; }

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,102,255,0.05);
  border: 1px solid rgba(0,102,255,0.15);
  border-radius: 12px;
  padding: 14px 16px;
}

.session-module {
  font-size: 12px;
  font-weight: 700;
  color: #00F0FF;
  background: rgba(0,240,255,0.08);
  border: 1px solid rgba(0,240,255,0.2);
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  margin-bottom: 4px;
}

.session-module-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }

.session-lecturer { font-size: 12px; color: #9ca3af; }

.marked-badge {
  font-size: 12px;
  color: #10b981;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.attend-btn {
  font-size: 12px;
  color: white;
  background: #0066FF;
  padding: 8px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.attend-btn:hover { background: #0052CC; }

/* RESPONSIVE */
@media (max-width: 400px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-value { font-size: 20px; }
}
</style>