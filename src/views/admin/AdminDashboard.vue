<template>
  <div class="rs-page">

    <header class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-dot"></div>
        RaySense
        <span class="rs-badge rs-badge--brand">Admin</span>
      </div>
      <div class="header-right">
        <span class="welcome-text">{{ auth.fullName }}</span>
        <button class="rs-logout" @click="handleLogout">Logout</button>
      </div>
    </header>

    <main class="rs-main rs-main--wide">

      <nav class="rs-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="rs-tab"
          :class="{ 'rs-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <OverviewTab  v-if="activeTab === 'overview'"  />
      <ModulesTab   v-if="activeTab === 'modules'"   />
      <SectionsTab  v-if="activeTab === 'sections'"  />
      <LecturersTab v-if="activeTab === 'lecturers'" />
      <StudentsTab  v-if="activeTab === 'students'"  />

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

const router    = useRouter()
const auth      = useAuthStore()
const activeTab = ref('overview')

const tabs = [
  { key: 'overview',  label: 'Overview'  },
  { key: 'modules',   label: 'Modules'   },
  { key: 'sections',  label: 'Sections'  },
  { key: 'lecturers', label: 'Lecturers' },
  { key: 'students',  label: 'Students'  },
]

const handleLogout = () => { auth.clearSession(); router.push('/login') }
</script>

<style scoped>
.header-right { display: flex; align-items: center; gap: 14px; }
.welcome-text { font-size: 13px; color: var(--text-secondary); }
</style>