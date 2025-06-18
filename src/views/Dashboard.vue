<template>
  <div class="dashboard">
    <!-- Simple Header -->
    <header class="header">
      <h1 class="title">Dashboard Morning Reflection</h1>
      <div class="time-info">
        <span class="time">{{ currentTime }}</span>
        <span class="date">{{ currentDate }}</span>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">{{ store.employees.length }}</div>
        <div class="stat-label">Total Karyawan</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ todayReflections.length }}</div>
        <div class="stat-label">Hadir Hari Ini</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ pendingLeaves.length }}</div>
        <div class="stat-label">Cuti Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ store.isTodayWorshipDay ? 'Ibadah' : 'Kerja' }}</div>
        <div class="stat-label">Status Hari</div>
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
/* Simple Dashboard Styles */
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.time-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.time {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.date {
  font-size: 0.875rem;
  color: #718096;
}

/* Stats Grid */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

/* Content Sections */
.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.refresh-btn {
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background: #2c5282;
}

.refresh-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

/* Table Styles */
.table-wrapper {
  overflow-x: auto;
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
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
}

.simple-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.simple-table tr:hover {
  background: #f7fafc;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
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
  padding: 2rem;
  color: #718096;
}

.empty-message p {
  margin: 0;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .time-info {
    align-items: flex-start;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .simple-table {
    font-size: 0.75rem;
  }
  
  .simple-table th,
  .simple-table td {
    padding: 0.5rem;
  }
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

/* Time Status Section */
.time-status-section {
  margin-bottom: 2rem;
}

.time-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(40px);
  border-radius: 24px;
  padding: 2rem 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  box-shadow: var(--shadow-deep);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.time-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 1s ease;
}

.time-card:hover::before {
  left: 100%;
}

.time-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-floating);
  background: rgba(255, 255, 255, 0.15);
}

.current-time {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  background: var(--gradient-holographic);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.time-icon {
  font-size: 1.25rem;
}

.date-display {
  font-size: 1rem;
  color: #718096;
  font-weight: 500;
}

.worship-status {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.status-active,
.status-inactive {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 150px;
}

.status-active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2));
  backdrop-filter: blur(20px);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  position: relative;
  overflow: hidden;
}

.status-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.6), transparent);
  animation: shimmer 2s infinite;
}

.status-inactive {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  color: #374151;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-soft);
}

.status-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.time-status {
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-on-time {
  background: #d4edda;
  color: #155724;
}

.status-late {
  background: #fff3cd;
  color: #856404;
}

.status-closed {
  background: #f8d7da;
  color: #721c24;
}

/* Glass Effect */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-floating);
  position: relative;
  overflow: hidden;
}

.glass-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--gradient-aurora);
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
}

.glass-effect:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-deep);
}

/* Dashboard Content */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  width: 100%;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-floating);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-rainbow);
  background-size: 400% 400%;
  animation: gradientShift 6s ease infinite;
  z-index: 1;
}

.card:hover {
  transform: translateY(-8px) rotateX(2deg);
  box-shadow: var(--shadow-deep);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Morning Reflection Card Specific Styles */
.reflection-card {
  position: relative;
  overflow: hidden;
}

.reflection-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 100%;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.reflection-header {
  padding: 2rem 2.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.reflection-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transition: left 1.5s ease;
}

.card:hover .reflection-header::before {
  left: 100%;
}

.header-left {
  flex: 1;
  min-width: 300px;
}

.reflection-title {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: 0;
}

.section-icon {
  font-size: 2.5rem;
  background: var(--gradient-holographic);
  background-size: 400% 400%;
  animation: gradientShift 5s ease infinite, gentle-bounce 4s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
  transition: all 0.3s ease;
}

.card:hover .section-icon {
  transform: scale(1.1) rotate(10deg);
  filter: drop-shadow(0 6px 12px rgba(102, 126, 234, 0.5));
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.05); }
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.main-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  background: var(--gradient-cosmic);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.sub-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #718096;
  line-height: 1.4;
  opacity: 0.8;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #374151;
  overflow: hidden;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s ease;
}

.badge:hover::before {
  left: 100%;
}

.badge:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-neon);
}

.badge-success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
  color: #10b981;
  border: 1px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.badge-success:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
}

.badge-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.2));
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.badge-warning:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.3));
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.badge-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2));
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.badge-danger:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(248, 113, 113, 0.3));
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.badge-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.badge-info:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3));
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-glow);
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}
  
  

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.625rem 1.25rem;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.35);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.btn-refresh:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.25);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-text {
  font-weight: 600;
  letter-spacing: 0.025em;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  border-radius: 0 0 24px 24px;
  position: relative;
}

