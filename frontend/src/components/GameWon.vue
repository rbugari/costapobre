<template>
  <div class="game-won-container">
    <img :src="winImage" alt="Game Won" class="win-image" />
    <h2>{{ $t('game_won.title') }}</h2>
    <p>{{ $t('game_won.message') }}</p>
    <button @click="goToLogin" class="btn-primary">{{ $t('game_won.back_to_start') }}</button>
  </div>
</template>

<script>
export default {
  name: 'GameWon',
  data() {
    return {
      winImage: new URL('../assets/win.png', import.meta.url).href,
    };
  },
  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.game-won-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--noir-retro-background);
  color: var(--noir-retro-pure-black);
  text-align: center;
  padding: 20px;
}

.win-image {
  max-width: 80%;
  height: auto;
  margin-bottom: 30px;
  border: 5px solid var(--noir-retro-primary-accent);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

h2 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3em;
  color: var(--noir-retro-primary-accent);
  margin-bottom: 15px;
}

p {
  font-family: 'Roboto', sans-serif;
  font-size: 1.2em;
  margin-bottom: 30px;
  max-width: 600px;
}

.btn-primary {
  background-color: var(--noir-retro-secondary-accent);
  color: var(--noir-retro-off-white);
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #226A6D;
}

@media (max-width: 768px) {
  .win-image {
    max-width: 95%;
  }

  h2 {
    font-size: 2.2em;
  }

  p {
    font-size: 1em;
  }

  .btn-primary {
    padding: 12px 25px;
    font-size: 1em;
  }
}
</style>
<!-- Added a comment to force Vite re-evaluation -->