<template>
  <div class="play-card-view">
    <h3>Tu Plan Maestro</h3>
    <div class="selected-card">
      <h4>{{ card.titulo }}</h4>
      <p>{{ card.descripcion }}</p>
      <div class="tags">
        <strong>Tags obligatorios:</strong>
        <span v-for="tag in card.tags_obligatorios" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
    <div class="plan-input">
      <textarea v-model="plan" placeholder="Describe tu plan aquí..."></textarea>
      <div class="actions">
        <button @click="submitPlan" :disabled="!plan.trim()">Ejecutar Plan</button>
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
  },
  data() {
    return {
      plan: '',
    };
  },
  methods: {
    async submitPlan() {
      try {
        const response = await api.post('/ai/evaluate-plan', {
          cargo_actual: this.$parent.gameState.levelInfo.title,
          titulo_accion_elegida: this.card.titulo,
          tags_accion_elegida: this.card.tags_obligatorios,
          plan_del_jugador: this.plan,
          idioma: this.$parent.gameState.userInfo.selected_language || 'es',
        });
        this.$emit('playCard', { evaluation: response.data });
      } catch (err) {
        console.error('Error evaluating plan:', err);
        alert('Error al evaluar el plan.');
      }
    },
    cancel() {
      this.$emit('cancel');
    },
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
}
.actions .cancel-btn {
  background: #6c757d;
  margin-left: 10px;
}
</style>