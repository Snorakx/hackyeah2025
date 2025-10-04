<template>
  <div class="results">
    <div class="container">
      <div class="results-header">
        <h2>Wyniki symulacji emerytury</h2>
        <p>Oto prognoza Twojej przyszłej emerytury</p>
      </div>

      <div v-if="simulationData" class="results-content">
        <!-- Scenario Selection -->
        <div class="scenario-selection">
          <h3>Wybierz wariant prognozy (Model FUS20)</h3>
          <div class="scenario-buttons">
            <button
              @click="selectedScenario = 'intermediate'"
              :class="[
                'scenario-btn',
                { active: selectedScenario === 'intermediate' },
              ]"
            >
              Wariant pośredni
            </button>
            <button
              @click="selectedScenario = 'pessimistic'"
              :class="[
                'scenario-btn',
                { active: selectedScenario === 'pessimistic' },
              ]"
            >
              Wariant pesymistyczny
            </button>
            <button
              @click="selectedScenario = 'optimistic'"
              :class="[
                'scenario-btn',
                { active: selectedScenario === 'optimistic' },
              ]"
            >
              Wariant optymistyczny
            </button>
          </div>
        </div>

        <!-- Main Results Cards -->
        <div class="results-cards">
          <div class="result-card real-pension">
            <h3>Wysokość rzeczywista</h3>
            <div class="pension-amount">
              {{ formatCurrency(currentScenarioPension.real) }} zł
            </div>
            <p class="pension-description">
              Emerytura bez uwzględnienia inflacji
            </p>
          </div>

          <div class="result-card adjusted-pension">
            <h3>Wysokość urealniona</h3>
            <div class="pension-amount">
              {{ formatCurrency(currentScenarioPension.adjusted) }} zł
            </div>
            <p class="pension-description">
              Emerytura z uwzględnieniem inflacji
            </p>
          </div>

          <div class="result-card sustainable-pension">
            <h3>Wysokość zrównoważona</h3>
            <div class="pension-amount">
              {{ formatCurrency(currentScenarioPension.sustainable) }} zł
            </div>
            <p class="pension-description">Uwzględnia czynniki demograficzne</p>
          </div>
        </div>

        <!-- Comparison with Average -->
        <div class="comparison-section">
          <div class="comparison-card">
            <h3>Porównanie ze średnią emeryturą</h3>
            <div class="comparison-stats">
              <div class="stat-item">
                <span class="stat-label">Twoja emerytura (urealniona)</span>
                <span class="stat-value"
                  >{{
                    formatCurrency(currentScenarioPension.adjusted)
                  }}
                  zł</span
                >
              </div>
              <div class="stat-item">
                <span class="stat-label"
                  >Średnia emerytura w
                  {{ currentScenarioPension.retirementYear }}</span
                >
                <span class="stat-value"
                  >{{
                    formatCurrency(currentScenarioPension.averagePension)
                  }}
                  zł</span
                >
              </div>
              <div class="stat-item highlight">
                <span class="stat-label">Różnica</span>
                <span class="stat-value" :class="differenceClass">
                  {{ formatCurrency(currentScenarioPension.difference) }} zł ({{
                    currentScenarioPension.percentageDifference
                  }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Replacement Rate -->
        <div class="replacement-rate-section">
          <div class="replacement-rate-card">
            <h3>Stopa zastąpienia</h3>
            <div class="replacement-rate-display">
              <div class="rate-circle">
                <div class="rate-percentage">
                  {{ currentScenarioPension.replacementRate }}%
                </div>
                <div class="rate-label">Stopa zastąpienia</div>
              </div>
              <div class="rate-explanation">
                <p>
                  Twoja emerytura będzie stanowić
                  <strong>{{ currentScenarioPension.replacementRate }}%</strong>
                  Twojego ostatniego wynagrodzenia ({{
                    formatCurrency(currentScenarioPension.finalSalary)
                  }}
                  zł).
                </p>
                <p
                  v-if="currentScenarioPension.replacementRate < 60"
                  class="warning-text"
                >
                  ⚠️ Stopa zastąpienia poniżej 60% może oznaczać obniżenie
                  standardu życia na emeryturze.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ZUS System Analysis -->
        <div class="zus-analysis-section">
          <div class="zus-analysis-card">
            <h3>Analiza systemu ZUS</h3>
            <div class="zus-stats">
              <div class="zus-item">
                <span class="zus-label">Łączne składki wpłacone</span>
                <span class="zus-value"
                  >{{
                    formatCurrency(currentScenarioPension.totalContributions)
                  }}
                  zł</span
                >
              </div>
              <div class="zus-item">
                <span class="zus-label">Efektywność systemu</span>
                <span class="zus-value"
                  >{{
                    Math.round(currentScenarioPension.systemEfficiency * 100)
                  }}%</span
                >
              </div>
              <div class="zus-item">
                <span class="zus-label">Czynnik demograficzny</span>
                <span class="zus-value"
                  >{{
                    Math.round(currentScenarioPension.demographicFactor * 100)
                  }}%</span
                >
              </div>
              <div class="zus-item">
                <span class="zus-label">Stopa zastąpienia</span>
                <span class="zus-value"
                  >{{ currentScenarioPension.replacementRate }}%</span
                >
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
        </div>

        <!-- Salary Analysis -->
        <div class="salary-analysis-section">
          <div class="salary-analysis-card">
            <h3>Analiza wynagrodzenia</h3>
            <div class="salary-stats">
              <div class="salary-item">
                <span class="salary-label"
                  >Wynagrodzenie bez uwzględnienia zwolnień</span
                >
                <span class="salary-value"
                  >{{
                    formatCurrency(
                      currentScenarioPension.salaryWithoutSickLeave
                    )
                  }}
                  zł</span
                >
              </div>
              <div class="salary-item" v-if="simulationData.includeSickLeave">
                <span class="salary-label"
                  >Wynagrodzenie z uwzględnieniem zwolnień</span
                >
                <span class="salary-value"
                  >{{
                    formatCurrency(currentScenarioPension.salaryWithSickLeave)
                  }}
                  zł</span
                >
              </div>
              <div class="salary-item" v-if="simulationData.includeSickLeave">
                <span class="salary-label">Różnica z powodu zwolnień</span>
                <span class="salary-value negative"
                  >{{
                    formatCurrency(currentScenarioPension.sickLeaveImpact)
                  }}
                  zł</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Years Analysis -->
        <div class="additional-years-section">
          <div class="additional-years-card">
            <h3>Co gdybyś pracował dłużej?</h3>
            <div class="years-comparison">
              <div
                class="year-option"
                v-for="(option, index) in additionalYearsOptions"
                :key="index"
              >
                <div class="year-label">
                  +{{ option.years }} {{ option.years === 1 ? "rok" : "lata" }}
                </div>
                <div class="year-pension">
                  {{ formatCurrency(option.pension) }} zł
                </div>
                <div class="year-increase">
                  +{{ formatCurrency(option.increase) }} zł
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expected vs Actual Comparison -->
        <div v-if="expectedPension" class="expected-comparison-section">
          <div class="expected-comparison-card">
            <h3>Porównanie z oczekiwaną emeryturą</h3>
            <div class="expected-stats">
              <div class="expected-item">
                <span class="expected-label">Oczekiwana emerytura</span>
                <span class="expected-value"
                  >{{ formatCurrency(expectedPension) }} zł</span
                >
              </div>
              <div class="expected-item">
                <span class="expected-label">Prognozowana emerytura</span>
                <span class="expected-value"
                  >{{ formatCurrency(calculatedPension.adjusted) }} zł</span
                >
              </div>
              <div class="expected-item highlight">
                <span class="expected-label">Różnica</span>
                <span class="expected-value" :class="expectedDifferenceClass">
                  {{
                    formatCurrency(calculatedPension.adjusted - expectedPension)
                  }}
                  zł
                </span>
              </div>
            </div>
            <div
              v-if="calculatedPension.adjusted < expectedPension"
              class="additional-work-needed"
            >
              <p>
                Aby osiągnąć oczekiwaną emeryturę, musisz pracować dodatkowo
                <strong>{{ additionalWorkYears }} lat</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="goToAdvanced" class="btn-secondary">
            Przejdź do zaawansowanego dashboardu
          </button>
          <button @click="downloadReport" class="btn-primary">
            Pobierz raport
          </button>
          <button @click="startNewSimulation" class="btn-outline">
            Nowa symulacja
          </button>
        </div>

        <!-- Postal Code Input -->
        <div class="postal-code-section">
          <div class="postal-code-card">
            <h3>Kod pocztowy (opcjonalnie)</h3>
            <p>Pomóż nam lepiej zrozumieć potrzeby różnych regionów</p>
            <div class="postal-code-input">
              <input
                v-model="postalCode"
                type="text"
                placeholder="00-000"
                pattern="[0-9]{2}-[0-9]{3}"
                class="form-input"
              />
              <button @click="savePostalCode" class="btn-small">Zapisz</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-data">
        <h3>Brak danych do wyświetlenia</h3>
        <p>Przejdź do symulacji, aby zobaczyć wyniki</p>
        <button @click="$router.push('/simulation')" class="btn-primary">
          Przejdź do symulacji
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ReportGenerator } from "../utils/reportGenerator.js";

export default {
  name: "Results",
  setup() {
    const router = useRouter();
    const simulationData = ref(null);
    const postalCode = ref("");
    const expectedPension = ref(null);
    const selectedScenario = ref("intermediate");

    const calculatedPension = ref({
      intermediate: {
        real: 0,
        adjusted: 0,
        sustainable: 0,
        averagePension: 0,
        difference: 0,
        percentageDifference: 0,
        replacementRate: 0,
        finalSalary: 0,
        salaryWithoutSickLeave: 0,
        salaryWithSickLeave: 0,
        sickLeaveImpact: 0,
        retirementYear: 0,
        totalContributions: 0,
        systemEfficiency: 0,
        demographicFactor: 0,
      },
      pessimistic: {
        real: 0,
        adjusted: 0,
        sustainable: 0,
        averagePension: 0,
        difference: 0,
        percentageDifference: 0,
        replacementRate: 0,
        finalSalary: 0,
        salaryWithoutSickLeave: 0,
        salaryWithSickLeave: 0,
        sickLeaveImpact: 0,
        retirementYear: 0,
        totalContributions: 0,
        systemEfficiency: 0,
        demographicFactor: 0,
      },
      optimistic: {
        real: 0,
        adjusted: 0,
        sustainable: 0,
        averagePension: 0,
        difference: 0,
        percentageDifference: 0,
        replacementRate: 0,
        finalSalary: 0,
        salaryWithoutSickLeave: 0,
        salaryWithSickLeave: 0,
        sickLeaveImpact: 0,
        retirementYear: 0,
        totalContributions: 0,
        systemEfficiency: 0,
        demographicFactor: 0,
      },
    });

    const additionalYearsOptions = ref([]);

    const currentScenarioPension = computed(() => {
      return (
        calculatedPension.value[selectedScenario.value] ||
        calculatedPension.value.intermediate
      );
    });

    const differenceClass = computed(() => {
      return currentScenarioPension.value.difference >= 0
        ? "positive"
        : "negative";
    });

    const expectedDifferenceClass = computed(() => {
      const diff = calculatedPension.value.adjusted - expectedPension.value;
      return diff >= 0 ? "positive" : "negative";
    });

    const additionalWorkYears = computed(() => {
      if (calculatedPension.value.adjusted >= expectedPension.value) return 0;
      const yearsNeeded = Math.ceil(
        (expectedPension.value - calculatedPension.value.adjusted) / 200
      );
      return Math.max(1, yearsNeeded);
    });

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("pl-PL").format(Math.round(amount));
    };

    const calculatePension = () => {
      if (!simulationData.value) return;

      const data = simulationData.value;
      const currentYear = new Date().getFullYear();
      const workYears = data.retirementYear - data.workStartYear;
      const retirementAge = data.gender === "male" ? 65 : 60;

      // ZUS Model FUS20 parameters based on real data - three scenarios
      const scenarios = {
        intermediate: {
          // Wariant pośredni (Tabela 1.1)
          pensionContributionRate: 0.195,
          individualAccountRate: 0.076,
          frdRate: 0.015,
          ofeRate: 0.025,
          inflationRate: 0.025,
          inflationRate2023: 0.098,
          inflationRate2024: 0.048,
          inflationRate2025: 0.031,
          realWageGrowth: 0.029,
          realWageGrowth2023: 0.003,
          realWageGrowth2024: 0.034,
          realWageGrowth2025: 0.037,
          collectionRate: 0.99,
          systemEfficiency: 0.71,
          demographicLoadFactor: 0.4,
          lifeExpectancyIncrease: 0.002,
        },
        pessimistic: {
          // Wariant pesymistyczny (Tabela 1.2)
          pensionContributionRate: 0.195,
          individualAccountRate: 0.076,
          frdRate: 0.015,
          ofeRate: 0.025,
          inflationRate: 0.025,
          inflationRate2023: 0.098,
          inflationRate2024: 0.048,
          inflationRate2025: 0.031,
          realWageGrowth: 0.024, // Niższy wzrost wynagrodzeń
          realWageGrowth2023: -0.002,
          realWageGrowth2024: 0.029,
          realWageGrowth2025: 0.03,
          collectionRate: 0.98, // Niższa ściągalność
          systemEfficiency: 0.69, // Niższa efektywność
          demographicLoadFactor: 0.45, // Wyższe obciążenie demograficzne
          lifeExpectancyIncrease: 0.002,
        },
        optimistic: {
          // Wariant optymistyczny (Tabela 1.3)
          pensionContributionRate: 0.195,
          individualAccountRate: 0.076,
          frdRate: 0.015,
          ofeRate: 0.025,
          inflationRate: 0.025,
          inflationRate2023: 0.098,
          inflationRate2024: 0.048,
          inflationRate2025: 0.031,
          realWageGrowth: 0.034, // Wyższy wzrost wynagrodzeń
          realWageGrowth2023: 0.008,
          realWageGrowth2024: 0.037,
          realWageGrowth2025: 0.04,
          collectionRate: 0.995, // Wyższa ściągalność
          systemEfficiency: 0.73, // Wyższa efektywność
          demographicLoadFactor: 0.35, // Niższe obciążenie demograficzne
          lifeExpectancyIncrease: 0.002,
        },
      };

      // Calculate for each scenario
      Object.keys(scenarios).forEach((scenarioKey) => {
        const zusParameters = scenarios[scenarioKey];

        // Calculate salary progression with real ZUS parameters
        let finalSalary = data.grossSalary;
        let totalContributions = 0;

        for (
          let year = data.workStartYear;
          year < data.retirementYear;
          year++
        ) {
          const yearsFromStart = year - data.workStartYear;

          // Apply real wage growth based on year
          let wageGrowthRate;
          if (year <= 2023) {
            wageGrowthRate = zusParameters.realWageGrowth2023;
          } else if (year === 2024) {
            wageGrowthRate = zusParameters.realWageGrowth2024;
          } else if (year === 2025) {
            wageGrowthRate = zusParameters.realWageGrowth2025;
          } else {
            wageGrowthRate = zusParameters.realWageGrowth;
          }

          finalSalary = finalSalary * (1 + wageGrowthRate);

          // Calculate annual contributions
          const annualContribution =
            finalSalary * zusParameters.pensionContributionRate;
          const individualContribution =
            annualContribution * zusParameters.individualAccountRate;
          totalContributions += individualContribution;
        }

        // ZUS account calculation with real parameters
        let zusAccount = data.zusAccount || 0;
        if (!zusAccount) {
          zusAccount = totalContributions;
        }

        // Add subaccount if provided
        const totalAccount = zusAccount + (data.zusSubAccount || 0);

        // Sick leave impact with real data
        let sickLeaveReduction = 0;
        if (data.includeSickLeave) {
          // Based on ZUS statistics: men 12 days/year, women 18 days/year
          const sickDaysPerYear = data.gender === "male" ? 12 : 18;
          const sickPayRate = 0.8; // 80% of salary during sick leave
          const sickLeavePercentage = (sickDaysPerYear / 365) * sickPayRate;
          sickLeaveReduction = finalSalary * sickLeavePercentage * workYears;
        }

        // Pension calculation using ZUS methodology
        // Base pension from individual account
        const monthlyPensionFromAccount = totalAccount / 12;

        // Apply system efficiency factor (from ZUS data: 71% efficiency)
        const systemEfficiencyFactor = zusParameters.systemEfficiency;
        const basePension = monthlyPensionFromAccount * systemEfficiencyFactor;

        // Apply sick leave reduction
        const realPension = Math.max(0, basePension - sickLeaveReduction / 12);

        // Inflation adjustment using ZUS projections
        let inflationAdjustment = 1;
        const yearsToRetirement = data.retirementYear - currentYear;

        for (let year = currentYear; year < data.retirementYear; year++) {
          let inflationRate;
          if (year === 2023) {
            inflationRate = zusParameters.inflationRate2023;
          } else if (year === 2024) {
            inflationRate = zusParameters.inflationRate2024;
          } else if (year === 2025) {
            inflationRate = zusParameters.inflationRate2025;
          } else {
            inflationRate = zusParameters.inflationRate;
          }
          inflationAdjustment *= 1 + inflationRate;
        }

        const adjustedPension = realPension / inflationAdjustment;

        // Average pension projection based on ZUS data
        // Current average pension: ~2800 PLN (from ZUS statistics)
        const currentAveragePension = 2800;
        const averagePension = currentAveragePension * inflationAdjustment;

        // Replacement rate calculation
        const replacementRate = (realPension / finalSalary) * 100;

        // System sustainability factor (from ZUS demographic projections)
        const demographicFactor =
          1 - zusParameters.demographicLoadFactor * (yearsToRetirement / 60);
        const sustainablePension =
          realPension * Math.max(0.5, demographicFactor);

        calculatedPension.value[scenarioKey] = {
          real: realPension,
          adjusted: adjustedPension,
          sustainable: sustainablePension,
          averagePension: averagePension,
          difference: adjustedPension - averagePension,
          percentageDifference:
            ((adjustedPension - averagePension) / averagePension) * 100,
          replacementRate: Math.round(replacementRate),
          finalSalary: finalSalary,
          salaryWithoutSickLeave: finalSalary,
          salaryWithSickLeave: finalSalary - sickLeaveReduction / workYears,
          sickLeaveImpact: sickLeaveReduction / workYears,
          retirementYear: data.retirementYear,
          totalContributions: totalContributions,
          systemEfficiency: zusParameters.systemEfficiency,
          demographicFactor: demographicFactor,
        };
      });

      // Calculate additional years options for current scenario
      const currentParams = scenarios[selectedScenario.value];
      calculateAdditionalYearsOptions(
        currentScenarioPension.value.real,
        currentScenarioPension.value.finalSalary,
        workYears,
        currentParams
      );
    };

    const calculateAdditionalYearsOptions = (
      basePension,
      salary,
      workYears,
      zusParameters
    ) => {
      additionalYearsOptions.value = [];
      const additionalYears = [1, 2, 5];

      additionalYears.forEach((years) => {
        // Calculate additional salary with real wage growth
        let additionalSalary = salary;
        for (let i = 0; i < years; i++) {
          additionalSalary *= 1 + zusParameters.realWageGrowth;
        }

        // Calculate additional contributions with real ZUS rates
        const additionalContribution =
          additionalSalary *
          zusParameters.pensionContributionRate *
          zusParameters.individualAccountRate;

        // Apply system efficiency factor
        const newPension =
          basePension +
          (additionalContribution / 12) * zusParameters.systemEfficiency;
        const increase = newPension - basePension;

        additionalYearsOptions.value.push({
          years: years,
          pension: newPension,
          increase: increase,
        });
      });
    };

    const goToAdvanced = () => {
      router.push("/advanced");
    };

    const downloadReport = () => {
      if (!simulationData.value || !calculatedPension.value) {
        alert("Brak danych do wygenerowania raportu");
        return;
      }

      const reportData = ReportGenerator.generatePensionReport(
        simulationData.value,
        calculatedPension.value
      );

      // Show download options
      const format = confirm(
        "Wybierz format raportu:\nOK - PDF (HTML do druku)\nAnuluj - Excel"
      )
        ? "pdf"
        : "excel";

      if (format === "pdf") {
        ReportGenerator.exportToPDF(reportData);
      } else {
        ReportGenerator.exportToExcel(reportData);
      }
    };

    const startNewSimulation = () => {
      router.push("/simulation");
    };

    const savePostalCode = () => {
      if (postalCode.value) {
        // Save postal code to localStorage or send to server
        localStorage.setItem("postalCode", postalCode.value);
        alert("Kod pocztowy został zapisany");
      }
    };

    onMounted(() => {
      // Load simulation data from sessionStorage
      const storedData = sessionStorage.getItem("simulationData");
      if (storedData) {
        simulationData.value = JSON.parse(storedData);
        calculatePension();
      }

      // Load expected pension from localStorage (set in dashboard)
      const storedExpectedPension = localStorage.getItem("expectedPension");
      if (storedExpectedPension) {
        expectedPension.value = parseInt(storedExpectedPension);
      }

      // Load postal code if exists
      const storedPostalCode = localStorage.getItem("postalCode");
      if (storedPostalCode) {
        postalCode.value = storedPostalCode;
      }
    });

    return {
      simulationData,
      calculatedPension,
      currentScenarioPension,
      selectedScenario,
      additionalYearsOptions,
      postalCode,
      expectedPension,
      differenceClass,
      expectedDifferenceClass,
      additionalWorkYears,
      formatCurrency,
      goToAdvanced,
      downloadReport,
      startNewSimulation,
      savePostalCode,
    };
  },
};
</script>

