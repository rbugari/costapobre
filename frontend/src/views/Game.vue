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
          Nivel: <strong>{{ gameState.level }} / {{ gameState.maxLevel }}</strong>
        </p>
        <p>
          Puntos de Corrupción (PC): <strong>{{ gameState.pc }}</strong>
          <span v-if="gameState.levelInfo">
            / {{ gameState.levelInfo.pc_required_for_ascension }}
          </span>
        </p>
        <p>
          Influencia (INF): <strong>{{ gameState.inf }}</strong>
          <span v-if="gameState.levelInfo">
            / {{ gameState.levelInfo.inf_required_for_ascension }}
          </span>
        </p>
        <p>
          Barra de Escándalo (BE): <strong>{{ gameState.be }}</strong>
        </p>
      </div>
    </div>

    <!-- Área de Gestión de Escándalo -->
    <div v-if="gameState && gameState.be > 85 && !showScandalEvent" class="scandal-area">
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

    <!-- Monetization Prompts -->
    <div v-if="showPremiumPrompt" class="monetization-prompt">
      <h3>¡Desbloquea el Juego Completo!</h3>
      <p>Para acceder a los niveles superiores y la experiencia completa de Corruptia, necesitas adquirir el Pase Premium.</p>
      <button @click="purchasePremium">Comprar Pase Premium (2€)</button>
    </div>

    <div v-if="showScandalRescuePrompt" class="monetization-prompt">
      <h3>¡Rescata tu Carrera Política!</h3>
      <p>Tu nivel de escándalo es crítico. Paga para reducirlo y evitar consecuencias graves.</p>
      <button @click="purchaseScandalRescue">Pagar Rescate (1€)</button>
    </div>

    <div v-if="showGameOver" class="monetization-prompt game-over">
      <h3>¡GAME OVER!</h3>
      <p>Tu escándalo ha llegado a un nivel insostenible y no tienes el desbloqueo completo. Tu carrera política ha terminado.</p>
      <p>Para continuar jugando y tener inmunidad a futuros GAME OVER por escándalo, adquiere el Desbloqueo Completo.</p>
      <!-- Optionally, add a button to purchase full unlock if not already offered -->
    </div>

    <div v-if="showAdLimitWarning" class="monetization-prompt ad-limit-warning">
      <h3>Límite de Anuncios Alcanzado</h3>
      <p>Como usuario invitado, has alcanzado el límite de anuncios recompensados. No podrás ver más anuncios por ahora.</p>
    </div>

    <!-- Área Operativa / Selección -->
    <div class="game-operational-area" v-if="currentScreen === 'game' && gameState">
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
      <div v-else-if="selectedCorruptionType && !selectedCard">
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
    <div class="llm-evaluation-area" v-if="currentScreen === 'evaluation' && llmEvaluation">
      <EvaluationView
        :evaluation="llmEvaluation"
        @closeEvaluation="closeEvaluation"
      />
    </div>

    <!-- Tarjeta seleccionada para jugar -->
    <div class="card-play-area" v-if="currentScreen === 'game' && selectedCard && gameConfig">
      <PlayCardView
        :card="selectedCard"
        @playCard="handlePlayCard"
        @cancel="cancelPlayCard"
        :gameConfig="gameConfig"
      />
    </div>

    <!-- Evento de Escándalo -->
    <ScandalEvent
      v-if="currentScreen === 'scandal' && showScandalEvent"
      :headline="scandalHeadline"
      @scandal-resolved="handleScandalResolved"
    />

    <!-- Pantalla de GAME OVER -->
    <div v-if="currentScreen === 'gameOver' && showGameOver" class="monetization-prompt game-over">
      <h3>¡GAME OVER!</h3>
      <p>Tu escándalo ha llegado a un nivel insostenible y tu carrera política ha terminado.</p>
      <button @click="$router.push('/login')">Volver al Inicio</button>
    </div>

    <!-- Pantalla de Acceso Premium -->
    <div v-if="currentScreen === 'premiumAccess'" class="monetization-prompt">
      <h3>¡Acceso Premium Requerido!</h3>
      <p>Has completado los niveles gratuitos. Adquiere el Pase Premium para continuar.</p>
      <button @click="$router.push('/premium-access')">Ir a la Tienda Premium</button>
    </div>

  </div>
