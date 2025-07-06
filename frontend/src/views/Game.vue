<template>
  <div class="game-container">
    <div v-if="gameState" class="game-info-panel">
      <div class="level-details">
        <h3>
          Cargo Actual:
          {{ gameState.levelInfo ? gameState.levelInfo.title : 'Cargando...' }}
        </h3>
        <img
          v-if="gameState.levelInfo && gameState.levelInfo.character_image_url"
          :src="getCharacterImageUrl(gameState.levelInfo.character_image_url)"
          alt="Character Image"
          class="character-image"
        />
        <p v-if="gameState.levelInfo">
          {{ gameState.levelInfo.description_visual }}
        </p>
      </div>
      <div class="resource-details">
        <p>
          Nivel: <strong>{{ gameState.level }}</strong>
        </p>
        <p>
          Puntos de Corrupción (PC): <strong>{{ gameState.pc }}</strong>
          <span v-if="gameState.nextLevelInfo">
            / {{ gameState.nextLevelInfo.pc_required_for_ascension }}
          </span>
        </p>
        <p>
          Influencia (INF): <strong>{{ gameState.inf }}</strong>
          <span v-if="gameState.nextLevelInfo">
            / {{ gameState.nextLevelInfo.inf_required_for_ascension }}
          </span>
        </p>
        <p>
          Barra de Escándalo (BE): <strong>{{ gameState.be }}</strong>
        </p>
      </div>
    </div>

    <!-- Área de Gestión de Escándalo -->
    <div v-if="gameState && gameState.be > 85" class="scandal-area">
      <div class="scandal-alert">
        ¡Alerta! Tu nivel de escándalo es peligrosamente alto.
      </div>
      <div class="scandal-actions">
        <input
          type="number"
          v-model.number="infToSpend"
          placeholder="INF a gastar"
          min="1"
          :max="gameState.inf"
        />
        <button @click="reduceScandal" :disabled="!infToSpend || infToSpend <= 0">
          Reducir Escándalo
        </button>
      </div>
    </div>

    <!-- Área Operativa / Selección -->
    <div class="game-operational-area" v-if="!selectedCard && !llmEvaluation">
      <div v-if="corruptionTypes.length > 0 && !selectedCorruptionType">
        <h3>Tipos de Corrupción Disponibles:</h3>
        <div class="corruption-types-list">
          <span
            v-for="(type, index) in corruptionTypes"
            :key="index"
            class="corruption-type"
          >
            {{ type.name }}
          </span>
        </div>
        <button @click="spinRoulette" class="spin-button">Girar Ruleta</button>
      </div>
      <div v-else-if="selectedCorruptionType && !selectedCard && !llmEvaluation">
        <h4>Tipo de Corrupción Seleccionado:</h4>
        <p class="selected-type-display">{{ selectedCorruptionType.name }}</p>
        <!-- Aquí van las tarjetas de acciones según el tipo de corrupción seleccionado -->
        <ActionCards
          :type="selectedCorruptionType"
          @selectCard="handleSelectCard"
        />
      </div>
    </div>

    <!-- Evaluación de la LLM -->
    <div class="llm-evaluation-area" v-if="llmEvaluation">
      <EvaluationView
        :evaluation="llmEvaluation"
        @closeEvaluation="closeEvaluation"
      />
    </div>

    <!-- Tarjeta seleccionada para jugar -->
    <div class="card-play-area" v-if="selectedCard">
      <PlayCardView
        :card="selectedCard"
        @playCard="handlePlayCard"
        @cancel="cancelPlayCard"
      />
    </div>
  </div>
</template>

<script>
import ActionCards from '../components/ActionCards.vue';
import EvaluationView from '../components/EvaluationView.vue';
import PlayCardView from '../components/PlayCardView.vue';
import api from '../api'; // Importar la instancia de axios configurada

