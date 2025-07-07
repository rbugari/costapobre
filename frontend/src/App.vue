<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  watch: {
    $route() {
      // Este watcher puede ser útil para forzar actualizaciones si surgen problemas de reactividad.
      // Por ahora, lo mantenemos simple, ya que el guardia de navegación del router debería ser suficiente.
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>