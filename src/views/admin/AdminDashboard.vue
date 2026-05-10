<template>
  <div class="admin-page">

    <!-- HEADER -->
    <header class="page-header">
      <div class="logo-mark">
        <div class="logo-dot"></div>
        <span class="logo-text">RaySense</span>
        <span class="admin-chip">Admin</span>
      </div>
      <div class="header-right">
        <span class="welcome-text">{{ auth.fullName }}</span>
        <button class="logout-btn" @click="handleLogout">Logout</button>
      </div>
    </header>

    <main class="page-main">

      <!-- TABS -->
      <div class="tab-row">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- OVERVIEW TAB -->
      <div v-if="activeTab === 'overview'">
        <OverviewTab />
      </div>

      <!-- MODULES TAB -->
      <div v-else-if="activeTab === 'modules'">
        <ModulesTab />
      </div>

      <!-- SECTIONS TAB -->
      <div v-else-if="activeTab === 'sections'">
        <SectionsTab />
      </div>

      <!-- LECTURERS TAB -->
      <div v-else-if="activeTab === 'lecturers'">
        <LecturersTab />
      </div>

      <!-- STUDENTS TAB -->
      <div v-else-if="activeTab === 'students'">
        <StudentsTab />
      </div>

    </main>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import OverviewTab  from './tabs/OverviewTab.vue'
import ModulesTab   from './tabs/ModulesTab.vue'
import SectionsTab  from './tabs/SectionsTab.vue'
import LecturersTab from './tabs/LecturersTab.vue'
import StudentsTab  from './tabs/StudentsTab.vue'

const router = useRouter()
const auth   = useAuthStore()

const activeTab = ref('overview')

const tabs = [
  { key: 'overview',  label: '📊 Overview'  },
  { key: 'modules',   label: '📚 Modules'   },
  { key: 'sections',  label: '🏫 Sections'  },
  { key: 'lecturers', label: '👨‍🏫 Lecturers' },
  { key: 'students',  label: '🎓 Students'  }
]

const handleLogout = () => {
  auth.clearSession()
  router.push('/login')
}
</script>

<style scoped>
.admin-page {
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

.admin-chip {
  font-size: 11px;
  background: rgba(0,102,255,0.15);
  border: 1px solid rgba(0,102,255,0.3);
  color: #0066FF;
  padding: 2px 8px;
  border-radius: 999px;
}

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
  padding: 24px 16px;
  max-width: 960px;
  margin: 0 auto;
}

/* TABS */
.tab-row {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 16px;
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
</style>git