export default {
  name: 'Game',
  components: {
    ActionCards,
    EvaluationView,
    PlayCardView
  },
  data() {
    return {
      gameState: null,
      corruptionTypes: [],
      selectedCorruptionType: null,
      selectedCard: null,
      llmEvaluation: null,
      isLoadingGameState: false,
      isLoadingCorruptionTypes: false,
      errorGameState: null,
      errorCorruptionTypes: null,
      infToSpend: 1,
    };
  },
  methods: {
    getCharacterImageUrl(relativePath) {
      // Asume que el backend está en http://localhost:5000
      // y sirve imágenes estáticas desde su raíz.
      return `http://localhost:5000${relativePath}`;
    },
    async spinRoulette() {
      if (this.corruptionTypes.length === 0) return;
      const randomIndex = Math.floor(Math.random() * this.corruptionTypes.length);
      this.selectedCorruptionType = this.corruptionTypes[randomIndex];
    },
    
    handleSelectCard(card) {
      this.selectedCard = card;
    },
    handlePlayCard(result) {
      this.selectedCard = null;
      this.llmEvaluation = result.evaluation;
      // Actualizar el estado del juego con los datos de la evaluación
      this.gameState = result.evaluation.updated_game_state;
    },
    cancelPlayCard() {
      this.selectedCard = null;
    },
    closeEvaluation() {
      this.llmEvaluation = null;
      this.selectedCorruptionType = null;
    },
    async loadGameState() {
      this.isLoadingGameState = true;
      this.errorGameState = null;
      try {
        const response = await api.get('/game/progress');
        this.gameState = response.data;
      } catch (error) {
        console.error('Error loading game state:', error);
        this.errorGameState = 'Failed to load game state.';
      } finally {
        this.isLoadingGameState = false;
      }
    },
    async loadCorruptionTypes() {
      if (!this.gameState || !this.gameState.levelInfo) return;
      this.isLoadingCorruptionTypes = true;
      this.errorCorruptionTypes = null;
      try {
        const response = await api.post('/ai/get-corruption-types', {
          cargo_actual: this.gameState.levelInfo.title,
          idioma: this.gameState.userInfo.selected_language || 'es',
        });
        this.corruptionTypes = response.data.map(name => ({ name }));
        console.log('Frontend: Tipos de corrupción recibidos:', this.corruptionTypes.length);
      } catch (error) {
        console.error('Error loading corruption types:', error);
        this.errorCorruptionTypes = 'Failed to load corruption types.';
      } finally {
        this.isLoadingCorruptionTypes = false;
      }
    },
    async reduceScandal() {
      if (this.infToSpend > this.gameState.inf) {
        alert('No tienes suficiente Influencia.');
        return;
      }
      try {
        const response = await api.post('/game/reduce-scandal', {
          inf_to_spend: this.infToSpend,
        });
        this.gameState = response.data;
        this.infToSpend = 1; // Reset input
        alert(`Has gastado ${this.infToSpend} de Influencia para reducir tu Escándalo.`);
      } catch (error) {
        console.error('Error reducing scandal:', error);
        alert('No se pudo reducir el escándalo.');
      }
    },
  },
  async mounted() {
    await this.loadGameState();
    if (!this.errorGameState) {
      this.loadCorruptionTypes();
    }
  }
};
</script>

<style scoped>
.game-container {
  max-width: 100%; /* Ajusta al 100% del contenedor padre (GameLayout) */
  margin: 0; /* Elimina el margen superior */
  background: #212529;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  color: #f3f3f3;
}

.game-info-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px; /* Añade un padding inferior para separar del contenido siguiente */
  border-bottom: 1px solid #333; /* Línea divisoria sutil */
}

@media (min-width: 768px) {
  .game-info-panel {
    flex-direction: row;
    justify-content: space-between;
    gap: 32px;
  }
}

.level-details {
  flex: 1;
}
.character-image {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-top: 8px;
  background: #2c2f34;
  object-fit: cover;
}
.resource-details p {
  margin: 0 0 4px 0;
}
.scandal-area {
  background-color: #ffcdd2;
  color: #c62828;
  padding: 15px;
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid #ef9a9a;
}
.scandal-alert {
  font-weight: bold;
  margin-bottom: 10px;
}
.scandal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap; /* Allow wrapping on small screens */
}
.scandal-actions input {
  width: 100px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #c62828;
}
.scandal-actions button {
  background-color: #d32f2f;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.scandal-actions button:disabled {
  background-color: #ef9a9a;
  cursor: not-allowed;
}
.corruption-types-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.corruption-type {
  background: #313842;
  padding: 8px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.corruption-type:hover {
  background: #5f25d6;
  color: #fff;
}
.game-operational-area,
.llm-evaluation-area,
.card-play-area {
  margin-top: 32px;
}
</style>
