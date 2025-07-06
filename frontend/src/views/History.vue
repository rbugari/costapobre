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
.history-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: var(--surface-color); /* Fondo oscuro */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: var(--text-color); /* Texto claro */
}

.history-entry {
  border: 1px solid #444; /* Borde oscuro */
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  text-align: left;
  background-color: #2c2f34; /* Fondo de entrada de historial */
}

.history-entry h3 {
  color: var(--primary-color); /* Color primario para títulos */
  margin-top: 0;
}

.history-entry p {
  margin: 5px 0;
}

.history-entry .timestamp {
  font-size: 0.8em;
  color: #aaa; /* Color de texto más claro para timestamp */
  text-align: right;
}
</style>
