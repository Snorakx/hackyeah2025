<template>
  <div class="admin-panel">
    <div class="container">
      <div class="admin-header">
        <h2>Panel administracyjny</h2>
        <p>Raportowanie zainteresowania symulatorem emerytalnym</p>
      </div>

      <div class="admin-content">
        <!-- Statistics Overview -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-number">{{ totalUsers }}</div>
              <div class="stat-label">Użytkownicy</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ totalSimulations }}</div>
              <div class="stat-label">Symulacje</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">{{ averagePension }} zł</div>
              <div class="stat-label">Średnia emerytura</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-number">{{ todaySimulations }}</div>
              <div class="stat-label">Dziś</div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filters-card">
            <h3>Filtry raportu</h3>
            <div class="filters-grid">
              <div class="filter-group">
                <label for="date-from">Data od</label>
                <input
                  id="date-from"
                  v-model="filters.dateFrom"
                  type="date"
                  class="form-input"
                />
              </div>
              <div class="filter-group">
                <label for="date-to">Data do</label>
                <input
                  id="date-to"
                  v-model="filters.dateTo"
                  type="date"
                  class="form-input"
                />
              </div>
              <div class="filter-group">
                <label for="gender-filter">Płeć</label>
                <select
                  id="gender-filter"
                  v-model="filters.gender"
                  class="form-select"
                >
                  <option value="">Wszystkie</option>
                  <option value="male">Mężczyźni</option>
                  <option value="female">Kobiety</option>
                </select>
              </div>
              <div class="filter-group">
                <label for="age-range">Przedział wiekowy</label>
                <select
                  id="age-range"
                  v-model="filters.ageRange"
                  class="form-select"
                >
                  <option value="">Wszystkie</option>
                  <option value="18-30">18-30 lat</option>
                  <option value="31-45">31-45 lat</option>
                  <option value="46-60">46-60 lat</option>
                  <option value="60+">60+ lat</option>
                </select>
              </div>
              <div class="filter-actions">
                <button @click="applyFilters" class="btn-primary">
                  Zastosuj filtry
                </button>
                <button @click="clearFilters" class="btn-secondary">
                  Wyczyść
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Usage Chart -->
        <div class="chart-section">
          <div class="chart-card">
            <h3>Wykres użycia w czasie</h3>
            <div class="chart-container">
              <canvas ref="usageChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-section">
          <div class="table-card">
            <div class="table-header">
              <h3>Dane użycia symulatora</h3>
              <div class="table-actions">
                <button @click="exportToExcel" class="btn-primary">
                  📊 Eksportuj do Excel
                </button>
                <button @click="refreshData" class="btn-secondary">
                  🔄 Odśwież
                </button>
              </div>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Data użycia</th>
                    <th>Godzina</th>
                    <th>Emerytura oczekiwana</th>
                    <th>Wiek</th>
                    <th>Płeć</th>
                    <th>Wynagrodzenie</th>
                    <th>Okresy choroby</th>
                    <th>Konto ZUS</th>
                    <th>Emerytura rzeczywista</th>
                    <th>Emerytura urealniona</th>
                    <th>Kod pocztowy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(record, index) in paginatedData" :key="index">
                    <td>{{ formatDate(record.date) }}</td>
                    <td>{{ record.time }}</td>
                    <td>{{ formatCurrency(record.expectedPension) }}</td>
                    <td>{{ record.age }}</td>
                    <td>{{ record.gender === "male" ? "M" : "K" }}</td>
                    <td>{{ formatCurrency(record.salary) }}</td>
                    <td>{{ record.includeSickLeave ? "Tak" : "Nie" }}</td>
                    <td>{{ formatCurrency(record.zusAccount) }}</td>
                    <td>{{ formatCurrency(record.realPension) }}</td>
                    <td>{{ formatCurrency(record.adjustedPension) }}</td>
                    <td>{{ record.postalCode || "-" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="btn-pagination"
              >
                ← Poprzednia
              </button>
              <span class="page-info">
                Strona {{ currentPage }} z {{ totalPages }}
              </span>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="btn-pagination"
              >
                Następna →
              </button>
            </div>
          </div>
        </div>

        <!-- Regional Analysis -->
        <div class="regional-section">
          <div class="regional-card">
            <h3>Analiza regionalna</h3>
            <div class="regional-chart-container">
              <canvas ref="regionalChart"></canvas>
            </div>
            <div class="regional-stats">
              <div
                class="regional-item"
                v-for="region in regionalData"
                :key="region.name"
              >
                <div class="region-name">{{ region.name }}</div>
                <div class="region-count">{{ region.count }} symulacji</div>
                <div class="region-percentage">{{ region.percentage }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import { Chart, registerables } from "chart.js";
import * as XLSX from "xlsx";

Chart.register(...registerables);

export default {
  name: "AdminPanel",
  setup() {
    const usageChart = ref(null);
    const regionalChart = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 10;

    const filters = ref({
      dateFrom: "",
      dateTo: "",
      gender: "",
      ageRange: "",
    });

    // Sample data - in real app this would come from API
    const usageData = ref([
      {
        date: "2025-01-15",
        time: "14:30",
        expectedPension: 5000,
        age: 35,
        gender: "male",
        salary: 8000,
        includeSickLeave: true,
        zusAccount: 120000,
        realPension: 3200,
        adjustedPension: 2800,
        postalCode: "00-001",
      },
      {
        date: "2025-01-15",
        time: "16:45",
        expectedPension: 3000,
        age: 28,
        gender: "female",
        salary: 5500,
        includeSickLeave: false,
        zusAccount: 45000,
        realPension: 2100,
        adjustedPension: 1900,
        postalCode: "30-001",
      },
      {
        date: "2025-01-14",
        time: "10:15",
        expectedPension: 7000,
        age: 45,
        gender: "male",
        salary: 12000,
        includeSickLeave: true,
        zusAccount: 200000,
        realPension: 4800,
        adjustedPension: 4200,
        postalCode: "50-001",
      },
      {
        date: "2025-01-14",
        time: "09:30",
        expectedPension: 2500,
        age: 32,
        gender: "female",
        salary: 6000,
        includeSickLeave: true,
        zusAccount: 80000,
        realPension: 2400,
        adjustedPension: 2100,
        postalCode: "80-001",
      },
      {
        date: "2025-01-13",
        time: "15:20",
        expectedPension: 4000,
        age: 40,
        gender: "male",
        salary: 9000,
        includeSickLeave: false,
        zusAccount: 150000,
        realPension: 3600,
        adjustedPension: 3200,
        postalCode: "20-001",
      },
    ]);

    const regionalData = ref([
      { name: "Mazowieckie", count: 45, percentage: 25 },
      { name: "Śląskie", count: 38, percentage: 21 },
      { name: "Wielkopolskie", count: 32, percentage: 18 },
      { name: "Małopolskie", count: 28, percentage: 16 },
      { name: "Dolnośląskie", count: 22, percentage: 12 },
      { name: "Inne", count: 15, percentage: 8 },
    ]);

    const totalUsers = computed(() => {
      const uniqueUsers = new Set(
        usageData.value.map((record) => record.age + record.gender)
      );
      return uniqueUsers.size;
    });

    const totalSimulations = computed(() => usageData.value.length);

    const averagePension = computed(() => {
      const total = usageData.value.reduce(
        (sum, record) => sum + record.adjustedPension,
        0
      );
      return Math.round(total / usageData.value.length);
    });

    const todaySimulations = computed(() => {
      const today = new Date().toISOString().split("T")[0];
      return usageData.value.filter((record) => record.date === today).length;
    });

    const filteredData = computed(() => {
      let filtered = [...usageData.value];

      if (filters.value.dateFrom) {
        filtered = filtered.filter(
          (record) => record.date >= filters.value.dateFrom
        );
      }
      if (filters.value.dateTo) {
        filtered = filtered.filter(
          (record) => record.date <= filters.value.dateTo
        );
      }
      if (filters.value.gender) {
        filtered = filtered.filter(
          (record) => record.gender === filters.value.gender
        );
      }
      if (filters.value.ageRange) {
        const [min, max] = filters.value.ageRange.split("-").map(Number);
        if (max) {
          filtered = filtered.filter(
            (record) => record.age >= min && record.age <= max
          );
        } else {
          filtered = filtered.filter((record) => record.age >= min);
        }
      }

      return filtered;
    });

    const totalPages = computed(() =>
      Math.ceil(filteredData.value.length / itemsPerPage)
    );

    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredData.value.slice(start, end);
    });

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("pl-PL");
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("pl-PL").format(Math.round(amount));
    };

    const createUsageChart = () => {
      if (!usageChart.value) return;

      const ctx = usageChart.value.getContext("2d");

      // Group data by date
      const dateGroups = {};
      usageData.value.forEach((record) => {
        if (!dateGroups[record.date]) {
          dateGroups[record.date] = 0;
        }
        dateGroups[record.date]++;
      });

      const dates = Object.keys(dateGroups).sort();
      const counts = dates.map((date) => dateGroups[date]);

      new Chart(ctx, {
        type: "line",
        data: {
          labels: dates.map((date) =>
            new Date(date).toLocaleDateString("pl-PL")
          ),
          datasets: [
            {
              label: "Liczba symulacji",
              data: counts,
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
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      });
    };

    const createRegionalChart = () => {
      if (!regionalChart.value) return;

      const ctx = regionalChart.value.getContext("2d");

      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: regionalData.value.map((region) => region.name),
          datasets: [
            {
              data: regionalData.value.map((region) => region.count),
              backgroundColor: [
                "var(--zus-blue)",
                "var(--zus-green)",
                "var(--zus-orange)",
                "var(--zus-red)",
                "var(--zus-gray)",
                "var(--zus-dark-blue)",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    };

    const applyFilters = () => {
      currentPage.value = 1;
    };

    const clearFilters = () => {
      filters.value = {
        dateFrom: "",
        dateTo: "",
        gender: "",
        ageRange: "",
      };
      currentPage.value = 1;
    };

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const exportToExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(filteredData.value);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Raport użycia");

      const fileName = `raport-uzycia-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);
    };

    const refreshData = () => {
      // In real app, this would fetch fresh data from API
      alert("Dane zostały odświeżone");
    };

    onMounted(() => {
      nextTick(() => {
        createUsageChart();
        createRegionalChart();
      });
    });

    return {
      usageChart,
      regionalChart,
      currentPage,
      filters,
      usageData,
      regionalData,
      totalUsers,
      totalSimulations,
      averagePension,
      todaySimulations,
      filteredData,
      totalPages,
      paginatedData,
      formatDate,
      formatCurrency,
      createUsageChart,
      createRegionalChart,
      applyFilters,
      clearFilters,
      previousPage,
      nextPage,
      exportToExcel,
      refreshData,
    };
  },
};
</script>

<style scoped>
.admin-panel {
  padding: 2rem 0;
}

.admin-header {
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h2 {
  font-size: 2.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1rem;
}

.admin-header p {
  font-size: 1.2rem;
  color: var(--zus-gray);
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--zus-dark-blue);
}

.stat-label {
  font-size: 1rem;
  color: var(--zus-gray);
  font-weight: 500;
}

.filters-section,
.chart-section,
.table-section,
.regional-section {
  background: var(--zus-white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filters-card,
.chart-card,
.table-card,
.regional-card {
  padding: 2rem;
}

.filters-card h3,
.chart-card h3,
.table-card h3,
.regional-card h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: var(--zus-dark-blue);
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  font-size: 1rem;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--zus-blue);
  outline: none;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  grid-column: 1 / -1;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: var(--zus-blue);
  color: var(--zus-white);
}

.btn-primary:hover {
  background: var(--zus-dark-blue);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--zus-gray);
  color: var(--zus-white);
}

.btn-secondary:hover {
  background: #666;
}

.chart-container,
.regional-chart-container {
  height: 300px;
  margin-bottom: 1rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-actions {
  display: flex;
  gap: 1rem;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--zus-gray);
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: var(--zus-dark-blue);
  position: sticky;
  top: 0;
}

.data-table tr:hover {
  background: #f8f9fa;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.btn-pagination {
  padding: 0.5rem 1rem;
  background: var(--zus-blue);
  color: var(--zus-white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-pagination:hover:not(:disabled) {
  background: var(--zus-dark-blue);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: var(--zus-dark-blue);
}

.regional-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.regional-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.region-name {
  font-weight: 600;
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
}

.region-count {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--zus-blue);
  margin-bottom: 0.25rem;
}

.region-percentage {
  font-size: 0.9rem;
  color: var(--zus-gray);
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .table-actions {
    justify-content: center;
  }

  .regional-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .admin-header h2 {
    font-size: 2rem;
  }
}
</style>
