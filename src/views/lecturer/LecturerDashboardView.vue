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
        <p>Loading your modules...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="banner-error">
        {{ error }}
      </div>

      <!-- SECTION DETAIL VIEW -->
      <div v-else-if="activeSection">
        <SectionDetailView
          :section="activeSection"
          @back="activeSection = null"
        />
      </div>

      <!-- SECTIONS LIST -->
      <div v-else class="content">

        <div class="page-title-row">
          <h1 class="title">My Modules</h1>
          <p class="subtitle">
            {{ sections.length }} section(s) assigned
          </p>
        </div>

        <!-- EMPTY STATE -->
        <div v-if="sections.length === 0" class="empty-state">
          <p>No sections assigned yet.</p>
          <p class="empty-sub">
            Contact your administrator to be assigned to a module.
          </p>
        </div>

        <!-- SECTION CARDS -->
        <div v-else class="sections-grid">

          <div
            v-for="section in sections"
            :key="section.sectionId"
            class="section-card"
          >

            <!-- CARD TOP -->
            <div class="card-top">
              <span class="module-badge">
                {{ section.fullSectionName }}
              </span>

              <span class="department">
                {{ section.department }}
              </span>
            </div>

            <!-- MODULE INFO -->
            <h2 class="module-name">
              {{ section.moduleName }}
            </h2>

            <p class="semester-text">
              {{ section.semester }} · {{ section.year }}
            </p>

            <!-- STATS -->
            <div class="stats-row">

              <div class="stat">
                <span class="stat-value">
                  {{ section.studentCount }}
                </span>
                <span class="stat-label">
                  Students
                </span>
              </div>

              <div class="divider"></div>

              <div class="stat">
                <span class="stat-value cyan">
                  {{ section.todayPresent }}
                </span>
                <span class="stat-label">
                  Present Today
                </span>
              </div>

              <div class="divider"></div>

              <div class="stat">
                <span class="stat-value">
                  {{
                    section.studentCount > 0
                      ? Math.round(
                          (section.todayPresent * 100) /
                          section.studentCount
                        )
                      : 0
                  }}%
                </span>

                <span class="stat-label">
                  Rate
                </span>
              </div>

            </div>

            <!-- ACTIONS -->
            <div class="card-actions">

              <!-- ACTIVE SESSION -->
              <button
                v-if="section.hasActiveSession"
                class="resume-btn"
                @click="router.push(`/lecturer/sessions/${section.activeSessionId}/live`)"
              >
                ▶ Resume Active Session
              </button>

              <!-- START SESSION -->
              <button
                v-else
                class="start-btn"
                :disabled="startingSession === section.sectionId"
                @click="startSession(section)"
              >
                {{
                  startingSession === section.sectionId
                    ? 'Starting...'
                    : '▶ Start Attendance'
                }}
              </button>

              <!-- HISTORY -->
              <button
                class="history-btn"
                @click="openSection(section)"
              >
                History
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import SectionDetailView from './SectionDetailView.vue'

const router        = useRouter()
const auth          = useAuthStore()
const loading       = ref(true)
const error         = ref('')
const sections      = ref([])
const activeSection = ref(null)
const startingSession = ref(null)   // tracks which section is loading

onMounted(async () => {
  try {
    const response = await api.get('/lecturer/sections')
    sections.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load sections'
  } finally {
    loading.value = false
  }
})

const startSession = async (section) => {
  startingSession.value = section.sectionId
  try {
    const response = await api.post(
      `/lecturer/sections/${section.sectionId}/sessions/start`,
      { autoCloseMinutes: 60 }
    )
    router.push(`/lecturer/sessions/${response.data.sessionId}/live`)

  } catch (err) {
    const message = err.response?.data?.message || ''

    // Session already exists → fetch it and redirect
    if (message.includes('already has an active session')) {
      try {
        // Get the active session for this section
        const sectionsResponse = await api.get('/lecturer/sections')
        const sectionData = sectionsResponse.data.find(
          s => s.sectionId === section.sectionId
        )

        if (sectionData?.activeSessionId) {
          router.push(`/lecturer/sessions/${sectionData.activeSessionId}/live`)
        } else {
          alert('A session is already active. Check your dashboard.')
        }
      } catch {
        alert(message)
      }
    } else {
      alert(message)
    }
  } finally {
    startingSession.value = null
  }
}

const openSection = (section) => {
  activeSection.value = section
}

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

.logo-mark { display: flex; align-items: center; gap: 10px; }

.logo-dot {
  width: 10px; height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 12px #00F0FF;
}

.logo-text { font-weight: 700; }

.header-right { display: flex; align-items: center; gap: 14px; }

.welcome-text { font-size: 13px; color: #9ca3af; }

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

.logout-btn:hover { border-color: rgba(239,68,68,0.4); color: #f87171; }

.page-main {
  padding: 32px 16px;
  max-width: 800px;
  margin: 0 auto;
}

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

.banner-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
}

.page-title-row { margin-bottom: 24px; }

.title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }

.subtitle { font-size: 13px; color: #9ca3af; }

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #6b7280;
  font-size: 14px;
}

.empty-sub { font-size: 12px; margin-top: 6px; }

/* GRID */
.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* CARD */
.section-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-card:hover {
  border-color: rgba(0,240,255,0.2);
  box-shadow: 0 0 20px rgba(0,240,255,0.06);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.module-badge {
  font-size: 12px;
  font-weight: 700;
  color: #00F0FF;
  background: rgba(0,240,255,0.08);
  border: 1px solid rgba(0,240,255,0.2);
  padding: 4px 10px;
  border-radius: 999px;
}

.department { font-size: 11px; color: #6b7280; }

.module-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }

.semester-text { font-size: 12px; color: #6b7280; margin-bottom: 16px; }

.stats-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 14px;
}

.stat { text-align: center; flex: 1; }

.stat-value { display: block; font-size: 20px; font-weight: 700; }

.stat-value.cyan { color: #00F0FF; }

.stat-label { font-size: 10px; color: #6b7280; margin-top: 2px; }

.divider { width: 1px; height: 30px; background: rgba(255,255,255,0.06); }

.card-footer { font-size: 12px; color: #6b7280; text-align: right; }

@media (max-width: 600px) {
  .sections-grid { grid-template-columns: 1fr; }
}
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.start-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0,102,255,0.1);
  border: 1px solid rgba(0,102,255,0.3);
  color: #0066FF;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover {
  background: rgba(0,102,255,0.2);
  border-color: rgba(0,102,255,0.6);
}

.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.history-btn {
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-btn:hover { border-color: rgba(255,255,255,0.2); color: white; }
.resume-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  color: #10b981;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.resume-btn:hover {
  background: rgba(16,185,129,0.2);
  border-color: rgba(16,185,129,0.6);
}
</style>