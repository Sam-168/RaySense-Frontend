<template>
  <div>
    <div class="tab-header">
      <h2 class="section-title">Lecturers</h2>
      <button class="btn btn-primary btn--sm" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ Add lecturer' }}
      </button>
    </div>

    <div v-if="showForm" class="rs-card form-card">
      <h3 class="form-title">New lecturer account</h3>
      <div class="form-grid">
        <div class="rs-field">
          <label class="rs-label">Full Name</label>
          <input v-model="form.fullName" class="rs-input" placeholder="Dr. Jane Smith" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Email</label>
          <input v-model="form.email" type="email" class="rs-input" placeholder="jane@university.ac.za" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Password</label>
          <input v-model="form.password" type="password" class="rs-input" placeholder="Min 6 characters" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Employee Number</label>
          <input v-model="form.employeeNumber" class="rs-input" placeholder="EMP002" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Department</label>
          <input v-model="form.department" class="rs-input" placeholder="Computer Science" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Phone Number</label>
          <input v-model="form.phoneNumber" class="rs-input" placeholder="+27 82 123 4567" />
        </div>
      </div>
      <div v-if="formError" class="rs-alert rs-alert--error mb-3">{{ formError }}</div>
      <button class="btn btn-accent" :disabled="saving" @click="createLecturer">
        {{ saving ? 'Creating...' : 'Create lecturer' }}
      </button>
    </div>

    <div v-if="loading" class="rs-loading">
      <div class="rs-spinner"></div>
    </div>

    <div v-else class="rs-table-wrap">
      <table class="rs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Employee #</th>
            <th>Department</th>
            <th>Sections</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lecturer in lecturers" :key="lecturer.id">
            <td>{{ lecturer.fullName }}</td>
            <td>{{ lecturer.email }}</td>
            <td>{{ lecturer.employeeNumber }}</td>
            <td>{{ lecturer.department || '—' }}</td>
            <td>{{ lecturer.sectionCount }}</td>
            <td>
              <span class="rs-badge" :class="lecturer.isActive ? 'rs-badge--success' : 'rs-badge--muted'">
                {{ lecturer.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const loading   = ref(true)
const saving    = ref(false)
const showForm  = ref(false)
const formError = ref('')
const lecturers = ref([])

const form = ref({ fullName: '', email: '', password: '', employeeNumber: '', department: '', phoneNumber: '' })

const fetchLecturers = async () => {
  try {
    const res = await api.get('/admin/lecturers')
    lecturers.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchLecturers)

const createLecturer = async () => {
  formError.value = ''
  if (!form.value.fullName || !form.value.email || !form.value.password || !form.value.employeeNumber) {
    formError.value = 'Name, email, password and employee number are required'
    return
  }
  saving.value = true
  try {
    await api.post('/admin/lecturers', form.value)
    form.value = { fullName: '', email: '', password: '', employeeNumber: '', department: '', phoneNumber: '' }
    showForm.value = false
    await fetchLecturers()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to create lecturer'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title { font-size: 16px; font-weight: 600; }

.form-card { margin-bottom: 20px; }

.form-title { font-size: 14px; font-weight: 600; margin-bottom: 14px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.mb-3 { margin-bottom: 12px; }
</style>