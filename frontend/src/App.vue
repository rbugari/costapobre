<template>
  <div id="app">
    <GameLayout v-if="isLoggedIn" />
    <router-view v-else />
  </div>
</template>

<script>
import GameLayout from './components/GameLayout.vue';

export default {
  name: 'App',
  components: {
    GameLayout,
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('token');
    }
  },
  watch: {
    $route() {
      // Forzar una re-evaluación de isLoggedIn cuando cambia la ruta
      this.$forceUpdate();
    }
  }
}
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #1a1a1a;
  color: #f3f3f3;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

#app {
  min-height: 100vh; /* Asegura que #app ocupe toda la altura de la ventana */
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>