<template>
  <div class="advanced-dashboard">
    <div class="container">
      <div class="dashboard-header">
        <h2>Zaawansowany dashboard symulatora emerytalnego</h2>
        <p>Szersze możliwości prognozowania i analizy</p>
      </div>

      <div class="dashboard-content">
        <!-- Historical Salary Input -->
        <div class="section historical-salary">
          <div class="section-card">
            <h3>Wprowadź konkretne kwoty wynagrodzeń z przeszłości</h3>
            <div class="salary-inputs">
              <div
                v-for="(salary, index) in historicalSalaries"
                :key="index"
                class="salary-input-group"
              >
                <label :for="`year-${index}`">Rok {{ salary.year }}</label>
                <input
                  :id="`year-${index}`"
                  v-model="salary.amount"
                  type="number"
                  min="0"
                  step="100"
                  class="form-input"
                />
                <button
                  @click="removeHistoricalSalary(index)"
                  class="btn-remove"
                  :disabled="historicalSalaries.length <= 1"
                >
                  Usuń
                </button>
              </div>
              <button @click="addHistoricalSalary" class="btn-add">
                + Dodaj kolejny rok
              </button>
            </div>
          </div>
        </div>

        <!-- Future Salary Projections -->
        <div class="section future-salary">
          <div class="section-card">
            <h3>Prognozy wynagrodzeń w przyszłości</h3>
            <div class="projection-options">
              <div class="option-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    v-model="projectionType"
                    value="indexation"
                    class="radio-input"
                  />
                  <span class="radio-custom"></span>
                  Użyj wskaźnika indeksacji
                </label>
                <div
                  v-if="projectionType === 'indexation'"
                  class="indexation-input"
                >
                  <label for="indexation-rate">Wskaźnik indeksacji (%)</label>
                  <input
                    id="indexation-rate"
                    v-model="indexationRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="option-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    v-model="projectionType"
                    value="custom"
                    class="radio-input"
                  />
                  <span class="radio-custom"></span>
                  Wprowadź konkretne kwoty
                </label>
                <div v-if="projectionType === 'custom'" class="custom-salaries">
                  <div
                    v-for="(salary, index) in futureSalaries"
                    :key="index"
                    class="salary-input-group"
                  >
                    <label :for="`future-year-${index}`"
                      >Rok {{ salary.year }}</label
                    >
                    <input
                      :id="`future-year-${index}`"
                      v-model="salary.amount"
                      type="number"
                      min="0"
                      step="100"
                      class="form-input"
                    />
                    <button
                      @click="removeFutureSalary(index)"
                      class="btn-remove"
                    >
                      Usuń
                    </button>
                  </div>
                  <button @click="addFutureSalary" class="btn-add">
                    + Dodaj kolejny rok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sick Leave Periods -->
        <div class="section sick-leave">
          <div class="section-card">
            <h3>Okresy choroby w przeszłości i przyszłości</h3>
            <div class="sick-leave-tabs">
              <button
                @click="activeSickLeaveTab = 'past'"
                :class="[
                  'tab-button',
                  { active: activeSickLeaveTab === 'past' },
                ]"
              >
                Przeszłość
              </button>
              <button
                @click="activeSickLeaveTab = 'future'"
                :class="[
                  'tab-button',
                  { active: activeSickLeaveTab === 'future' },
                ]"
              >
                Przyszłość
              </button>
            </div>

            <div
              v-if="activeSickLeaveTab === 'past'"
              class="sick-leave-content"
            >
              <div
                v-for="(period, index) in pastSickLeavePeriods"
                :key="index"
                class="sick-leave-period"
              >
                <div class="period-inputs">
                  <div class="input-group">
                    <label :for="`past-start-${index}`">Data rozpoczęcia</label>
                    <input
                      :id="`past-start-${index}`"
                      v-model="period.startDate"
                      type="date"
                      class="form-input"
                    />
                  </div>
                  <div class="input-group">
                    <label :for="`past-end-${index}`">Data zakończenia</label>
                    <input
                      :id="`past-end-${index}`"
                      v-model="period.endDate"
                      type="date"
                      class="form-input"
                    />
                  </div>
                  <div class="input-group">
                    <label :for="`past-days-${index}`">Liczba dni</label>
                    <input
                      :id="`past-days-${index}`"
                      v-model="period.days"
                      type="number"
                      min="1"
                      class="form-input"
                    />
                  </div>
                  <button
                    @click="removePastSickLeave(index)"
                    class="btn-remove"
                  >
                    Usuń
                  </button>
                </div>
              </div>
              <button @click="addPastSickLeave" class="btn-add">
                + Dodaj okres choroby
              </button>
            </div>

            <div
              v-if="activeSickLeaveTab === 'future'"
              class="sick-leave-content"
            >
              <div
                v-for="(period, index) in futureSickLeavePeriods"
                :key="index"
                class="sick-leave-period"
              >
                <div class="period-inputs">
                  <div class="input-group">
                    <label :for="`future-start-${index}`"
                      >Data rozpoczęcia</label
                    >
                    <input
                      :id="`future-start-${index}`"
                      v-model="period.startDate"
                      type="date"
                      class="form-input"
                    />
                  </div>
                  <div class="input-group">
                    <label :for="`future-end-${index}`">Data zakończenia</label>
                    <input
                      :id="`future-end-${index}`"
                      v-model="period.endDate"
                      type="date"
                      class="form-input"
                    />
                  </div>
                  <div class="input-group">
                    <label :for="`future-days-${index}`">Liczba dni</label>
                    <input
                      :id="`future-days-${index}`"
                      v-model="period.days"
                      type="number"
                      min="1"
                      class="form-input"
                    />
                  </div>
                  <button
                    @click="removeFutureSickLeave(index)"
                    class="btn-remove"
                  >
                    Usuń
                  </button>
                </div>
              </div>
              <button @click="addFutureSickLeave" class="btn-add">
                + Dodaj okres choroby
              </button>
            </div>
          </div>
        </div>

        <!-- ZUS Account Growth Visualization -->
        <div class="section zus-growth">
          <div class="section-card">
            <h3>Wzrost kwoty zgromadzonej na koncie i subkoncie ZUS</h3>
            <div class="growth-chart-container">
              <canvas ref="growthChart"></canvas>
            </div>
            <div class="growth-summary">
              <div class="summary-item">
                <span class="summary-label">Obecna kwota</span>
                <span class="summary-value"
                  >{{ formatCurrency(currentZusAmount) }} zł</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label"
                  >Prognozowana kwota na emeryturę</span
                >
                <span class="summary-value"
                  >{{ formatCurrency(projectedZusAmount) }} zł</span
                >
              </div>
              <div class="summary-item highlight">
                <span class="summary-label">Przyrost</span>
                <span class="summary-value"
                  >{{
                    formatCurrency(projectedZusAmount - currentZusAmount)
                  }}
                  zł</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="recalculatePension" class="btn-primary">
            Przelicz emeryturę
          </button>
          <button @click="resetAdvancedData" class="btn-secondary">
            Resetuj dane
          </button>
          <button @click="exportData" class="btn-outline">
            Eksportuj dane
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  name: "AdvancedDashboard",
  setup() {
    const growthChart = ref(null);
    const activeSickLeaveTab = ref("past");
    const projectionType = ref("indexation");
    const indexationRate = ref(3.0);

    const historicalSalaries = ref([
      { year: new Date().getFullYear() - 1, amount: "" },
      { year: new Date().getFullYear() - 2, amount: "" },
    ]);

    const futureSalaries = ref([
      { year: new Date().getFullYear() + 1, amount: "" },
      { year: new Date().getFullYear() + 2, amount: "" },
    ]);

    const pastSickLeavePeriods = ref([]);
    const futureSickLeavePeriods = ref([]);

    const currentZusAmount = ref(50000);
    const projectedZusAmount = ref(250000);

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("pl-PL").format(Math.round(amount));
    };

    const addHistoricalSalary = () => {
      const lastYear =
        historicalSalaries.value[historicalSalaries.value.length - 1].year;
      historicalSalaries.value.push({ year: lastYear - 1, amount: "" });
    };

    const removeHistoricalSalary = (index) => {
      if (historicalSalaries.value.length > 1) {
        historicalSalaries.value.splice(index, 1);
      }
    };

    const addFutureSalary = () => {
      const lastYear =
        futureSalaries.value[futureSalaries.value.length - 1].year;
      futureSalaries.value.push({ year: lastYear + 1, amount: "" });
    };

    const removeFutureSalary = (index) => {
      futureSalaries.value.splice(index, 1);
    };

    const addPastSickLeave = () => {
      pastSickLeavePeriods.value.push({
        startDate: "",
        endDate: "",
        days: "",
      });
    };

    const removePastSickLeave = (index) => {
      pastSickLeavePeriods.value.splice(index, 1);
    };

    const addFutureSickLeave = () => {
      futureSickLeavePeriods.value.push({
        startDate: "",
        endDate: "",
        days: "",
      });
    };

    const removeFutureSickLeave = (index) => {
      futureSickLeavePeriods.value.splice(index, 1);
    };

    const createGrowthChart = () => {
      if (!growthChart.value) return;

      const ctx = growthChart.value.getContext("2d");

      // Generate sample data for ZUS account growth
      const years = [];
      const amounts = [];
      const currentYear = new Date().getFullYear();

      for (let i = 0; i <= 20; i++) {
        years.push(currentYear + i);
        amounts.push(currentZusAmount.value + i * 10000);
      }

      new Chart(ctx, {
        type: "line",
        data: {
          labels: years,
          datasets: [
            {
              label: "Konto ZUS",
              data: amounts,
              borderColor: "var(--zus-blue)",
              backgroundColor: "rgba(63, 132, 210, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return (
                    "Konto ZUS: " + formatCurrency(context.parsed.y) + " zł"
                  );
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return formatCurrency(value) + " zł";
                },
              },
            },
          },
        },
      });
    };

    const recalculatePension = () => {
      // This would trigger a recalculation with the advanced data
      alert("Przeliczanie emerytury z zaawansowanymi danymi...");
    };

    const resetAdvancedData = () => {
      historicalSalaries.value = [
        { year: new Date().getFullYear() - 1, amount: "" },
        { year: new Date().getFullYear() - 2, amount: "" },
      ];
      futureSalaries.value = [
        { year: new Date().getFullYear() + 1, amount: "" },
        { year: new Date().getFullYear() + 2, amount: "" },
      ];
      pastSickLeavePeriods.value = [];
      futureSickLeavePeriods.value = [];
      projectionType.value = "indexation";
      indexationRate.value = 3.0;
    };

    const exportData = () => {
      const data = {
        historicalSalaries: historicalSalaries.value,
        futureSalaries: futureSalaries.value,
        pastSickLeavePeriods: pastSickLeavePeriods.value,
        futureSickLeavePeriods: futureSickLeavePeriods.value,
        projectionType: projectionType.value,
        indexationRate: indexationRate.value,
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "advanced-pension-data.json";
      link.click();
      URL.revokeObjectURL(url);
    };

    onMounted(() => {
      nextTick(() => {
        createGrowthChart();
      });
    });

    return {
      growthChart,
      activeSickLeaveTab,
      projectionType,
      indexationRate,
      historicalSalaries,
      futureSalaries,
      pastSickLeavePeriods,
      futureSickLeavePeriods,
      currentZusAmount,
      projectedZusAmount,
      formatCurrency,
      addHistoricalSalary,
      removeHistoricalSalary,
      addFutureSalary,
      removeFutureSalary,
      addPastSickLeave,
      removePastSickLeave,
      addFutureSickLeave,
      removeFutureSickLeave,
      recalculatePension,
      resetAdvancedData,
      exportData,
    };
  },
};
</script>

