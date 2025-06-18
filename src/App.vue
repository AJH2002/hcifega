<template>
  <div class="app-container">
    <!-- Luxury Navigation -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <div class="brand-icon">
            <img src="/logohci.png" alt="Logo" width="60" height="60" />
          </div>
          <h1 class="nav-title">General Affair System</h1>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">
            <span class="nav-link-icon">📊</span>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/attendance" class="nav-link">
            <span class="nav-link-icon">🌅</span>
            <span>Morning Reflection</span>
          </router-link>
        </div>
      </div>
    </nav>
    
    <!-- Main Content Area -->
    <main class="main-container">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
    
    <!-- Decorative Elements -->
    <div class="bg-decoration">
      <div class="decoration-circle decoration-1"></div>
      <div class="decoration-circle decoration-2"></div>
      <div class="decoration-circle decoration-3"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* App Container */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
  overflow-x: hidden;
}

/* Luxury Navigation */
.navbar {
  background: var(--gradient-elegant);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-elegant);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.brand-icon {
  width: 48px;
  height: 48px;
  background: var(--gradient-gold);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--luxury-navy);
  box-shadow: var(--shadow-soft);
}

.nav-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--luxury-white);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.025em;
}

.nav-links {
  display: flex;
  gap: var(--spacing-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.nav-link.router-link-active {
  background: var(--luxury-gold);
  color: var(--luxury-navy);
  font-weight: 600;
}

.nav-link-icon {
  font-size: 1.25rem;
}

/* Main Content */
.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-2xl);
  position: relative;
  z-index: 1;
}

.content-wrapper {
  background: var(--luxury-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-luxury);
  padding: var(--spacing-2xl);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Background Decorations */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: var(--gradient-gold);
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.decoration-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  right: -150px;
  animation-delay: 0s;
}

.decoration-2 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  left: -100px;
  animation-delay: 2s;
}

.decoration-3 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-container {
    padding: var(--spacing-md);
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .nav-title {
    font-size: 1.5rem;
  }
  
  .nav-links {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-link {
    justify-content: center;
  }
  
  .main-container {
    padding: var(--spacing-md);
  }
  
  .content-wrapper {
    padding: var(--spacing-lg);
  }
}
</style>