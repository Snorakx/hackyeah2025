<template>
  <div class="summary-section">
    <div class="summary-card">
      <h3>Podsumowanie Twoich odpowiedzi</h3>
      <div class="summary-grid">
        <div
          v-for="(response, index) in responses"
          :key="index"
          class="summary-item"
        >
          <div class="summary-label">{{ response.label }}</div>
          <div class="summary-value">{{ response.value }}</div>
          <button
            @click="$emit('edit', index)"
            class="edit-button"
            :aria-label="`Edytuj ${response.label}`"
          >
            ✏️
          </button>
        </div>
      </div>
      <div class="summary-actions">
        <button @click="$emit('go-back')" class="btn-secondary">
          Wróć do edycji
        </button>
        <button @click="$emit('calculate')" class="btn-primary">
          Oblicz emeryturę
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SummaryCard",
  props: {
    responses: {
      type: Array,
      required: true,
    },
  },
  emits: ["edit", "go-back", "calculate"],
};
</script>

<style scoped>
.summary-section {
  padding: 2rem;
  background: var(--zus-white);
  border-top: 1px solid var(--zus-light-gray);
}

.summary-card {
  max-width: 800px;
  margin: 0 auto;
}

.summary-card h3 {
  color: var(--zus-dark-blue);
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

.summary-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--zus-light-gray);
  border-radius: 8px;
  border-left: 4px solid var(--zus-green);
}

.summary-label {
  font-weight: 600;
  color: var(--zus-dark-blue);
  min-width: 200px;
}

.summary-value {
  flex: 1;
  color: var(--zus-text-dark);
  margin: 0 1rem;
}

.edit-button {
  background: var(--zus-blue);
  color: var(--zus-white);
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background: var(--zus-dark-blue);
  transform: translateY(-1px);
}

.edit-button:focus {
  outline: 2px solid var(--zus-blue);
  outline-offset: 2px;
}

.summary-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--zus-green), var(--zus-dark-green));
  color: var(--zus-white);
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 153, 63, 0.3);
}

.btn-primary:focus {
  outline: 2px solid var(--zus-green);
  outline-offset: 2px;
}

.btn-secondary {
  background: var(--zus-white);
  color: var(--zus-blue);
  border: 2px solid var(--zus-blue);
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.btn-secondary:hover {
  background: var(--zus-blue);
  color: var(--zus-white);
  transform: translateY(-2px);
}

.btn-secondary:focus {
  outline: 2px solid var(--zus-blue);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .summary-label {
    min-width: auto;
  }
  
  .summary-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