<style scoped>
.results {
  padding: 2rem 0;
}

.results-header {
  text-align: center;
  margin-bottom: 3rem;
}

.results-header h2 {
  font-size: 2.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1rem;
}

.results-header p {
  font-size: 1.2rem;
  color: var(--zus-gray);
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.results-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.result-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  border-top: 4px solid var(--zus-blue);
}

.real-pension {
  border-top-color: var(--zus-green);
}

.adjusted-pension {
  border-top-color: var(--zus-orange);
}

.sustainable-pension {
  border-top-color: var(--zus-red);
}

.result-card h3 {
  font-size: 1.3rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1rem;
}

.pension-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
}

.pension-description {
  color: var(--zus-gray);
  font-size: 1rem;
}

.comparison-section,
.replacement-rate-section,
.zus-analysis-section,
.salary-analysis-section,
.additional-years-section,
.expected-comparison-section {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.comparison-section h3,
.replacement-rate-section h3,
.zus-analysis-section h3,
.salary-analysis-section h3,
.additional-years-section h3,
.expected-comparison-section h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
}

.comparison-stats,
.zus-stats,
.salary-stats,
.expected-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item,
.zus-item,
.salary-item,
.expected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item.highlight,
.expected-item.highlight {
  background: var(--zus-orange);
  color: var(--zus-white);
}

