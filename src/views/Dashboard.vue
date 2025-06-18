<template>
  <div class="dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="dashboard-title">
            <span class="title-icon">📊</span>
            Dashboard Morning Reflection
          </h1>
          <p class="dashboard-subtitle">Monitor kehadiran dan aktivitas karyawan</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-number">{{ store.employees.length }}</div>
              <div class="stat-label">Total Karyawan</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-number">{{ todayReflections.length }}</div>
              <div class="stat-label">Hadir Hari Ini</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏰</div>
            <div class="stat-content">
              <div class="stat-number">{{ pendingLeaves.length }}</div>
              <div class="stat-label">Cuti Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Time and Status -->
    <div class="time-status-section">
      <div class="time-card">
        <div class="current-time">
          <div class="time-display">
            <span class="time-icon">🕐</span>
            <span class="time-text">{{ currentTime }}</span>
          </div>
          <div class="date-display">{{ currentDate }}</div>
        </div>
        <div class="worship-status">
          <div v-if="store.isTodayWorshipDay" class="status-active">
            <span class="status-icon">🙏</span>
            <span class="status-text">Hari Ibadah</span>
          </div>
          <div v-else class="status-inactive">
            <span class="status-icon">📅</span>
            <span class="status-text">Hari Kerja</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Morning Reflections Section -->
      <div class="section animate-fade-in">
        <div class="card reflection-card">
          <div class="card-header reflection-header">
            <div class="header-left">
              <h2 class="card-title reflection-title">
                <span class="section-icon">🌅</span>
                <div class="title-content">
                  <span class="main-title">Morning Reflections</span>
                  <span class="sub-title">Kehadiran Renungan Pagi Hari Ini</span>
                </div>
              </h2>
            </div>
            <div class="card-actions">
              <button @click="store.fetchReflections" class="btn btn-refresh" :disabled="store.loading">
                <span class="btn-icon" :class="{ 'spinning': store.loading }">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V9H4.58152M4.58152 9C5.24618 7.35652 6.43101 5.9604 7.96114 5.02493C9.49127 4.08946 11.2865 3.67505 13.0826 3.83379C14.8787 3.99254 16.5823 4.72379 17.9291 5.91948C19.2758 7.11517 20.1948 8.71375 20.5407 10.4743M20.5407 10.4743L19 9M20.5407 10.4743L22 9M20 20V15H19.4185M19.4185 15C18.7538 16.6435 17.569 18.0396 16.0389 18.9751C14.5087 19.9105 12.7135 20.3249 10.9174 20.1662C9.12132 20.0075 7.41766 19.2762 6.07092 18.0805C4.72418 16.8848 3.80521 15.2863 3.45926 13.5257M3.45926 13.5257L5 15M3.45926 13.5257L2 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="btn-text">{{ store.loading ? 'Loading...' : 'Refresh' }}</span>
              </button>
            </div>
          </div>
          
          <div v-if="store.reflections.length" class="table-container">
            <table class="table-luxury">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Waktu Join</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="reflection in store.reflections" :key="reflection.id" class="table-row">
                  <td>
                    <div class="employee-cell">
                      <div class="employee-avatar">
                        {{ getInitials(reflection.employee?.full_name) }}
                      </div>
                      <span class="employee-name">{{ reflection.employee?.full_name || 'Unknown' }}</span>
                    </div>
                  </td>
                  <td class="date-cell">{{ formatDate(reflection.date) }}</td>
                  <td>
                    <span :class="getStatusBadgeClass(reflection.status)">{{ reflection.status }}</span>
                  </td>
                  <td class="time-cell">
                    {{ reflection.join_time ? formatTime(reflection.join_time) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">🙏</div>
            <h3>Belum ada data kehadiran</h3>
            <p>Data kehadiran renungan pagi akan muncul di sini</p>
          </div>
        </div>
      </div>

      <!-- Leave Requests Section -->
      <div class="section animate-fade-in">
        <div class="card glass-effect">
          <div class="card-header">
            <h2 class="card-title">
              <span class="section-icon">📅</span>
              Data Cuti
            </h2>
            <div class="card-actions">
              <button @click="store.fetchLeaves" class="btn btn-primary btn-sm" :disabled="store.loading">
                <span v-if="store.loading">⏳</span>
                <span v-else>🔄</span>
                {{ store.loading ? 'Loading...' : 'Refresh' }}
              </button>
            </div>
          </div>
          
          <div v-if="store.leaves.length" class="table-container">
            <table class="table-luxury">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Selesai</th>
                  <th>Tipe Cuti</th>
                  <th>Status</th>
                  <th>Durasi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="leave in store.leaves" :key="leave.id" class="table-row">
                  <td>
                    <div class="employee-cell">
                      <div class="employee-avatar">
                        {{ getInitials(leave.employee?.full_name) }}
                      </div>
                      <span class="employee-name">{{ leave.employee?.full_name || 'Unknown' }}</span>
                    </div>
                  </td>
                  <td class="date-cell">{{ formatDate(leave.start_date) }}</td>
                  <td class="date-cell">{{ formatDate(leave.end_date) }}</td>
                  <td>
                    <span class="leave-type">{{ leave.type }}</span>
                  </td>
                  <td>
                    <span :class="getLeaveStatusBadgeClass(leave.status)">{{ leave.status }}</span>
                  </td>
                  <td class="duration-cell">
                    {{ calculateLeaveDuration(leave.start_date, leave.end_date) }} hari
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>Belum ada data cuti</h3>
            <p>Data cuti karyawan akan muncul di sini</p>
          </div>
        </div>
      </div>
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
/* Dashboard Layout */
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header Section */
.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-text {
  flex: 1;
  min-width: 300px;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 2.5rem;
}

.dashboard-subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.header-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 180px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stat-content {
  color: #2d3748;
}

.stat-number {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.25rem;
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
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
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
  color: #2d3748;
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
  background: #e6fffa;
  color: #234e52;
  border: 1px solid #81e6d9;
}

.status-inactive {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
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
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
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
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
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
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  position: relative;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  animation: gentle-bounce 3s ease-in-out infinite;
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
  color: #2d3748;
  line-height: 1.2;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
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
  max-height: 600px;
  overflow-y: auto;
  border-radius: 0 0 16px 16px;
}

.table-luxury {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.table-luxury th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #374151;
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
}

.table-luxury th:first-child {
  padding-left: 2rem;
}

.table-luxury th:last-child {
  padding-right: 2rem;
}

.table-luxury td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.9rem;
  transition: all 0.2s ease;
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
}

.empty-state:hover {
  border-color: #cbd5e1;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gentle-pulse 2s ease-in-out infinite;
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
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
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
</style>