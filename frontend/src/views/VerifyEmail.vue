<template>
  <div class="auth-container" :style="backgroundImageStyle">
    <div class="auth-form">
      <img :src="headerImage" alt="Corruptopolis IA" class="form-header-image" />
      <p class="form-description">{{ $t('verify_email.description_prefix') }} <strong>{{ email }}</strong>. {{ $t('verify_email.description_suffix') }}</p>
      <form @submit.prevent="verify">
        <div class="form-group">
          <label for="verificationCode">{{ $t('verify_email.verification_code_label') }}</label>
          <input type="text" id="verificationCode" v-model="verificationCode" required />
        </div>
        <button type="submit" class="btn-primary">{{ $t('verify_email.verify_button') }}</button>
      </form>
      <button @click="resendVerificationEmail" class="btn-secondary">{{ $t('verify_email.resend_code_button') }}</button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import api from '../api';
import headerImage from '../assets/header1.png';

export default {
  data() {
    return {
      verificationCode: '',
      email: this.$route.query.email || '',
      error: '',
      backgroundImage: '',
      headerImage: headerImage,
    };
  },
  created() {
    this.setRandomBackgroundImage();
  },
  computed: {
    backgroundImageStyle() {
      return {
        backgroundImage: `url(${this.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    },
  },
  methods: {
    setRandomBackgroundImage() {
      const images = [
        '/images/base_f.png',
        '/images/base_m.png',
      ];
      const randomIndex = Math.floor(Math.random() * images.length);
      this.backgroundImage = images[randomIndex];
    },
    async verify() {
      try {
        const response = await api.post('/auth/verify-email', {
          email: this.email,
          verificationCode: this.verificationCode
        });
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        this.$router.push('/game');
      } catch (err) {
        this.error = err.response?.data?.msg || this.$t('verify_email.verification_error');
      }
    },
    async resendVerificationEmail() {
      try {
        await api.post('/auth/resend-verification-email', { email: this.email });
        alert(this.$t('verify_email.resend_success'));
        this.error = ''; // Clear any previous errors
      } catch (err) {
        this.error = err.response?.data?.msg || 'Error al reenviar el código de verificación.';
      }
    },
  },
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* Use 100vh to cover the full viewport height */
  padding: 20px; /* Add some padding around the container */
  box-sizing: border-box; /* Include padding in the element's total width and height */
}

.auth-form {
  background: var(--color-panel-background); /* Changed to new palette variable */
  padding: 2rem;
  border-radius: 8px; /* Changed to match new aesthetic */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  border: 2px solid var(--color-button-border); /* Changed to new palette variable */
  text-align: center; /* Center content within the form */
}

.auth-form h2 {
  font-family: 'Bebas Neue', sans-serif; /* Updated for consistent title font */
  color: var(--color-text-dark); /* Changed to new palette variable */
  margin-bottom: 1.5rem;
}

.form-header-image {
  max-width: 100%;
  height: auto;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.form-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-dark);
  font-family: 'Roboto', sans-serif;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-dark);
  font-family: 'Roboto', sans-serif;
  text-align: left; /* Align label text to the left */
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-button-border); /* Changed to new palette variable */
  border-radius: 8px; /* Changed to match new aesthetic */
  background: var(--color-panel-background); /* Changed to new palette variable */
  color: var(--color-text-dark); /* Changed to new palette variable */
  box-sizing: border-box;
}

.error-message {
  color: var(--color-rojo-alerta);
  margin-top: 15px;
  font-family: 'Roboto', sans-serif;
}
</style>