<style scoped>
.advanced-dashboard {
  padding: 2rem 0;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h2 {
  font-size: 2.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1rem;
}

.dashboard-header p {
  font-size: 1.2rem;
  color: var(--zus-gray);
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: var(--zus-white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-card {
  padding: 2rem;
}

.section-card h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
}

.salary-inputs,
.custom-salaries {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.salary-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.salary-input-group label {
  font-weight: 600;
  color: var(--zus-dark-blue);
  min-width: 80px;
}

.form-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  font-size: 1rem;
}

.form-input:focus {
  border-color: var(--zus-blue);
  outline: none;
}

.btn-add,
.btn-remove {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-add {
  background: var(--zus-green);
  color: var(--zus-white);
  align-self: flex-start;
}

.btn-add:hover {
  background: #00aa00;
}

.btn-remove {
  background: var(--zus-red);
  color: var(--zus-white);
}

.btn-remove:hover:not(:disabled) {
  background: #cc0000;
}

.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.projection-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--zus-dark-blue);
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--zus-gray);
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.radio-input:checked + .radio-custom {
  border-color: var(--zus-blue);
}

.radio-input:checked + .radio-custom::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: var(--zus-blue);
  border-radius: 50%;
}

.indexation-input {
  margin-left: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.indexation-input label {
  font-weight: 600;
  color: var(--zus-dark-blue);
}

.sick-leave-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--zus-gray);
}

.tab-button {
  padding: 1rem 2rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: var(--zus-gray);
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: var(--zus-blue);
  border-bottom-color: var(--zus-blue);
}

.sick-leave-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sick-leave-period {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid var(--zus-gray);
}

.period-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  align-items: end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 600;
  color: var(--zus-dark-blue);
  font-size: 0.9rem;
}

.growth-chart-container {
  height: 400px;
  margin-bottom: 2rem;
}

.growth-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.summary-item.highlight {
  background: var(--zus-orange);
  color: var(--zus-white);
}

.summary-label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-outline {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--zus-blue), var(--zus-dark-blue));
  color: var(--zus-white);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(63, 132, 210, 0.3);
}

.btn-secondary {
  background: var(--zus-orange);
  color: var(--zus-white);
}

.btn-secondary:hover {
  background: #ff8c42;
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  color: var(--zus-blue);
  border: 2px solid var(--zus-blue);
}

.btn-outline:hover {
  background: var(--zus-blue);
  color: var(--zus-white);
}

@media (max-width: 768px) {
  .salary-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .period-inputs {
    grid-template-columns: 1fr;
  }

  .growth-summary {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .dashboard-header h2 {
    font-size: 2rem;
  }
}
</style>
