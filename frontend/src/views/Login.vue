<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Iniciar Sesión</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <input type="text" v-model="nickname" placeholder="Nickname" required />
        </div>
        <div class="form-group">
          <input type="password" v-model="password" placeholder="Contraseña" required />
        </div>
        <button type="submit">Login</button>
      </form>
      <p class="auth-switch">
        ¿No tienes una cuenta? <router-link to="/register">Regístrate</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      nickname: '',
      password: ''
    };
  },
  methods: {
    async login() {
      console.log('Intentando iniciar sesión...'); // Log de depuración
      try {
        const res = await api.post('/auth/login', {
          nickname: this.nickname,
          password: this.password
        });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        this.$router.push('/game');
      } catch (err) {
        alert('Credenciales inválidas');
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
  background: var(--surface-color);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #1a1a1a;
  color: var(--text-color);
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background: var(--primary-color);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #4a1da8;
}

.auth-switch {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.auth-switch a {
  font-weight: bold;
}
</style>