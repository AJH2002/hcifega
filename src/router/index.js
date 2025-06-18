import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Attendance from '../views/Attendance.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/attendance', name: 'Attendance', component: Attendance }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router