<template>
  <div class="scenario-selection">
    <h3>Wybierz wariant prognozy (Model FUS20)</h3>
    <div class="scenario-buttons">
      <button
        @click="$emit('select', 'intermediate')"
        :class="[
          'scenario-btn',
          { active: selectedScenario === 'intermediate' },
        ]"
      >
        Wariant pośredni
      </button>
      <button
        @click="$emit('select', 'pessimistic')"
        :class="[
          'scenario-btn',
          { active: selectedScenario === 'pessimistic' },
        ]"
      >
        Wariant pesymistyczny
      </button>
      <button
        @click="$emit('select', 'optimistic')"
        :class="[
          'scenario-btn',
          { active: selectedScenario === 'optimistic' },
        ]"
      >
        Wariant optymistyczny
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ScenarioSelector",
  props: {
    selectedScenario: {
      type: String,
      default: "intermediate",
    },
  },
  emits: ["select"],
};
</script>

<style scoped>
.scenario-selection {
  margin-bottom: 2rem;
}

.scenario-selection h3 {
  color: var(--zus-dark-blue);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.scenario-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.scenario-btn {
  padding: 1rem 2rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  background: var(--zus-white);
  color: var(--zus-text-dark);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.scenario-btn:hover {
  border-color: var(--zus-blue);
  background: #f8f9fa;
}

.scenario-btn.active {
  background: var(--zus-green);
  color: var(--zus-white);
  border-color: var(--zus-green);
}

.scenario-btn.active:hover {
  background: var(--zus-dark-green);
  border-color: var(--zus-dark-green);
}

.scenario-btn:focus {
  outline: 2px solid var(--zus-blue);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .scenario-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .scenario-btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>
