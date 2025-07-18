<template>
  <div class="corruption-wheel-wrapper">
    <div class="corruption-buttons-grid">
      <button
        v-for="(type, index) in corruptionTypes"
        :key="index"
        class="corruption-type-button"
        :class="{ 'spinning-highlight': isSpinning && spinningIndex === index, 'selected-highlight': !isSpinning && selectedType === type.name }"
        @click="selectType(type)"
        :disabled="isSpinning"
      >
        {{ type.name }}
      </button>
    </div>
    <button @click="startSpin" :disabled="isSpinning" class="btn-primary">Girar Ruleta</button>
  </div>
</template>

<script>
export default {
  name: 'CorruptionWheel',
  props: {
    corruptionTypes: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      isSpinning: false,
      selectedType: null,
      spinDuration: 4000, // milliseconds (max 5 seconds as per request)
      spinningIndex: -1, // Index of the currently highlighted button during spin
      spinInterval: null, // To store the interval ID for the spinning effect
    };
  },
  methods: {
    startSpin() {
      this.isSpinning = true;
      this.selectedType = null;
      this.spinningIndex = -1; // Reset spinning highlight
      clearInterval(this.spinInterval); // Clear any existing interval

      const numTypes = this.corruptionTypes.length;
      const finalIndex = Math.floor(Math.random() * numTypes);
      const selectedTypeObject = this.corruptionTypes[finalIndex];

      let currentHighlightDuration = 50; // Initial speed of highlight change
      const decelerationFactor = 1.05; // How much to slow down each step
      const minHighlightDuration = 300; // Max speed for highlight change

      let currentStep = 0;
      const totalSteps = this.spinDuration / currentHighlightDuration; // Approximate total steps

      const animateSpin = () => {
        this.spinningIndex = currentStep % numTypes;
        currentStep++;

        // Gradually increase highlight duration to simulate slowing down
        if (currentHighlightDuration < minHighlightDuration) {
          currentHighlightDuration *= decelerationFactor;
        }

        // Stop condition: if we are close to the end and have passed the final index multiple times
        if (currentStep > numTypes * 3 && currentStep % numTypes === finalIndex) { // Ensure at least 3 full rotations
          clearInterval(this.spinInterval);
          this.isSpinning = false;
          this.selectedType = selectedTypeObject.name;
          this.spinningIndex = finalIndex; // Ensure final highlight is on the selected item
          this.$emit('type-selected', selectedTypeObject);
          return;
        }

        // Clear and set new interval for speed change
        clearInterval(this.spinInterval);
        this.spinInterval = setTimeout(animateSpin, currentHighlightDuration);
      };

      this.spinInterval = setTimeout(animateSpin, currentHighlightDuration); // Start the animation

      // Fallback to stop after spinDuration in case animation logic is off
      setTimeout(() => {
        if (this.isSpinning) { // Only stop if not already stopped by animation logic
          clearInterval(this.spinInterval);
          this.isSpinning = false;
          this.selectedType = selectedTypeObject.name;
          this.spinningIndex = finalIndex;
          this.$emit('type-selected', selectedTypeObject);
        }
      }, this.spinDuration + 500); // Add a small buffer
    },
    selectType(type) {
      // This method allows direct selection if needed, but the main flow is startSpin
      if (!this.isSpinning) {
        this.selectedType = type.name;
        this.$emit('type-selected', type);
      }
    },
    spinIntervalCallback() {
      // This is a helper for the setInterval to ensure 'this' context is correct
      const numTypes = this.corruptionTypes.length;
      this.spinningIndex = (this.spinningIndex + 1) % numTypes;
    },
  },
  beforeDestroy() {
    clearInterval(this.spinInterval);
  },
};
</script>

<style scoped>
.corruption-wheel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.corruption-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Justified buttons */
  gap: 10px;
  width: 100%;
  max-width: 600px; /* Limit width for better layout */
  padding: 15px;
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 8px;
  background-color: var(--noir-retro-panel-background);
  margin-bottom: 20px;
}

.corruption-type-button {
  background-color: var(--noir-retro-secondary-accent);
  color: var(--noir-retro-off-white);
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  padding: 10px 15px;
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.1s ease, box-shadow 0.1s ease; /* Faster transition for spinning */
  box-shadow: 3px 3px 0px var(--noir-retro-pure-black);
  text-align: center;
  white-space: nowrap; /* Prevent text wrapping */
  overflow: hidden;
  text-overflow: ellipsis; /* Add ellipsis if text is too long */
}

.corruption-type-button:hover:not(:disabled) {
  background-color: #226A6D; /* Slightly darker teal */
  box-shadow: 1px 1px 0px var(--noir-retro-pure-black);
}

.corruption-type-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--noir-retro-pure-black);
}

.corruption-type-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning-highlight {
  background-color: var(--noir-retro-yellow-ocre) !important; /* Highlight color */
  color: var(--noir-retro-pure-black) !important;
  box-shadow: 0 0 8px var(--noir-retro-yellow-ocre) !important;
}

.selected-highlight {
  background-color: var(--noir-retro-primary-accent) !important; /* Final selected color */
  color: var(--noir-retro-off-white) !important;
  box-shadow: 0 0 10px var(--noir-retro-primary-accent) !important;
  border: 2px solid var(--noir-retro-yellow-ocre) !important;
}

.btn-primary {
  margin-top: 20px;
}
</style>