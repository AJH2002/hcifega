<template>
  <div class="attendance">
    <!-- Header Section -->
    <div class="header">
      <div class="header-left">
        <h1>Attendance Management</h1>
        <p>Kelola kehadiran renungan pagi</p>
      </div>
      <div class="time-info">
        <div class="current-time">
          <span class="time">{{ currentTimeDisplay }}</span>
          <span class="date">{{ new Date().toLocaleDateString('id-ID') }}</span>
        </div>
        <div class="status-info">
          <span class="status-badge" :class="timeStatusClass">{{ timeStatusMessage }}</span>
          <span class="day-status" :class="{ 'worship-day': store.isTodayWorshipDay }">
            {{ store.isTodayWorshipDay ? 'Hari Renungan' : 'Hari Biasa' }}
          </span>
        </div>
      </div>
    </div>









    <!-- Content -->
    <div class="content">
      <!-- Attendance History -->
      <div class="section">
        <div class="section-header">
          <h2>Riwayat Kehadiran</h2>
          <button class="refresh-btn" @click="store.fetchReflections" :disabled="loading">
            Refresh
          </button>
        </div>
        
        <!-- Search and Filter Controls -->
        <div class="controls">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Cari nama karyawan..."
              class="search-input"
            >
            <span class="search-icon">🔍</span>
          </div>
          
          <div class="filter-controls">
            <div class="filter-group">
              <label class="filter-label">Urutkan:</label>
              <select v-model="sortOrder" class="sort-select">
                <option value="asc">Nama A-Z</option>
                <option value="desc">Nama Z-A</option>
                <option value="date-desc">Tanggal Terbaru</option>
                <option value="date-asc">Tanggal Terlama</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label class="filter-label">Status:</label>
              <select v-model="statusFilter" class="status-filter">
                <option value="all">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Absen">Absen</option>
              </select>
            </div>
          </div>
        </div>
        
        <div v-if="filteredReflections.length" class="table-wrapper">
          <table class="simple-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Waktu Join</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reflection in filteredReflections" :key="reflection.id">
                <td>
                  <div class="employee-info">
                    <span class="employee-name">{{ reflection.employee?.full_name || 'Unknown' }}</span>
                    <span class="employee-id">ID: {{ reflection.employee?.employee_id || '-' }}</span>
                  </div>
                </td>
                <td>{{ formatDate(reflection.date) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(reflection.status)">{{ reflection.status }}</span>
                </td>
                <td>{{ reflection.join_time ? new Date(reflection.join_time).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Manual Entry' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else-if="store.reflections.length === 0" class="empty-message">
          <p>Belum ada data kehadiran</p>
        </div>
        
        <div v-else class="empty-message">
          <p>Tidak ada data yang sesuai dengan filter</p>
        </div>
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
    
    // Search and filter reactive variables
    const searchQuery = ref('')
    const sortOrder = ref('date-desc')
    const statusFilter = ref('all')
    
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
    
    // Filtered and sorted reflections
    const filteredReflections = computed(() => {
      let filtered = [...store.reflections]
      
      // Apply search filter
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(reflection => {
          const employeeName = reflection.employee?.full_name?.toLowerCase() || ''
          const employeeId = reflection.employee?.employee_id?.toLowerCase() || ''
          return employeeName.includes(query) || employeeId.includes(query)
        })
      }
      
      // Apply status filter
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(reflection => reflection.status === statusFilter.value)
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortOrder.value) {
          case 'asc':
            const nameA = a.employee?.full_name || ''
            const nameB = b.employee?.full_name || ''
            return nameA.localeCompare(nameB)
          case 'desc':
            const nameA2 = a.employee?.full_name || ''
            const nameB2 = b.employee?.full_name || ''
            return nameB2.localeCompare(nameA2)
          case 'date-asc':
            return new Date(a.date) - new Date(b.date)
          case 'date-desc':
          default:
            return new Date(b.date) - new Date(a.date)
        }
      })
      
      return filtered
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
    
    const getStatusClass = (status) => {
      switch (status) {
        case 'Hadir': return 'status-present'
        case 'Absen': return 'status-absent'
        case 'Terlambat': return 'status-late'
        default: return 'status-absent'
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
      searchQuery,
      sortOrder,
      statusFilter,
      filteredReflections,
      formatDate,
      getInitials,
      getStatusBadgeClass,
      getStatusClass,
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
/* Attendance Layout */
.attendance {
  min-height: 100vh;
  padding: 2rem;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-left h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.header-left p {
  font-size: 1rem;
  color: #718096;
  margin: 0;
}

.time-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.current-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
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

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.status-hadir {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.status-terlambat {
  background: #fed7d7;
  color: #742a2a;
}

.status-badge.status-closed {
  background: #e2e8f0;
  color: #4a5568;
}

.day-status {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
}

.day-status.worship-day {
  color: #3182ce;
  font-weight: 600;
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

/* Controls */
.controls {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}

.search-box {
  position: relative;
  max-width: 350px;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3182ce;
  background: white;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  pointer-events: none;
}

.filter-controls {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: nowrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sort-select,
.status-filter {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

.sort-select:focus,
.status-filter:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.sort-select:hover,
.status-filter:hover {
  border-color: #cbd5e0;
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

/* Employee Info */
.employee-info {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 600;
  color: #2d3748;
}

.employee-id {
  font-size: 0.75rem;
  color: #718096;
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
  .attendance {
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
  
  .controls {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-controls {
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .filter-group {
    flex: 1;
    min-width: 120px;
  }
  
  .sort-select,
  .status-filter {
    width: 100%;
    min-width: auto;
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
  
  .employee-info {
    min-width: auto;
  }
  
  .employee-name {
    font-size: 0.875rem;
  }
  
  .employee-id {
    font-size: 0.75rem;
  }
}













</style>