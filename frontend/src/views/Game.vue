<template>
  <div class="game-container">
    <!-- Panel de Información del Juego (Rediseñado) -->
    <div v-if="gameState" class="game-info-panel">
      <!-- 50% Izquierda: Info del Personaje -->
      <div class="character-info-container">
        <img
          v-if="gameState.levelInfo && gameState.levelInfo.character_image_url"
          :src="getCharacterImageUrl(gameState.levelInfo.character_image_url)"
          alt="Character Image"
          class="character-image"
        />
        <div class="character-text">
          <h3 class="character-title">{{ gameState.levelInfo ? gameState.levelInfo.title : 'Cargando...' }}</h3>
          <p class="character-description" v-if="gameState.levelInfo">{{ gameState.levelInfo.description_visual }}</p>
        </div>
      </div>

      <!-- 50% Derecha: Recursos -->
      <div class="resources-container">
        <div class="resource-item">
          <div class="resource-label">
            <span class="resource-title">Puntos de Corrupción (PC)</span>
            <span class="resource-value">{{ gameState.pc }} / {{ gameState.levelInfo.pc_required_for_ascension }}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill pc-bar" :style="{ width: (gameState.pc / gameState.levelInfo.pc_required_for_ascension * 100) + '%' }"></div>
          </div>
        </div>
        <div class="resource-item">
          <div class="resource-label">
            <span class="resource-title">Influencia (INF)</span>
            <span class="resource-value">{{ gameState.inf }} / 100</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill inf-bar" :style="{ width: gameState.inf + '%' }"></div>
          </div>
        </div>
        <div class="resource-item">
          <div class="resource-label">
            <span class="resource-title">Barra de Escándalo (BE)</span>
            <span class="resource-value">{{ gameState.be }} / 100</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill be-bar" :class="{ 'be-warning': gameState.be > 50 && gameState.be <= 80, 'be-danger': gameState.be > 80 }" :style="{ width: gameState.be + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- El resto del template original -->
    <div v-if="gameState && gameState.be > 85 && !showScandalEvent" class="scandal-area">
      <div class="scandal-alert">¡Alerta! Tu nivel de escándalo es peligrosamente alto.</div>
      <div class="scandal-actions">
        <input type="number" v-model.number="infToSpend" placeholder="INF a gastar" min="1" :max="gameState.inf" />
        <button @click="reduceScandal" :disabled="!infToSpend || infToSpend <= 0" class="btn-primary">Reducir Escándalo</button>
      </div>
    </div>
    <div class="game-operational-area" v-if="currentScreen === 'game' && gameState">
      <div v-if="corruptionTypes.length > 0 && !selectedCorruptionType">
        <CorruptionWheel :corruptionTypes="corruptionTypes" @type-selected="handleCorruptionTypeSelected" />
      </div>
      <div v-else-if="selectedCorruptionType && !selectedCard">
        <h3 class="selected-type-display">{{ selectedCorruptionType.name }}</h3>
        <ActionCards :type="selectedCorruptionType" @selectCard="handleSelectCard" />
      </div>
    </div>
    <div class="llm-evaluation-area" v-if="currentScreen === 'evaluation' && llmEvaluation">
      <EvaluationView :evaluation="llmEvaluation" @closeEvaluation="closeEvaluation" />

      <div v-if="isDevMode && devCalculationDetails" class="dev-calculation-box">
        <h3>Detalles de Cálculo (Dev)</h3>
        <p><strong>Puntuación LLM (1-10):</strong> {{ devCalculationDetails.llm_pc_valor }}</p>
        <p><strong>Factor de Ganancia PC (Nivel):</strong> {{ devCalculationDetails.pc_gain_factor }}</p>
        <p><strong>Influencia Actual:</strong> {{ devCalculationDetails.inf_actual }}</p>
        <p><strong>Multiplicador por Influencia:</strong> {{ devCalculationDetails.influence_multiplier.toFixed(2) }}</p>
        <p><strong>Ganancia PC (sin redondear):</strong> {{ devCalculationDetails.raw_pc_gain.toFixed(2) }}</p>
        <p><strong>Ganancia PC (final redondeada):</strong> {{ devCalculationDetails.final_pc_gain }}</p>
      </div>
    </div>
    <div class="card-play-area" v-if="currentScreen === 'game' && selectedCard && gameConfig">
      <PlayCardView :card="selectedCard" @playCard="handlePlayCard" @cancel="cancelPlayCard" :gameConfig="gameConfig" :generatedPlan="generatedDevPlan" />
    </div>
    <ScandalEvent v-if="currentScreen === 'scandal' && showScandalEvent" :headline="scandalHeadline" :user-info="gameState.userInfo" @scandal-resolved="handleScandalResolved" />
    <div v-if="currentScreen === 'gameOver' && showGameOver" class="monetization-prompt game-over">
      <h3>¡GAME OVER!</h3>
      <p>Tu escándalo ha llegado a un nivel insostenible y tu carrera política ha terminado.</p>
      <button @click="$router.push('/login')" class="btn-primary">Volver al Inicio</button>
    </div>
    <div v-if="currentScreen === 'premiumAccess'" class="monetization-prompt">
      <h3>¡Acceso Premium Requerido!</h3>
      <p>Has completado los niveles gratuitos. Adquiere el Pase Premium para continuar.</p>
      <button @click="$router.push('/premium-access')" class="btn-primary">Ir a la Tienda Premium</button>
    </div>
    <div v-if="isDevMode" class="dev-tools">
      <h3>Herramientas de Desarrollo</h3>
      <button @click="addPc()" class="btn-dev-tool">Añadir 10% PC/INF</button>
      <button @click="addInf()" class="btn-dev-tool">Añadir 50% PC/INF</button>
      <button @click="triggerScandal" class="btn-dev-tool">Forzar Escándalo</button>
      <select v-model="selectedLevel" @change="changeLevel">
        <option disabled value="">Seleccionar Nivel</option>
        <option v-for="n in gameState.maxLevel" :key="n" :value="n">Nivel {{ n }}</option>
      </select>
      <button @click="resetProgress" class="btn-dev-tool">Resetear Progreso</button>

      <div v-if="selectedCard">
        <select v-model="devPlanQuality">
          <option value="muy bueno">Muy Bueno</option>
          <option value="bueno">Bueno</option>
          <option value="regular">Regular</option>
          <option value="malo">Malo</option>
        </select>
        <button @click="generateDevPlan" class="btn-dev-tool">Generar Plan (Dev)</button>
      </div>
    </div>
  </div>
</template>

<script>
import ActionCards from '../components/ActionCards.vue';
import EvaluationView from '../components/EvaluationView.vue';
import PlayCardView from '../components/PlayCardView.vue';
import ScandalEvent from '../components/ScandalEvent.vue';
import CorruptionWheel from '../components/CorruptionWheel.vue';
import api from '../api';

export default {
  name: 'Game',
  components: {
    ActionCards,
    EvaluationView,
    PlayCardView,
    ScandalEvent,
    CorruptionWheel
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
      showScandalEvent: false,
      scandalHeadline: '',
      currentScreen: 'game',
      isDevMode: false, // Explicitly initialize to false
      selectedLevel: '',
      devPlanQuality: 'bueno',
      generatedDevPlan: '',
      devCalculationDetails: null,
    };
  },
  methods: {
    getCharacterImageUrl(relativePath) {
      return `http://localhost:5000${relativePath}`;
    },
    handleCorruptionTypeSelected(selectedType) {
      this.selectedCorruptionType = selectedType;
    },
    handleSelectCard(card) {
      this.selectedCard = card;
      console.log('Game.vue: selectedCard updated to:', this.selectedCard);
    },
    async handlePlayCard(result) {
      const actionTitle = this.selectedCard ? this.selectedCard.titulo : 'N/A';
      this.selectedCard = null;
      if (result.evaluation.gameOver) {
        this.showGameOver = true;
        this.gameState = null;
        this.llmEvaluation = null;
        this.showScandalEvent = false;
        this.currentScreen = 'gameOver';
        return;
      }
      if (result.evaluation.requiresPremiumAccess) {
        this.currentScreen = 'premiumAccess';
        this.$router.push('/premium-access');
        return;
      }
      if (result.evaluation.scandal_triggered) {
        this.scandalHeadline = result.evaluation.scandal_headline;
        this.showScandalEvent = true;
        this.llmEvaluation = null;
        this.currentScreen = 'scandal';
        return;
      }
      this.llmEvaluation = result.evaluation;
      this.gameState = result.evaluation.updated_game_state;
      this.devCalculationDetails = result.evaluation.dev_calculation_details;
      this.currentScreen = 'evaluation';
      if (result.evaluation.requiresRescue) {
        this.showScandalRescuePrompt = true;
      } else {
        this.showScandalRescuePrompt = false;
      }
      try {
        if (this.gameState) {
          await api.post('/history/add', {
            level: this.gameState.level,
            action_title: actionTitle,
            narrated_plan_text: result.narrated_plan_text,
            llm_evaluation_json: result.evaluation.llm_evaluation_json,
            llm_advice_json: result.evaluation.llm_advice_json,
          });
        }
      } catch (historyErr) {
        console.error('Error saving LLM interaction to history:', historyErr);
      }
    },
    cancelPlayCard() {
      this.selectedCard = null;
    },
    closeEvaluation() {
      this.llmEvaluation = null;
      this.selectedCorruptionType = null;
      this.currentScreen = 'game';
      this.generatedDevPlan = ''; // Reset the generated plan
      this.loadCorruptionTypes();
    },
    handleScandalResolved(updatedGameState) {
      this.gameState = updatedGameState;
      this.showScandalEvent = false;
      this.llmEvaluation = null;
      this.selectedCorruptionType = null;
      this.currentScreen = 'game';
    },
    async loadGameState() {
      this.isLoadingGameState = true;
      this.errorGameState = null;
      try {
        const response = await api.get('/game/progress');
        this.gameState = response.data;
        this.isDevMode = this.gameState.gameMode === 'desarrollo';
        console.log('Game Mode received from backend:', this.gameState.gameMode);
        if (response.data.scandal_triggered) {
          this.scandalHeadline = response.data.scandal_headline;
          this.showScandalEvent = true;
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
        this.infToSpend = 1;
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
    async generateDevPlan() {
      console.log('generateDevPlan called. Quality:', this.devPlanQuality);
      if (!this.selectedCard) {
        console.warn('No card selected for dev plan generation.');
        return;
      }
      try {
        const response = await api.post('/ai/generate-dev-plan', {
          titulo_accion_elegida: this.selectedCard.titulo,
          descripcion_accion_elegida: this.selectedCard.descripcion,
          tags_accion_elegida: this.selectedCard.tags_obligatorios,
          quality_level: this.devPlanQuality,
          idioma: this.gameState.userInfo.selected_language || 'es',
        });
        this.generatedDevPlan = response.data.plan;
        console.log('LLM Generated Dev Plan:', this.generatedDevPlan);
      } catch (error) {
        console.error('Error generating dev plan:', error);
        alert('Error al generar el plan de desarrollo.');
      }
    },
    // Placeholder methods for development tools
    addPc() {
      if (!this.gameState) {
        console.warn('gameState is null. Cannot add PC/INF.');
        return;
      }
      const pcIncrease = Math.round(this.gameState.pc * 0.10);
      const infIncrease = Math.round(this.gameState.inf * 0.10);
      this.gameState.pc += pcIncrease;
      this.gameState.inf += infIncrease;
      console.log(`Added ${pcIncrease} PC and ${infIncrease} INF (10%). New PC: ${this.gameState.pc}, New INF: ${this.gameState.inf}`);
    },
    addInf() {
      if (!this.gameState) {
        console.warn('gameState is null. Cannot add PC/INF.');
        return;
      }
      const pcIncrease = Math.round(this.gameState.pc * 0.50);
      const infIncrease = Math.round(this.gameState.inf * 0.50);
      this.gameState.pc += pcIncrease;
      this.gameState.inf += infIncrease;
      console.log(`Added ${pcIncrease} PC and ${infIncrease} INF (50%). New PC: ${this.gameState.pc}, New INF: ${this.gameState.inf}`);
    },
    triggerScandal() {
      if (!this.gameState) {
        console.warn('gameState is null. Cannot trigger scandal.');
        return;
      }
      this.gameState.be = 90; // Set BE to 90% to trigger scandal
      this.scandalHeadline = '¡Escándalo forzado por herramientas de desarrollo!'; // Set a default headline
      this.showScandalEvent = true;
      this.currentScreen = 'scandal';
      console.log('Scandal forced! BE set to:', this.gameState.be);
    },
    changeLevel() {
      console.log(`changeLevel to ${this.selectedLevel} called. Not yet implemented.`);
      // Implement logic to change the game level
    },
    resetProgress() {
      console.log('resetProgress called. Not yet implemented.');
      // Implement logic to reset game progress
    },
  },
  async mounted() {
    await this.loadGameState();
    if (!this.errorGameState) {
      this.loadCorruptionTypes();
      await this.loadGameConfig();
    }
  }
};
</script>

<style scoped>
.game-info-panel {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  background-color: var(--noir-retro-panel-background);
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 8px;
  margin-bottom: 20px;
}

.character-info-container {
  display: flex;
  align-items: center;
  width: 50%;
  gap: 15px;
}

.character-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid var(--noir-retro-pure-black);
}

.character-text {
  display: flex;
  flex-direction: column;
}

.character-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8em;
  color: var(--noir-retro-primary-accent);
  margin: 0;
}

.character-description {
  font-family: 'Roboto', sans-serif;
  font-size: 1em;
  color: var(--noir-retro-pure-black);
  margin: 5px 0 0 0;
}

.resources-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  gap: 15px;
}

.resource-item {
  width: 100%;
}

.resource-label {
  display: flex;
  justify-content: space-between;
  font-family: 'Roboto', sans-serif;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.resource-title {
  color: #226A6D;
  font-weight: bold;
}

.resource-value {
  color: #298488;
}

.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  height: 15px;
  border: 1px solid var(--noir-retro-pure-black);
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}

.pc-bar { background-color: var(--noir-retro-secondary-accent); }
.inf-bar { background-color: var(--noir-retro-yellow-ocre); }
.be-bar { background-color: #6c757d; }
.be-warning { background-color: #ffc107; }
.be-danger { background-color: var(--noir-retro-primary-accent); }

/* Estilos adicionales del componente original */
.scandal-area, .monetization-prompt {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
}

.dev-tools {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: black;
}

.selected-type-display {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8em;
  color: var(--noir-retro-primary-accent);
  margin: 0;
  text-align: center;
  margin-bottom: 20px; /* Added margin to separate from cards */
}

.btn-dev-tool {
  background-color: #6c757d; /* Grey background */
  color: white; /* White text */
  border: 1px solid #5a6268;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-dev-tool:hover {
  background-color: #5a6268;
}
</style>