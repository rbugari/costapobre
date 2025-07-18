<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Editar Perfil</h2>
      <form @submit.prevent="saveProfile">
        <input type="text" :value="userProfile.nickname" placeholder="Nickname" disabled />
        <input type="email" :value="userProfile.email" placeholder="Email" disabled />
        
        <select v-model="userProfile.country_of_origin">
          <option value="">Seleccionar País</option>
          <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
        </select>

        <input type="number" v-model="userProfile.age" placeholder="Edad" />
        <input type="text" v-model="userProfile.political_ideology" placeholder="Ideología Política" />
        <textarea v-model="userProfile.personal_profile" placeholder="Perfil Personal"></textarea>
        
        <div class="form-group">
          <label for="avatar-upload">Foto de Avatar:</label>
          <input type="file" id="avatar-upload" @change="onFileSelected" accept="image/*" />
          <p class="help-text">Formatos permitidos: JPG, PNG, GIF, WEBP. Tamaño máximo: 2MB.</p>
          <div v-if="avatarPreview" class="avatar-preview-container">
            <img :src="avatarPreview" alt="Avatar Preview" class="avatar-preview" />
          </div>
        </div>

        <select v-model="userProfile.selected_language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button type="submit" class="btn-primary">Guardar Cambios</button>
      </form>
      <button @click="goBackToGame" class="btn-secondary" style="margin-top: 1rem;">Volver al Juego</button>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      userProfile: {},
      selectedFile: null,
      avatarPreview: null,
      countries: [
        'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador',
        'España', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
        'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela',
        'Estados Unidos', 'Canadá', 'Reino Unido', 'Francia', 'Alemania', 'Italia', 'Brasil',
        'Australia', 'China', 'India', 'Japón', 'Rusia', 'Sudáfrica',
      ],
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
        if (this.userProfile.avatar_url) {
          this.avatarPreview = `http://localhost:5000${this.userProfile.avatar_url}`;
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    },
    async saveProfile() {
      try {
        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('avatar', this.selectedFile);
          const res = await api.put('/upload/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          this.userProfile.avatar_url = res.data.avatar_url;
        }

        await api.put('/auth/profile', this.userProfile);
        alert('Perfil actualizado exitosamente!');
        this.$router.push('/game');
      } catch (err) {
        console.error('Error saving user profile:', err);
        alert('Error al guardar el perfil.');
      }
    },
    onFileSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    goBackToGame() {
      this.$router.push('/game');
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
  background: var(--color-panel-background);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  border: 2px solid var(--color-button-border);
}

.auth-form h2 {
  font-family: 'Bebas Neue', sans-serif;
  color: var(--color-text-dark);
  margin-bottom: 1.5rem;
}

.auth-form input,
.auth-form textarea,
.auth-form select {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 2px solid var(--color-button-border);
  border-radius: 8px;
  background: var(--color-panel-background);
  color: var(--color-text-dark);
  box-sizing: border-box;
}

.auth-form input:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auth-form textarea {
  min-height: 80px;
  resize: vertical;
}

.avatar-preview-container {
  margin-top: 10px;
  text-align: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--noir-retro-primary-accent);
}

.help-text {
  font-size: 0.8rem;
  color: #666;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}
</style>
