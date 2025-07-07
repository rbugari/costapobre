<template>
  <div class="premium-access-container">
    <div class="premium-access-card">
      <h2>¡Acceso Premium Requerido!</h2>
      <p>Has completado todos los niveles gratuitos de Corruptia.</p>
      <p>Para continuar tu ascenso en la política y desbloquear nuevos desafíos, necesitas adquirir el Pase Premium.</p>
      <button @click="purchasePremium">Adquirir Pase Premium (2€)</button>
      <p class="small-text">Al hacer clic, se simulará una compra y se activará tu acceso premium.</p>
    </div>
  </div>
</template>

<script>
import { monetizationApi } from '../api';

export default {
  name: 'PremiumAccessPrompt',
  methods: {
    async purchasePremium() {
      try {
        // Simular la compra del pase premium
        const response = await monetizationApi.simulatePremiumPurchase();
        if (response.data.user.premium) {
          alert('¡Pase Premium adquirido con éxito! Ahora puedes continuar tu carrera.');
          this.$router.push('/game'); // Redirigir al juego
        } else {
          alert('Hubo un problema al procesar tu compra. Inténtalo de nuevo.');
        }
      } catch (error) {
        console.error('Error al simular la compra premium:', error);
        alert(`Error al adquirir el Pase Premium: ${error.response ? error.response.data.message : error.message}`);
      }
    },
  },
};
</script>

<style scoped>
.premium-access-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1a1a1a;
  color: #f3f3f3;
}

.premium-access-card {
  background-color: #212529;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
  text-align: center;
  max-width: 600px;
  width: 90%;
  border: 2px solid var(--primary-color);
}

.premium-access-card h2 {
  color: var(--primary-color);
  margin-bottom: 20px;
  font-size: 2.2em;
}

.premium-access-card p {
  margin-bottom: 15px;
  font-size: 1.1em;
  line-height: 1.6;
}

.premium-access-card button {
  background-color: var(--primary-color);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 20px;
  transition: background-color 0.3s ease;
}

.premium-access-card button:hover {
  background-color: #4a1da8;
}

.premium-access-card .small-text {
  font-size: 0.8em;
  color: #aaa;
  margin-top: 15px;
}
</style>
