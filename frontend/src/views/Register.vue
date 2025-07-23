<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>{{ $t('register.create_account_title') }}</h2>
      <form @submit.prevent="register">
        <input type="text" v-model="nickname" :placeholder="$t('register.nickname_placeholder')" required />
        <input type="email" v-model="email" :placeholder="$t('register.email_placeholder')" required />
        <input type="password" v-model="password" :placeholder="$t('register.password_placeholder')" required />
        <input type="password" v-model="passwordConfirm" :placeholder="$t('register.confirm_password_placeholder')" required />
        
        <select v-model="country_of_origin">
          <option value="">{{ $t('register.select_country_placeholder') }}</option>
          <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
        </select>

        <input type="number" v-model="age" :placeholder="$t('register.age_placeholder')" />
        <input type="text" v-model="political_ideology" :placeholder="$t('register.political_ideology_placeholder')" />
        <textarea v-model="personal_profile" :placeholder="$t('register.personal_profile_placeholder')"></textarea>
        
        <div class="form-group">
          <label for="avatar-upload">{{ $t('register.avatar_label') }}</label>
          <input type="file" id="avatar-upload" @change="onFileSelected" accept="image/*" />
          <p class="help-text">{{ $t('register.avatar_help_text') }}</p>
          <div v-if="avatarPreviewUrl" class="avatar-preview-container">
            <img :src="avatarPreviewUrl" alt="Avatar Preview" class="avatar-preview" />
          </div>
        </div>

        <select v-model="selected_language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button type="submit" class="btn-primary">{{ $t('register.register_button') }}</button>
      </form>
      <p class="auth-switch">
        {{ $t('register.already_have_account_question') }} <router-link to="/" class="btn-secondary">{{ $t('register.login_link') }}</router-link>
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
  watch: {
    selected_language(newLang) {
      this.$i18n.locale = newLang;
    },
  },
  methods: {
    async register() {
      if (this.password !== this.passwordConfirm) {
        alert(this.$t('register.passwords_do_not_match'));
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
        alert(this.$t('register.registration_successful_prefix') + ' ' + this.$t('register.registration_successful_suffix')); // 'Registro exitoso. Por favor, verifica tu email...'
        this.$router.push({ name: 'VerifyEmail', query: { email: this.email } });
      } catch (err) {
        const errorMessage = err.response?.data?.msg || this.$t('register.unexpected_error');
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
        alert(this.$t('register.invalid_file_format'));
        this.selectedFile = null;
        this.avatarPreviewUrl = null;
        return;
      }

      // Validar tamaño de archivo (2MB máximo)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert(this.$t('register.file_size_exceeded'));
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