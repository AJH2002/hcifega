<template>
  <div class="attendance-container">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🌅</span>
          Morning Reflection <span class="text-luxury">Attendance</span>
        </h1>
        <p class="page-subtitle">Kelola kehadiran renungan pagi dengan mudah dan elegan</p>
        
        <!-- Status Waktu dan Hari -->
        <div class="time-status">
          <div class="status-card" :class="timeStatusClass">
            <div class="status-icon">{{ timeStatusIcon }}</div>
            <div class="status-info">
              <h4>{{ currentTimeDisplay }}</h4>
              <p>{{ timeStatusMessage }}</p>
            </div>
          </div>
          
          <div class="worship-day-status" :class="{ 'active': store.isTodayWorshipDay }">
            <div class="day-icon">{{ store.isTodayWorshipDay ? '✅' : '❌' }}</div>
            <div class="day-info">
              <h4>{{ store.isTodayWorshipDay ? 'Hari Renungan' : 'Bukan Hari Renungan' }}</h4>
              <p>{{ store.isTodayWorshipDay ? 'Senin, Rabu, Jumat' : 'Renungan hanya Senin, Rabu, Jumat' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>









    <!-- Attendance History -->
    <div class="section animate-slide-in">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">📊</span>
          Riwayat Kehadiran Renungan Pagi
        </h2>
        <div class="section-actions">
          <button class="btn btn-primary btn-sm" @click="store.fetchReflections">
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>
      
      <div v-if="store.reflections.length" class="card glass-effect">
        <div class="table-container">
          <table class="table-luxury">
            <thead>
              <tr>
                <th><span class="th-content">👤 Employee</span></th>
                <th><span class="th-content">📅 Date</span></th>
                <th><span class="th-content">📊 Status</span></th>
                <th><span class="th-content">⏰ Join Time</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reflection in store.reflections" :key="reflection.id" class="table-row">
                <td>
                  <div class="employee-cell">
                    <div class="employee-avatar">{{ getInitials(reflection.employee?.full_name) }}</div>
                    <span class="employee-name">{{ reflection.employee?.full_name || 'Unknown' }}</span>
                  </div>
                </td>
                <td class="date-cell">{{ formatDate(reflection.date) }}</td>
                <td>
                  <span :class="getStatusBadgeClass(reflection.status)">{{ reflection.status }}</span>
                </td>
                <td class="time-cell">{{ reflection.join_time ? new Date(reflection.join_time).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Manual Entry' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>Belum ada data kehadiran</h3>
        <p>Mulai catat kehadiran untuk melihat riwayat di sini</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useGaStore } from '../stores/gaStore'
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    const store = useGaStore()
    const currentTime = ref(new Date())
    const timeInterval = ref(null)
    
    // Update waktu setiap detik
    const updateTime = () => {
      currentTime.value = new Date()
      store.updateCurrentTime()
    }
    
    // Computed properties
    const currentTimeDisplay = computed(() => {
      return currentTime.value.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
      })
    })
    
    const timeStatusClass = computed(() => {
      const status = store.zoomTimeStatus.status
      return {
        'status-hadir': status === 'Hadir',
        'status-terlambat': status === 'Terlambat',
        'status-closed': status === 'Closed'
      }
    })
    
    const timeStatusIcon = computed(() => {
      const status = store.zoomTimeStatus.status
      switch (status) {
        case 'Hadir': return '✅'
        case 'Terlambat': return '⏰'
        case 'Closed': return '🔒'
        default: return '❓'
      }
    })
    
    const timeStatusMessage = computed(() => {
      return store.zoomTimeStatus.message
    })
    

    
    // Methods
    

    
    const formatDate = (date) => {
      return date ? new Date(date).toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : '-'
    }
    
    const getInitials = (name) => {
      if (!name) return '?'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    
    const getStatusBadgeClass = (status) => {
      const baseClass = 'badge '
      switch (status) {
        case 'Hadir': return baseClass + 'badge-success'
        case 'Absen': return baseClass + 'badge-danger'
        case 'Terlambat': return baseClass + 'badge-warning'
        default: return baseClass + 'badge-info'
      }
    }
    

    
    const showNotification = (message, type) => {
      // Simple notification - you can replace with a proper notification library
      alert(message)
    }
    
    // Lifecycle hooks
    onMounted(() => {
      store.fetchEmployees()
      store.fetchReflections()
      
      // Start time interval
      timeInterval.value = setInterval(updateTime, 1000)
    })
    
    onUnmounted(() => {
      if (timeInterval.value) {
        clearInterval(timeInterval.value)
      }
    })
    
    return {
      store,
      currentTime,
      currentTimeDisplay,
      timeStatusClass,
      timeStatusIcon,
      timeStatusMessage,
      formatDate,
      getInitials,
      getStatusBadgeClass,
      showNotification,
      loading: computed(() => store.loading),
      errors: computed(() => store.errors),
      employees: computed(() => store.employees),
      reflections: computed(() => store.reflections)
    }
  }
}
</script>

