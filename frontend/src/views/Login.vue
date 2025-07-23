<template>
  <div class="auth-container">
    <div class="auth-form">
      <img :src="headerImage" alt="Corruptopolis IA" class="form-header-image" />
      <form @submit.prevent="login">
        <div class="form-group">
          <input type="text" v-model="nickname" :placeholder="$t('login.nickname_placeholder')" required />
        </div>
        <div class="form-group">
          <input type="password" v-model="password" :placeholder="$t('login.password_placeholder')" required />
        </div>
        <button type="submit" class="btn-primary">{{ $t('login.login_button') }}</button>
      </form>
      <div class="auth-switch">
        <p><strong>{{ $t('login.no_account_question') }}</strong> <router-link to="/register" class="btn-secondary">{{ $t('login.register_button') }}</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import headerImage from '../assets/header1.png';

export default {
  data() {
    return {
      nickname: '',
      password: '',
      headerImage: headerImage,
    };
  },
  methods: {
    async login() {
      try {
        const res = await api.post('/auth/login', {
          nickname: this.nickname,
          password: this.password
        });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        this.$router.push('/game');
      } catch (err) {
        console.log('Login error response:', err.response);
        if (err.response?.data?.needsVerification) {
          console.log('Redirecting to VerifyEmail. Response data:', err.response.data);
          this.$router.push({ name: 'VerifyEmail', query: { email: err.response.data.email } });
        } else if (err.response?.data?.needsTermsAcceptance) {
          this.$router.push({ name: 'AcceptTerms', query: { userId: err.response.data.userId } });
        } else {
          alert(err.response?.data?.msg || 'Credenciales inválidas');
        }
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.auth-form {
  background: var(--color-panel-background); /* Changed to new palette variable */
  padding: 2rem;
  border-radius: 8px; /* Changed to match new aesthetic */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  border: 2px solid var(--color-button-border); /* Changed to new palette variable */
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

.form-group {
  margin-bottom: 1rem;
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

button {
  /* Removed specific button styles, now uses btn-primary */
}

.auth-switch {
  margin-top: 1rem;
  font-size: 0.9rem;
  font-family: 'Roboto', sans-serif; /* Updated for consistent body font */
  color: var(--color-text-dark); /* Changed to new palette variable */
}

.auth-switch a {
  font-weight: bold;
  font-family: 'Bebas Neue', sans-serif;
  color: var(--noir-retro-pure-black);
}
</style>