<template>
  <div class="accordion-item">
    <div class="accordion-header" @click="toggle">
      <h3 class="accordion-title">{{ title }}</h3>
      <span class="accordion-icon">{{ isOpen ? '-' : '+' }}</span>
    </div>
    <div v-if="isOpen" class="accordion-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Accordion',
  props: {
    title: {
      type: String,
      required: true,
    },
    startOpen: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: this.startOpen,
    };
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
  },
};
</script>

<style scoped>
.accordion-item {
  background-color: var(--noir-retro-panel-background);
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  background-color: var(--noir-retro-secondary-accent);
  color: var(--noir-retro-off-white);
}

.accordion-header:hover {
  background-color: #226A6D;
}

.accordion-title {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5em;
  font-weight: normal;
}

.accordion-icon {
  font-size: 1.8em;
  font-weight: bold;
}

.accordion-content {
  padding: 20px;
  color: var(--noir-retro-pure-black);
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
}
</style>
