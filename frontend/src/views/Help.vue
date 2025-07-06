<template>
  <div class="help-container">
    <h2>Cómo Jugar a "CORRUPTIA"</h2>
    <p>¡Bienvenido, futuro líder de Costa Pobre! Tu objetivo es ascender en la jerarquía política utilizando tus habilidades de corrupción.</p>

    <h3>Flujo de Juego:</h3>
    <ol>
      <li><strong>Inicio de Turno:</strong> Verás tu cargo actual y tus estadísticas (Puntos de Corrupción, Influencia, Barra de Escándalo).</li>
      <li><strong>Girar Ruleta de Corrupción:</strong> Haz clic en el botón para seleccionar aleatoriamente un tipo de corrupción para este turno.</li>
      <li><strong>Generar Cartas de Acción:</strong> Una vez seleccionado el tipo de corrupción, se generarán 5 cartas con sub-opciones específicas. Elige la que mejor se adapte a tu plan.</li>
      <li><strong>Narrar tu Plan Maestro:</strong> Describe cómo llevarás a cabo la acción elegida. Puedes escribir tu plan o, si tu navegador lo permite, grabar un audio que se transcribirá a texto. Asegúrate de incluir los tags obligatorios que se te proporcionan.</li>
      <li><strong>Evaluación del Mentor Corrupto:</strong> Tu plan será evaluado por el Mentor, quien te dará una calificación y consejos. Tus estadísticas se actualizarán según el éxito de tu plan.</li>
      <li><strong>Gestión de Escándalos:</strong> Ten cuidado, si tu Barra de Escándalo sube demasiado, podrías enfrentar una crisis.</li>
      <li><strong>Ascenso de Nivel:</strong> Cumple los requisitos de PC e INF para ascender a un cargo más alto y desbloquear nuevas oportunidades de corrupción.</li>
    </ol>

    <h3>Estadísticas Clave:</h3>
    <ul>
      <li><strong>Puntos de Corrupción (PC):</strong> Tu moneda principal. Gánalos con planes exitosos.</li>
      <li><strong>Influencia (INF):</strong> Representa tu poder y conexiones. Necesaria para ascender de nivel.</li>
      <li><strong>Barra de Escándalo (BE):</strong> ¡Cuidado! Si sube demasiado, podrías tener problemas.</li>
    </ul>

    <h3>Consejos del Mentor:</h3>
    <p>Sé astuto, planifica bien tus movimientos y no dejes cabos sueltos. ¡El éxito en Costa Pobre depende de tu ingenio corrupto!</p>

    <button @click="goBackToGame" class="back-button">Volver al Juego</button>
  </div>
</template>

<script>
export default {
  name: 'Help',
  methods: {
    goBackToGame() {
      this.$router.push('/game');
    },
  },
};
</script>

<style scoped>
.help-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: var(--surface-color); /* Fondo oscuro */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: left;
  color: var(--text-color); /* Texto claro */
}

.help-container h2,
.help-container h3 {
  color: var(--primary-color); /* Color primario para títulos */
  margin-bottom: 15px;
}

.help-container p,
.help-container li {
  margin-bottom: 10px;
  line-height: 1.6;
}

.help-container ol,
.help-container ul {
  margin-left: 20px;
  margin-bottom: 20px;
}

.back-button {
  background-color: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background-color: var(--primary-dark-color);
}
</style>
