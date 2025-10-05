<template>
  <div class="pension-results">
    <div class="results-grid">
      <!-- Main Pension Display -->
      <div class="pension-card main-pension">
        <h4>
          Za ~30 lat będziesz dostawać: {{ formatCurrency(pension.real) }} zł
        </h4>
        <div class="pension-amounts">
          <div class="pension-item">
            <span class="pension-label">Ile dostaniesz</span>
            <span class="pension-value real">
              {{ formatCurrency(pension.real) }} zł
            </span>
            <p class="pension-description">Kwota, którą otrzymasz na konto</p>
          </div>
          <div class="pension-item">
            <span class="pension-label">Co za to kupisz</span>
            <span class="pension-value adjusted">
              {{ formatCurrency(pension.adjusted) }} zł
            </span>
            <p class="pension-description">
              ~{{ formatCurrency(pension.adjusted) }} zł w dzisiejszych cenach.
              Inflacja zrobi swoje.
            </p>
          </div>
          <div class="pension-item">
            <span class="pension-label">Wysokość zrównoważona</span>
            <span class="pension-value sustainable">
              {{ formatCurrency(pension.sustainable) }} zł
            </span>
            <p class="pension-description">Uwzględnia czynniki demograficzne</p>
          </div>
        </div>
      </div>

      <!-- Comparison Card -->
      <div class="comparison-card">
        <h4>Porównanie ze średnią emeryturą</h4>
        <div class="comparison-stats">
          <div class="stat-item">
            <span class="stat-label"
              >Średnia emerytura w {{ pension.retirementYear }}</span
            >
            <span class="stat-value">
              {{ formatCurrency(pension.averagePension) }} zł
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Różnica</span>
            <span class="stat-value" :class="differenceClass">
              {{ formatCurrency(pension.difference) }} zł ({{
                pension.percentageDifference > 0 ? "+" : ""
              }}{{ Math.round(pension.percentageDifference) }}%)
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Stopa zastąpienia</span>
            <span class="stat-value"> {{ pension.replacementRate }}% </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PensionResults",
  props: {
    pension: {
      type: Object,
      required: true,
    },
  },
  computed: {
    differenceClass() {
      return this.pension.difference >= 0 ? "positive" : "negative";
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
.pension-results {
  margin-bottom: 2rem;
}

.results-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.pension-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--zus-green);
}

.pension-card h4 {
  color: var(--zus-dark-blue);
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.pension-amounts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pension-item {
  text-align: center;
  padding: 1rem;
  background: var(--zus-light-gray);
  border-radius: 8px;
  border-left: 3px solid var(--zus-green);
}

.pension-label {
  display: block;
  font-weight: 600;
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.pension-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.pension-value.real {
  color: var(--zus-blue);
}

.pension-value.adjusted {
  color: var(--zus-green);
}

.pension-value.sustainable {
  color: var(--zus-dark-green);
}

.pension-description {
  font-size: 0.9rem;
  color: var(--zus-text-light);
  margin: 0;
  line-height: 1.4;
}

.comparison-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--zus-blue);
}

.comparison-card h4 {
  color: var(--zus-dark-blue);
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.comparison-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: var(--zus-light-gray);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--zus-text-light);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--zus-text-dark);
}

.stat-value.positive {
  color: var(--zus-green);
}

.stat-value.negative {
  color: var(--zus-red);
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .pension-amounts {
    gap: 1rem;
  }

  .pension-value {
    font-size: 1.5rem;
  }
}
</style>
