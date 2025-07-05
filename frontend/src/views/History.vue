<template>
  <div>
    <h2>Historial de Interacciones</h2>
    <div v-if="history.length === 0">
      <p>No hay interacciones registradas aún.</p>
    </div>
    <div v-else>
      <div v-for="(entry, index) in history" :key="index" class="history-entry">
        <h3>Turno {{ index + 1 }} - Nivel {{ entry.level }}</h3>
        <p><strong>Acción:</strong> {{ entry.action_title }}</p>
        <p><strong>Plan Narrado:</strong> {{ entry.narrated_plan_text }}</p>
        <p><strong>Evaluación del Mentor:</strong> {{ entry.llm_evaluation_json.evaluation }} (Cambio PC: {{ entry.llm_evaluation_json.score_change }})</p>
        <p><strong>Consejo:</strong> {{ entry.llm_advice_json.advice }}</p>
        <p class="timestamp">{{ new Date(entry.timestamp).toLocaleString() }}</p>
      </div>
    </div>
    <router-link to="/game">Volver al Juego</router-link>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      history: [],
    };
  },
  async mounted() {
    await this.fetchHistory();
  },
  methods: {
    async fetchHistory() {
      try {
        const res = await api.get('/history/all');
        this.history = res.data;
      } catch (err) {
        console.error('Error fetching history:', err);
        alert('Error al cargar el historial.');
      }
    },
  },
};
</script>

<style scoped>
.history-entry {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  text-align: left;
}

.history-entry h3 {
  color: #007bff;
  margin-top: 0;
}

.history-entry p {
  margin: 5px 0;
}

.history-entry .timestamp {
  font-size: 0.8em;
  color: #666;
  text-align: right;
}
</style>
