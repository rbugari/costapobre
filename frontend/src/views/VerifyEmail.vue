<template>
  <div class="verify-email-container">
    <h2>Verificar Email</h2>
    <p>Se ha enviado un código de verificación a <strong>{{ email }}</strong>. Por favor, introduce el código a continuación para activar tu cuenta.</p>
    <form @submit.prevent="verify">
      <div class="form-group">
        <label for="verificationCode">Código de Verificación</label>
        <input type="text" id="verificationCode" v-model="verificationCode" required>
      </div>
      <button type="submit" class="btn-primary">Verificar</button>
    </form>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      verificationCode: '',
      email: this.$route.query.email || '',
      error: ''
    };
  },
  methods: {
    async verify() {
      try {
        const response = await api.post('/auth/verify-email', {
          email: this.email,
          verificationCode: this.verificationCode
        });
        // Guardar tokens y redirigir al juego
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        this.$router.push('/game');
      } catch (err) {
        this.error = err.response?.data?.msg || 'Error al verificar el código.';
      }
    }
  }
};
</script>

<style scoped>
.verify-email-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
}
.form-group {
  margin-bottom: 15px;
}
.error-message {
  color: red;
  margin-top: 15px;
}
</style>
