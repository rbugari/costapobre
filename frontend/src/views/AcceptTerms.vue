<template>
  <div class="accept-terms-container">
    <div class="card">
      <h2>{{ $t('accept_terms.title') }}</h2>
      <div class="terms-content">
        <div v-html="termsText" class="terms-section"></div>
        <div v-html="disclaimerText" class="terms-section"></div>
      </div>
      <div class="checkbox-container">
        <input type="checkbox" id="acceptCheckbox" v-model="accepted" />
        <label for="acceptCheckbox">{{ $t('accept_terms.checkbox_label') }}</label>
      </div>
      <button @click="acceptTerms" :disabled="!accepted" class="btn-primary">{{ $t('accept_terms.accept_button') }}</button>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'AcceptTerms',
  data() {
    return {
      termsText: '',
      disclaimerText: '',
      accepted: false,
    };
  },
  async created() {
    await this.loadTermsAndDisclaimer();
  },
  methods: {
    async loadTermsAndDisclaimer() {
      try {
        const response = await api.get('/game/config'); // Asumiendo que tienes un endpoint para obtener la configuración del juego
        this.termsText = response.data.TERMS_AND_CONDITIONS_TEXT;
        this.disclaimerText = response.data.DISCLAIMER_TEXT;
      } catch (error) {
        console.error('Error loading terms and disclaimer:', error);
        alert(this.$t('accept_terms.error_loading_terms'));
      }
    },
    async acceptTerms() {
      const userId = this.$route.query.userId;
      if (!userId) {
        console.error('User ID not found in route query.');
        alert(this.$t('accept_terms.error_user_not_identified'));
        return;
      }
      try {
        const response = await api.post('/auth/accept-terms', { userId });
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        this.$router.push('/game'); // Redirect to game after accepting
      } catch (error) {
        console.error('Error accepting terms:', error);
        alert(this.$t('accept_terms.error_accepting_terms'));
      }
    },
  },
};
</script>

<style scoped>
.accept-terms-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--noir-retro-background);
  padding: 20px;
}

.card {
  background-color: var(--noir-retro-panel-background);
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 8px;
  padding: 30px;
  box-shadow: 8px 8px 0px var(--noir-retro-primary-accent);
  max-width: 800px;
  width: 100%;
  text-align: center;
}

h2 {
  font-family: 'Bebas Neue', sans-serif;
  color: var(--noir-retro-primary-accent);
  margin-bottom: 20px;
  font-size: 2.5em;
}

.terms-content {
  max-height: 500px;
  overflow-y: auto;
  background-color: var(--noir-retro-off-white);
  border: 1px solid var(--noir-retro-dark-grey);
  padding: 20px;
  margin-bottom: 20px;
  text-align: left;
  color: var(--noir-retro-pure-black);
  line-height: 1.6;
}

.terms-section h2, .terms-section h3 {
  font-family: 'Bebas Neue', sans-serif;
  color: var(--noir-retro-dark-grey);
  margin-top: 20px;
  margin-bottom: 10px;
}

.terms-section p, .terms-section li {
  font-family: 'Roboto', sans-serif;
  font-size: 1em;
  margin-bottom: 10px;
}

.terms-section ul {
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 10px;
}

.checkbox-container {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-container input[type="checkbox"] {
  margin-right: 10px;
  width: 20px;
  height: 20px;
  accent-color: var(--noir-retro-primary-accent); /* Color del checkbox */
}

.checkbox-container label {
  font-family: 'Roboto', sans-serif;
  color: var(--noir-retro-pure-black);
  font-size: 1.1em;
}

.btn-primary {
  background-color: var(--noir-retro-primary-accent);
  color: var(--noir-retro-off-white);
  border: 2px solid var(--noir-retro-pure-black);
  padding: 12px 25px;
  border-radius: 5px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 4px 4px 0px var(--noir-retro-pure-black);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--noir-retro-dark-grey);
  box-shadow: 2px 2px 0px var(--noir-retro-pure-black);
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
