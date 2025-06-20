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
          <span class="date">{{ currentDateDisplay }}</span>
        </div>
        <div class="status-info">
          <span class="day-status" :class="{ 'worship-day': store.isTodayWorshipDay }">
            {{ store.isTodayWorshipDay ? 'Hari Renungan' : 'Hari Biasa' }}
          </span>
          <div v-if="store.zoomTimeStatus.status === 'Closed'" class="closed-status-block">
            <span class="closed-status-text">{{ timeStatusMessage }}</span>
          </div>
          <span v-else class="status-badge" :class="timeStatusClass">{{ timeStatusMessage }}</span>
        </div>
      </div>
    </div>









    <!-- Content -->
    <div class="content">
      <!-- Attendance History -->
      <div class="section">
        <div class="section-header">
          <h2>Riwayat Kehadiran</h2>
          <div class="section-header-actions">
            <button class="btn btn-primary" @click="store.fetchReflections">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.5 10"></path>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L3.5 14"></path>
              </svg>
              <span>Refresh</span>
            </button>
            <button class="btn btn-success" @click="exportToCSV">
              <span class="icon">📄</span> Export to CSV
            </button>
          </div>
        </div>
        
        <!-- Search and Filter Controls -->
        <div class="controls">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Cari nama atau ID karyawan..."
              class="search-input"
            >
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
    
    const currentDateDisplay = computed(() => {
      return currentTime.value.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
    
    const exportToCSV = () => {
      const headers = ['Karyawan', 'ID Karyawan', 'Tanggal', 'Status', 'Waktu Join'];
      const rows = filteredReflections.value.map(reflection => [
        `"${reflection.employee?.full_name || 'Unknown'}"`,
        `"${reflection.employee?.employee_id || '-'}"`,
        `"${formatDate(reflection.date)}"`,
        `"${reflection.status}"`,
        `"${reflection.join_time ? new Date(reflection.join_time).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Manual Entry'}"`
      ]);

      let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "riwayat_kehadiran.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return {
      store,
      currentTime,
      currentTimeDisplay,
      currentDateDisplay,
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
      exportToCSV,
      loading: computed(() => store.loading),
      errors: computed(() => store.errors),
      employees: computed(() => store.employees),
      reflections: computed(() => store.reflections)
    }
  }
}
</script>

<style scoped>
.attendance {
  padding: 2rem;
  background-color: #f9fafb;
}

/* Header */
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header-left h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
}

.header-left p {
  font-size: 1rem;
  color: #6b7280;
}

/* Time Info Styling */
.time-info {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.current-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.time {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
}

.date {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 400;
  line-height: 1.2;
}

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  margin-top: 0.5rem;
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

.day-status {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.worship-day {
  color: #3b82f6;
  font-weight: 600;
}

/* Closed Status Block */
.closed-status-block {
  background-color: #fee2e2;
  border: 1px solid #dc2626;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  margin-top: 0.25rem;
  box-shadow: 0 1px 2px rgba(220, 38, 38, 0.1);
  display: inline-block;
}

.closed-status-text {
  color: #dc2626;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  display: block;
  text-align: center;
}

/* Controls */
.controls {
  display: flex; /* Changed to flexbox */
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  justify-content: space-between; /* Space out items */
  align-items: center; /* Align items vertically */
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex-grow: 1; /* Allow search box to grow */
  max-width: 400px; /* Set a max-width */
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 4px 12px;
  transition: all 0.3s ease;
}

.search-box:hover, .search-box:focus-within {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-input {
  flex-grow: 1;
  border: none;
  outline: none;
  padding: 8px;
  font-size: 1rem;
  background-color: transparent;
}

.search-icon {
  color: #9e9e9e;
  margin-right: 8px;
  font-size: 1.1rem;
}





.sort-select,
.status-filter {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus,
.sort-select:focus,
.status-filter:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

/* Section Header */
.section-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
}

/* Table Styles */
.table-wrapper {
  overflow-x: auto;
}

.simple-table {
  width: 100%;
  border-collapse: collapse;
}

.simple-table th,
.simple-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.simple-table th {
  background-color: #f3f4f6;
  font-weight: 600;
  color: #374151;
}

.employee-info {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 600;
}

.employee-id {
  font-size: 0.875rem;
  color: #6b7280;
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

.section-header-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}

.btn-success:hover {
  background-color: #27ae60;
}

.icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.btn:hover .icon {
  transform: rotate(90deg);
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