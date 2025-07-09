<template>
  <div class="play-card-view">
    <h3>Tu Plan Maestro</h3>
    <div class="selected-card">
      <h4>{{ card.titulo }}</h4>
      <img v-if="card.image_url" :src="getCardImageUrl(card.image_url)" :alt="card.titulo" class="card-image" />
      <p>{{ card.descripcion }}</p>
      <div class="tags">
        <strong>Tags obligatorios:</strong>
        <span v-for="tag in card.tags_obligatorios" :key="tag" class="tag">{{ tag }}</span>
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
        <button @click="toggleRecording" :class="{ 'recording': isRecording }">
          {{ isRecording ? 'Detener Grabación' : 'Grabar Voz' }}
        </button>
        <button @click="submitPlan" :disabled="!plan.trim() || (gameConfig && wordCount > parseInt(gameConfig.MAX_PLAN_WORDS))">Ejecutar Plan</button>
        <button @click="cancel" class="cancel-btn">Cancelar</button>
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
    generatedPlan(newVal) {
      if (newVal) {
        this.plan = newVal;
      }
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
.play-card-view {
  background: #2c2f34;
  padding: 20px;
  border-radius: 12px;
}
.selected-card {
  background: #313842;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.card-image {
  width: 30%;
  height: auto;
  border-radius: 4px;
  margin-bottom: 10px;
  object-fit: cover;
  display: block; /* Para centrar la imagen */
  margin-left: auto; /* Para centrar la imagen */
  margin-right: auto; /* Para centrar la imagen */
}
.tags {
  margin-top: 10px;
}
.tag {
  background: #5f25d6;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  margin-right: 5px;
  font-size: 0.9em;
}
.plan-input .input-limits {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 1.2em; /* Aumentar tamaño de fuente */
  font-weight: bold; /* Negrita */
  color: #e0e0e0; /* Color más brillante */
}
.plan-input textarea {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #444;
  background: #212529;
  color: #f3f3f3;
  resize: vertical;
}
.actions {
  margin-top: 15px;
  text-align: right;
}
.actions button {
  background: #5f25d6;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 10px;
}
.actions .cancel-btn {
  background: #6c757d;
}
.actions button.recording {
  background: #dc3545;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}
</style>