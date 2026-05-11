<template>
  <div>
    <div class="tab-header">
      <h2 class="section-title">Sections</h2>
      <button class="btn btn-primary btn--sm" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ Add section' }}
      </button>
    </div>

    <!-- CREATE FORM -->
    <div v-if="showForm" class="rs-card form-card">
      <h3 class="form-title">New section</h3>
      <div class="form-grid">
        <div class="rs-field">
          <label class="rs-label">Module</label>
          <select v-model="form.moduleId" class="rs-input">
            <option value="">Select module...</option>
            <option v-for="m in modules" :key="m.id" :value="m.id">
              {{ m.moduleCode }} — {{ m.moduleName }}
            </option>
          </select>
        </div>
        <div class="rs-field">
          <label class="rs-label">Lecturer</label>
          <select v-model="form.lecturerId" class="rs-input">
            <option value="">Select lecturer...</option>
            <option v-for="l in lecturers" :key="l.id" :value="l.id">
              {{ l.fullName }} ({{ l.employeeNumber }})
            </option>
          </select>
        </div>
        <div class="rs-field">
          <label class="rs-label">Section Code</label>
          <input v-model="form.sectionCode" class="rs-input" placeholder="A" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Semester</label>
          <input v-model="form.semester" class="rs-input" placeholder="Semester 1" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Year</label>
          <input v-model="form.year" type="number" class="rs-input" placeholder="2026" />
        </div>
      </div>
      <div v-if="formError" class="rs-alert rs-alert--error mb-3">{{ formError }}</div>
      <button class="btn btn-accent" :disabled="saving" @click="createSection">
        {{ saving ? 'Creating...' : 'Create section' }}
      </button>
    </div>

    <div v-if="loading" class="rs-loading">
      <div class="rs-spinner"></div>
    </div>

    <div v-else>
      <div class="rs-table-wrap">
        <table class="rs-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Module</th>
              <th>Lecturer</th>
              <th>Semester</th>
              <th>Students</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="section in sections" :key="section.id">
              <td><span class="rs-badge rs-badge--accent">{{ section.fullSectionName }}</span></td>
              <td>{{ section.moduleName }}</td>
              <td>{{ section.lecturerName }}</td>
              <td>{{ section.semester }} {{ section.year }}</td>
              <td>
                <button class="inline-link" @click="openEnrollment(section)">
                  {{ section.studentCount }} students
                </button>
              </td>
              <td>
                <button class="btn btn-danger btn--sm" @click="deleteSection(section.id)">
                  Deactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ENROLLMENT PANEL -->
      <div v-if="activeSection" class="rs-card enrollment-panel">
        <div class="enrollment-header">
          <h3 class="enrollment-title">{{ activeSection.fullSectionName }} — Students</h3>
          <button class="btn btn-ghost btn--sm" @click="activeSection = null">Close</button>
        </div>

        <div v-if="enrollmentLoading" class="rs-loading" style="padding: 24px 0;">
          <div class="rs-spinner"></div>
        </div>

        <div v-else class="enrollment-cols">
          <!-- Enrolled -->
          <div class="enrollment-col">
            <p class="col-label">Enrolled ({{ enrollmentData.enrolled.length }})</p>
            <div class="student-list">
              <div v-for="s in enrollmentData.enrolled" :key="s.id" class="student-row">
                <div>
                  <p class="student-name">{{ s.fullName }}</p>
                  <p class="student-num">{{ s.studentNumber }}</p>
                </div>
                <button class="btn btn-danger btn--sm" @click="removeStudent(s.id)">Remove</button>
              </div>
              <p v-if="!enrollmentData.enrolled.length" class="empty-text">No students enrolled</p>
            </div>
          </div>

          <!-- Available -->
          <div class="enrollment-col">
            <p class="col-label">Available ({{ enrollmentData.available.length }})</p>
            <input v-model="studentSearch" class="rs-search" placeholder="Search..." style="margin-bottom: 10px;" />
            <div class="student-list">
              <div v-for="s in filteredAvailable" :key="s.id" class="student-row">
                <div>
                  <p class="student-name">{{ s.fullName }}</p>
                  <p class="student-num">{{ s.studentNumber }}</p>
                </div>
                <button class="btn btn-success btn--sm" @click="enrollStudent(s.id)">Enrol</button>
              </div>
              <p v-if="!filteredAvailable.length" class="empty-text">No available students</p>
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

const loading          = ref(true)
const saving           = ref(false)
const showForm         = ref(false)
const formError        = ref('')
const sections         = ref([])
const modules          = ref([])
const lecturers        = ref([])
const activeSection    = ref(null)
const enrollmentData   = ref({ enrolled: [], available: [] })
const enrollmentLoading = ref(false)
const studentSearch    = ref('')

const form = ref({ moduleId: '', lecturerId: '', sectionCode: '', semester: '', year: new Date().getFullYear() })

const filteredAvailable = computed(() => {
  const q = studentSearch.value.toLowerCase()
  return enrollmentData.value.available.filter(s =>
    s.fullName.toLowerCase().includes(q) || s.studentNumber.toLowerCase().includes(q)
  )
})

const fetchAll = async () => {
  loading.value = true
  try {
    const [sectionsRes, modulesRes, lecturersRes] = await Promise.all([
      api.get('/admin/sections'),
      api.get('/admin/modules'),
      api.get('/admin/lecturers'),
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
  try { await api.delete(`/admin/sections/${id}`); await fetchAll() }
  catch (err) { alert(err.response?.data?.message || 'Failed') }
}

const openEnrollment = async (section) => {
  activeSection.value = section
  enrollmentLoading.value = true
  try {
    const res = await api.get(`/admin/sections/${section.id}/students`)
    enrollmentData.value = res.data
  } finally {
    enrollmentLoading.value = false
  }
}

const enrollStudent = async (studentId) => {
  try {
    await api.post(`/admin/sections/${activeSection.value.id}/enroll`, { studentId })
    await openEnrollment(activeSection.value)
    await fetchAll()
  } catch (err) { alert(err.response?.data?.message || 'Failed') }
}

const removeStudent = async (studentId) => {
  if (!confirm('Remove this student?')) return
  try {
    await api.delete(`/admin/sections/${activeSection.value.id}/students/${studentId}`)
    await openEnrollment(activeSection.value)
    await fetchAll()
  } catch (err) { alert(err.response?.data?.message || 'Failed') }
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

.inline-link {
  background: none;
  border: none;
  color: var(--brand);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--font);
  text-decoration: underline;
  padding: 0;
}

.enrollment-panel { margin-top: 16px; }

.enrollment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.enrollment-title { font-size: 14px; font-weight: 600; }

.enrollment-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) { .enrollment-cols { grid-template-columns: 1fr; } }

.col-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}

.student-name { font-size: 13px; font-weight: 500; }
.student-num  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.empty-text {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 16px 0;
}
</style>