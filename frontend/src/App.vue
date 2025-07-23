<template>
  <div id="app">
    
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentTheme: 'noir-retro', // Default theme
    };
  },
  watch: {
    $route() {
      // Este watcher puede ser útil para forzar actualizaciones si surgen problemas de reactividad.
      // Por ahora, lo mantenemos simple, ya que el guardia de navegación del router debería ser suficiente.
    }
  },
  mounted() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme(this.currentTheme); // Apply default theme if no saved theme
    }
  },
  methods: {
    setTheme(themeName) {
      document.documentElement.className = ''; // Clear existing classes from html
      document.documentElement.classList.add(`theme-${themeName}`);
      localStorage.setItem('theme', themeName);
      this.currentTheme = themeName;
    },
  },
};
</script>

<style>
@import './assets/ocre-theme.css';
/* Placeholder for other themes */
@import './assets/dark-theme.css';
@import './assets/noir-retro-theme.css';



/* Keep only transition styles, other global styles will be in base.css */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>