.stat-label,
.zus-label,
.salary-label,
.expected-label {
  font-weight: 500;
}

.stat-value,
.zus-value,
.salary-value,
.expected-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.positive {
  color: var(--zus-green);
}

.negative {
  color: var(--zus-red);
}

.replacement-rate-display {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.rate-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--zus-blue), var(--zus-dark-blue));
  color: var(--zus-white);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rate-percentage {
  font-size: 2rem;
  font-weight: 700;
}

.rate-label {
  font-size: 0.9rem;
  text-align: center;
}

.rate-explanation {
  flex: 1;
}

.warning-text {
  color: var(--zus-red);
  font-weight: 500;
  margin-top: 1rem;
}

.zus-explanation {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--zus-blue);
}

.zus-explanation p {
  margin: 0.5rem 0;
  color: var(--zus-gray);
  line-height: 1.6;
}

.scenario-selection {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.scenario-selection h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
}

.scenario-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.scenario-btn {
  padding: 1rem 2rem;
  border: 2px solid var(--zus-gray);
  background: var(--zus-white);
  color: var(--zus-dark-blue);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
}

.scenario-btn:hover {
  border-color: var(--zus-blue);
  background: #f8f9fa;
}

.scenario-btn.active {
  background: var(--zus-blue);
  color: var(--zus-white);
  border-color: var(--zus-blue);
}

