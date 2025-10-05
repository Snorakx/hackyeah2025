<template>
  <div class="results">
    <div class="container">
      <div class="results-header">
        <h2>
          Za ~30 lat będziesz dostawać:
          {{ formatCurrency(currentScenarioPension?.real || 0) }} zł
        </h2>
        <p>Ale spokojnie – to nie koniec świata. Sprawdź, co możesz zrobić.</p>
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
          <div class="actions-text">
            <p>Wynik Cię nie kręci? Sprawdźmy, jak to zmienić.</p>
          </div>
          <div class="actions-buttons">
            <button @click="goToAdvanced" class="btn-secondary">
              Zaawansowane opcje
            </button>
            <button @click="downloadReport" class="btn-outline">
              Pobierz raport
            </button>
            <button @click="startNewSimulation" class="btn-primary">
              Co mogę zrobić?
            </button>
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

      // Debug: sprawdź dane
      console.log("Simulation data:", data);

      // Konwertuj dane na liczby
      const processedData = {
        age: parseInt(data.age) || 0,
        birthYear: parseInt(data.birthYear) || 0,
        gender: data.gender,
        grossSalary: parseFloat(data.grossSalary) || 0,
        workStartYear: parseInt(data.workStartYear) || 0,
        retirementYear: parseInt(data.retirementYear) || 0,
        zusAccount: parseFloat(data.zusAccount) || 0,
        zusSubAccount: parseFloat(data.zusSubAccount) || 0,
        includeSickLeave:
          data.includeSickLeave === true || data.includeSickLeave === "true",
      };

      console.log("Processed data:", processedData);

      // Sprawdź czy dane są poprawne
      if (
        processedData.grossSalary <= 0 ||
        processedData.workStartYear <= 0 ||
        processedData.retirementYear <= 0
      ) {
        console.error("Invalid data:", processedData);
        return;
      }

      // Sprawdź czy retirementYear jest większy od workStartYear
      if (processedData.retirementYear <= processedData.workStartYear) {
        console.error(
          "Retirement year must be after work start year:",
          processedData
        );
        return;
      }

      // Jeśli retirementYear nie jest ustawiony, oblicz na podstawie wieku
      if (!processedData.retirementYear || processedData.retirementYear === 0) {
        const retirementAge = processedData.gender === "female" ? 60 : 65;
        processedData.retirementYear = processedData.birthYear + retirementAge;
        console.log(
          `Calculated retirement year: ${processedData.retirementYear} (age ${retirementAge})`
        );
      }

      console.log("Data validation passed, proceeding with calculations...");

      // Sprawdź szczegóły danych
      console.log("Salary:", processedData.grossSalary);
      console.log("Work start:", processedData.workStartYear);
      console.log("Retirement:", processedData.retirementYear);
      console.log(
        "Years to work:",
        processedData.retirementYear - processedData.workStartYear
      );

      // ZUS parameters based on FUS20 model from zusananaliza.txt
      const scenarios = {
        pessimistic: {
          // Wariant nr 2 (pesymistyczny) z tabeli 1.2
          realWageGrowth: 0.019, // 1.9% real wage growth (2025-2080)
          inflationRate: 0.025, // 2.5% inflation (2025-2080)
          pensionContributionRate: 0.1952, // 19.52% składka emerytalna
          individualAccountRate: 0.076, // 7.6% na subkonto
          systemEfficiency: 0.64, // 64% wydolność (wariant 2)
          demographicLoadFactor: 0.87, // 0.87 współczynnik obciążenia (2080)
          lifeExpectancyIncrease: 0.002,
        },
        intermediate: {
          // Wariant nr 1 (pośredni) z tabeli 1.1
          realWageGrowth: 0.029, // 2.9% real wage growth (2025-2080)
          inflationRate: 0.025, // 2.5% inflation (2025-2080)
          pensionContributionRate: 0.1952, // 19.52% składka emerytalna
          individualAccountRate: 0.076, // 7.6% na subkonto
          systemEfficiency: 0.71, // 71% wydolność (wariant 1)
          demographicLoadFactor: 0.84, // 0.84 współczynnik obciążenia (2080)
          lifeExpectancyIncrease: 0.002,
        },
        optimistic: {
          // Wariant nr 3 (optymistyczny) z tabeli 1.3
          realWageGrowth: 0.038, // 3.8% real wage growth (2025-2080)
          inflationRate: 0.025, // 2.5% inflation (2025-2080)
          pensionContributionRate: 0.1952, // 19.52% składka emerytalna
          individualAccountRate: 0.076, // 7.6% na subkonto
          systemEfficiency: 1.06, // 106% wydolność (wariant 3, 2080)
          demographicLoadFactor: 0.77, // 0.77 współczynnik obciążenia (2080)
          lifeExpectancyIncrease: 0.002,
        },
      };

      // Calculate for each scenario
      Object.keys(scenarios).forEach((scenarioKey) => {
        const zusParameters = scenarios[scenarioKey];

        // Calculate salary progression with real ZUS parameters
        let finalSalary = processedData.grossSalary;
        let totalContributions = 0;

        console.log(`Calculating for scenario: ${scenarioKey}`);
        console.log(`Starting salary: ${finalSalary}`);

        for (
          let year = processedData.workStartYear;
          year < processedData.retirementYear;
          year++
        ) {
          const yearsFromStart = year - processedData.workStartYear;

          // Apply real wage growth based on year
          let wageGrowthRate;
          if (yearsFromStart < 5) {
            wageGrowthRate = zusParameters.realWageGrowth * 1.1; // Slightly higher growth in early career
          } else if (yearsFromStart < 15) {
            wageGrowthRate = zusParameters.realWageGrowth; // Normal growth in mid-career
          } else {
            wageGrowthRate = zusParameters.realWageGrowth * 0.8; // Lower growth in late career
          }

          finalSalary = finalSalary * (1 + wageGrowthRate);

          // Calculate annual contributions (salary is monthly, so multiply by 12)
          const annualSalary = finalSalary * 12;
          const annualContribution =
            annualSalary * zusParameters.pensionContributionRate;
          const individualContribution =
            annualContribution * zusParameters.individualAccountRate;
          totalContributions += individualContribution;

          console.log(
            `Year ${year}: salary=${finalSalary}, annual=${annualSalary}, contribution=${annualContribution}, individual=${individualContribution}`
          );
        }

        // Calculate sick leave impact
        const sickLeaveReduction = processedData.includeSickLeave
          ? finalSalary *
            0.05 *
            (processedData.retirementYear - processedData.workStartYear)
          : 0;

        // Add existing ZUS account balances
        const totalAccountBalance =
          (processedData.zusAccount || 0) + (processedData.zusSubAccount || 0);
        const totalContributionsWithBalance =
          totalContributions + totalAccountBalance;

        // Base pension from individual account
        // Emerytura = zgromadzone środki / średnia długość życia w miesiącach
        const lifeExpectancy = processedData.gender === "female" ? 20 : 18; // lata życia po emeryturze
        const monthsInRetirement = lifeExpectancy * 12;
        const monthlyPensionFromAccount =
          totalContributionsWithBalance / monthsInRetirement;

        console.log(`Total contributions: ${totalContributions}`);
        console.log(`Total with balance: ${totalContributionsWithBalance}`);
        console.log(
          `Monthly pension from account: ${monthlyPensionFromAccount}`
        );

        // Apply system efficiency factor (from ZUS data: wydolność systemu)
        // Wydolność < 100% oznacza deficyt, > 100% oznacza nadwyżkę
        const systemEfficiencyFactor = Math.min(
          1.0,
          zusParameters.systemEfficiency
        );
        const basePension = monthlyPensionFromAccount * systemEfficiencyFactor;

        console.log(`System efficiency: ${systemEfficiencyFactor}`);
        console.log(`Base pension: ${basePension}`);

        // Apply sick leave reduction
        const realPension = Math.max(0, basePension - sickLeaveReduction);

        // Minimalna emerytura jako fallback
        const minimalPension = 1200; // Minimalna emerytura w Polsce
        const finalRealPension = Math.max(realPension, minimalPension);

        // Calculate inflation-adjusted pension
        let inflationAdjustment = 1;
        const yearsToRetirement = Math.max(
          0,
          processedData.retirementYear - currentYear
        );

        console.log(`Years to retirement: ${yearsToRetirement}`);

        for (
          let year = currentYear;
          year < processedData.retirementYear;
          year++
        ) {
          let inflationRate;
          if (year < currentYear + 10) {
            inflationRate = zusParameters.inflationRate * 1.1; // Higher inflation in near term
          } else {
            inflationRate = zusParameters.inflationRate;
          }
          inflationAdjustment *= 1 + inflationRate;
        }

        const adjustedPension = finalRealPension / inflationAdjustment;

        // Calculate average pension for comparison
        const averagePension = 2800; // Base average pension in Poland

        // Calculate replacement rate
        const replacementRate = (finalRealPension / finalSalary) * 100;

        // System sustainability factor (from ZUS demographic projections)
        // Współczynnik obciążenia systemowego rośnie z 0.40 do 0.84
        const currentLoadFactor = 0.4; // 2023
        const futureLoadFactor = zusParameters.demographicLoadFactor; // 2080
        const loadFactorProgression =
          currentLoadFactor +
          (futureLoadFactor - currentLoadFactor) *
            Math.min(1, yearsToRetirement / 57);

        // Im wyższy współczynnik obciążenia, tym niższa emerytura
        const demographicFactor = Math.max(
          0.3,
          1 - (loadFactorProgression - 0.4) * 0.5
        );
        const sustainablePension = finalRealPension * demographicFactor;

        console.log(`Final results for ${scenarioKey}:`);
        console.log(`Real pension: ${finalRealPension}`);
        console.log(`Adjusted pension: ${adjustedPension}`);
        console.log(`Sustainable pension: ${sustainablePension}`);

        calculatedPension.value[scenarioKey] = {
          real: Math.round(finalRealPension),
          adjusted: Math.round(adjustedPension),
          sustainable: Math.round(sustainablePension),
          averagePension: averagePension,
          difference: Math.round(adjustedPension - averagePension),
          percentageDifference: Math.round(
            ((adjustedPension - averagePension) / averagePension) * 100
          ),
          replacementRate: Math.round(replacementRate),
          finalSalary: Math.round(finalSalary),
          salaryWithoutSickLeave: Math.round(finalSalary),
          salaryWithSickLeave: Math.round(
            finalSalary - sickLeaveReduction / 12
          ),
          sickLeaveImpact: Math.round(sickLeaveReduction / 12),
          retirementYear: processedData.retirementYear,
          totalContributions: Math.round(totalContributions),
          systemEfficiency: zusParameters.systemEfficiency,
          demographicFactor: demographicFactor,
        };
      });

      // Calculate additional years options
      const currentParams = scenarios[selectedScenario.value];
      const workYears =
        processedData.retirementYear - processedData.workStartYear;
      calculateAdditionalYearsOptions(
        currentScenarioPension.value.real,
        currentScenarioPension.value.finalSalary,
        workYears,
        currentParams,
        processedData
      );
    };

    const calculateAdditionalYearsOptions = (
      basePension,
      salary,
      workYears,
      zusParameters,
      processedData
    ) => {
      additionalYearsOptions.value = [];
      const yearsToAdd = [1, 2, 5];

      yearsToAdd.forEach((years) => {
        let additionalSalary = salary;
        for (let i = 0; i < years; i++) {
          additionalSalary *= 1 + zusParameters.realWageGrowth;
        }

        // Calculate additional contributions with real ZUS rates
        const annualSalary = additionalSalary * 12;
        const annualContribution =
          annualSalary * zusParameters.pensionContributionRate;
        const individualContribution =
          annualContribution * zusParameters.individualAccountRate;

        // Calculate additional pension from individual account
        const lifeExpectancy = processedData.gender === "female" ? 20 : 18;
        const monthsInRetirement = lifeExpectancy * 12;
        const additionalMonthlyPension =
          individualContribution / monthsInRetirement;

        // Apply system efficiency factor
        const newPension =
          basePension +
          additionalMonthlyPension * zusParameters.systemEfficiency;
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
      };

      ReportGenerator.generateReport(reportData);
    };

    const startNewSimulation = () => {
      sessionStorage.removeItem("simulationData");
      router.push("/simulation");
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
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
      expectedPension,
      selectedScenario,
      calculatedPension,
      additionalYearsOptions,
      currentScenarioPension,
      differenceClass,
      goToAdvanced,
      downloadReport,
      startNewSimulation,
      formatCurrency,
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
  margin: 2rem 0;
  text-align: center;
}

.actions-text {
  margin-bottom: 1.5rem;
}

.actions-text p {
  color: var(--zus-text-light);
  font-size: 1.1rem;
  margin: 0;
}

.actions-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
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
