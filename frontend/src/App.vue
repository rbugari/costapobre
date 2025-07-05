<template>
  <div id="app">
    <header v-if="isLoggedIn">
      <nav class="navbar">
        <router-link to="/game">Juego</router-link>
        <router-link to="/history">Historial</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer v-if="isLoggedIn" class="footer">
      <div class="footer-buttons">
        <button @click="goToHelp" class="help-btn">Ayuda</button>
        <button @click="logout" class="logout-btn">Salir</button>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('token');
    }
  },
  methods: {
    goToHelp() {
      this.$router.push('/help');
    },
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/');
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

.navbar {
  background-color: #212529;
  padding: 15px 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
  border-bottom: 1px solid #333;
}
.navbar a {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 5px;
}
.navbar a.router-link-exact-active {
  background-color: #5f25d6;
}
.footer {
  position: fixed; /* Vuelve a fixed */
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #212529;
  padding: 15px 0;
  border-top: 1px solid #333;
  height: 60px; /* Altura explícita para el footer */
  display: flex;
  align-items: center;
  justify-content: center;
}
.footer-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.footer button {
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.footer .help-btn {
  background-color: #6c757d; /* Gris secundario */
}
.footer .logout-btn {
  background-color: #dc3545; /* Rojo para salir */
}
main {
  flex-grow: 1; /* Permite que el contenido principal ocupe el espacio restante */
  padding-top: 60px; /* Ajusta según la altura de tu navbar */
  padding-bottom: 60px; /* Espacio para el footer fijo */
  overflow-y: auto; /* Permite scroll en el contenido principal si es necesario */
}
</style>