</template>

<script>
import ActionCards from '../components/ActionCards.vue';
import EvaluationView from '../components/EvaluationView.vue';
import PlayCardView from '../components/PlayCardView.vue';
import ScandalEvent from '../components/ScandalEvent.vue'; // Importar el nuevo componente
import api, { monetizationApi } from '../api'; // Importar la instancia de axios configurada y la API de monetización

export default {
  name: 'Game',
  components: {
    ActionCards,
    EvaluationView,
    PlayCardView,
    ScandalEvent // Registrar el nuevo componente
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
      gameConfig: {},
      showPremiumPrompt: false,
      showScandalRescuePrompt: false,
      showGameOver: false,
      showAdLimitWarning: false,
      showScandalEvent: false, // Nuevo estado para controlar la visibilidad del evento de escándalo
      scandalHeadline: '', // Nuevo estado para el titular del escándalo
      currentScreen: 'game', // Controla qué pantalla se muestra: 'game', 'evaluation', 'scandal', 'gameOver', 'premiumAccess'
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
    async handlePlayCard(result) {
      console.log('Game.vue: handlePlayCard - Raw result from backend:', result); // Nuevo log
      const actionTitle = this.selectedCard ? this.selectedCard.titulo : 'N/A'; // Capture title before clearing
      this.selectedCard = null;

      // Manejar GAME OVER
      if (result.evaluation.gameOver) {
        this.showGameOver = true; // Mantener esta bandera para el prompt de monetización
        this.gameState = null; // Limpiar gameState
        this.llmEvaluation = null; // Limpiar evaluación
        this.showScandalEvent = false; // Asegurarse de que el modal de escándalo no se muestre
        this.currentScreen = 'gameOver';
        return; // Detener la ejecución
      }

      // Manejar redirección a pantalla premium
      if (result.evaluation.requiresPremiumAccess) {
        console.log('Game.vue: handlePlayCard - Acceso premium requerido. Redirigiendo...');
        this.currentScreen = 'premiumAccess';
        this.$router.push('/premium-access');
        return; // Detener la ejecución
      }

      // Manejar evento de escándalo
      if (result.evaluation.scandal_triggered) {
        this.scandalHeadline = result.evaluation.scandal_headline;
        this.showScandalEvent = true; // Mantener esta bandera para el componente
        this.llmEvaluation = null; // Limpiar evaluación para que no se muestre la vista de evaluación
        this.currentScreen = 'scandal';
        return; // Detener la ejecución
      }

      // Si no hay GAME OVER, premium requerido o escándalo, mostrar la evaluación normal
      this.llmEvaluation = result.evaluation; // Asignar la evaluación completa
      this.gameState = result.evaluation.updated_game_state; // Actualizar el estado del juego
      this.currentScreen = 'evaluation';

      // Check for scandal rescue prompt after evaluation (si no se disparó un escándalo mayor)
      if (result.evaluation.requiresRescue) {
        this.showScandalRescuePrompt = true;
      } else {
        this.showScandalRescuePrompt = false;
      }

      // Guardar la interacción en el historial
      try {
        if (this.gameState) {
          await api.post('/history/add', {
            level: this.gameState.level,
            action_title: actionTitle,
            narrated_plan_text: result.narrated_plan_text, // CORREGIDO: Obtener el plan narrado directamente
            llm_evaluation_json: result.evaluation.llm_evaluation_json,
            llm_advice_json: result.evaluation.llm_advice_json,
          });
          console.log('Interacción LLM guardada en el historial.');
        }
      } catch (historyErr) {
        console.error('Error al guardar la interacción LLM en el historial:', historyErr);
      }
    },
    cancelPlayCard() {
      this.selectedCard = null;
    },
    closeEvaluation() {
      this.llmEvaluation = null;
      this.selectedCorruptionType = null;
      this.currentScreen = 'game'; // Volver a la pantalla de juego normal
    },
    // Nuevo método para manejar la resolución del escándalo desde ScandalEvent.vue
    handleScandalResolved(updatedGameState) {
      this.gameState = updatedGameState;
      this.showScandalEvent = false; // Ocultar el evento de escándalo
      this.llmEvaluation = null; // Limpiar la evaluación para permitir nuevas acciones
      this.selectedCorruptionType = null; // Limpiar el tipo de corrupción seleccionado
      this.currentScreen = 'game'; // Volver a la pantalla de juego normal
    },
    async loadGameState() {
      this.isLoadingGameState = true;
      this.errorGameState = null;
      try {
        const response = await api.get('/game/progress');
        this.gameState = response.data;

        // Verificar si se disparó un escándalo al cargar el juego
        if (response.data.scandal_triggered) {
          this.scandalHeadline = response.data.scandal_headline;
          this.showScandalEvent = true;
        } else {
          this.showScandalEvent = false;
        }

        // Handle monetization flags
        if (this.gameState.requiresPremium && !this.gameState.userInfo.tipo_invitado) {
          this.showPremiumPrompt = true;
        } else {
          this.showPremiumPrompt = false;
        }

        // Check for GAME OVER condition (if backend sends a specific status or message)
        if (response.status === 402 && response.data.msg && response.data.msg.includes('GAME OVER')) {
          this.showGameOver = true;
        } else {
          this.showGameOver = false;
        }

        // Check for scandal rescue prompt
        if (response.status === 402 && response.data.requiresRescue) {
          this.showScandalRescuePrompt = true;
        } else {
          this.showScandalRescuePrompt = false;
        }

        // Check for guest user ad limit
        if (this.gameState.userInfo.tipo_invitado && this.gameState.userInfo.anuncios_vistos >= this.gameConfig.INVITADO_MAX_ANUNCIOS) {
          this.showAdLimitWarning = true;
        } else {
          this.showAdLimitWarning = false;
        }
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
    async loadGameConfig() {
      try {
        const response = await api.get('/game/config');
        this.gameConfig = response.data;
      } catch (error) {
        console.error('Error loading game config:', error);
      }
    },
    async purchasePremium() {
      try {
        const response = await monetizationApi.simulatePremiumPurchase();
        this.gameState.userInfo.premium = response.data.user.premium;
        this.gameState.userInfo.pagoTotal = response.data.user.pagoTotal;
        this.showPremiumPrompt = false;
        alert('Pase Premium adquirido con éxito!');
      } catch (error) {
        console.error('Error purchasing premium:', error);
        alert(`Error al adquirir el Pase Premium: ${error.response ? error.response.data.message : error.message}`);
      }
    },
    async purchaseScandalRescue() {
      try {
        const response = await monetizationApi.simulateScandalRescue();
        this.gameState.userInfo.rescatePago = response.data.user.rescatePago;
        this.gameState.userInfo.pagoTotal = response.data.user.pagoTotal;
        this.showScandalRescuePrompt = false;
        alert('Rescate de escándalo adquirido con éxito!');
      } catch (error) {
        console.error('Error purchasing scandal rescue:', error);
        alert(`Error al adquirir el rescate de escándalo: ${error.response ? error.response.data.message : error.message}`);
      }
    },
  },
  async mounted() {
    await this.loadGameState();
    if (!this.errorGameState) {
      this.loadCorruptionTypes();
      await this.loadGameConfig(); // Ensure gameConfig is loaded before proceeding
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

.monetization-prompt {
  background-color: #313842;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
  border: 1px solid var(--primary-color);
}

.monetization-prompt h3 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.monetization-prompt p {
  margin-bottom: 15px;
  color: #f3f3f3;
}

.monetization-prompt button {
  background-color: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

.monetization-prompt button:hover {
  background-color: #4a1da8;
}

.game-over {
  background-color: #c62828;
  border-color: #ef9a9a;
}

.game-over h3 {
  color: white;
}

.ad-limit-warning {
  background-color: #ffc107;
  color: #333;
  border-color: #e0a800;
}

.ad-limit-warning h3 {
  color: #333;
}
</style>