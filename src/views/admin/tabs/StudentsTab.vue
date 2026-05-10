<template>
  <div>
    <h2 class="tab-title">Students</h2>

    <!-- SEARCH -->
    <input
      v-model="search"
      class="search-input"
      placeholder="Search by name or student number..."
    />

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- TABLE -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Student #</th>
            <th>Email</th>
            <th>Face Enrolled</th>
            <th>Sections</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.id">
            <td>{{ student.fullName }}</td>
            <td>{{ student.studentNumber }}</td>
            <td>{{ student.email }}</td>
            <td>
              <span class="face-badge" :class="student.hasFaceEncoding ? 'enrolled' : 'missing'">
                {{ student.hasFaceEncoding ? '✓ Enrolled' : '✗ Missing' }}
              </span>
            </td>
            <td>{{ student.enrolledSections }}</td>
            <td>
              <span class="status-badge" :class="student.isActive ? 'active' : 'inactive'">
                {{ student.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading  = ref(true)
const students = ref([])
const search   = ref('')

const filteredStudents = computed(() => {
  const q = search.value.toLowerCase()
  return students.value.filter(s =>
    s.fullName.toLowerCase().includes(q) ||
    s.studentNumber.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    const response = await api.get('/admin/students')
    students.value = response.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tab-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }

.search-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: white;
  font-size: 13px;
  outline: none;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.search-input:focus { border-color: rgba(0,240,255,0.3); }

.loading-state { display: flex; justify-content: center; padding: 40px; }

.spinner {
  width: 24px; height: 24px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { overflow-x: auto; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  color: #6b7280;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-weight: 600;
  text-transform: uppercase;
}

.table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: #d1d5db;
}

.face-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
}

.face-badge.enrolled {
  background: rgba(16,185,129,0.1);
  color: #10b981;
  border: 1px solid rgba(16,185,129,0.2);
}

.face-badge.missing {
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
}

.status-badge.active {
  background: rgba(16,185,129,0.1);
  color: #10b981;
  border: 1px solid rgba(16,185,129,0.2);
}

.status-badge.inactive {
  background: rgba(107,114,128,0.1);
  color: #6b7280;
  border: 1px solid rgba(107,114,128,0.2);
}
</style>