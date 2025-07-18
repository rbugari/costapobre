<template>
  <div id="app">
    <div class="theme-switcher">
      <button @click="setTheme('ocre')">Ocre Theme</button>
      <button @click="setTheme('dark')">Dark Theme (Placeholder)</button>
      <button @click="setTheme('noir-retro')">Noir Retro Theme</button>
    </div>
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

.theme-switcher {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px;
  border-radius: 5px;
}

.theme-switcher button {
  margin-left: 5px;
  padding: 5px 10px;
  cursor: pointer;
}

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