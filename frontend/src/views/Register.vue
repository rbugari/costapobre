<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Crear Cuenta</h2>
      <form @submit.prevent="register">
        <input type="text" v-model="nickname" placeholder="Nickname" required />
        <input type="email" v-model="email" placeholder="Email" required />
        <input type="password" v-model="password" placeholder="Contraseña" required />
        <input type="password" v-model="passwordConfirm" placeholder="Confirmar Contraseña" required />
        <input type="text" v-model="country_of_origin" placeholder="País de Origen" />
        <input type="number" v-model="age" placeholder="Edad" />
        <input type="text" v-model="political_ideology" placeholder="Ideología Política" />
        <textarea v-model="personal_profile" placeholder="Perfil Personal"></textarea>
        <input type="text" v-model="avatar_url" placeholder="URL de Avatar (opcional)" />
        <select v-model="selected_language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button type="submit">Registrarse</button>
      </form>
      <p class="auth-switch">
        ¿Ya tienes una cuenta? <router-link to="/">Inicia Sesión</router-link>
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
      email: '',
      password: '',
      passwordConfirm: '',
      country_of_origin: '',
      age: null,
      political_ideology: '',
      personal_profile: '',
      avatar_url: '',
      selected_language: 'es',
    };
  },
  methods: {
    async register() {
      if (this.password !== this.passwordConfirm) {
        alert('Las contraseñas no coinciden');
        return;
      }
      try {
        const res = await api.post('/auth/register', {
          nickname: this.nickname,
          email: this.email,
          password: this.password,
          country_of_origin: this.country_of_origin,
          age: this.age,
          political_ideology: this.political_ideology,
          personal_profile: this.personal_profile,
          avatar_url: this.avatar_url,
          selected_language: this.selected_language,
        });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        alert('¡Registro exitoso! Por favor, inicia sesión.');
        this.$router.push('/');
      } catch (err) {
        alert(err.response.data.msg);
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
  padding: 2rem 1rem;
}

.auth-form {
  background: var(--surface-color);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
}

.auth-form h2 {
  margin-bottom: 1.5rem;
}

.auth-form input,
.auth-form textarea,
.auth-form select {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #1a1a1a;
  color: var(--text-color);
  box-sizing: border-box;
}

.auth-form textarea {
  min-height: 80px;
  resize: vertical;
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
  margin-top: 1rem;
}

button:hover {
  background-color: #4a1da8;
}

.auth-switch {
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.auth-switch a {
  font-weight: bold;
}
</style>