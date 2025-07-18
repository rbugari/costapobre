<template>
  <div class="play-card-view">
    <h3 class="plan-master-title">Tu Plan Maestro</h3>
    <div class="selected-card">
      <div class="selected-card-content">
      <img v-if="card.image_url" :src="getCardImageUrl(card.image_url)" :alt="card.titulo" class="card-image" />
      <div class="selected-card-text">
        <h4>{{ card.titulo }}</h4>
        <p>{{ card.descripcion }}</p>
      </div>
    </div>
      <div class="tags">
        <strong>Tags a utilizar:</strong>
        <span v-for="tag in card.tags_obligatorios" :key="tag" class="tag tag-reveal">{{ tag }}</span>
      </div>
    </div>
    <div class="plan-input">
      <div class="input-limits">
        <span v-if="gameConfig && gameConfig.MAX_PLAN_WORDS">Palabras: {{ wordCount }} / {{ gameConfig.MAX_PLAN_WORDS }}</span>
        <span v-if="isRecording">Tiempo restante: {{ remainingTime }}s</span>
      </div>
      <textarea 
        v-model="plan" 
        placeholder="Describe tu plan aquí..."
        :maxlength="gameConfig && gameConfig.MAX_PLAN_WORDS ? parseInt(gameConfig.MAX_PLAN_WORDS) : null"
      ></textarea>
      <div class="actions">
        <button @click="toggleRecording" :class="{ 'recording': isRecording }" class="btn-primary">
          {{ isRecording ? 'Detener Grabación' : 'Grabar Voz' }}
        </button>
        <button @click="submitPlan" :disabled="!plan.trim() || (gameConfig && wordCount > parseInt(gameConfig.MAX_PLAN_WORDS))" class="btn-primary">Ejecutar Plan</button>
        <button @click="cancel" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'PlayCardView',
  props: {
    card: {
      type: Object,
      required: true,
    },
    gameConfig: {
      type: Object,
      default: null,
    },
    generatedPlan: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      plan: '',
      isRecording: false,
      recognition: null,
      remainingTime: 0,
      timerInterval: null,
    };
  },
  computed: {
    wordCount() {
      return this.plan.trim().split(/\s+/).filter(Boolean).length;
    },
  },
  mounted() {
    console.log('PlayCardView mounted. Initial gameConfig:', this.gameConfig);
  },
  watch: {
    generatedPlan: {
      immediate: true,
      handler(newVal) {
        console.log('PlayCardView: generatedPlan watcher triggered. newVal:', newVal);
        if (newVal) {
          this.plan = newVal;
        }
      },
    },
    gameConfig: {
      immediate: true,
      handler(newConfig) {
        console.log('gameConfig watcher triggered. newConfig:', newConfig);
        if (newConfig) {
          // Asegurarse de que los valores numéricos sean realmente números
          newConfig.MAX_RECORDING_SECONDS = parseInt(newConfig.MAX_RECORDING_SECONDS);
          newConfig.MAX_PLAN_WORDS = parseInt(newConfig.MAX_PLAN_WORDS);
          this.remainingTime = newConfig.MAX_RECORDING_SECONDS;
        }
      },
    },
  },
  methods: {
    async submitPlan() {
      if (this.gameConfig && this.wordCount > this.gameConfig.MAX_PLAN_WORDS) {
        alert(`Tu plan excede el límite de ${this.gameConfig.MAX_PLAN_WORDS} palabras.`);
        return;
      }
      try {
        const response = await api.post('/ai/evaluate-plan', {
          cargo_actual: this.$parent.gameState.levelInfo.title,
          titulo_accion_elegida: this.card.titulo,
          tags_accion_elegida: this.card.tags_obligatorios,
          plan_del_jugador: this.plan,
          idioma: this.$parent.gameState.userInfo.selected_language || 'es',
        });
        this.$emit('playCard', { evaluation: response.data, narrated_plan_text: this.plan });
      } catch (err) {
        console.error('Error evaluating plan:', err);
        if (err.response && err.response.status === 403) {
          alert(err.response.data.msg); // Mostrar el mensaje específico del backend
        } else {
          alert('Error al evaluar el plan.');
        }
      }
    },
    cancel() {
      this.$emit('cancel');
    },
    toggleRecording() {
      if (this.isRecording) {
        this.recognition.stop();
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Tu navegador no soporta la API de Reconocimiento de Voz. Por favor, intenta con Chrome o Edge.');
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.$parent.gameState.userInfo.selected_language === 'en' ? 'en-US' : 'es-ES';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.startTimer();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.stopTimer();
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert(`Error en el reconocimiento de voz: ${event.error}`);
      };

      this.recognition.onresult = (event) => {
        this.plan = event.results[0][0].transcript;
      };

      this.recognition.start();
    },
    startTimer() {
      if (!this.gameConfig || !this.gameConfig.MAX_RECORDING_SECONDS) return;
      this.remainingTime = this.gameConfig.MAX_RECORDING_SECONDS;
      this.timerInterval = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          this.recognition.stop();
        }
      }, 1000);
    },
    stopTimer() {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    },
    getCardImageUrl(relativePath) {
      return `http://localhost:5000${relativePath}`;
    },
  },
  beforeDestroy() {
    this.stopTimer();
  },
};
</script>

