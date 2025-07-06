<template>
  <div class="game-board-container">
    <header class="game-board-header">
      <div class="header-left">
        <div v-if="userProfile" class="user-info">
          <img
            v-if="userProfile.avatar_url"
            :src="getCharacterImageUrl(userProfile.avatar_url)"
            alt="User Avatar"
            class="user-avatar"
          />
          <span>{{ userProfile.nickname }}</span>
          <button @click="goToEditProfile" class="edit-profile-button">
            Editar Perfil
          </button>
        </div>
      </div>
      <div class="header-right">
        <h1 class="game-title">El Ascenso Corrupto</h1>
      </div>
    </header>
    <main class="game-board-main">
      <router-view />
    </main>
    <footer class="game-board-footer">
      <div class="footer-buttons">
        <button @click="goToHistory" class="history-btn">Historial</button>
        <button @click="goToHelp" class="help-btn">Ayuda</button>
        <button @click="logout" class="logout-btn">Salir</button>
      </div>
    </footer>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'GameLayout',
  data() {
    return {
      userProfile: null,
    };
  },
  async mounted() {
    await this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      try {
        const res = await api.get('/auth/profile');
        this.userProfile = res.data;
      } catch (err) {
        console.error('Error fetching user profile in GameLayout:', err);
        // Manejar el error, quizás redirigir al login si el token es inválido
      }
    },
    getCharacterImageUrl(relativePath) {
      // Asume que el backend está en http://localhost:5000
      // y sirve imágenes estáticas desde su raíz.
      return `http://localhost:5000${relativePath}`;
    },
    goToHelp() {
      this.$router.push('/help');
    },
    goToHistory() {
      this.$router.push('/history');
    },
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/');
    },
    goToEditProfile() {
      this.$router.push({ name: 'EditProfile' });
    },
  },
};
</script>

<style scoped>
.game-board-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ocupa toda la altura de la ventana */
  max-width: 1200px; /* Ancho máximo del tablero */
  width: 90%; /* Ocupa el 90% del ancho disponible */
  margin: 0 auto; /* Centra el tablero */
  background-color: #212529; /* Color de fondo del tablero */
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  overflow: hidden; /* Asegura que el contenido no se desborde */
}

.game-board-header {
  background-color: #2c3034;
  padding: 15px 30px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  text-align: right;
}

.game-title {
  margin: 0;
  color: #fff;
  font-size: 1.8em;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  object-fit: cover;
}

.edit-profile-button {
  background: #5f25d6;
  border: none;
  color: #fff;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
}

.game-board-main {
  flex-grow: 1; /* Permite que el contenido principal ocupe el espacio restante */
  padding: 20px;
  overflow-y: auto; /* Permite scroll si el contenido es muy largo */
}

.game-board-footer {
  background-color: #2c3034;
  padding: 15px 0;
  border-top: 1px solid #333;
}

.footer-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.footer-buttons button {
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.footer-buttons .help-btn {
  background-color: var(--secondary-color);
}
.footer-buttons .logout-btn {
  background-color: var(--danger-color);
}
.footer-buttons .history-btn {
  background-color: var(--primary-color);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .game-board-container {
    width: 98%;
    border-radius: 0;
  }
  .game-board-main {
    padding: 10px;
  }
  .game-board-header {
    flex-direction: column;
    gap: 10px;
  }
  .header-right {
    text-align: center;
  }
}
</style>
