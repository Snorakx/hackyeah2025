<template>
  <div class="dashboard">
    <div class="container">
      <div class="dashboard-layout">
        <!-- Left Section -->
        <div class="left-section">
          <div class="main-content">
            <h1>Za ile chcesz żyć, gdy trochę zwolnisz?</h1>
            <p class="subtitle">
              Dodaj wydatki lub wpisz kwotę — zobacz, czy plan się spina.
            </p>

            <div class="input-section">
              <div class="input-group">
                <input
                  v-model="desiredPension"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Za ile chcesz żyć? np. 4500 zł"
                  class="pension-input"
                  @input="updateComparison"
                />
                <button
                  @click="proceedToSimulation"
                  class="btn-proceed"
                  :disabled="!desiredPension"
                >
                  Przejdź dalej →
                </button>
              </div>
              <p class="input-help">
                Wpisz miesięczną kwotę, za którą chcesz wygodnie żyć na
                emeryturze
              </p>
            </div>

            <div class="info-icons">
              <div class="info-item">
                <div class="info-icon">🛡️</div>
                <span>Bezpieczne dane</span>
              </div>
              <div class="info-item">
                <div class="info-icon">📈</div>
                <span>Oparte na realnych stawkach</span>
              </div>
              <div class="info-item">
                <div class="info-icon">🧮</div>
                <span>100% darmowe</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section - Basket -->
        <div class="right-section">
          <div class="basket-card">
            <h3>Twój koszyk</h3>

            <div
              class="basket-area"
              :class="{ 'has-items': basketItems.length > 0 }"
              @dragover.prevent
              @drop="handleDrop"
            >
              <div v-if="basketItems.length === 0" class="empty-basket">
                <div class="basket-icon">🛒</div>
                <p>Przeciągnij tutaj wydatki lub wpisz kwotę poniżej</p>
              </div>
              <div v-else class="basket-items">
                <div
                  v-for="(item, index) in basketItems"
                  :key="index"
                  class="basket-item"
                  @click="removeFromBasket(index)"
                >
                  <div class="item-content">
                    <span class="item-icon">{{ item.icon }}</span>
                    <span class="item-name">{{ item.name }}</span>
                  </div>
                  <span class="item-amount">{{ item.amount }} zł</span>
                </div>
              </div>
            </div>

            <div class="total-amount" v-if="basketItems.length > 0">
              <div class="total-line"></div>
              <div class="total-content">
                <span class="total-label">Razem miesięcznie</span>
                <span class="total-value">{{ totalBasketAmount }} zł</span>
              </div>
            </div>
          </div>

          <div class="available-expenses">
            <h4>Dostępne wydatki</h4>
            <div class="expenses-grid">
              <div
                v-for="expense in availableExpenses"
                :key="expense.id"
                class="expense-item"
                :class="{ selected: selectedExpense === expense.id }"
                @click="addToBasket(expense)"
                @dragstart="handleDragStart($event, expense)"
                draggable="true"
              >
                <div class="expense-icon">{{ expense.icon }}</div>
                <div class="expense-content">
                  <div class="expense-name">{{ expense.name }}</div>
                  <div class="expense-amount">{{ expense.amount }} zł</div>
                </div>
              </div>
            </div>
            <p class="drag-instruction">Przeciągnij wydatki do koszyka</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "Dashboard",
  setup() {
    const router = useRouter();
    const desiredPension = ref("");

    // Basket functionality
    const basketItems = ref([]);
    const selectedExpense = ref(null);

    const availableExpenses = ref([
      { id: 1, name: "Mieszkanie / Czynsz", amount: 1500, icon: "🏠" },
      { id: 2, name: "Jedzenie", amount: 1200, icon: "🛒" },
      { id: 3, name: "Rachunki", amount: 500, icon: "💡" },
      { id: 4, name: "Transport", amount: 400, icon: "🚗" },
      { id: 5, name: "Zdrowie", amount: 300, icon: "💊" },
      { id: 6, name: "Rozrywka", amount: 400, icon: "🎬" },
      { id: 7, name: "Ubrania", amount: 300, icon: "👕" },
      { id: 8, name: "Wakacje", amount: 600, icon: "✈️" },
    ]);

    // Basket functions
    const totalBasketAmount = computed(() => {
      return basketItems.value.reduce((total, item) => total + item.amount, 0);
    });

    const selectExpense = (expenseId) => {
      selectedExpense.value = expenseId;
    };

    const handleDragStart = (event, expense) => {
      event.dataTransfer.setData("application/json", JSON.stringify(expense));
    };

    const addToBasket = (expense) => {
      // Check if item already exists in basket
      const existingItem = basketItems.value.find(
        (item) => item.id === expense.id
      );
      if (!existingItem) {
        basketItems.value.push({ ...expense });
        // Update desired pension if basket has items
        desiredPension.value = totalBasketAmount.value;
      }
    };

    const removeFromBasket = (index) => {
      basketItems.value.splice(index, 1);
      // Update desired pension if basket becomes empty
      if (basketItems.value.length === 0) {
        desiredPension.value = "";
      } else {
        desiredPension.value = totalBasketAmount.value;
      }
    };

    const handleDrop = (event) => {
      event.preventDefault();
      const data = JSON.parse(event.dataTransfer.getData("application/json"));
      addToBasket(data);
    };

    const updateComparison = () => {
      // This function can be used to update the chart when desiredPension changes
    };

    const proceedToSimulation = () => {
      if (desiredPension.value) {
        // Store the desired pension in sessionStorage
        sessionStorage.setItem("desiredPension", desiredPension.value);
        router.push("/simulation");
      }
    };

    onMounted(() => {
      // Initialize component
    });

    return {
      desiredPension,
      updateComparison,
      proceedToSimulation,
      // Basket functionality
      basketItems,
      selectedExpense,
      availableExpenses,
      totalBasketAmount,
      selectExpense,
      handleDragStart,
      addToBasket,
      removeFromBasket,
      handleDrop,
    };
  },
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8f9fa;
  margin: 0;
  padding: 0;
}

