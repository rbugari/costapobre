<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Crear Cuenta</h2>
      <form @submit.prevent="register">
        <input type="text" v-model="nickname" placeholder="Nickname" required />
        <input type="email" v-model="email" placeholder="Email" required />
        <input type="password" v-model="password" placeholder="Contraseña" required />
        <input type="password" v-model="passwordConfirm" placeholder="Confirmar Contraseña" required />
        
        <select v-model="country_of_origin">
          <option value="">Seleccionar País</option>
          <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
        </select>

        <input type="number" v-model="age" placeholder="Edad" />
        <input type="text" v-model="political_ideology" placeholder="Ideología Política" />
        <textarea v-model="personal_profile" placeholder="Perfil Personal"></textarea>
        
        <div class="form-group">
          <label for="avatar-upload">Foto de Avatar (opcional):</label>
          <input type="file" id="avatar-upload" @change="onFileSelected" accept="image/*" />
          <p class="help-text">Formatos permitidos: JPG, PNG, GIF, WEBP. Tamaño máximo: 2MB.</p>
          <div v-if="avatarPreviewUrl" class="avatar-preview-container">
            <img :src="avatarPreviewUrl" alt="Avatar Preview" class="avatar-preview" />
          </div>
        </div>

        <select v-model="selected_language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button type="submit" class="btn-primary">Registrarse</button>
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
      selectedFile: null,
      avatarPreviewUrl: null,
      selected_language: 'es',
      countries: [
        'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador',
        'España', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
        'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela',
        'Estados Unidos', 'Canadá', 'Reino Unido', 'Francia', 'Alemania', 'Italia', 'Brasil',
        'Australia', 'China', 'India', 'Japón', 'Rusia', 'Sudáfrica', // Add more as needed
      ],
    };
  },
  methods: {
    async register() {
      if (this.password !== this.passwordConfirm) {
        alert('Las contraseñas no coinciden');
        return;
      }

      const formData = new FormData();
      formData.append('nickname', this.nickname);
      formData.append('email', this.email);
      formData.append('password', this.password);
      formData.append('country_of_origin', this.country_of_origin);
      formData.append('age', this.age);
      formData.append('political_ideology', this.political_ideology);
      formData.append('personal_profile', this.personal_profile);
      formData.append('selected_language', this.selected_language);
      if (this.selectedFile) {
        formData.append('avatar', this.selectedFile);
      }

      try {
        const res = await api.post('/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert(res.data.msg); // 'Registro exitoso. Por favor, verifica tu email...'
        this.$router.push({ name: 'VerifyEmail', query: { email: this.email } });
      } catch (err) {
        const errorMessage = err.response?.data?.msg || 'Ha ocurrido un error inesperado durante el registro.';
        alert(errorMessage);
      }
    },
    onFileSelected(event) {
      const file = event.target.files[0];
      if (!file) {
        this.selectedFile = null;
        this.avatarPreviewUrl = null;
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Formato de archivo no permitido. Por favor, sube una imagen JPG, PNG, GIF o WEBP.');
        this.selectedFile = null;
        this.avatarPreviewUrl = null;
        return;
      }

      // Validar tamaño de archivo (2MB máximo)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert('El tamaño de la imagen excede el límite de 2MB.');
        this.selectedFile = null;
        this.avatarPreviewUrl = null;
        return;
      }

      this.selectedFile = file;
      // Generar previsualización
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
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
  background: var(--color-panel-background); /* Changed to new palette variable */
  padding: 2rem;
  border-radius: 8px; /* Changed to match new aesthetic */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  border: 2px solid var(--color-button-border); /* Changed to new palette variable */
}

.auth-form h2 {
  font-family: 'Bebas Neue', sans-serif; /* Updated for consistent title font */
  color: var(--color-text-dark); /* Changed to new palette variable */
  margin-bottom: 1.5rem;
}

.auth-form input,
.auth-form textarea,
.auth-form select {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 2px solid var(--color-button-border); /* Changed to new palette variable */
  border-radius: 8px; /* Changed to match new aesthetic */
  background: var(--color-panel-background); /* Changed to new palette variable */
  color: var(--color-text-dark); /* Changed to new palette variable */
  box-sizing: border-box;
}

.auth-form textarea {
  min-height: 80px;
  resize: vertical;
}

button {
  /* Removed specific button styles, now uses btn-primary */
}

.auth-switch {
  margin-top: 1.5rem;
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