<template>
  <div class="results">
    <div class="container">
      <div class="results-header">
        <h2>Wyniki symulacji emerytury</h2>
        <p>Oto prognoza Twojej przyszłej emerytury</p>
      </div>

      <!-- Wyjaśnienia dla użytkownika -->
      <PensionExplanation />

      <div v-if="simulationData" class="results-content">
        <!-- Scenario Selection -->
        <ScenarioSelector
          :selected-scenario="selectedScenario"
          @select="selectedScenario = $event"
        />

        <!-- Main Results -->
        <PensionResults :pension="currentScenarioPension" />

        <!-- ZUS Details -->
        <ZusDetails :pension="currentScenarioPension" />

        <!-- Additional Years -->
        <AdditionalYears :options="additionalYearsOptions" />

        <!-- Actions -->
        <div class="actions-section">
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

        <!-- Postal Code -->
        <div class="postal-code-section">
          <h4>Kod pocztowy (opcjonalny)</h4>
          <p>Pomóż nam lepiej zrozumieć potrzeby różnych regionów</p>
          <input
            v-model="postalCode"
            type="text"
            placeholder="Wprowadź kod pocztowy"
            class="postal-input"
            maxlength="6"
            pattern="[0-9]{2}-[0-9]{3}"
          />
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
import PensionExplanation from "./PensionExplanation.vue";
import ScenarioSelector from "./ScenarioSelector.vue";
import PensionResults from "./PensionResults.vue";
import ZusDetails from "./ZusDetails.vue";
import AdditionalYears from "./AdditionalYears.vue";
import { ReportGenerator } from "../utils/reportGenerator.js";

export default {
  name: "Results",
  components: {
    PensionExplanation,
    ScenarioSelector,
    PensionResults,
    ZusDetails,
    AdditionalYears,
  },
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

    const calculatePension = () => {
      if (!simulationData.value) return;

      const data = simulationData.value;
      const currentYear = new Date().getFullYear();

      // ZUS parameters for different scenarios
      const scenarios = {
        pessimistic: {
          realWageGrowth: 0.02, // 2% real wage growth
          inflationRate: 0.035, // 3.5% inflation
          pensionContributionRate: 0.1952, // 19.52%
          individualAccountRate: 0.076, // 7.6%
          systemEfficiency: 0.71, // 71% efficiency
          demographicLoadFactor: 0.45, // Higher demographic burden
          lifeExpectancyIncrease: 0.003,
        },
        intermediate: {
          realWageGrowth: 0.025, // 2.5% real wage growth
          inflationRate: 0.03, // 3% inflation
          pensionContributionRate: 0.1952, // 19.52%
          individualAccountRate: 0.076, // 7.6%
          systemEfficiency: 0.71, // 71% efficiency
          demographicLoadFactor: 0.4, // Moderate demographic burden
          lifeExpectancyIncrease: 0.0025,
        },
        optimistic: {
          realWageGrowth: 0.03, // 3% real wage growth
          inflationRate: 0.025, // 2.5% inflation
          pensionContributionRate: 0.1952, // 19.52%
          individualAccountRate: 0.076, // 7.6%
          systemEfficiency: 0.71, // 71% efficiency
          demographicLoadFactor: 0.35, // Lower demographic burden
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
          if (yearsFromStart < 5) {
            wageGrowthRate = zusParameters.realWageGrowth * 1.2; // Higher growth in early career
          } else if (yearsFromStart < 15) {
            wageGrowthRate = zusParameters.realWageGrowth * 1.1; // Moderate growth in mid-career
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

        // Calculate sick leave impact
        const sickLeaveReduction = data.includeSickLeave
          ? finalSalary * 0.05 * (data.retirementYear - data.workStartYear)
          : 0;

        // Base pension from individual account
        const monthlyPensionFromAccount = totalAccount / 12;

        // Apply system efficiency factor (from ZUS data: 71% efficiency)
        const systemEfficiencyFactor = zusParameters.systemEfficiency;
        const basePension = monthlyPensionFromAccount * systemEfficiencyFactor;

        // Apply sick leave reduction
        const realPension = Math.max(0, basePension - sickLeaveReduction / 12);

        // Calculate inflation-adjusted pension
        let inflationAdjustment = 1;
        const yearsToRetirement = data.retirementYear - currentYear;

        for (let year = currentYear; year < data.retirementYear; year++) {
          let inflationRate;
          if (year < currentYear + 10) {
            inflationRate = zusParameters.inflationRate * 1.1; // Higher inflation in near term
          } else {
            inflationRate = zusParameters.inflationRate;
          }
          inflationAdjustment *= 1 + inflationRate;
        }

        const adjustedPension = realPension / inflationAdjustment;

        // Calculate average pension for comparison
        const averagePension = 3500; // Base average pension

        // Calculate replacement rate
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
          salaryWithSickLeave: finalSalary - sickLeaveReduction / 12,
          sickLeaveImpact: sickLeaveReduction / 12,
          retirementYear: data.retirementYear,
          totalContributions: totalContributions,
          systemEfficiency: zusParameters.systemEfficiency,
          demographicFactor: demographicFactor,
        };
      });

      // Calculate additional years options
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
      const yearsToAdd = [1, 2, 5];

      yearsToAdd.forEach((years) => {
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
          increase: increase,
          newPension: newPension,
          finalSalary: additionalSalary,
        });
      });
    };

    const goToAdvanced = () => {
      router.push("/advanced");
    };

    const downloadReport = () => {
      if (!simulationData.value) return;

      const reportData = {
        ...simulationData.value,
        results: calculatedPension.value,
        selectedScenario: selectedScenario.value,
        postalCode: postalCode.value,
      };

      ReportGenerator.generateReport(reportData);
    };

    const startNewSimulation = () => {
      sessionStorage.removeItem("simulationData");
      router.push("/simulation");
    };

    onMounted(() => {
      const data = sessionStorage.getItem("simulationData");
      if (data) {
        simulationData.value = JSON.parse(data);
        calculatePension();
      }
    });

    return {
      simulationData,
      postalCode,
      expectedPension,
      selectedScenario,
      calculatedPension,
      additionalYearsOptions,
      currentScenarioPension,
      differenceClass,
      goToAdvanced,
      downloadReport,
      startNewSimulation,
    };
  },
};
</script>

