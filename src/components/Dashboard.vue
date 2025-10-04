<template>
  <div class="dashboard">
    <div class="container">
      <div class="dashboard-header">
        <h2>Pulpit podstawowy</h2>
        <p>
          Zacznij od określenia, jaką emeryturę chciałbyś otrzymywać w
          przyszłości
        </p>
      </div>

      <div class="dashboard-content">
        <div class="pension-input-section">
          <div class="input-card">
            <h3>Jaka emerytura Cię interesuje?</h3>
            <div class="input-group">
              <label for="desired-pension"
                >Oczekiwana wysokość emerytury (zł)</label
              >
              <input
                id="desired-pension"
                v-model="desiredPension"
                type="number"
                min="0"
                step="100"
                placeholder="Wprowadź kwotę"
                class="pension-input"
                @input="updateComparison"
              />
            </div>
            <button
              @click="proceedToSimulation"
              class="btn-primary"
              :disabled="!desiredPension"
            >
              Przejdź do symulacji
            </button>
          </div>
        </div>

        <div class="comparison-section">
          <div class="comparison-card">
            <h3>Porównanie z średnimi emeryturami</h3>
            <div class="chart-container">
              <canvas ref="comparisonChart"></canvas>
            </div>
            <div class="chart-legend">
              <div
                class="legend-item"
                v-for="group in pensionGroups"
                :key="group.id"
              >
                <div
                  class="legend-color"
                  :style="{ backgroundColor: group.color }"
                ></div>
                <span class="legend-label">{{ group.label }}</span>
                <span class="legend-amount">{{ group.amount }} zł</span>
              </div>
            </div>
          </div>
        </div>

        <div class="fun-fact-section">
          <div class="fun-fact-card">
            <h3>Czy wiesz, że...</h3>
            <p class="fun-fact-text">{{ currentFunFact }}</p>
            <button @click="getNewFunFact" class="btn-secondary">
              Kolejna ciekawostka
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  name: "Dashboard",
  setup() {
    const router = useRouter();
    const desiredPension = ref("");
    const comparisonChart = ref(null);
    const currentFunFact = ref("");

    const pensionGroups = ref([
      {
        id: "minimal",
        label: "Emerytury poniżej minimalnej",
        amount: 1580,
        color: "var(--zus-red)",
        description:
          "Świadczeniobiorcy otrzymujący emeryturę w wysokości poniżej minimalnej wykazywali się niską aktywnością zawodową, nie przepracowali minimum 25 lat dla mężczyzn i 20 lat dla kobiet.",
      },
      {
        id: "average",
        label: "Średnia emerytura",
        amount: 2800,
        color: "var(--zus-blue)",
        description: "Średnia wysokość emerytury w Polsce w 2024 roku.",
      },
      {
        id: "above-average",
        label: "Emerytury powyżej średniej",
        amount: 4500,
        color: "var(--zus-green)",
        description:
          "Emerytury osób z wyższymi zarobkami i dłuższym stażem pracy.",
      },
      {
        id: "high",
        label: "Najwyższe emerytury",
        amount: 8000,
        color: "var(--zus-orange)",
        description:
          "Najwyższe emerytury w Polsce, głównie w województwie śląskim.",
      },
    ]);

    const funFacts = [
      "Najwyższą emeryturę w Polsce otrzymuje mieszkaniec województwa śląskiego, wysokość jego emerytury to 12,500 zł, pracował przez 45 lat, nie był nigdy na zwolnieniu lekarskim.",
      "Średni czas pracy na emeryturę w Polsce to 35 lat dla mężczyzn i 32 lata dla kobiet.",
      "Osoby z wyższym wykształceniem otrzymują średnio o 40% wyższe emerytury niż osoby z wykształceniem podstawowym.",
      "Każdy dodatkowy rok pracy po osiągnięciu wieku emerytalnego zwiększa emeryturę średnio o 3-5%.",
      "W 2024 roku minimalna emerytura wynosi 1,580 zł, a maksymalna może przekraczać 15,000 zł.",
    ];

    const getRandomFunFact = () => {
      const randomIndex = Math.floor(Math.random() * funFacts.length);
      return funFacts[randomIndex];
    };

    const getNewFunFact = () => {
      currentFunFact.value = getRandomFunFact();
    };

    const createComparisonChart = () => {
      if (!comparisonChart.value) return;

      const ctx = comparisonChart.value.getContext("2d");

      new Chart(ctx, {
        type: "bar",
        data: {
          labels: pensionGroups.value.map((group) => group.label),
          datasets: [
            {
              label: "Wysokość emerytury (zł)",
              data: pensionGroups.value.map((group) => group.amount),
              backgroundColor: pensionGroups.value.map((group) => group.color),
              borderColor: pensionGroups.value.map((group) => group.color),
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
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
                afterLabel: function (context) {
                  const group = pensionGroups.value[context.dataIndex];
                  return group.description;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return value.toLocaleString("pl-PL") + " zł";
                },
              },
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45,
              },
            },
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const groupIndex = elements[0].index;
              const group = pensionGroups.value[groupIndex];
              alert(`${group.label}\n\n${group.description}`);
            }
          },
        },
      });
    };

    const updateComparison = () => {
      // Add user's desired pension to comparison if it's different from existing groups
      if (
        desiredPension.value &&
        !pensionGroups.value.find((g) => g.id === "user")
      ) {
        pensionGroups.value.push({
          id: "user",
          label: "Twoja oczekiwana emerytura",
          amount: parseInt(desiredPension.value),
          color: "var(--zus-dark-blue)",
          description:
            "Wprowadzona przez Ciebie oczekiwana wysokość emerytury.",
        });
      }
    };

    const proceedToSimulation = () => {
      if (desiredPension.value) {
        router.push("/simulation");
      }
    };

    onMounted(() => {
      currentFunFact.value = getRandomFunFact();
      nextTick(() => {
        createComparisonChart();
      });
    });

    return {
      desiredPension,
      comparisonChart,
      currentFunFact,
      pensionGroups,
      updateComparison,
      proceedToSimulation,
      getNewFunFact,
    };
  },
};
</script>

<style scoped>
.dashboard {
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
  max-width: 600px;
  margin: 0 auto;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.pension-input-section {
  grid-column: 1 / -1;
}

.input-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.input-card h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 2rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.pension-input {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
  font-size: 1.2rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  text-align: center;
  transition: border-color 0.3s ease;
}

.pension-input:focus {
  border-color: var(--zus-blue);
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--zus-blue), var(--zus-dark-blue));
  color: var(--zus-white);
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(63, 132, 210, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comparison-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.comparison-card h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
  text-align: center;
}

.chart-container {
  height: 300px;
  margin-bottom: 1.5rem;
}

.chart-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-label {
  font-weight: 500;
  flex: 1;
}

.legend-amount {
  font-weight: 600;
  color: var(--zus-dark-blue);
}

.fun-fact-card {
  background: linear-gradient(135deg, var(--zus-orange), #ff8c42);
  color: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 179, 79, 0.3);
  text-align: center;
}

.fun-fact-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.fun-fact-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: var(--zus-white);
  border: 2px solid var(--zus-white);
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--zus-white);
  color: var(--zus-orange);
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .chart-legend {
    grid-template-columns: 1fr;
  }

  .dashboard-header h2 {
    font-size: 2rem;
  }
}
</style>
