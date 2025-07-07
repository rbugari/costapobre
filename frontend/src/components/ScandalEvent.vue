<template>
  <div class="scandal-overlay">
    <div class="scandal-modal">
      <h2>¡ESCÁNDALO EN COSTA POBRE!</h2>
      <h3 class="scandal-headline">{{ headline }}</h3>

      <div class="scandal-options">
        <div class="option-card">
          <h4>A) Comprar Silencio y Voluntades</h4>
          <p>Una generosa donación a los medios y un bono 'de productividad' a los jueces clave pueden hacer que este malentendido desaparezca.</p>
          <p class="cost">Costo: 50% PC actual, 50 INF</p>
          <button @click="resolveScandal('A')">Elegir Opción A</button>
        </div>

        <div class="option-card">
          <h4>B) Degradación Estratégica</h4>
          <p>Es hora de dar un paso al costado... 'por el bien del partido'. Bajar de perfil un tiempo hará que todos se olviden. Volverás más fuerte.</p>
          <p class="cost">Costo: 25 INF</p>
          <button @click="resolveScandal('B')">Elegir Opción B</button>
        </div>

        <div class="option-card">
          <h4>C) Negarlo Todo y Afrontar las Consecuencias</h4>
          <p>Son todas mentiras de la oposición. ¡El pueblo de Costa Pobre sabe que soy inocente!</p>
          <p class="cost">Costo: 0</p>
          <button @click="resolveScandal('C')">Elegir Opción C</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'ScandalEvent',
  props: {
    headline: {
      type: String,
      required: true,
    },
  },
  methods: {
    async resolveScandal(choice) {
      try {
        const res = await api.post('/game/resolve-scandal', { choice });
        if (res.data.gameOver) {
          alert(res.data.msg);
          this.$router.push('/login'); // Redirigir al login o a una pantalla de Game Over
        } else {
          alert(res.data.msg);
          this.$emit('scandal-resolved', res.data.updated_game_state);
        }
      } catch (err) {
        console.error('Error al resolver el escándalo:', err);
        alert('Error al procesar la opción de escándalo.');
      }
    },
  },
};
</script>

<style scoped>
.scandal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.scandal-modal {
  background-color: #212529;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
  text-align: center;
  max-width: 900px;
  width: 90%;
  color: #f3f3f3;
  border: 2px solid #e74c3c; /* Borde rojo para el escándalo */
}

.scandal-modal h2 {
  color: #e74c3c; /* Rojo para el título principal */
  margin-bottom: 20px;
  font-size: 2.5em;
}

.scandal-headline {
  font-style: italic;
  margin-bottom: 30px;
  font-size: 1.5em;
  color: #f1c40f; /* Amarillo para el titular */
}

.scandal-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.option-card {
  background-color: #34495e;
  padding: 20px;
  border-radius: 10px;
  flex: 1;
  min-width: 280px;
  max-width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #2c3e50;
}

.option-card h4 {
  color: #3498db; /* Azul para los títulos de opción */
  margin-bottom: 10px;
  font-size: 1.2em;
}

.option-card p {
  font-size: 0.9em;
  line-height: 1.5;
  margin-bottom: 15px;
}

.option-card .cost {
  font-weight: bold;
  color: #e74c3c; /* Rojo para los costos */
  margin-top: auto; /* Empuja el costo y el botón hacia abajo */
  margin-bottom: 15px;
}

.option-card button {
  background-color: #2ecc71; /* Verde para los botones de acción */
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
  width: 100%;
}

.option-card button:hover {
  background-color: #27ae60;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .scandal-modal {
    padding: 20px;
  }
  .scandal-options {
    flex-direction: column;
    max-width: 400px;
    margin: 0 auto;
  }
  .option-card {
    max-width: 100%;
  }
}
</style>