<style scoped>
.results {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--zus-light-gray), var(--zus-white));
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h2 {
  color: var(--zus-dark-blue);
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.results-header p {
  color: var(--zus-text-light);
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.actions-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 2rem 0;
}

.postal-code-section {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--zus-blue);
  text-align: center;
}

.postal-code-section h4 {
  color: var(--zus-dark-blue);
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.postal-code-section p {
  color: var(--zus-text-light);
  margin-bottom: 1rem;
}

.postal-input {
  width: 200px;
  padding: 1rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
  transition: all 0.3s ease;
}

.postal-input:focus {
  outline: none;
  border-color: var(--zus-blue);
  box-shadow: 0 0 0 3px rgba(63, 132, 210, 0.2);
}

.no-data {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--zus-white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-data h3 {
  color: var(--zus-dark-blue);
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.no-data p {
  color: var(--zus-text-light);
  font-size: 1.1rem;
  margin-bottom: 2rem;
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
  min-width: 150px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--zus-green), var(--zus-dark-green));
  color: var(--zus-white);
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
  background: var(--zus-orange);
  color: var(--zus-white);
}

.btn-secondary:hover {
  background: var(--zus-blue);
  transform: translateY(-2px);
}

.btn-outline {
  background: var(--zus-white);
  color: var(--zus-blue);
  border: 2px solid var(--zus-blue);
}

.btn-outline:hover {
  background: var(--zus-blue);
  color: var(--zus-white);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .results-header h2 {
    font-size: 2rem;
  }
  
  .results-header p {
    font-size: 1rem;
  }
  
  .actions-section {
    flex-direction: column;
    align-items: center;
  }
  
  .postal-input {
    width: 100%;
    max-width: 300px;
  }
}
</style>