<style scoped>
/* Attendance Container */
.attendance-container {
  min-height: 100vh;
  padding: var(--spacing-xl) 0;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-2xl) var(--spacing-xl);
  border-radius: var(--radius-2xl);
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.page-header::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 2.8rem;
  font-weight: 800;
  color: white;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  letter-spacing: -0.02em;
}

.title-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.text-luxury {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.page-subtitle {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.9);
  line-height: 1.6;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  margin-bottom: 0;
}

/* Time Status Section */
.time-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  color: white;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.status-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
}

.status-card.status-hadir {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 10px 30px rgba(17, 153, 142, 0.3);
}

.status-card.status-hadir:hover {
  box-shadow: 0 15px 40px rgba(17, 153, 142, 0.4);
}

.status-card.status-terlambat {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 10px 30px rgba(240, 147, 251, 0.3);
}

.status-card.status-terlambat:hover {
  box-shadow: 0 15px 40px rgba(240, 147, 251, 0.4);
}

.status-card.status-closed {
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  box-shadow: 0 10px 30px rgba(75, 108, 183, 0.3);
}

.status-card.status-closed:hover {
  box-shadow: 0 15px 40px rgba(75, 108, 183, 0.4);
}

.status-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.status-info h4 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-xs) 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.status-info p {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 500;
}

.worship-day-status {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  box-shadow: 0 10px 30px rgba(252, 182, 159, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.worship-day-status::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%);
  pointer-events: none;
}

.worship-day-status:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(252, 182, 159, 0.4);
}

.worship-day-status.active {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  box-shadow: 0 10px 30px rgba(168, 237, 234, 0.3);
}

.worship-day-status.active:hover {
  box-shadow: 0 15px 40px rgba(168, 237, 234, 0.4);
}

.day-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.day-info h4 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-xs) 0;
  color: #2d3748;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.day-info p {
  font-size: 0.875rem;
  margin: 0;
  color: #4a5568;
  font-weight: 500;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.action-card {
  background: var(--luxury-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: var(--shadow-elegant);
}

.action-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-luxury);
  border-color: var(--luxury-gold);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.action-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--luxury-navy);
  margin-bottom: var(--spacing-sm);
}

.action-card p {
  color: var(--luxury-gray-medium);
  font-size: 0.875rem;
}

/* Form Styles */
.attendance-form {
  padding: var(--spacing-lg) 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--luxury-navy);
  margin-bottom: var(--spacing-sm);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-icon {
  font-size: 1rem;
}

.form-input {
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--luxury-gray-soft);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--luxury-white);
}

.form-input:focus {
  outline: none;
  border-color: var(--luxury-gold);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.form-actions {
  text-align: center;
}

.btn-lg {
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: 1.125rem;
}

/* Zoom Card */
.zoom-card {
  background: var(--gradient-elegant);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--luxury-white);
  margin-bottom: var(--spacing-2xl);
}

.zoom-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.zoom-icon {
  font-size: 3rem;
}

.zoom-text h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--luxury-white);
}

.zoom-text p {
  opacity: 0.9;
}

.zoom-btn {
  flex-shrink: 0;
}

/* Error Messages */
.error-messages {
  margin-top: var(--spacing-lg);
}

.error-card {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fca5a5;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-md);
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-content h4 {
  color: #dc2626;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.error-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-content li {
  color: #b91c1c;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
}

/* Section Styles */
.section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: var(--spacing-2xl);
  position: relative;
  overflow: hidden;
}

.section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid #f7fafc;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
}

.section-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-actions .btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.section-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.card {
  background: white;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.glass-effect {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.table-container {
  overflow-x: auto;
}

.table-luxury {
  width: 100%;
  border-collapse: collapse;
}

.table-luxury thead {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

.table-luxury th {
  padding: var(--spacing-lg);
  text-align: left;
  font-weight: 700;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
}

.th-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.table-luxury td {
  padding: var(--spacing-lg);
  border-bottom: 1px solid #f1f5f9;
  color: #4a5568;
}

.table-row:hover {
  background: linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%);
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.employee-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.employee-name {
  font-weight: 600;
  color: #2d3748;
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.badge-danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.badge-warning {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
}

.badge-info {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: #718096;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  font-size: 1rem;
  color: #718096;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-title {
    font-size: 2.2rem;
    flex-direction: column;
  }
  
  .page-header {
    padding: var(--spacing-xl) var(--spacing-lg);
  }
  
  .time-status {
    grid-template-columns: 1fr;
  }
  
  .status-card, .worship-day-status {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
  
  .section {
    padding: var(--spacing-xl) var(--spacing-lg);
  }
  
  .section-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .table-luxury th,
  .table-luxury td {
    padding: var(--spacing-md);
  }
  
  .employee-cell {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
}
</style>