<template>
  <div class="evaluation-view">
    <h3>{{ $t('evaluation_view.mentor_evaluation_title') }}</h3>
    <div class="results">
      <div class="result-item">
        <strong>{{ $t('evaluation_view.pc_gained') }}</strong>
        <span>{{ evaluation.pc_ganado_this_turn.toFixed(2) }}</span>
      </div>
      <div class="result-item">
        <strong>{{ $t('evaluation_view.inf_gained') }}</strong>
        <span>{{ evaluation.inf_ganado_this_turn }}</span>
      </div>
      <div class="result-item">
        <strong>{{ $t('evaluation_view.be_increase') }}</strong>
        <span>+{{ evaluation.be_aumento_this_turn }}</span>
      </div>
    </div>
    <div class="advice">
      <h4>{{ $t('evaluation_view.mentor_advice_title') }}</h4>
      <p>{{ evaluation.llm_advice_json.advice }}</p>
    </div>
    <div v-if="evaluation.ascended" class="ascended-alert">
      {{ $t('evaluation_view.ascended_alert') }}
    </div>
    <button @click="close" class="btn-primary">{{ $t('evaluation_view.next_turn_button') }}</button>
  </div>
</template>

<script>
export default {
  name: 'EvaluationView',
  props: {
    evaluation: {
      type: Object,
      required: true,
    },
  },
  methods: {
    close() {
      this.$emit('closeEvaluation');
    },
  },
  mounted() {
    console.log('EvaluationView mounted. Prop evaluation:', this.evaluation);
  }
};
</script>

<style scoped>
.evaluation-view {
  background: var(--color-panel-background); /* Changed to new palette variable */
  padding: 20px;
  border-radius: 8px; /* Changed to match new aesthetic */
  text-align: center;
  border: 2px solid var(--color-button-border); /* Changed to new palette variable */
  box-shadow: 4px 4px 0px var(--color-button-border); /* Changed to new aesthetic */
  animation: fade-in-slide-up 0.5s ease-out forwards;
}
.evaluation-view h3 {
  font-family: 'Bebas Neue', sans-serif; /* Updated for consistent title font */
  font-weight: normal;
  color: var(--color-text-dark);
  margin-bottom: 20px;
}
.results {
  margin-bottom: 20px;
}
.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-button-border);
}
.result-item strong {
  font-family: 'Roboto', sans-serif; /* Updated for consistent body font */
  font-weight: normal;
  color: var(--color-text-dark);
}
.result-item span {
  font-family: 'Roboto', sans-serif; /* Updated for consistent body font */
  font-weight: normal;
  color: var(--color-text-dark);
}
.advice {
  background: var(--color-panel-background);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 2px solid var(--color-button-border);
}
.advice h4 {
  font-family: 'Bebas Neue', sans-serif; /* Updated for consistent title font */
  font-weight: normal;
  color: var(--color-text-dark);
  margin-bottom: 10px;
}
.advice p {
  font-family: 'Roboto', sans-serif; /* Updated for consistent body font */
  font-weight: normal;
  line-height: 1.6;
  color: var(--color-text-dark);
}
.ascended-alert {
  background-color: var(--noir-retro-panel-background);
  color: var(--noir-retro-pure-black);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 2px solid var(--noir-retro-pure-black);
}

@keyframes fade-in-slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>