<style scoped>
.play-card-view h3.plan-master-title {
  color: var(--noir-retro-primary-accent);
  text-align: center;
  margin-bottom: 20px;
}

.selected-card {
  background: var(--color-panel-background);
  padding: 0; /* Removed padding */
  border-radius: 8px; /* Changed to match new aesthetic */
  margin-bottom: 15px;
  border: 2px solid var(--color-button-border);
  box-shadow: 4px 4px 0px var(--color-button-border);
}

.selected-card-content {
  display: flex;
  align-items: flex-start; /* Align items to the top */
  gap: 15px;
  padding: 15px;
}

.selected-card-text {
  flex: 1;
}

.selected-card h4 {
  font-family: 'Bebas Neue', sans-serif; /* Updated for consistent title font */
  font-weight: normal; /* Bebas Neue is already bold */
  color: var(--color-text-dark);
  margin: 0 0 5px 0; /* Adjusted margin */
}
.selected-card p {
  font-family: 'Roboto', sans-serif;
  font-weight: normal;
  line-height: 1.6;
  color: var(--noir-retro-pure-black);
  margin: 0;
}
.card-image {
  width: 120px; /* Fixed width for the image */
  height: auto; /* Auto height to maintain aspect ratio */
  border-radius: 8px; /* Changed to match new aesthetic */
  object-fit: contain; /* Ensure the whole image is visible */
  display: block;
  flex-shrink: 0; /* Prevent image from shrinking */
}
.tags {
  margin-top: 15px; /* Added margin-top */
  padding: 10px 10px; /* Add padding to align with text */
  text-align: center; /* Center the tags */
}
.tags strong {
  color: var(--noir-retro-secondary-accent); /* Blue color for tags title */
  display: block; /* Make it a block to center */
  margin-bottom: 10px; /* Space below title */
  font-weight: bold; /* Ensure bold */
}
.tag {
  background: var(--noir-retro-primary-accent);
  color: var(--noir-retro-off-white);
  padding: 8px 12px; /* Increased padding */
  border-radius: 8px;
  margin: 5px; /* Adjusted margin for better spacing */
  font-size: 1.1em; /* Increased font size */
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  font-weight: normal;
  border: 1px solid var(--noir-retro-pure-black);
  display: inline-block; /* Ensure tags are inline-block for margin */
  cursor: default; /* Remove pointer cursor */
  box-shadow: none; /* Remove button-like shadow */
}

.plan-input textarea {
  width: 100%;
  min-height: 300px; /* Increased height */
  padding: 10px;
  border-radius: 8px;
  border: 2px solid var(--color-button-border);
  background: var(--color-panel-background);
  color: var(--color-text-dark);
  resize: vertical;
  font-size: 1.2em;
  box-sizing: border-box; /* Ensure padding is included in width */
}
</style>