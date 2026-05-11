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

    <main class="rs-main rs-main--wide">

      <div v-if="loading" class="rs-loading">
        <div class="rs-spinner rs-spinner--lg"></div>
        <p>Loading your modules...</p>
      </div>

      <div v-else-if="error" class="rs-alert rs-alert--error">{{ error }}</div>

      <div v-else-if="activeSection">
        <SectionDetailView :section="activeSection" @back="activeSection = null" />
      </div>

      <div v-else>
        <div class="page-title-row">
          <h1 class="page-title">My modules</h1>
          <p class="page-sub">{{ sections.length }} section{{ sections.length !== 1 ? 's' : '' }} assigned</p>
        </div>

        <div v-if="sections.length === 0" class="empty-state rs-card">
          <p class="empty-title">No sections assigned</p>
          <p class="empty-sub">Contact your administrator to be assigned to a module.</p>
        </div>

        <div v-else class="sections-grid">
          <div v-for="section in sections" :key="section.sectionId" class="section-card rs-card">

            <div class="card-top">
              <span class="rs-badge rs-badge--accent">{{ section.fullSectionName }}</span>
              <span class="department-text">{{ section.department }}</span>
            </div>

            <h2 class="module-name">{{ section.moduleName }}</h2>
            <p class="semester-text">{{ section.semester }} · {{ section.year }}</p>

            <div class="stats-row">
              <div class="stat">
                <span class="stat-value">{{ section.studentCount }}</span>
                <span class="stat-label">Students</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-value accent">{{ section.todayPresent }}</span>
                <span class="stat-label">Present today</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-value">
                  {{ section.studentCount > 0
                    ? Math.round((section.todayPresent * 100) / section.studentCount)
                    : 0 }}%
                </span>
                <span class="stat-label">Rate</span>
              </div>
            </div>

            <div class="card-actions">
              <button
                v-if="section.hasActiveSession"
                class="btn btn-success"
                style="flex: 1;"
                @click="router.push(`/lecturer/sessions/${section.activeSessionId}/live`)"
              >
                Resume session
              </button>
              <button
                v-else
                class="btn btn-primary"
                style="flex: 1;"
                :disabled="startingSession === section.sectionId"
                @click="startSession(section)"
              >
                {{ startingSession === section.sectionId ? 'Starting...' : 'Start attendance' }}
              </button>
              <button class="btn btn-ghost" @click="openSection(section)">History</button>
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

const router          = useRouter()
const auth            = useAuthStore()
const loading         = ref(true)
const error           = ref('')
const sections        = ref([])
const activeSection   = ref(null)
const startingSession = ref(null)

onMounted(async () => {
  try {
    const res = await api.get('/lecturer/sections')
    sections.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load sections'
  } finally {
    loading.value = false
  }
})

const startSession = async (section) => {
  startingSession.value = section.sectionId
  try {
    const res = await api.post(`/lecturer/sections/${section.sectionId}/sessions/start`, { autoCloseMinutes: 60 })
    router.push(`/lecturer/sessions/${res.data.sessionId}/live`)
  } catch (err) {
    const message = err.response?.data?.message || ''
    if (message.includes('already has an active session')) {
      const sectionsRes = await api.get('/lecturer/sections')
      const sectionData = sectionsRes.data.find(s => s.sectionId === section.sectionId)
      if (sectionData?.activeSessionId) router.push(`/lecturer/sessions/${sectionData.activeSessionId}/live`)
      else alert('A session is already active. Check your dashboard.')
    } else {
      alert(message)
    }
  } finally {
    startingSession.value = null
  }
}

const openSection   = (section) => { activeSection.value = section }
const handleLogout  = () => { auth.clearSession(); router.push('/login') }
</script>

<style scoped>
.header-right { display: flex; align-items: center; gap: 14px; }
.welcome-text { font-size: 13px; color: var(--text-secondary); }

.page-title-row { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
.page-sub   { font-size: 13px; color: var(--text-secondary); }

.empty-state { text-align: center; padding: 40px 20px; }
.empty-title { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
.empty-sub   { font-size: 12px; color: var(--text-muted); }

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.section-card {
  transition: border-color 0.2s, transform 0.2s;
  cursor: default;
}

.section-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.department-text { font-size: 11px; color: var(--text-muted); }

.module-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
  letter-spacing: -0.01em;
}

.semester-text { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }

.stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px;
}

.stat { text-align: center; flex: 1; }
.stat-value { display: block; font-size: 20px; font-weight: 700; margin-bottom: 2px; }
.stat-value.accent { color: var(--accent); }
.stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.stat-divider { width: 1px; height: 28px; background: var(--border-subtle); }

.card-actions { display: flex; gap: 8px; }

@media (max-width: 600px) { .sections-grid { grid-template-columns: 1fr; } }
</style>