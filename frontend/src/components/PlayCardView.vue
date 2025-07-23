<template>
  <div class="play-card-view">
    <h3 class="plan-master-title">{{ $t('play_card_view.plan_master_title') }}</h3>
    <div class="selected-card">
      <div class="selected-card-content">
      <img v-if="card.image_url" :src="getCardImageUrl(card.image_url)" :alt="card.title" class="card-image" />
      <div class="selected-card-text">
        <h4>{{ card.title }}</h4>
        <p>{{ card.description }}</p>
      </div>
    </div>
      <div class="tags">
        <strong>{{ $t('play_card_view.tags_to_use') }}</strong>
        <span v-for="tag in card.required_tags" :key="tag" class="tag tag-reveal">{{ tag }}</span>
      </div>
    </div>
    <div class="plan-input">
      <div class="input-limits">
        <span v-if="gameConfig && gameConfig.MAX_PLAN_WORDS">{{ $t('play_card_view.words_label') }} {{ wordCount }} / {{ gameConfig.MAX_PLAN_WORDS }}</span>
        <span v-if="isRecording">{{ $t('play_card_view.time_remaining_label') }} {{ remainingTime }}s</span>
      </div>
      <textarea 
        v-model="plan" 
        :placeholder="$t('play_card_view.plan_placeholder')"
        :maxlength="gameConfig && gameConfig.MAX_PLAN_WORDS ? parseInt(gameConfig.MAX_PLAN_WORDS) : null"
      ></textarea>
      <div class="actions main-actions">
        <button @click="toggleRecording" :class="{ 'recording': isRecording }" class="btn-primary">
          {{ isRecording ? $t('play_card_view.stop_recording_button') : $t('play_card_view.record_voice_button') }}
        </button>
        <button @click="submitPlan" :disabled="!plan.trim() || (gameConfig && wordCount > parseInt(gameConfig.MAX_PLAN_WORDS))" class="btn-primary">{{ $t('play_card_view.execute_plan_button') }}</button>
        <button @click="useWildcard" class="btn-primary btn-wildcard">{{ $t('play_card_view.use_wildcard_button') }}</button>
        <button @click="cancel" class="btn-primary">{{ $t('play_card_view.cancel_button') }}</button>
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
        alert(this.$t('play_card_view.plan_exceeds_word_limit', { max_words: this.gameConfig.MAX_PLAN_WORDS }));
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
          alert(this.$t('play_card_view.error_evaluating_plan'));
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
        alert(this.$t('play_card_view.speech_recognition_not_supported'));
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
        alert(`${this.$t('play_card_view.speech_recognition_error')} ${event.error}`);
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
    async useWildcard() {
      alert(this.$t('play_card_view.watch_ad_for_plan')); // Simulate watching an ad
      try {
        const response = await api.post('/ai/generate-wildcard-plan', {
          titulo_accion_elegida: this.card.title,
          descripcion_accion_elegida: this.card.description,
          tags_accion_elegida: this.card.required_tags,
          idioma: this.$parent.gameState.userInfo.selected_language || 'es',
        });
        this.plan = response.data.plan;
      } catch (error) {
        console.error('Error generating wildcard plan:', error);
        alert(this.$t('play_card_view.error_generating_wildcard_plan'));
      }
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
  display: flex; /* Use flexbox for alignment */
  flex-wrap: wrap; /* Allow tags to wrap on smaller screens */
  align-items: center; /* Vertically center items */
  justify-content: center; /* Center the whole block */
  gap: 10px; /* Space between title and tags */
  padding: 10px;
  margin-top: 15px;
}

.tags strong {
  color: var(--noir-retro-secondary-accent);
  font-weight: bold;
  font-size: 1.2em; /* Make title slightly larger */
}

.tag {
  background: transparent;
  color: #226A6D;
  padding: 5px 10px;
  margin: 0;
  font-size: 1.4em; /* Larger font size for tags */
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  font-weight: bold;
  border: none;
  text-decoration: underline;
  text-decoration-color: #c0392b; /* Red underline */
  text-underline-offset: 4px; /* Space between text and underline */
  display: inline-block;
  cursor: default;
  box-shadow: none;
}

.main-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.main-actions .btn-primary {
  flex-grow: 1; /* Allow buttons to grow and fill space */
}

@media (max-width: 768px) {
  .main-actions {
    flex-direction: column;
  }
}

.btn-wildcard {
  background-color: #f1c40f; /* Yellow background */
  color: #2c3e50; /* Dark text for contrast */
  font-weight: bold;
}

.btn-wildcard:hover {
  background-color: #f39c12; /* Darker yellow on hover */
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