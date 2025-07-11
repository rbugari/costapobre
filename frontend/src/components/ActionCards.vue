<template>
  <div class="action-cards-container">
    <h3>Elige una acción para: {{ type.name }}</h3>
    <div v-if="isLoading">Cargando acciones...</div>
    <div v-if="error">{{ error }}</div>
    <div class="cards-grid">
      <div v-for="card in cards" :key="card.titulo" class="card" @click="selectCard(card)">
        <h4>{{ card.titulo }}</h4>
        <img v-if="card.image_url" :src="getCardImageUrl(card.image_url)" :alt="card.titulo" class="card-image" />
        <p>{{ card.descripcion }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'ActionCards',
  props: {
    type: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      cards: [],
      isLoading: false,
      error: null,
    };
  },
  watch: {
    type: {
      immediate: true,
      handler(newType) {
        if (newType) {
          this.fetchCards();
        }
      },
    },
  },
  methods: {
    async fetchCards() {
      this.isLoading = true;
      this.error = null;
      try {
        // Añadir verificaciones de nulidad
        if (!this.$parent.gameState || !this.$parent.gameState.levelInfo || !this.$parent.gameState.userInfo) {
          console.warn('ActionCards: gameState o userInfo no disponibles. No se pueden cargar las tarjetas.');
          this.isLoading = false;
          return;
        }

        const response = await api.post('/ai/get-cards', {
          cargo_actual: this.$parent.gameState.levelInfo.title,
          tipo_de_corrupcion_elegido: this.type.name,
          idioma: this.$parent.gameState.userInfo.selected_language || 'es',
        });
        this.cards = response.data;
      } catch (err) {
        console.error('Error fetching cards:', err);
        this.error = 'No se pudieron cargar las acciones.';
      } finally {
        this.isLoading = false;
      }
    },
    selectCard(card) {
      this.$emit('selectCard', card);
    },
    getCardImageUrl(relativePath) {
      return `http://localhost:5000${relativePath}`;
    },
  },
};
</script>

<style scoped>
.action-cards-container {
  text-align: center;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
.card {
  background: #313842;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.card-image {
  width: 80%;
  height: auto;
  border-radius: 4px;
  margin-bottom: 10px;
  object-fit: cover;
}
</style>