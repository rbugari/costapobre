<template>
  <div class="slot-machine-wrapper">
    <div class="reel-container">
      <div class="reel-highlight"></div>
      <div class="reel" :style="reelStyle">
        <!-- Duplicating items for seamless looping effect -->
        <div v-for="(type, i) in extendedCorruptionTypes" :key="'A-' + i" class="reel-item" :class="{ 'selected': isSelected(i) }">
          {{ type.name }}
        </div>
      </div>
    </div>
    <button @click="startSpin" :disabled="isSpinning" class="spin-button">
      {{ $t('corruption_wheel.spin_button') }}
    </button>
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
      isHighlighting: false,
      finalIndex: -1,
      reelStyle: { transform: 'translateY(0px)', transition: 'none' },
    };
  },
  computed: {
    extendedCorruptionTypes() {
      // We need enough items for a smooth looping animation. Let's ensure at least 20 items.
      if (!this.corruptionTypes || this.corruptionTypes.length === 0) return [];
      const baseList = this.corruptionTypes;
      let extendedList = [];
      while (extendedList.length < 20) {
        extendedList.push(...baseList);
      }
      return extendedList;
    },
  },
  methods: {
    startSpin() {
      if (this.isSpinning || this.extendedCorruptionTypes.length === 0) return;

      this.isSpinning = true;
      this.isHighlighting = false;
      this.finalIndex = -1;

      const itemHeight = 60; // Must match .reel-item height in CSS
      const randomOffset = Math.floor(Math.random() * this.extendedCorruptionTypes.length);
      const initialTransform = `translateY(-${randomOffset * itemHeight}px)`;
      this.reelStyle = { transform: initialTransform, transition: 'transform 0.5s ease-out' };

      setTimeout(() => {
        const originalIndex = Math.floor(Math.random() * this.corruptionTypes.length);
        this.finalIndex = this.findClosestIndex(originalIndex);
        const containerHeight = 150; // As defined in your CSS
        const finalPosition = (this.finalIndex * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
        const finalTransform = `translateY(-${finalPosition}px)`;
        // Slower spin duration (3s)
        this.reelStyle = { transform: finalTransform, transition: 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' };

        // End of spin & highlight
        setTimeout(() => {
          this.isSpinning = false;
          this.isHighlighting = true;
          // Emit the actual object that was selected
          this.$emit('type-selected', this.extendedCorruptionTypes[this.finalIndex]);

          // Remove highlight after a delay
          setTimeout(() => {
            this.isHighlighting = false;
          }, 1500); // Highlight duration
        }, 3100); // Wait for spin animation to finish (3s + buffer)
      }, 500); // Wait for initial spin to finish
    },
    findClosestIndex(originalIndex) {
      for (let i = 5; i < this.extendedCorruptionTypes.length - 5; i++) {
        if (this.extendedCorruptionTypes[i].name === this.corruptionTypes[originalIndex].name) {
          return i;
        }
      }
      return originalIndex; // Fallback
    },
    isSelected(index) {
      return this.isHighlighting && index === this.finalIndex;
    },
  },
};
</script>

<style scoped>
.slot-machine-wrapper {
  display: flex;
  flex-direction: row; /* Default for desktop */
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 20px;
  width: 100%;
  max-width: 700px;
  margin: 20px auto;
}

.reel-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 150px; /* Match button height */
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  border: 6px double #1a2023; /* Comic/fair style border */
  border-radius: 10px;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.7); /* Deeper inset shadow */
}

.reel-highlight {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 60px; /* Match item height */
  transform: translateY(-50%);
  background: rgba(255, 255, 0, 0.1);
  border-top: 2px solid var(--noir-retro-yellow-ocre);
  border-bottom: 2px solid var(--noir-retro-yellow-ocre);
  z-index: 1;
}

.reel {
  width: 100%;
}

.reel-item {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8em;
  color: #f5f5f5;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
  transition: all 0.3s ease;
}

.reel-item.selected {
  color: var(--noir-retro-yellow-ocre);
  transform: scale(1.1);
  text-shadow: 0 0 10px var(--noir-retro-yellow-ocre);
}

.spin-button {
  flex-shrink: 0; /* Prevent button from shrinking */
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: #c0392b;
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8em; /* Slightly smaller font size */
  text-transform: uppercase;
  border: 5px solid #a02d22;
  cursor: pointer;
  box-shadow: 0 8px 0 #a02d22, 0 15px 20px rgba(0,0,0,0.3);
  transition: all 0.1s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.spin-button:hover:not(:disabled) {
  background: #e74c3c;
}

.spin-button:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 4px 0 #a02d22, 0 8px 10px rgba(0,0,0,0.3);
}

.spin-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive layout for mobile */
@media (max-width: 768px) {
  .slot-machine-wrapper {
    flex-direction: column; /* Stack them vertically */
    gap: 20px;
  }

  .spin-button {
    width: 120px;
    height: 120px;
    font-size: 1.5em;
  }

  .reel-item {
    font-size: 1.5em;
  }
  
  .reel-container {
    height: 120px; /* Match mobile button height */
  }
}
</style>