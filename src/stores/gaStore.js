import { defineStore } from 'pinia'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8000/api/ga'
axios.defaults.headers.common['Accept'] = 'application/json'

export const useGaStore = defineStore('ga', {
  state: () => ({
    employees: [],
    reflections: [],
    leaves: [],
    form: {
      employee_id: '',
      date: '',
      status: ''
    },
    zoomForm: {
      employee_id: '',
      zoom_link: 'https://zoom.us/j/meeting'
    },
    errors: null,
    loading: false,
    currentTime: new Date(),
    isWorshipDay: false,
    canJoinZoom: false,
    zoomStatus: ''
  }),
  getters: {
    // Cek apakah hari ini adalah hari worship (Senin, Rabu, Jumat)
    isTodayWorshipDay() {
      const today = new Date()
      const dayOfWeek = today.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
      return [1, 3, 5].includes(dayOfWeek) // Monday, Wednesday, Friday
    },
    
    // Cek status waktu untuk zoom
    zoomTimeStatus() {
      const now = new Date()
      const today = new Date()
      const maxHadirTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30) // 07:30
      const maxTerlambatTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 35) // 07:35
      
      if (now <= maxHadirTime) {
        return { status: 'Hadir', canJoin: true, message: 'Waktu absensi: Hadir' }
      } else if (now <= maxTerlambatTime) {
        return { status: 'Terlambat', canJoin: true, message: 'Waktu absensi: Terlambat' }
      } else {
        return { status: 'Closed', canJoin: false, message: 'Waktu absensi sudah ditutup' }
      }
    }
  },
  actions: {
    // Update waktu saat ini
    updateCurrentTime() {
      this.currentTime = new Date()
    },
    
    async fetchEmployees() {
      try {
        const response = await axios.get('/employees')
        this.employees = response.data.data
      } catch (error) {
        console.error('Error fetching employees:', error)
        this.employees = []
      }
    },
    
    async fetchReflections() {
      try {
        const response = await axios.get('/morning-reflections')
        this.reflections = response.data.data
      } catch (error) {
        console.error('Error fetching reflections:', error)
        this.reflections = []
      }
    },
    
    async fetchLeaves() {
      try {
        const response = await axios.get('/leaves')
        this.leaves = response.data.data
      } catch (error) {
        console.error('Error fetching leaves:', error)
        this.leaves = []
      }
    },
    
    // Submit manual attendance
    async submitAttendance() {
      this.errors = null
      this.loading = true
      try {
        const response = await axios.post('/morning-reflections', this.form)
        await this.fetchReflections() // Refresh data
        this.form = { employee_id: '', date: '', status: '' }
        return { success: true, message: 'Absensi berhasil disimpan!' }
      } catch (error) {
        if (error.response?.status === 422) {
          this.errors = error.response.data.errors
          return { success: false, message: 'Validation error' }
        }
        return { success: false, message: 'Error recording attendance.' }
      }
    },
    // Join Zoom dan record attendance otomatis
    async joinZoomMeeting(employeeId) {
      this.errors = null
      this.loading = true
      
      try {
        // Cek apakah hari ini adalah hari worship
        if (!this.isTodayWorshipDay) {
          throw new Error('Renungan pagi hanya diadakan pada hari Senin, Rabu, dan Jumat')
        }
        
        // Cek waktu
        const timeStatus = this.zoomTimeStatus
        if (!timeStatus.canJoin) {
          throw new Error('Waktu absensi sudah ditutup. Absensi hanya diperbolehkan hingga jam 07:35 WIB')
        }
        
        // Record zoom join ke backend
        const response = await axios.post('/zoom-join', {
          employee_id: employeeId,
          zoom_link: this.zoomForm.zoom_link
        })
        
        // Refresh data reflections
        await this.fetchReflections()
        
        // Buka link zoom di tab baru
        if (response.data.zoom_link) {
          window.open(response.data.zoom_link, '_blank')
        }
        
        return {
          success: true,
          message: response.data.message,
          data: response.data.data,
          zoom_link: response.data.zoom_link
        }
        
      } catch (error) {
        let errorMessage = 'Terjadi kesalahan saat bergabung ke Zoom'
        
        if (error.response?.status === 422) {
          this.errors = error.response.data.errors
          errorMessage = Object.values(error.response.data.errors).flat().join(', ')
        } else if (error.response?.status === 403) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        console.error('Error joining zoom:', error)
        return { success: false, message: errorMessage }
      } finally {
        this.loading = false
      }
    },
    
    // Reset form
    resetForm() {
      this.form = { employee_id: '', date: '', status: '' }
      this.errors = null
    },
    
    // Reset zoom form
    resetZoomForm() {
      this.zoomForm = { employee_id: '', zoom_link: 'https://zoom.us/j/meeting' }
      this.errors = null
    }
  }
})
