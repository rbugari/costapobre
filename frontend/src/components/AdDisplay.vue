<template>
  <div class="ad-overlay">
    <div class="ad-container">
      <img :src="adImage" alt="Advertisement" class="ad-image" />
      <p class="ad-text">{{ $t('ad_display.ad_text') }}</p>
      <div class="ad-buttons">
        <button @click="continueGame" class="btn-primary">{{ $t('ad_display.continue_button') }}</button>
        <button @click="goPremium" class="btn-secondary">{{ $t('ad_display.go_premium_button', { price: 2 }) }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import adImage from '@/assets/pub_1.png';

export default {
  name: 'AdDisplay',
  data() {
    return {
      adImage: adImage,
    };
  },
  methods: {
    continueGame() {
      this.$emit('ad-closed');
    },
    async goPremium() {
      try {
        await api.post('/game/go-premium');
        alert(this.$t('ad_display.premium_success_alert'));
        this.$emit('ad-closed');
        // Optionally, refresh game state to reflect premium status immediately
        this.$emit('premium-activated');
      } catch (error) {
        console.error('Error going premium:', error);
        alert(this.$t('ad_display.premium_error_alert'));
      }
    },
  },
};
</script>

<style scoped>
.ad-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.ad-container {
  background-color: var(--noir-retro-panel-background);
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
}

.ad-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 20px;
}

.ad-text {
  font-size: 1.2em;
  color: var(--noir-retro-pure-black);
  margin-bottom: 25px;
}

.ad-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn-primary, .btn-secondary {
  padding: 12px 25px;
  border-radius: 5px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: var(--noir-retro-primary-accent);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #1a5f62;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #5a6268;
}
</style>
