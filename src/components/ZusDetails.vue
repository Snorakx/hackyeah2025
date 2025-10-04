<template>
  <div class="zus-details">
    <h4>Szczegóły ZUS</h4>
    <div class="zus-grid">
      <div class="zus-item">
        <span class="zus-label">Łączne składki wpłacone</span>
        <span class="zus-value">
          {{ formatCurrency(pension.totalContributions) }} zł
        </span>
      </div>
      <div class="zus-item">
        <span class="zus-label">Efektywność systemu</span>
        <span class="zus-value">
          {{ Math.round(pension.systemEfficiency * 100) }}%
        </span>
      </div>
      <div class="zus-item">
        <span class="zus-label">Czynnik demograficzny</span>
        <span class="zus-value">
          {{ Math.round(pension.demographicFactor * 100) }}%
        </span>
      </div>
    </div>
    
    <div class="zus-explanation">
      <p>
        <strong>Efektywność systemu:</strong> Procent składek, który
        rzeczywiście trafia do Twojego konta emerytalnego.
      </p>
      <p>
        <strong>Czynnik demograficzny:</strong> Wpływ starzenia się
        społeczeństwa na wysokość emerytury.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ZusDetails",
  props: {
    pension: {
      type: Object,
      required: true,
    },
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    },
  },
};
</script>

<style scoped>
.zus-details {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--zus-orange);
  margin-bottom: 2rem;
}

.zus-details h4 {
  color: var(--zus-dark-blue);
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.zus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.zus-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: var(--zus-light-gray);
  border-radius: 8px;
  border-left: 3px solid var(--zus-orange);
}

.zus-label {
  font-size: 0.9rem;
  color: var(--zus-text-light);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.zus-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--zus-text-dark);
}

.zus-explanation {
  background: var(--zus-light-gray);
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid var(--zus-blue);
}

.zus-explanation p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--zus-text-dark);
}

.zus-explanation p:last-child {
  margin-bottom: 0;
}

.zus-explanation strong {
  color: var(--zus-dark-blue);
}

@media (max-width: 768px) {
  .zus-grid {
    grid-template-columns: 1fr;
  }
}
</style>
