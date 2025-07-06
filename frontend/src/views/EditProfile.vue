<template>
  <div class="edit-profile-container">
    <h2>Editar Perfil de Usuario</h2>
    <form @submit.prevent="saveProfile">
      <div class="form-group">
        <label for="nickname">Nickname:</label>
        <input type="text" id="nickname" v-model="userProfile.nickname" disabled />
      </div>

      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="userProfile.email" disabled />
      </div>

      <div class="form-group">
        <label for="country_of_origin">País de Origen:</label>
        <input type="text" id="country_of_origin" v-model="userProfile.country_of_origin" />
      </div>

      <div class="form-group">
        <label for="age">Edad:</label>
        <input type="number" id="age" v-model="userProfile.age" />
      </div>

      <div class="form-group">
        <label for="political_ideology">Ideología Política:</label>
        <input type="text" id="political_ideology" v-model="userProfile.political_ideology" />
      </div>

      <div class="form-group">
        <label for="personal_profile">Perfil Personal:</label>
        <textarea id="personal_profile" v-model="userProfile.personal_profile"></textarea>
      </div>

      <div class="form-group">
        <label for="avatar_upload">Subir Nuevo Avatar:</label>
        <input type="file" id="avatar_upload" @change="handleFileChange" accept="image/jpeg, image/png, image/gif" />
        <p class="upload-info">Formatos permitidos: JPEG, PNG, GIF. Tamaño máximo: 1MB.</p>
        <div v-if="avatarPreview" class="avatar-preview">
          <img :src="avatarPreview" alt="Previsualización del Avatar" />
        </div>
        <button type="button" @click="uploadAvatar" :disabled="!selectedFile">Subir Avatar</button>
      </div>

      <div class="form-group">
        <label for="selected_language">Idioma Preferido:</label>
        <select id="selected_language" v-model="userProfile.selected_language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit">Guardar Cambios</button>
        <button type="button" @click="goBackToGame" class="back-button">Volver al Juego</button>
      </div>
    </form>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      userProfile: {
        nickname: '',
        email: '',
        country_of_origin: '',
        age: null,
        political_ideology: '',
        personal_profile: '',
        avatar_url: '',
        selected_language: 'en',
      },
      selectedFile: null,
      avatarPreview: null,
    };
  },
  async mounted() {
    await this.fetchUserProfile();
    if (this.userProfile.avatar_url) {
      this.avatarPreview = `http://localhost:5000${this.userProfile.avatar_url}`;
    }
  },
  methods: {
    handleFileChange(event) {
      console.log('Evento change disparado en input de archivo.');
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.avatarPreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.selectedFile = null;
        this.avatarPreview = null;
      }
    },
    async uploadAvatar() {
      if (!this.selectedFile) {
        alert('Por favor, selecciona un archivo para subir.');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', this.selectedFile);

      console.log('Intentando subir avatar...', this.selectedFile);
      try {
        const res = await api.put('/upload/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        this.userProfile.avatar_url = res.data.avatar_url;
        alert('Avatar actualizado exitosamente!');
        // No redirigimos, solo actualizamos la vista
      } catch (err) {
        console.error('Error uploading avatar:', err.response ? err.response.data : err.message);
        alert(`Error al subir el avatar: ${err.response ? err.response.data.msg : err.message}`);
      }
    },
    async fetchUserProfile() {
      try {
        const res = await api.get('/auth/profile');
        this.userProfile = res.data;
        if (this.userProfile.avatar_url) {
          this.avatarPreview = `http://localhost:5000${this.userProfile.avatar_url}`;
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        alert('Error al cargar el perfil de usuario.');
      }
    },
    async saveProfile() {
      try {
        // Excluir avatar_url de esta actualización, ya que se maneja por separado
        const profileToSave = { ...this.userProfile };
        delete profileToSave.avatar_url;

        await api.put('/auth/profile', profileToSave);
        alert('Perfil actualizado exitosamente!');
        this.$router.push('/game');
      } catch (err) {
        console.error('Error saving user profile:', err);
        alert('Error al guardar el perfil de usuario.');
      }
    },
    goBackToGame() {
      this.$router.push('/game');
    },
    logClick() {
      console.log('Input de archivo clickeado.');
    },
    logInput() {
      console.log('Input de archivo ha recibido un evento input.');
    },
  },
};
</script>

<style scoped>
.edit-profile-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: var(--surface-color); /* Fondo oscuro */
  color: var(--text-color); /* Texto claro */
  text-align: left;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #444; /* Borde oscuro */
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #1a1a1a; /* Fondo de input oscuro */
  color: var(--text-color); /* Texto de input claro */
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions button {
  background-color: var(--primary-color); /* Botón primario */
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

.form-actions button:hover {
  background-color: #4a1da8; /* Hover del botón primario */
}

.upload-info {
  font-size: 0.8em;
  color: #aaa;
  margin-top: 5px;
}

.avatar-preview {
  margin-top: 10px;
  text-align: center;
}

.avatar-preview img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color);
}

.back-button {
  background-color: #6c757d; /* Color gris para el botón de volver */
  margin-left: 10px;
}

.back-button:hover {
  background-color: #5a6268;
}
</style>