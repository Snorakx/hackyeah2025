<template>
  <div
    class="progress-steps"
    role="progressbar"
    :aria-valuenow="currentStep"
    :aria-valuemin="1"
    :aria-valuemax="totalSteps"
    aria-label="Postęp wypełniania formularza"
  >
    <div class="steps-container">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step-item"
        :class="{
          'step-completed': index < currentStep - 1,
          'step-current': index === currentStep - 1,
          'step-pending': index > currentStep - 1,
        }"
        :aria-current="index === currentStep - 1 ? 'step' : null"
      >
        <div class="step-number" :aria-hidden="true">
          <span v-if="index < currentStep - 1" class="step-check">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-content">
          <div class="step-label">{{ step.label }}</div>
          <div v-if="step.description" class="step-description">
            {{ step.description }}
          </div>
        </div>
      </div>
    </div>

    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: progressPercentage + '%' }"
        :aria-label="`Ukończono ${currentStep} z ${totalSteps} kroków`"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProgressSteps",
  props: {
    currentStep: {
      type: Number,
      required: true,
      validator: (value) => value > 0,
    },
    totalSteps: {
      type: Number,
      required: true,
      validator: (value) => value > 0,
    },
    steps: {
      type: Array,
      required: true,
      validator: (steps) => steps.every((step) => step.label),
    },
  },
  computed: {
    progressPercentage() {
      return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    },
  },
};
</script>

<style scoped>
.progress-steps {
  margin: 2rem 0;
}

.steps-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  border: 3px solid;
  position: relative;
  z-index: 3;
  background: var(--zus-white);
}

.step-completed .step-number {
  background: var(--zus-green);
  color: var(--zus-white);
  border-color: var(--zus-green);
}

.step-current .step-number {
  background: var(--zus-blue);
  color: var(--zus-white);
  border-color: var(--zus-blue);
  box-shadow: 0 0 0 4px rgba(63, 132, 210, 0.2);
}

.step-pending .step-number {
  background: var(--zus-white);
  color: var(--zus-gray);
  border-color: var(--zus-gray);
}

.step-check {
  font-size: 1.2rem;
  font-weight: bold;
}

.step-content {
  max-width: 120px;
}

.step-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--zus-text-dark);
  margin-bottom: 0.25rem;
}

.step-completed .step-label {
  color: var(--zus-green);
}

.step-current .step-label {
  color: var(--zus-blue);
  font-weight: 700;
}

.step-pending .step-label {
  color: var(--zus-text-light);
}

.step-description {
  font-size: 0.8rem;
  color: var(--zus-text-light);
  line-height: 1.3;
}

.progress-bar {
  height: 4px;
  background: var(--zus-light-gray);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--zus-green), var(--zus-blue));
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* Połączenie kroków linią */
.steps-container::before {
  content: "";
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: var(--zus-light-gray);
  z-index: 0;
}

.step-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 20px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: var(--zus-light-gray);
  z-index: 0;
}

.step-completed:not(:last-child)::after {
  background: var(--zus-green);
}

@media (max-width: 768px) {
  .steps-container {
    flex-direction: column;
    gap: 1rem;
  }

  .step-item {
    flex-direction: row;
    text-align: left;
    width: 100%;
  }

  .step-number {
    margin-right: 1rem;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .step-content {
    max-width: none;
    flex: 1;
  }

  .steps-container::before,
  .step-item::after {
    display: none;
  }
}
</style>
