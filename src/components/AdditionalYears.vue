<template>
  <div class="additional-years">
    <h4>Co się stanie, jeśli będziesz pracować dłużej?</h4>
    <div class="years-grid">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="year-option"
      >
        <div class="year-header">
          <span class="year-label">{{ option.years }} {{ getYearsText(option.years) }}</span>
          <span class="year-increase">+{{ formatCurrency(option.increase) }} zł</span>
        </div>
        <div class="year-details">
          <div class="year-salary">
            <span class="salary-label">Wynagrodzenie w ostatnim roku</span>
            <span class="salary-value">
              {{ formatCurrency(option.finalSalary) }} zł
            </span>
          </div>
          <div class="year-pension">
            <span class="pension-label">Nowa emerytura</span>
            <span class="pension-value">
              {{ formatCurrency(option.newPension) }} zł
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AdditionalYears",
  props: {
    options: {
      type: Array,
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
    getYearsText(years) {
      if (years === 1) return "rok";
      if (years >= 2 && years <= 4) return "lata";
      return "lat";
    },
  },
};
</script>

<style scoped>
.additional-years {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--zus-green);
  margin-bottom: 2rem;
}

.additional-years h4 {
  color: var(--zus-dark-blue);
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.years-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.year-option {
  background: var(--zus-light-gray);
  border-radius: 8px;
  padding: 1.5rem;
  border-left: 3px solid var(--zus-green);
  transition: all 0.3s ease;
}

.year-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--zus-gray);
}

.year-label {
  font-weight: 600;
  color: var(--zus-dark-blue);
  font-size: 1.1rem;
}

.year-increase {
  font-weight: 700;
  color: var(--zus-green);
  font-size: 1.1rem;
}

.year-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.year-salary,
.year-pension {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.salary-label,
.pension-label {
  font-size: 0.9rem;
  color: var(--zus-text-light);
}

.salary-value,
.pension-value {
  font-weight: 600;
  color: var(--zus-text-dark);
}

.salary-value {
  color: var(--zus-blue);
}

.pension-value {
  color: var(--zus-green);
}

@media (max-width: 768px) {
  .years-grid {
    grid-template-columns: 1fr;
  }
  
  .year-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .year-salary,
  .year-pension {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