.dashboard .container {
  padding: 0;
}

.dashboard-layout {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem 2rem;
}

.left-section {
  flex: 2;
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.main-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a365d;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin-bottom: 2rem;
}

.input-section {
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.pension-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  background: white;
}

.pension-input:focus {
  outline: none;
  border-color: #00a651;
}

.btn-proceed {
  background: #00a651;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.btn-proceed:hover:not(:disabled) {
  background: #008f47;
}

.btn-proceed:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.input-help {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
}

.info-icons {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #718096;
}

.info-icon {
  font-size: 1.2rem;
}

/* Basket Styles */
.basket-card {
  background: white;
  border: 2px solid #00a651;
  border-radius: 8px;
  padding: 16px;
}

.basket-card h3 {
  margin: 0 0 12px 0;
  color: #1a365d;
  font-size: 16px;
  font-weight: 600;
}

.basket-area {
  min-height: 120px;
  border: 2px dashed #cbd5e0;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
}

.basket-area.has-items {
  border-style: solid;
  border-color: #00a651;
  background: white;
  min-height: auto;
  padding: 8px;
}

.empty-basket {
  text-align: center;
  color: #718096;
  font-size: 14px;
}

.basket-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.basket-items {
  width: 100%;
}

.basket-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 32px 12px 12px;
  background: white;
  border: 1px solid #00a651;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
}

.basket-item:hover {
  background: #f8f9fa;
}

.basket-item .item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.basket-item .item-icon {
  font-size: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.basket-item .item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a365d;
  line-height: 1.2;
}

.basket-item .item-amount {
  font-size: 14px;
  color: #00a651;
  font-weight: 600;
}

.basket-item::after {
  content: "×";
  position: absolute;
  right: 8px;
  top: 8px;
  color: #718096;
  font-size: 16px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s ease;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(113, 128, 150, 0.1);
}

.basket-item:hover::after {
  opacity: 1;
  background: rgba(113, 128, 150, 0.2);
}

.total-amount {
  margin-top: 16px;
}

.total-line {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 12px;
}

.total-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 14px;
  color: #1a365d;
  font-weight: 500;
}

.total-value {
  font-size: 16px;
  color: #00a651;
  font-weight: 700;
}

/* Available Expenses */
.available-expenses {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.available-expenses h4 {
  margin: 0 0 1rem 0;
  color: #1a365d;
  font-size: 1.1rem;
  font-weight: 600;
}

.expenses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.expense-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.expense-item:hover {
  border-color: #00a651;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 166, 81, 0.15);
  background: white;
}

.expense-item.selected {
  border-color: #00a651;
  background: #f0fff4;
}

.expense-icon {
  font-size: 1.2rem;
}

.expense-content {
  flex: 1;
}

.expense-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2d3748;
}

.expense-amount {
  font-size: 0.8rem;
  color: #00a651;
  font-weight: 600;
}

.drag-instruction {
  text-align: center;
  font-size: 0.8rem;
  color: #718096;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
    gap: 1.5rem;
  }

  .main-content h1 {
    font-size: 2rem;
  }

  .input-group {
    flex-direction: column;
  }

  .btn-proceed {
    width: 100%;
  }

  .info-icons {
    flex-direction: column;
    gap: 1rem;
  }

  .expenses-grid {
    grid-template-columns: 1fr;
  }
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
