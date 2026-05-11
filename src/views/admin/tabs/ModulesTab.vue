<template>
  <div>
    <div class="tab-header">
      <h2 class="section-title">Modules</h2>
      <button class="btn btn-primary btn--sm" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ Add module' }}
      </button>
    </div>

    <div v-if="showForm" class="rs-card form-card">
      <h3 class="form-title">New module</h3>
      <div class="form-grid">
        <div class="rs-field">
          <label class="rs-label">Module Code</label>
          <input v-model="form.moduleCode" class="rs-input" placeholder="MAT101" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Module Name</label>
          <input v-model="form.moduleName" class="rs-input" placeholder="Mathematics 101" />
        </div>
        <div class="rs-field">
          <label class="rs-label">Department</label>
          <input v-model="form.department" class="rs-input" placeholder="Mathematics" />
        </div>
      </div>
      <div v-if="formError" class="rs-alert rs-alert--error mb-3">{{ formError }}</div>
      <button class="btn btn-accent" :disabled="saving" @click="createModule">
        {{ saving ? 'Creating...' : 'Create module' }}
      </button>
    </div>

    <div v-if="loading" class="rs-loading">
      <div class="rs-spinner"></div>
    </div>

    <div v-else class="rs-table-wrap">
      <table class="rs-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Department</th>
            <th>Sections</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="module in modules" :key="module.id">
            <td><span class="rs-badge rs-badge--accent">{{ module.moduleCode }}</span></td>
            <td>{{ module.moduleName }}</td>
            <td>{{ module.department || '—' }}</td>
            <td>{{ module.sectionCount }}</td>
            <td>
              <span class="rs-badge" :class="module.isActive ? 'rs-badge--success' : 'rs-badge--muted'">
                {{ module.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn btn-danger btn--sm" @click="deleteModule(module.id)">
                Deactivate
              </button>
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
const modules   = ref([])
const form      = ref({ moduleCode: '', moduleName: '', department: '' })

const fetchModules = async () => {
  try {
    const res = await api.get('/admin/modules')
    modules.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchModules)

const createModule = async () => {
  formError.value = ''
  if (!form.value.moduleCode || !form.value.moduleName) {
    formError.value = 'Module code and name are required'
    return
  }
  saving.value = true
  try {
    await api.post('/admin/modules', form.value)
    form.value = { moduleCode: '', moduleName: '', department: '' }
    showForm.value = false
    await fetchModules()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to create module'
  } finally {
    saving.value = false
  }
}

const deleteModule = async (id) => {
  if (!confirm('Deactivate this module?')) return
  try {
    await api.delete(`/admin/modules/${id}`)
    await fetchModules()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to deactivate')
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