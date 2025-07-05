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
        <label for="avatar_url">URL de Avatar:</label>
        <input type="text" id="avatar_url" v-model="userProfile.avatar_url" />
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
        <button type="button" @click="$router.push('/game')">Cancelar</button>
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
    };
  },
  async mounted() {
    await this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      try {
        const res = await api.get('/auth/profile'); // Necesitaremos este endpoint en el backend
        this.userProfile = res.data;
      } catch (err) {
        console.error('Error fetching user profile:', err);
        alert('Error al cargar el perfil de usuario.');
      }
    },
    async saveProfile() {
      try {
        await api.put('/auth/profile', this.userProfile); // Necesitaremos este endpoint en el backend
        alert('Perfil actualizado exitosamente!');
        this.$router.push('/game');
      } catch (err) {
        console.error('Error saving user profile:', err);
        alert('Error al guardar el perfil de usuario.');
      }
    },
  },
};
</script>

<style scoped>
.edit-profile-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

.form-actions button[type="button"] {
  background-color: #6c757d;
}

.form-actions button:hover {
  opacity: 0.9;
}
</style>