.scenario-btn.active:hover {
  background: var(--zus-dark-blue);
  border-color: var(--zus-dark-blue);
}

.years-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.year-option {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid var(--zus-gray);
}

.year-label {
  font-weight: 600;
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
}

.year-pension {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--zus-blue);
  margin-bottom: 0.25rem;
}

.year-increase {
  font-size: 0.9rem;
  color: var(--zus-green);
  font-weight: 500;
}

.additional-work-needed {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  color: #856404;
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

.postal-code-section {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.postal-code-section h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
}

.postal-code-section p {
  color: var(--zus-gray);
  margin-bottom: 1.5rem;
}

.postal-code-input {
  display: flex;
  justify-content: center;
  gap: 1rem;
  max-width: 300px;
  margin: 0 auto;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
}

.form-input:focus {
  border-color: var(--zus-blue);
  outline: none;
}

.btn-small {
  padding: 0.75rem 1rem;
  background: var(--zus-blue);
  color: var(--zus-white);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-small:hover {
  background: var(--zus-dark-blue);
}

.no-data {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--zus-white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-data h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1rem;
}

.no-data p {
  color: var(--zus-gray);
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .results-cards {
    grid-template-columns: 1fr;
  }

  .replacement-rate-display {
    flex-direction: column;
    text-align: center;
  }

  .years-comparison {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .postal-code-input {
    flex-direction: column;
  }
}
</style>
