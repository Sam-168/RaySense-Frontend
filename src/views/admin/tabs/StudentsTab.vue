<template>
  <div>
    <h2 class="section-title">Students</h2>

    <input v-model="search" class="rs-search" placeholder="Search by name or student number..." />

    <div v-if="loading" class="rs-loading">
      <div class="rs-spinner"></div>
    </div>

    <div v-else class="rs-table-wrap">
      <table class="rs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Student #</th>
            <th>Email</th>
            <th>Face</th>
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
              <span class="rs-badge" :class="student.hasFaceEncoding ? 'rs-badge--success' : 'rs-badge--danger'">
                {{ student.hasFaceEncoding ? 'Enrolled' : 'Missing' }}
              </span>
            </td>
            <td>{{ student.enrolledSections }}</td>
            <td>
              <span class="rs-badge" :class="student.isActive ? 'rs-badge--success' : 'rs-badge--muted'">
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
    s.fullName.toLowerCase().includes(q) || s.studentNumber.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    const res = await api.get('/admin/students')
    students.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
</style>