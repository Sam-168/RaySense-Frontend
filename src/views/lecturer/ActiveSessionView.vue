<template>
  <div class="session-page">

    <!-- HEADER -->
    <header class="page-header">
      <div class="logo-mark">
        <div class="logo-dot"></div>
        <span class="logo-text">RaySense</span>
      </div>
      <div class="session-badge">
        <span class="pulse-dot"></span>
        LIVE SESSION
      </div>
    </header>

    <main class="page-main">

      <!-- LOADING -->
      <div v-if="loading && !liveData" class="loading-state">
        <div class="spinner"></div>
        <p>Starting session...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="banner-error">{{ error }}</div>

      <!-- SESSION CONTENT -->
      <div v-else-if="liveData" class="content">

        <!-- SESSION INFO -->
        <div class="session-info">
          <div>
            <h1 class="session-title">{{ liveData.moduleName }}</h1>
            <p class="session-sub">{{ liveData.sectionName }} · Started {{ formatTime(liveData.startedAt) }}</p>
            <p class="session-code">{{ liveData.sessionCode }}</p>
          </div>
          <div class="status-pill" :class="liveData.status === 'ACTIVE' ? 'active' : 'closed'">
            {{ liveData.status }}
          </div>
        </div>

        <!-- LIVE STATS -->
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">Present</p>
            <p class="stat-value green">{{ liveData.presentCount }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Absent</p>
            <p class="stat-value red">
              {{ liveData.totalStudents - liveData.presentCount }}
            </p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Total</p>
            <p class="stat-value">{{ liveData.totalStudents }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Rate</p>
            <p class="stat-value cyan">{{ liveData.attendancePercentage }}%</p>
          </div>
        </div>

        <!-- PROGRESS BAR -->
        <div class="progress-wrap">
          <div
            class="progress-bar"
            :style="{ width: liveData.attendancePercentage + '%' }"
          ></div>
        </div>

        <!-- AUTO CLOSE TIMER -->
        <div class="timer-row" v-if="liveData.status === 'ACTIVE'">
          <span class="timer-label">⏱ Auto-closes in</span>
          <span class="timer-value">{{ timeUntilAutoClose }}</span>
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
            <div class="student-left">
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
              <span v-if="student.time" class="time-text">
                {{ formatTime(student.time) }}
              </span>
              <span
                class="status-badge"
                :class="student.status === 'PRESENT' ? 'present' : 'absent'"
              >
                {{ student.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- END SESSION BUTTON -->
        <button
          v-if="liveData.status === 'ACTIVE'"
          class="end-btn"
          :disabled="ending"
          @click="confirmEnd"
        >
          {{ ending ? 'Ending...' : 'End Session' }}
        </button>

        <div v-else class="session-ended-banner">
          ✓ Session ended at {{ formatTime(liveData.endedAt) }}
          <button class="back-link" @click="$router.push('/lecturer/dashboard')">
            Back to Dashboard
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

const router = useRouter()
const route  = useRoute()

const sessionId = route.params.sessionId

const loading  = ref(true)
const ending   = ref(false)
const error    = ref('')
const liveData = ref(null)
const search   = ref('')
let   pollTimer = null

// ── Fetch live data ──────────────────────────────────────────────────────────
const fetchLiveData = async () => {
  try {
    const response = await api.get(`/lecturer/sessions/${sessionId}/live`)
    liveData.value = response.data

    // If session is closed, stop polling
    if (liveData.value.status === 'CLOSED') {
      clearInterval(pollTimer)
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load session data'
  } finally {
    loading.value = false
  }
}

// ── Start polling on mount ───────────────────────────────────────────────────
onMounted(async () => {
  await fetchLiveData()
  // Poll every 10 seconds
  pollTimer = setInterval(fetchLiveData, 10000)
})

// ── Stop polling on unmount ──────────────────────────────────────────────────
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// ── End session ──────────────────────────────────────────────────────────────
const confirmEnd = async () => {
  if (!confirm('Are you sure you want to end this session?')) return

  ending.value = true
  try {
    await api.put(`/lecturer/sessions/${sessionId}/end`)
    await fetchLiveData() // Refresh to show ended state
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to end session'
  } finally {
    ending.value = false
  }
}

// ── Computed ─────────────────────────────────────────────────────────────────
const filteredStudents = computed(() => {
  if (!liveData.value) return []
  const q = search.value.toLowerCase()
  return liveData.value.students.filter(s =>
    s.fullName.toLowerCase().includes(q) ||
    s.studentNumber.toLowerCase().includes(q)
  )
})

const timeUntilAutoClose = computed(() => {
  if (!liveData.value) return ''
  const started     = new Date(liveData.value.startedAt)
  const autoClose   = new Date(started.getTime() + liveData.value.autoCloseMinutes * 60000)
  const now         = new Date()
  const diffMs      = autoClose - now
  if (diffMs <= 0) return 'Closing...'
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return `${mins}m ${secs}s`
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (val) => {
  if (!val) return ''
  const d = new Date(val)
  return isNaN(d) ?
    val.toString().substring(0, 5) :
    d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.session-page {
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

.logo-mark { display: flex; align-items: center; gap: 10px; }

.logo-dot {
  width: 10px; height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 12px #00F0FF;
}

.logo-text { font-weight: 700; }

.session-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  padding: 6px 12px;
  border-radius: 999px;
}

.pulse-dot {
  width: 8px; height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}

.page-main {
  padding: 24px 16px;
  max-width: 680px;
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
  padding: 12px 16px;
  font-size: 13px;
}

/* SESSION INFO */
.session-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.session-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }

.session-sub { font-size: 13px; color: #9ca3af; margin-bottom: 4px; }

.session-code {
  font-size: 11px;
  color: #4b5563;
  font-family: monospace;
}

.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-pill.active {
  background: rgba(16,185,129,0.1);
  color: #10b981;
  border: 1px solid rgba(16,185,129,0.3);
}

.status-pill.closed {
  background: rgba(107,114,128,0.1);
  color: #6b7280;
  border: 1px solid rgba(107,114,128,0.3);
}

/* STATS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.stat-label { font-size: 10px; color: #6b7280; margin-bottom: 6px; }

.stat-value { font-size: 22px; font-weight: 700; }

.stat-value.green { color: #10b981; }
.stat-value.red   { color: #ef4444; }
.stat-value.cyan  { color: #00F0FF; }

/* PROGRESS */
.progress-wrap {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 14px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0066FF, #00F0FF);
  border-radius: 999px;
  transition: width 0.5s ease;
}

/* TIMER */
.timer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.15);
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 16px;
}

.timer-label { font-size: 12px; color: #9ca3af; }

.timer-value { font-size: 14px; font-weight: 700; color: #f59e0b; }

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
.student-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 12px 16px;
}

.student-left { display: flex; align-items: center; gap: 10px; }

.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot.red   { background: #ef4444; }

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

/* END BUTTON */
.end-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.end-btn:hover {
  background: rgba(239,68,68,0.15);
  border-color: rgba(239,68,68,0.6);
}

.end-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* SESSION ENDED */
.session-ended-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(107,114,128,0.08);
  border: 1px solid rgba(107,114,128,0.2);
  color: #9ca3af;
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 13px;
}

.back-link {
  background: none;
  border: 1px solid rgba(255,255,255,0.1);
  color: #9ca3af;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>