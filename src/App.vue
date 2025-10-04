<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>Symulator Emerytalny ZUS</h1>
            <p>Narzędzie edukacyjne do prognozowania wysokości emerytury</p>
          </div>
          <nav class="main-nav">
            <router-link to="/" class="nav-link">Pulpit</router-link>
            <router-link to="/simulation" class="nav-link"
              >Symulacja</router-link
            >
            <router-link to="/advanced" class="nav-link"
              >Zaawansowane</router-link
            >
            <router-link to="/admin" class="nav-link">Admin</router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <div class="container">
        <p>
          &copy; 2025 Zakład Ubezpieczeń Społecznych. Wszystkie prawa
          zastrzeżone.
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
/* ZUS Color Scheme */
:root {
  --zus-orange: rgb(255, 179, 79);
  --zus-green: rgb(0, 153, 63);
  --zus-gray: rgb(190, 195, 206);
  --zus-blue: rgb(63, 132, 210);
  --zus-dark-blue: rgb(0, 65, 110);
  --zus-red: rgb(240, 94, 94);
  --zus-black: rgb(0, 0, 0);
  --zus-white: rgb(255, 255, 255);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Inter", sans-serif;
  line-height: 1.6;
  color: var(--zus-black);
  background-color: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-header {
  background: linear-gradient(135deg, var(--zus-blue), var(--zus-dark-blue));
  color: var(--zus-white);
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.logo p {
  font-size: 0.9rem;
  opacity: 0.9;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--zus-white);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.app-main {
  min-height: calc(100vh - 140px);
  padding: 2rem 0;
}

.app-footer {
  background-color: var(--zus-dark-blue);
  color: var(--zus-white);
  text-align: center;
  padding: 1rem 0;
  margin-top: auto;
}

/* WCAG 2.0 Compliance */
button:focus,
input:focus,
select:focus,
textarea:focus,
.nav-link:focus {
  outline: 3px solid var(--zus-orange);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --zus-orange: #ff6600;
    --zus-green: #00aa00;
    --zus-blue: #0066cc;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .main-nav {
    justify-content: center;
    flex-wrap: wrap;
  }

  .logo h1 {
    font-size: 1.5rem;
  }
}
</style>
