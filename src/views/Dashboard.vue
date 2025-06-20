<template>
  <div class="dashboard">
    <!-- Simple Header -->
    <header class="header">
      <h1 class="title">Dashboard Morning Reflection</h1>
      <div class="time-info">
        <div class="current-time">
          <span class="time">{{ currentTime }}</span>
          <span class="date">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-number">{{ store.employees.length }}</div>
          <div class="stat-label">Total Karyawan</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-number">{{ todayReflections.length }}</div>
          <div class="stat-label">Hadir Hari Ini</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-number">{{ pendingLeaves.length }}</div>
          <div class="stat-label">Cuti Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🗓️</div>
        <div class="stat-info">
          <div class="stat-number">{{ store.isTodayWorshipDay ? 'Ibadah' : 'Kerja' }}</div>
          <div class="stat-label">Status Hari</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-info">
          <div class="stat-number">{{ lateArrivalsCount }}</div>
          <div class="stat-label">Terlambat Hari Ini</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-number">{{ monthlyAttendancePercentage }}%</div>
          <div class="stat-label">Kehadiran Bulan Ini</div>
        </div>
      </div>
    </div>

    <!-- Content Sections -->
    <div class="content">
      <!-- Morning Reflections -->
      <section class="section">
        <div class="section-header">
          <h2>Morning Reflections</h2>
          <button @click="store.fetchReflections" class="refresh-btn" :disabled="store.loading">
            {{ store.loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        
        <div v-if="store.reflections.length" class="table-wrapper">
          <table class="simple-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reflection in store.reflections" :key="reflection.id">
                <td>{{ reflection.employee?.full_name || 'Unknown' }}</td>
                <td>{{ formatDate(reflection.date) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusBadgeClass(reflection.status)">
                    {{ reflection.status }}
                  </span>
                </td>
                <td>{{ reflection.join_time ? formatTime(reflection.join_time) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="empty-message">
          <p>Belum ada data kehadiran hari ini</p>
        </div>
      </section>

      <!-- Leave Requests -->
      <section class="section">
        <div class="section-header">
          <h2>Data Cuti</h2>
          <button @click="store.fetchLeaves" class="refresh-btn" :disabled="store.loading">
            {{ store.loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        
        <div v-if="store.leaves.length" class="table-wrapper">
          <table class="simple-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Tipe</th>
                <th>Status</th>
                <th>Durasi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="leave in store.leaves" :key="leave.id">
                <td>{{ leave.employee?.full_name || 'Unknown' }}</td>
                <td>{{ formatDate(leave.start_date) }}</td>
                <td>{{ formatDate(leave.end_date) }}</td>
                <td>{{ leave.type }}</td>
                <td>
                  <span class="status-badge" :class="getLeaveStatusBadgeClass(leave.status)">
                    {{ leave.status }}
                  </span>
                </td>
                <td>{{ calculateLeaveDuration(leave.start_date, leave.end_date) }} hari</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="empty-message">
          <p>Belum ada data cuti</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGaStore } from '@/stores/gaStore'

export default {
  name: 'Dashboard',
  setup() {
    const store = useGaStore()
    const currentTime = ref('')
    const currentDate = ref('')
    let timeInterval = null

    // Update current time
    const updateTime = () => {
      const now = new Date()
      const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
      
      currentTime.value = jakartaTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
      })
      
      currentDate.value = jakartaTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Jakarta'
      })
      
      store.updateCurrentTime()
    }

    // Computed properties
    const todayReflections = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      return store.reflections.filter(reflection => 
        reflection.date === today
      )
    })

    const pendingLeaves = computed(() => {
      return store.leaves.filter(leave => 
        leave.status === 'pending' || leave.status === 'Pending'
      )
    })

    const lateArrivalsCount = computed(() => {
      const today = new Date().toISOString().slice(0, 10);
      return store.reflections.filter(r => {
        if (r.date !== today || !r.join_time) return false;
        const checkinTime = new Date(r.join_time);
        const lateTime = new Date(`${r.date}T08:05:00`);
        return checkinTime > lateTime;
      }).length;
    });

    const monthlyAttendancePercentage = computed(() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const workDays = getWorkDaysInMonth(year, month);
      const presentDays = new Set(store.reflections
        .filter(r => {
          const reflectionDate = new Date(r.date);
          return reflectionDate.getFullYear() === year && reflectionDate.getMonth() === month;
        })
        .map(r => r.date)
      ).size;

      return workDays > 0 ? Math.round((presentDays / workDays) * 100) : 0;
    });

    function getWorkDaysInMonth(year, month) {
      let workDays = 0;
      const date = new Date(year, month, 1);
      while (date.getMonth() === month) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          workDays++;
        }
        date.setDate(date.getDate() + 1);
      }
      return workDays;
    }

    const timeStatusClass = computed(() => {
      const status = store.zoomTimeStatus
      return {
        'status-on-time': status === 'On Time',
        'status-late': status === 'Late',
        'status-closed': status === 'Closed'
      }
    })

    const timeStatusText = computed(() => {
      const status = store.zoomTimeStatus
      switch (status) {
        case 'On Time':
          return '✅ Tepat Waktu'
        case 'Late':
          return '⚠️ Terlambat'
        case 'Closed':
          return '❌ Tutup'
        default:
          return status
      }
    })

    // Methods
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      })
    }

    const getInitials = (name) => {
      if (!name) return '?'
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }

    const getStatusBadgeClass = (status) => {
      const baseClass = 'status-badge'
      switch (status) {
        case 'Hadir':
        case 'On Time':
          return `${baseClass} status-present`
        case 'Terlambat':
        case 'Late':
          return `${baseClass} status-late`
        case 'Tidak Hadir':
        case 'Absent':
          return `${baseClass} status-absent`
        default:
          return baseClass
      }
    }

    const getLeaveStatusBadgeClass = (status) => {
      const baseClass = 'status-badge'
      switch (status.toLowerCase()) {
        case 'approved':
        case 'disetujui':
          return `${baseClass} status-approved`
        case 'pending':
        case 'menunggu':
          return `${baseClass} status-pending`
        case 'rejected':
        case 'ditolak':
          return `${baseClass} status-rejected`
        default:
          return baseClass
      }
    }

    const calculateLeaveDuration = (startDate, endDate) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }

    // Lifecycle hooks
    onMounted(async () => {
      updateTime()
      timeInterval = setInterval(updateTime, 1000)
      
      // Fetch initial data
      await Promise.all([
        store.fetchEmployees(),
        store.fetchReflections(),
        store.fetchLeaves()
      ])
    })

    onUnmounted(() => {
      if (timeInterval) {
        clearInterval(timeInterval)
      }
    })

    return {
      store,
      currentTime,
      currentDate,
      todayReflections,
      pendingLeaves,
      timeStatusClass,
      timeStatusText,
      formatDate,
      formatTime,
      getInitials,
      getStatusBadgeClass,
      getLeaveStatusBadgeClass,
      calculateLeaveDuration
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  background-color: #f9fafb;
}

