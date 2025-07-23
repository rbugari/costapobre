<template>
  <div class="scandal-overlay">
    <div class="scandal-modal">
      <h2>{{ $t('scandal_event.title') }}</h2>
      <h3 class="scandal-headline">{{ headline }}</h3>

      <div class="scandal-options">
        <div class="option-card">
          <h4>{{ $t('scandal_event.option_a_title') }}</h4>
          <p>{{ $t('scandal_event.option_a_description') }}</p>
          <p class="cost">{{ $t('scandal_event.option_a_cost_prefix') }} <span v-if="!userInfo.rescatePago">{{ $t('scandal_event.option_a_cost_suffix') }}</span></p>
          <button @click="resolveScandal('A')" class="btn-primary">{{ $t('scandal_event.choose_option_a') }}</button>
        </div>

        <div class="option-card">
          <h4>{{ $t('scandal_event.option_b_title') }}</h4>
          <p>{{ $t('scandal_event.option_b_description') }}</p>
          <p class="cost">{{ $t('scandal_event.option_b_cost') }}</p>
          <button @click="resolveScandal('B')" class="btn-primary">{{ $t('scandal_event.choose_option_b') }}</button>
        </div>

        <div class="option-card">
          <h4>{{ $t('scandal_event.option_c_title') }}</h4>
          <p>{{ $t('scandal_event.option_c_description') }}</p>
          <p class="cost">{{ $t('scandal_event.option_c_cost') }}</p>
          <button @click="resolveScandal('C')" class="btn-primary btn-danger">{{ $t('scandal_event.choose_option_c') }}</button>
        </div>
      </div>

      <!-- New Result Modal -->
      <div v-if="showResultModal" class="result-modal-overlay">
        <div class="result-modal">
          <h3>{{ resultMessage }}</h3>
          <img :src="scandalResultImage" alt="Result Image" class="result-image" /> <!-- Placeholder image -->
          <div v-if="updatedGameStateDetails" class="updated-stats">
            <p>{{ $t('scandal_event.result_modal_pc') }} {{ updatedGameStateDetails.pc }}</p>
            <p>{{ $t('scandal_event.result_modal_inf') }} {{ updatedGameStateDetails.inf }}</p>
            <p>{{ $t('scandal_event.result_modal_be') }} {{ updatedGameStateDetails.be }}</p>
            <p>{{ $t('scandal_event.result_modal_level') }} {{ updatedGameStateDetails.level }}</p>
          </div>
          <button @click="continueGame" class="btn-primary">{{ $t('scandal_event.continue_button') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import scandalResultImage from '../assets/scandal_result.png';

export default {
  name: 'ScandalEvent',
  props: {
    headline: {
      type: String,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showResultModal: false,
      resultMessage: '',
      updatedGameStateDetails: null,
      scandalResultImage: scandalResultImage, // Use imported image
    };
  },
  methods: {
    async resolveScandal(choice) {
      try {
        const res = await api.post('/game/resolve-scandal', { choice });
        if (res.data.gameOver) {
          alert(res.data.msg);
          this.$router.push('/login'); // Redirect to login or a Game Over screen
        } else {
          this.resultMessage = res.data.msg;
          this.updatedGameStateDetails = res.data.updated_game_state;
          this.showResultModal = true; // Show the custom result modal
        }
      } catch (err) {
        console.error(this.$t('scandal_event.error_resolving_scandal'), err);
        alert(this.$t('scandal_event.error_processing_scandal_option'));
      }
    },
    continueGame() {
      this.showResultModal = false;
      this.$emit('scandal-resolved', this.updatedGameStateDetails);
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
  background-color: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.scandal-modal {
  background-color: var(--noir-retro-off-white); /* Light background */
  padding: 40px;
  border-radius: 8px; /* Rounded corners */
  box-shadow: 10px 10px 0px var(--noir-retro-pure-black); /* Dark shadow */
  text-align: center;
  max-width: 900px;
  width: 90%;
  color: var(--noir-retro-pure-black); /* Dark text */
  border: 5px solid var(--noir-retro-primary-accent); /* Accent border */
  max-height: 90vh; /* Limit height to 90% of viewport height */
  overflow-y: auto; /* Add scroll for overflow */
}

.scandal-modal h2 {
  color: var(--noir-retro-primary-accent); /* Accent color for main title */
  margin-bottom: 20px;
  font-size: 2.5em;
  font-family: 'Bebas Neue', sans-serif; /* Consistent with game titles */
  font-weight: normal;
  text-transform: uppercase;
}

.scandal-headline {
  margin-bottom: 30px;
  font-size: 1.5em;
  color: var(--noir-retro-pure-black); /* Dark text */
  font-family: 'Roboto', sans-serif; /* Consistent with body text */
  font-weight: normal;
}

.scandal-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.option-card {
  background-color: var(--noir-retro-panel-background); /* Slightly darker light background for cards */
  padding: 20px;
  border-radius: 8px; /* Rounded corners */
  flex: 1;
  min-width: 280px;
  max-width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 2px solid var(--noir-retro-pure-black); /* Dark border */
}

.option-card h4 {
  color: var(--noir-retro-primary-accent); /* Accent color for option titles */
  margin-bottom: 10px;
  font-size: 1.2em;
  font-family: 'Bebas Neue', sans-serif; /* Consistent with game titles */
  font-weight: normal;
}

.option-card p {
  font-size: 0.9em;
  line-height: 1.6;
  margin-bottom: 15px;
  font-family: 'Roboto', sans-serif; /* Consistent with body text */
  font-weight: normal;
  color: var(--noir-retro-pure-black); /* Dark text */
}

.option-card .cost {
  font-weight: bold; /* Make cost stand out */
  color: var(--noir-retro-secondary-accent); /* Accent color for costs */
  margin-top: auto;
  margin-bottom: 15px;
  font-family: 'Roboto', sans-serif; /* Consistent with body text */
}

.option-card button {
  /* Uses existing btn-primary styles */
}

.btn-danger {
  background-color: var(--noir-retro-primary-accent); /* Use primary accent for danger button */
  color: var(--noir-retro-off-white); /* Light text for danger button */
}

.btn-danger:hover {
  background-color: var(--noir-retro-pure-black); /* Darker hover for danger button */
}

/* New Result Modal Styles */
.result-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001; /* Higher z-index than scandal-overlay */
}

.result-modal {
  background-color: var(--noir-retro-off-white);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 10px 10px 0px var(--noir-retro-pure-black);
  text-align: center;
  max-width: 600px;
  width: 90%;
  color: var(--noir-retro-pure-black);
  border: 5px solid var(--noir-retro-primary-accent);
  max-height: 90vh;
  overflow-y: auto;
}

.result-modal h3 {
  font-family: 'Bebas Neue', sans-serif;
  color: var(--noir-retro-primary-accent);
  margin-bottom: 20px;
  font-size: 2em;
}

.result-image {
  max-width: 80%;
  height: auto; /* Reverted to auto */
  object-fit: contain;
  margin-bottom: 20px;
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 8px;
}

.updated-stats {
  margin-bottom: 20px;
  font-family: 'Roboto', sans-serif;
  font-size: 1.1em;
  color: var(--noir-retro-dark-grey);
}

.updated-stats p {
  margin: 5px 0;
}

.result-modal .btn-primary {
  margin-top: 20px;
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

  .result-modal {
    padding: 20px;
  }

  .result-modal h3 {
    font-size: 1.5em;
  }

  .result-image {
    max-width: 60%;
  }
}
</style>