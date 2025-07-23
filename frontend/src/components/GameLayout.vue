<template>
  <div class="game-board-container">
    <header class="game-board-header">
      <img :src="headerImage" :alt="$t('game_layout.game_title_alt')" class="header-image-bg" />
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
              :alt="$t('game_layout.user_avatar_alt')"
              class="user-avatar-footer"
            />
            <span class="user-nickname-footer">{{ userProfile.nickname }}</span>
            <button @click="goToEditProfile" class="btn-footer">{{ $t('game_layout.edit_profile_button') }}</button>
          </div>
        </div>
        <div class="footer-right-section">
          <button v-if="showRewardAdButton" @click="showRewardAd" class="btn-footer">{{ $t('game_layout.view_ad_button') }}</button>
          <button @click="goToHistory" class="btn-footer">{{ $t('game_layout.history_button') }}</button>
          <button @click="goToHelp" class="btn-footer">{{ $t('game_layout.help_button') }}</button>
          <button @click="logout" class="btn-footer">{{ $t('game_layout.logout_button') }}</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import api from '../api';
import headerImage from '../assets/header1.png';

import eventBus from '../eventBus';

export default {
  name: 'GameLayout',
  data() {
    return {
      userProfile: null,
      headerImage: headerImage,
      showRewardAdButton: false,
    };
  },
  watch: {
    'userProfile.selected_language'(newLang) {
      if (newLang && this.$i18n.locale !== newLang) {
        this.$i18n.locale = newLang;
        localStorage.setItem('selectedLanguage', newLang);
      }
    },
  },
  created() {
    eventBus.on('update-gamestate', this.handleGameStateUpdate);
  },
  beforeUnmount() {
    eventBus.off('update-gamestate', this.handleGameStateUpdate);
  },
  async mounted() {
    await this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      try {
        const res = await api.get('/auth/profile');
        this.userProfile = res.data;
        // Set initial locale from fetched user profile
        if (this.userProfile.selected_language) {
          this.$i18n.locale = this.userProfile.selected_language;
          localStorage.setItem('selectedLanguage', this.userProfile.selected_language);
        }
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
      localStorage.removeItem('selectedLanguage'); // Clear language on logout
      this.$router.push('/login'); // Redirigir explícitamente a /login
    },
    goToEditProfile() {
      this.$router.push({ name: 'EditProfile' });
    },
    handleGameStateUpdate(gameState) {
      if (gameState && gameState.userInfo) {
        this.showRewardAdButton = !gameState.userInfo.premium;
        // Update userProfile with selected_language from gameState
        this.userProfile = { ...this.userProfile, ...gameState.userInfo };
      }
    },
    async showRewardAd() {
      try {
        const response = await api.rewardAd();
        eventBus.emit('gamestate-updated-by-ad', response.data.updated_game_state);
        alert('¡Recompensa obtenida! Has ganado 20 PC y tu BE se ha reducido en 5.');
      } catch (error) {
        console.error('Error getting ad reward:', error);
        alert('No se pudo obtener la recompensa del anuncio. Inténtalo de nuevo.');
      }
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

.btn-footer {
  background-color: var(--noir-retro-secondary-accent);
  color: var(--noir-retro-off-white);
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  padding: 5px 10px; /* Compact padding */
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.1s ease, box-shadow 0.1s ease;
  box-shadow: 3px 3px 0px var(--noir-retro-pure-black);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-footer:hover:not(:disabled) {
  background-color: #226A6D;
  box-shadow: 1px 1px 0px var(--noir-retro-pure-black);
}

.btn-footer:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--noir-retro-pure-black);
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

  .footer-buttons {
    flex-direction: column;
    gap: 15px;
  }

  .footer-right-section {
    flex-wrap: wrap; /* Allow buttons to wrap */
    justify-content: center; /* Center buttons when wrapped */
  }
}
</style>