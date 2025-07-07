<template>
  <div class="evaluation-view">
    <h3>Evaluación del Mentor</h3>
    <div class="results">
      <div class="result-item">
        <strong>Puntos de Corrupción (PC) Ganados:</strong>
        <span>{{ evaluation.pc_ganado_this_turn.toFixed(2) }}</span>
      </div>
      <div class="result-item">
        <strong>Influencia (INF) Ganada:</strong>
        <span>{{ evaluation.inf_ganado_this_turn }}</span>
      </div>
      <div class="result-item">
        <strong>Aumento de Escándalo (BE):</strong>
        <span>+{{ evaluation.be_aumento_this_turn }}</span>
      </div>
    </div>
    <div class="advice">
      <h4>Consejo del Mentor:</h4>
      <p>{{ evaluation.llm_advice_json.advice }}</p>
    </div>
    <div v-if="evaluation.ascended" class="ascended-alert">
      ¡Felicidades! Has ascendido de nivel.
    </div>
    <button @click="close">Siguiente Turno</button>
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
  background: #2c2f34;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}
.results {
  margin-bottom: 20px;
}
.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #444;
}
.advice {
  background: #313842;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.ascended-alert {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
}
button {
  background: #5f25d6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>