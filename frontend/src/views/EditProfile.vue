<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>{{ $t('edit_profile.edit_profile_title') }}</h2>
      <form @submit.prevent="saveProfile">
        <input type="text" :value="userProfile.nickname" :placeholder="$t('edit_profile.nickname_placeholder')" disabled />
        <input type="email" :value="userProfile.email" :placeholder="$t('edit_profile.email_placeholder')" disabled />
        
        <select v-model="userProfile.country_of_origin">
          <option value="">{{ $t('edit_profile.select_country_placeholder') }}</option>
          <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
        </select>

        <input type="number" v-model="userProfile.age" :placeholder="$t('edit_profile.age_placeholder')" />
        <input type="text" v-model="userProfile.political_ideology" :placeholder="$t('edit_profile.political_ideology_placeholder')" />
        <textarea v-model="userProfile.personal_profile" :placeholder="$t('edit_profile.personal_profile_placeholder')"></textarea>
        
        <div class="form-group">
          <label for="avatar-upload">{{ $t('edit_profile.avatar_label') }}</label>
          <input type="file" id="avatar-upload" @change="onFileSelected" accept="image/*" />
          <p class="help-text">{{ $t('edit_profile.avatar_help_text') }}</p>
          <div v-if="avatarPreview" class="avatar-preview-container">
            <img :src="avatarPreview" alt="Avatar Preview" class="avatar-preview" />
          </div>
        </div>

        <select v-model="userProfile.selected_language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button type="submit" class="btn-primary">{{ $t('edit_profile.save_changes_button') }}</button>
      </form>
      <button @click="goBackToGame" class="btn-secondary" style="margin-top: 1rem;">{{ $t('edit_profile.back_to_game_button') }}</button>
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
  watch: {
    'userProfile.selected_language'(newLang) {
      if (newLang) {
        this.$i18n.locale = newLang;
      }
    },
  },
  methods: {
    async fetchUserProfile() {
      try {
        const res = await api.get('/auth/profile');
        this.userProfile = res.data;
        if (this.userProfile.avatar_url) {
          this.avatarPreview = `http://localhost:5000${this.userProfile.avatar_url}`;
        }
        // Set the i18n locale based on the fetched user profile language
        if (this.userProfile.selected_language) {
          this.$i18n.locale = this.userProfile.selected_language;
          localStorage.setItem('selectedLanguage', this.userProfile.selected_language);
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
        // Save the selected language to localStorage after successful profile update
        localStorage.setItem('selectedLanguage', this.userProfile.selected_language);
        alert(this.$t('edit_profile.profile_updated_successfully'));
        this.$router.push('/game');
      } catch (err) {
        console.error('Error saving user profile:', err);
        alert(this.$t('edit_profile.error_saving_profile'));
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
