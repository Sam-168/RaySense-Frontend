<template>
  <div class="dashboard">

    <!-- SIDEBAR / TOPBAR (RESPONSIVE) -->
    <aside class="sidebar">
      <div class="brand">
        <div class="dot"></div>
        <span>RaySense</span>
      </div>

      <nav class="nav">
        <button class="nav-item active">Dashboard</button>

        <router-link to="/attendance/mark" class="nav-item">
          Mark Attendance
        </router-link>
      </nav>
    </aside>

    <!-- MAIN -->
    <main class="main">

      <!-- TOP BAR -->
      <div class="topbar">
        <div>
          <h1 class="title">Student Dashboard</h1>
          <p class="subtitle">Attendance overview & history</p>
        </div>

        <div class="student-chip">
          ID: {{ student?.studentNumber || "Loading..." }}
        </div>
      </div>

      <!-- PROFILE CARD -->
      <section class="card profile">
        <h2>{{ student?.fullName }}</h2>
        <p>{{ student?.studentNumber }}</p>
        <p class="muted">Class: {{ student?.classId || "N/A" }}</p>
      </section>

      <!-- STATS -->
      <section class="stats">
        <div class="stat">
          <h3>{{ stats.daysPresent || 0 }}</h3>
          <p>Days Present</p>
        </div>

        <div class="stat highlight">
          <h3>{{ stats.attendancePercentage || 0 }}%</h3>
          <p>Attendance</p>
        </div>

        <div class="stat">
          <h3>{{ stats.totalDays || 0 }}</h3>
          <p>Total Days</p>
        </div>
      </section>

      <!-- HISTORY -->
      <section class="card">
        <h2>Attendance History</h2>

        <div v-if="attendance.length === 0" class="empty">
          No attendance records yet.
        </div>

        <div v-for="a in attendance" :key="a.id" class="attendance-row">
          <div>
            <p class="date">{{ a.date || "Unknown Date" }}</p>
            <p class="time">{{ a.time || "—" }}</p>
          </div>

          <div class="status" :class="a.status">
            {{ a.status || "PRESENT" }}
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const student = ref(null)
const attendance = ref([])
const stats = ref({})

// 👉 replace with logged-in student number later
const studentNumber = "20240001"

onMounted(async () => {
  try {
    const studentRes = await axios.get(
      `http://localhost:8080/api/students/number/${studentNumber}`
    )
    student.value = studentRes.data

    const studentId = student.value.id

    const attRes = await axios.get(
      `http://localhost:8080/api/attendance/student/${studentId}`
    )
    attendance.value = attRes.data

    const today = new Date()
    const start = new Date()
    start.setDate(today.getDate() - 30)

    const statsRes = await axios.get(
      `http://localhost:8080/api/attendance/student/${studentId}/stats`,
      {
        params: {
          startDate: start.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
          totalDays: 30
        }
      }
    )

    stats.value = statsRes.data

  } catch (err) {
    console.error(err)
  }
})
</script>

<style scoped>
/* ========== LAYOUT ========== */
.dashboard {
  display: flex;
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b0f14, #05070a);
  color: white;
}

/* ========== SIDEBAR ========== */
.sidebar {
  width: 220px;
  padding: 20px;
  border-right: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  margin-bottom: 30px;
}

.dot {
  width: 10px;
  height: 10px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 10px #00F0FF;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  padding: 10px;
  border-radius: 8px;
  color: #9ca3af;
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
}

.nav-item.active,
.nav-item:hover {
  color: #00F0FF;
  border-color: rgba(0,240,255,0.2);
  background: rgba(0,240,255,0.05);
}

/* ========== MAIN ========== */
.main {
  flex: 1;
  padding: 24px;
  min-width: 0;
}

/* ========== TOPBAR ========== */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.title {
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  font-size: 13px;
  color: #9ca3af;
}

.student-chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0,240,255,0.08);
  border: 1px solid rgba(0,240,255,0.2);
  color: #00F0FF;
  font-size: 12px;
}

/* ========== CARD ========== */
.card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(0,240,255,0.08);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.profile h2 {
  margin: 0;
}

.muted {
  color: #9ca3af;
  font-size: 13px;
}

/* ========== STATS ========== */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.stat {
  padding: 14px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  text-align: center;
}

.stat h3 {
  margin: 0;
  font-size: 20px;
}

.stat p {
  font-size: 12px;
  color: #9ca3af;
}

.stat.highlight {
  border-color: rgba(0,240,255,0.25);
  box-shadow: 0 0 15px rgba(0,240,255,0.05);
}

/* ========== HISTORY ========== */
.attendance-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.date {
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #9ca3af;
}

.status {
  font-size: 12px;
  color: #00F0FF;
}

/* ========== RESPONSIVE FIXES ========== */
@media (max-width: 900px) {
  .stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .nav {
    flex-direction: row;
  }

  .brand {
    margin-bottom: 0;
  }
}

@media (max-width: 480px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .attendance-row {
    flex-direction: column;
    gap: 5px;
  }
}
</style>