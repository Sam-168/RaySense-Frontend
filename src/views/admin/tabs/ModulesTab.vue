<template>
  <div>
    <div class="tab-header">
      <h2 class="tab-title">Modules</h2>
      <button class="add-btn" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ Add Module' }}
      </button>
    </div>

    <!-- CREATE FORM -->
    <div v-if="showForm" class="form-card">
      <h3 class="form-title">New Module</h3>
      <div class="form-grid">
        <div class="field">
          <label>Module Code</label>
          <input v-model="form.moduleCode" class="input" placeholder="e.g. MAT101" />
        </div>
        <div class="field">
          <label>Module Name</label>
          <input v-model="form.moduleName" class="input" placeholder="e.g. Mathematics 101" />
        </div>
        <div class="field">
          <label>Department</label>
          <input v-model="form.department" class="input" placeholder="e.g. Mathematics" />
        </div>
      </div>
      <div v-if="formError" class="banner-error">{{ formError }}</div>
      <button class="submit-btn" :disabled="saving" @click="createModule">
        {{ saving ? 'Creating...' : 'Create Module' }}
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- TABLE -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Department</th>
            <th>Sections</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="module in modules" :key="module.id">
            <td><span class="code-badge">{{ module.moduleCode }}</span></td>
            <td>{{ module.moduleName }}</td>
            <td>{{ module.department || '-' }}</td>
            <td>{{ module.sectionCount }}</td>
            <td>
              <span class="status-badge" :class="module.isActive ? 'active' : 'inactive'">
                {{ module.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="danger-btn" @click="deleteModule(module.id)">
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

const loading  = ref(true)
const saving   = ref(false)
const showForm = ref(false)
const formError = ref('')
const modules  = ref([])

const form = ref({ moduleCode: '', moduleName: '', department: '' })

const fetchModules = async () => {
  try {
    const response = await api.get('/admin/modules')
    modules.value = response.data
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.code-badge {
  font-size: 12px;
  font-weight: 700;
  color: #00F0FF;
  background: rgba(0,240,255,0.08);
  border: 1px solid rgba(0,240,255,0.2);
  padding: 2px 8px;
  border-radius: 999px;
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

.danger-btn {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: #f87171;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover { background: rgba(239,68,68,0.15); }
</style>