/* Header */
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
}

.time-info {
  text-align: right;
}

.current-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.time {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
}

.date {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.2;
}

/* Stats Grid */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  transition: all 0.3s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}

.stat-icon {
  font-size: 2rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Content Sections */
.content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .content {
    grid-template-columns: 1fr 1fr;
  }
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
}

.section-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 8px;
}


/* Table Styles */
.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.simple-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.simple-table th {
  background: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.simple-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  vertical-align: middle;
}

.simple-table tr:hover {
  background: #f7fafc;
}

.simple-table tr:last-child td {
  border-bottom: none;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-present {
  background: #c6f6d5;
  color: #22543d;
}

.status-late {
  background: #fed7d7;
  color: #742a2a;
}

.status-absent {
  background: #e2e8f0;
  color: #4a5568;
}

.status-approved {
  background: #c6f6d5;
  color: #22543d;
}

.status-pending {
  background: #fef5e7;
  color: #744210;
}

.status-rejected {
  background: #fed7d7;
  color: #742a2a;
}

/* Empty Message */
.empty-message {
  text-align: center;
  padding: 2rem 1rem;
  color: #718096;
}

.empty-message p {
  margin: 0;
  font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .stats {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  .section {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 0;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }
  
  .time-info {
    align-items: flex-start;
    width: 100%;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.75rem;
  }
  
  .section {
    padding: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .refresh-btn {
    width: 100%;
  }
  
  .simple-table {
    font-size: 0.75rem;
  }
  
  .simple-table th,
  .simple-table td {
    padding: 0.5rem 0.25rem;
  }
  
  .simple-table th {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .section {
    padding: 0.75rem;
  }
  
  .header {
    padding: 0.75rem;
  }
  
  .title {
    font-size: 1.25rem;
  }
  
  .time {
    font-size: 1rem;
  }
  
  .simple-table th,
  .simple-table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.7rem;
  }
  
  .status-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
  }
}

/* Loading and transition states */
.section {
  transition: opacity 0.3s ease;
}

.section.loading {
  opacity: 0.7;
}

/* Accessibility improvements */
.refresh-btn:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.nav-link:focus,
.simple-table:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
</style>