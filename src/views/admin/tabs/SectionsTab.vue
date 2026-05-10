<template>
  <div>
    <div class="tab-header">
      <h2 class="tab-title">Sections</h2>
      <button class="add-btn" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ Add Section' }}
      </button>
    </div>

    <!-- CREATE FORM -->
    <div v-if="showForm" class="form-card">
      <h3 class="form-title">New Section</h3>
      <div class="form-grid">
        <div class="field">
          <label>Module</label>
          <select v-model="form.moduleId" class="input">
            <option value="">Select module...</option>
            <option v-for="m in modules" :key="m.id" :value="m.id">
              {{ m.moduleCode }} - {{ m.moduleName }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Lecturer</label>
          <select v-model="form.lecturerId" class="input">
            <option value="">Select lecturer...</option>
            <option v-for="l in lecturers" :key="l.id" :value="l.id">
              {{ l.fullName }} ({{ l.employeeNumber }})
            </option>
          </select>
        </div>
        <div class="field">
          <label>Section Code</label>
          <input v-model="form.sectionCode" class="input" placeholder="e.g. A" />
        </div>
        <div class="field">
          <label>Semester</label>
          <input v-model="form.semester" class="input" placeholder="e.g. Semester 1" />
        </div>
        <div class="field">
          <label>Year</label>
          <input v-model="form.year" type="number" class="input" placeholder="e.g. 2026" />
        </div>
      </div>
      <div v-if="formError" class="banner-error">{{ formError }}</div>
      <button class="submit-btn" :disabled="saving" @click="createSection">
        {{ saving ? 'Creating...' : 'Create Section' }}
      </button>
    </div>

    <!-- TABLE -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Module</th>
              <th>Lecturer</th>
              <th>Semester</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="section in sections" :key="section.id">
              <td><span class="code-badge">{{ section.fullSectionName }}</span></td>
              <td>{{ section.moduleName }}</td>
              <td>{{ section.lecturerName }}</td>
              <td>{{ section.semester }} {{ section.year }}</td>
              <td>
                <button class="link-btn" @click="openEnrollment(section)">
                  {{ section.studentCount }} students
                </button>
              </td>
              <td>
                <button class="danger-btn" @click="deleteSection(section.id)">
                  Deactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ENROLLMENT PANEL -->
      <div v-if="activeSection" class="enrollment-panel">
        <div class="enrollment-header">
          <h3 class="enrollment-title">
            Manage Students: {{ activeSection.fullSectionName }}
          </h3>
          <button class="close-btn" @click="activeSection = null">✕</button>
        </div>

        <div v-if="enrollmentLoading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else class="enrollment-content">

          <!-- ENROLLED STUDENTS -->
          <div class="enrollment-col">
            <h4 class="col-title">Enrolled ({{ enrollmentData.enrolled.length }})</h4>
            <div class="student-list">
              <div
                v-for="student in enrollmentData.enrolled"
                :key="student.id"
                class="student-row"
              >
                <div>
                  <p class="student-name">{{ student.fullName }}</p>
                  <p class="student-num">{{ student.studentNumber }}</p>
                </div>
                <button class="remove-btn" @click="removeStudent(student.id)">
                  Remove
                </button>
              </div>
              <p v-if="enrollmentData.enrolled.length === 0" class="empty-text">
                No students enrolled yet
              </p>
            </div>
          </div>

          <!-- AVAILABLE STUDENTS -->
          <div class="enrollment-col">
            <h4 class="col-title">Available ({{ enrollmentData.available.length }})</h4>
            <input
              v-model="studentSearch"
              class="search-input"
              placeholder="Search students..."
            />
            <div class="student-list">
              <div
                v-for="student in filteredAvailable"
                :key="student.id"
                class="student-row"
              >
                <div>
                  <p class="student-name">{{ student.fullName }}</p>
                  <p class="student-num">{{ student.studentNumber }}</p>
                </div>
                <button class="enroll-btn" @click="enrollStudent(student.id)">
                  + Enroll
                </button>
              </div>
              <p v-if="filteredAvailable.length === 0" class="empty-text">
                No available students
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading         = ref(true)
const saving          = ref(false)
const showForm        = ref(false)
const formError       = ref('')
const sections        = ref([])
const modules         = ref([])
const lecturers       = ref([])
const activeSection   = ref(null)
const enrollmentData  = ref({ enrolled: [], available: [] })
const enrollmentLoading = ref(false)
const studentSearch   = ref('')

const form = ref({
  moduleId: '', lecturerId: '', sectionCode: '', semester: '', year: new Date().getFullYear()
})

const filteredAvailable = computed(() => {
  const q = studentSearch.value.toLowerCase()
  return enrollmentData.value.available.filter(s =>
    s.fullName.toLowerCase().includes(q) ||
    s.studentNumber.toLowerCase().includes(q)
  )
})

const fetchAll = async () => {
  loading.value = true
  try {
    const [sectionsRes, modulesRes, lecturersRes] = await Promise.all([
      api.get('/admin/sections'),
      api.get('/admin/modules'),
      api.get('/admin/lecturers')
    ])
    sections.value  = sectionsRes.data
    modules.value   = modulesRes.data
    lecturers.value = lecturersRes.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

const createSection = async () => {
  formError.value = ''
  if (!form.value.moduleId || !form.value.lecturerId || !form.value.sectionCode) {
    formError.value = 'Module, lecturer and section code are required'
    return
  }
  saving.value = true
  try {
    await api.post('/admin/sections', form.value)
    showForm.value = false
    await fetchAll()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to create section'
  } finally {
    saving.value = false
  }
}

const deleteSection = async (id) => {
  if (!confirm('Deactivate this section?')) return
  try {
    await api.delete(`/admin/sections/${id}`)
    await fetchAll()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to deactivate')
  }
}

const openEnrollment = async (section) => {
  activeSection.value = section
  enrollmentLoading.value = true
  try {
    const response = await api.get(`/admin/sections/${section.id}/students`)
    enrollmentData.value = response.data
  } finally {
    enrollmentLoading.value = false
  }
}

const enrollStudent = async (studentId) => {
  try {
    await api.post(`/admin/sections/${activeSection.value.id}/enroll`, { studentId })
    await openEnrollment(activeSection.value)
    await fetchAll()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to enroll')
  }
}

const removeStudent = async (studentId) => {
  if (!confirm('Remove student from this section?')) return
  try {
    await api.delete(`/admin/sections/${activeSection.value.id}/students/${studentId}`)
    await openEnrollment(activeSection.value)
    await fetchAll()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to remove')
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

.tab-title { font-size: 18px; font-weight: 700; }

.add-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(0,102,255,0.1);
  border: 1px solid rgba(0,102,255,0.3);
  color: #0066FF;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.add-btn:hover { background: rgba(0,102,255,0.2); }

/* FORM */
.form-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.field label {
  font-size: 12px;
  color: #9ca3af;
  display: block;
  margin-bottom: 4px;
}

.input {
  width: 100%;
  padding: 9px 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.input:focus { border-color: rgba(0,240,255,0.3); }

.input option { background: #1f2937; }

.banner-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  margin-bottom: 12px;
}

.submit-btn {
  padding: 10px 20px;
  border-radius: 8px;
  background: rgba(0,102,255,0.15);
  border: 1px solid rgba(0,102,255,0.4);
  color: #0066FF;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}

/* LOADING */
.loading-state { display: flex; justify-content: center; padding: 40px; }

.spinner {
  width: 24px; height: 24px;
  border: 2px solid rgba(0,240,255,0.2);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* TABLE */
.table-wrap { overflow-x: auto; margin-bottom: 24px; }

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

.code-badge {
  font-size: 12px;
  font-weight: 700;
  color: #00F0FF;
  background: rgba(0,240,255,0.08);
  border: 1px solid rgba(0,240,255,0.2);
  padding: 2px 8px;
  border-radius: 999px;
}

.link-btn {
  background: none;
  border: none;
  color: #0066FF;
  cursor: pointer;
  font-size: 13px;
  text-decoration: underline;
}

.danger-btn {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: #f87171;
  cursor: pointer;
}

/* ENROLLMENT PANEL */
.enrollment-panel {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 20px;
  margin-top: 8px;
}

.enrollment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.enrollment-title { font-size: 15px; font-weight: 600; }

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
}

.enrollment-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.col-title { font-size: 13px; font-weight: 600; color: #9ca3af; margin-bottom: 12px; }

.search-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: white;
  font-size: 12px;
  outline: none;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 8px 12px;
}

.student-name { font-size: 13px; font-weight: 500; }

.student-num { font-size: 11px; color: #6b7280; }

.enroll-btn {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  color: #10b981;
  cursor: pointer;
  white-space: nowrap;
}

.remove-btn {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: #f87171;
  cursor: pointer;
}

.empty-text { font-size: 12px; color: #4b5563; text-align: center; padding: 16px 0; }

@media (max-width: 600px) {
  .enrollment-content { grid-template-columns: 1fr; }
}
</style>