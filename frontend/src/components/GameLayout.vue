<template>
  <div class="game-board-container">
    <header class="game-board-header">
      <img :src="headerImage" alt="Corruptopolis IA" class="header-image-bg" />
    </header>
    <main class="game-board-main">
      <router-view />
    </main>
    <footer class="game-board-footer">
      <div class="footer-buttons">
        <div class="footer-left-section">
          <div v-if="userProfile" class="user-info-footer">
            <img
              v-if="userProfile.avatar_url"
              :src="getCharacterImageUrl(userProfile.avatar_url)"
              alt="User Avatar"
              class="user-avatar-footer"
            />
            <span class="user-nickname-footer">{{ userProfile.nickname }}</span>
          </div>
        </div>
        <div class="footer-right-section">
          <button @click="goToHistory" class="btn-secondary">Historial</button>
          <button @click="goToHelp" class="btn-secondary">Ayuda</button>
          <button @click="goToEditProfile" class="btn-secondary">Editar Perfil</button>
          <button @click="logout" class="btn-secondary">Salir</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import api from '../api';
import headerImage from '../assets/header1.png';

export default {
  name: 'GameLayout',
  data() {
    return {
      userProfile: null,
      headerImage: headerImage,
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
      localStorage.removeItem('accessToken'); // Corregido de 'token' a 'accessToken'
      this.$router.push('/login'); // Redirigir explícitamente a /login
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
  background-color: #084244; /* Custom background color */
  border: 5px solid var(--noir-retro-pure-black); /* Updated to Noir Retro palette */
  border-radius: 8px; /* Added rounded borders */
  box-shadow: 10px 10px 0px var(--noir-retro-pure-black); /* Updated to Noir Retro palette */
  overflow: hidden; /* Asegura que el contenido no se desborde */
  padding: 20px; /* Added generous padding */
}

.game-board-header {
  background-color: var(--noir-retro-primary-accent); /* Updated to Noir Retro palette */
  padding: 5px 0; /* Adjusted padding for minimal margin */
  border-bottom: 3px solid var(--noir-retro-pure-black); /* Updated to Noir Retro palette */
  display: flex;
  justify-content: center; /* Center content horizontally */
  align-items: center;
  border-radius: 8px; /* Rounded all corners */
}

.header-image-bg {
  width: 100%;
  height: 60px; /* Adjust height as needed for your image */
  object-fit: contain;
  border-radius: 8px; /* Added rounded corners to the image */
}

.header-logo {
  /* This is now replaced by the background image */
  display: none; /* Hide the img tag */
}

.header-left {
  /* This section is now empty in the template, so no specific styles needed here */
}

.header-right {
  /* This section is now removed from the template */
}

.game-title {
  /* This is now replaced by the image */
  display: none; /* Hide the text title */
}

.user-info {
  display: none; /* Hide the old user info in header */
}

.user-avatar {
  display: none; /* Hide the old user avatar in header */
}

.game-board-main {
  flex-grow: 1; /* Permite que el contenido principal ocupe el espacio restante */
  padding: 20px 0; /* Adjusted padding for alignment */
  overflow-y: auto; /* Permite scroll si el contenido es muy largo */
}

.game-board-footer {
  background-color: var(--noir-retro-primary-accent); /* Updated to Noir Retro palette */
  padding: 15px 0;
  border-top: 3px solid var(--noir-retro-pure-black); /* Updated to Noir Retro palette */
  border-radius: 8px; /* Rounded all corners */
}

.footer-buttons {
  display: flex;
  justify-content: space-between; /* Distribute items to ends */
  align-items: center; /* Center items vertically */
  padding: 0 20px; /* Add padding from edges */
}

.footer-left-section {
  display: flex;
  align-items: center;
}

.footer-right-section {
  display: flex;
  align-items: center;
  gap: 20px; /* Space between buttons */
}

.user-info-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--noir-retro-off-white);
  font-family: 'Roboto', sans-serif;
  font-size: 1.1em;
}

.user-avatar-footer {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--noir-retro-off-white);
}

.user-nickname-footer {
  font-weight: bold;
}

.footer-buttons button {
  /* Removed specific button styles, now uses btn-secondary */
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