.table-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--gradient-holographic);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
  z-index: 1;
}

.table-luxury {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.02);
  position: relative;
}

.table-luxury th {
  background: var(--gradient-cosmic);
  background-size: 400% 400%;
  animation: gradientShift 12s ease infinite;
  color: white;
  font-weight: 600;
  padding: 1.25rem 1rem;
  text-align: left;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.table-luxury th::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.8s ease;
}

.table-luxury th:hover::before {
  left: 100%;
}

.table-luxury th:first-child {
  padding-left: 2rem;
}

.table-luxury th:last-child {
  padding-right: 2rem;
}

.table-luxury td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #374151;
  font-size: 0.9rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: rgba(255, 255, 255, 0.05);
}

.table-luxury td:first-child {
  padding-left: 2rem;
}

.table-luxury td:last-child {
  padding-right: 2rem;
}

.table-row {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.table-row:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateX(4px);
  box-shadow: 4px 0 0 #667eea;
}

.table-row:hover td {
  color: #1f2937;
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.01);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.table-row:hover td::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  pointer-events: none;
}

/* Employee Cell */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.employee-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.employee-avatar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
  border-radius: 50%;
}

.table-row:hover .employee-avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.employee-name {
  font-weight: 600;
  color: #374151;
  transition: color 0.2s ease;
}

.table-row:hover .employee-name {
  color: #1f2937;
}

/* Status Badges */
.status-badge {
  padding: 0.5rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.status-present {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border-color: #10b981;
}

.status-late {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-color: #f59e0b;
}

.status-absent {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #991b1b;
  border-color: #ef4444;
}

.status-approved {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-color: #3b82f6;
}

.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-color: #f59e0b;
}

.status-rejected {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #991b1b;
  border-color: #ef4444;
}

.table-row:hover .status-badge {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Entry Type */
.entry-type {
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.auto-entry {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-color: #3b82f6;
}

.manual-entry {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #7c3aed;
  border-color: #8b5cf6;
}

.table-row:hover .entry-type {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Leave Type */
.leave-type {
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.table-row:hover .leave-type {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
}

/* Cell Specific Styles */
.date-cell {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
}

.time-cell {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.duration-cell {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  margin: 2rem;
  border: 2px dashed #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  backdrop-filter: blur(20px);
}

.empty-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gradient-aurora);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  opacity: 0.1;
  border-radius: 16px;
  z-index: -1;
}

.empty-state:hover {
  border-color: #cbd5e1;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
  background: var(--gradient-holographic);
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.empty-state h3 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-state p {
  margin: 0;
  color: #8b5cf6;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 500;
  opacity: 0.9;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Apply animations to elements */
.dashboard {
  animation: fadeIn 0.6s ease-out;
}

.stat-card {
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

.reflection-card {
  animation: scaleIn 0.6s ease-out 0.3s;
  animation-fill-mode: both;
}

.table-row {
  animation: fadeIn 0.4s ease-out;
  animation-fill-mode: both;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-title {
    font-size: 1.75rem;
  }
  
  .dashboard-subtitle {
    font-size: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-stats {
    justify-content: center;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    flex: 1;
    min-width: 120px;
  }
  
  .time-card {
    flex-direction: column;
    text-align: center;
  }
  
  .card-header {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
  
  .reflection-header {
    padding: 1.25rem;
  }
  
  .table-container {
    overflow-x: auto;
    border-radius: 12px;
  }
  
  .table-luxury {
    min-width: 700px;
  }
  
  .table-luxury th,
  .table-luxury td {
    padding: 0.75rem 0.5rem;
  }
  
  .employee-cell {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .btn-refresh {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0.75rem;
  }
  
  .dashboard-title {
    font-size: 1.5rem;
  }
  
  .dashboard-subtitle {
    font-size: 0.9rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.75rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .reflection-header {
    padding: 1rem;
  }
  
  .main-title {
    font-size: 1.25rem;
  }
  
  .sub-title {
    font-size: 0.85rem;
  }
  
  .btn-refresh {
    padding: 0.625rem 1.25rem;
    font-size: 0.85rem;
  }
  
  .table-luxury {
    min-width: 600px;
  }
  
  .table-luxury th,
  .table-luxury td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .table-container {
    font-size: 0.875rem;
  }
  
  .empty-state {
    padding: 2.5rem 1rem;
    margin: 1rem;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
  
  .empty-state h3 {
    font-size: 1.1rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
  }
}

/* Ocean Wave Animation */
@keyframes oceanWave {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>