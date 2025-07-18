<template>
  <div class="history-container">
    <h2>Historial de Interacciones</h2>

    <div class="filters">
      <label for="level-filter">Filtrar por Nivel:</label>
      <select id="level-filter" v-model="selectedLevel" @change="fetchHistory(1)">
        <option value="all">Todos los Niveles</option>
        <option v-for="n in maxLevel" :key="n" :value="n">Nivel {{ n }}</option>
      </select>
    </div>

    <div v-if="history.length === 0">
      <p>No hay interacciones para el nivel seleccionado.</p>
    </div>

    <div v-else>
      <div v-for="(entry, index) in history" :key="index" class="history-entry">
        <h3>Turno #{{ totalItems - ((currentPage - 1) * 5) - index }} - Nivel {{ entry.level }}</h3>
        <p><strong>Acción:</strong> {{ entry.action_title }}</p>
        <p><strong>Plan Narrado:</strong> {{ entry.narrated_plan_text }}</p>
        <p><strong>Evaluación:</strong> {{ entry.llm_evaluation_json?.evaluation }}</p>
        <p><strong>Consejo:</strong> {{ entry.llm_advice_json?.advice }}</p>
        <p class="timestamp">{{ new Date(entry.timestamp).toLocaleString() }}</p>
      </div>
    </div>

    <div class="pagination-controls">
      <button @click="prevPage" :disabled="currentPage <= 1" class="btn-secondary">Anterior</button>
      <span>Página {{ currentPage }} de {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="btn-secondary">Siguiente</button>
    </div>

    <router-link to="/game" class="btn-primary back-button">Volver al Juego</router-link>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      history: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      selectedLevel: 'all',
      maxLevel: 7, // Asumiendo un máximo de 7 niveles, se podría obtener dinámicamente
    };
  },
  async mounted() {
    await this.fetchHistory();
  },
  methods: {
    async fetchHistory(page = 1) {
      try {
        const params = {
          page: page,
          limit: 5,
        };
        if (this.selectedLevel !== 'all') {
          params.level = this.selectedLevel;
        }

        const res = await api.get('/history/all', { params });
        this.history = res.data.history;
        this.totalPages = res.data.totalPages;
        this.currentPage = res.data.currentPage;
        this.totalItems = res.data.totalItems;
      } catch (err) {
        console.error('Error fetching history:', err);
        alert('Error al cargar el historial.');
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.fetchHistory(this.currentPage + 1);
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.fetchHistory(this.currentPage - 1);
      }
    },
  },
};
</script>

<style scoped>
.history-container {
  max-width: 95%;
  margin: 20px auto;
  padding: 20px;
  background-color: var(--noir-retro-panel-background);
  color: var(--noir-retro-pure-black);
  border: 4px solid var(--noir-retro-pure-black);
  border-radius: 8px;
  box-shadow: 5px 5px 0px var(--noir-retro-pure-black);
  text-align: center;
}

.filters {
  margin-bottom: 20px;
  text-align: left;
}

.filters label {
  margin-right: 10px;
  font-weight: bold;
}

.filters select {
  padding: 8px;
  border-radius: 8px;
  border: 2px solid var(--noir-retro-pure-black);
  background-color: var(--noir-retro-off-white);
}

.history-entry {
  border: 2px solid var(--noir-retro-pure-black);
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  text-align: left;
  background-color: var(--noir-retro-off-white);
}

.history-entry h3 {
  color: var(--noir-retro-primary-accent);
  margin-top: 0;
  font-family: 'Bebas Neue', sans-serif;
}

.history-entry p {
  margin: 8px 0;
  font-family: 'Roboto', sans-serif;
}

.history-entry p strong {
  font-weight: 900; /* Make labels extra bold */
}

.history-entry .timestamp {
  font-size: 0.8em;
  color: #555;
  text-align: right;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.pagination-controls span {
  margin: 0 15px;
  font-weight: bold;
}

.back-button {
  margin-top: 20px;
}
</style>