<template>
  <div class="conversation-form">
    <div class="container">
      <div class="conversation-header">
        <h2>Symulacja emerytury</h2>
        <p>
          Odpowiedz na kilka pytań, a pomożemy Ci zaprognozować przyszłą
          emeryturę
        </p>
      </div>

      <!-- Conversation Flow -->
      <div class="conversation-container">
        <div class="conversation-messages">
          <!-- All Messages in Order -->
          <div
            v-for="(message, index) in conversationHistory"
            :key="`message-${index}`"
            class="message"
            :class="{
              'bot-message': message.type === 'bot',
              'user-message': message.type === 'user',
              'message-visible': message.visible,
            }"
          >
            <div v-if="message.type === 'bot'" class="message-avatar">
              <div class="avatar">ZUS</div>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.text }}</div>
              <div class="message-time">{{ message.timestamp }}</div>
            </div>
            <div v-if="message.type === 'user'" class="message-avatar">
              <div class="avatar user-avatar">Ty</div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="message bot-message typing-message">
            <div class="message-avatar">
              <div class="avatar">ZUS</div>
            </div>
            <div class="message-content typing-content">
              <div class="typing-text">
                {{ currentQuestion ? currentQuestion.text : "Piszę..." }}
              </div>
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Question Input -->
        <div v-if="currentQuestion && !showSummary" class="current-question">
          <div class="question-card">
            <div class="question-text">{{ currentQuestion.text }}</div>
            <div class="question-input">
              <!-- Age Input -->
              <input
                v-if="currentQuestion.type === 'age'"
                v-model="currentAnswer"
                type="number"
                min="18"
                max="70"
                placeholder="Wprowadź swój wiek"
                class="form-input"
                @keyup.enter="submitAnswer"
                @focus="hideTypingIndicator"
              />

              <!-- Gender Select -->
              <select
                v-else-if="currentQuestion.type === 'gender'"
                v-model="currentAnswer"
                class="form-select"
                @change="submitAnswer"
                @focus="hideTypingIndicator"
              >
                <option value="">Wybierz płeć</option>
                <option value="male">Mężczyzna</option>
                <option value="female">Kobieta</option>
              </select>

              <!-- Salary Input -->
              <input
                v-else-if="currentQuestion.type === 'salary'"
                v-model="currentAnswer"
                type="number"
                min="0"
                step="100"
                placeholder="Wprowadź wynagrodzenie brutto"
                class="form-input"
                @keyup.enter="submitAnswer"
                @focus="hideTypingIndicator"
              />

              <!-- Work Start Year -->
              <input
                v-else-if="currentQuestion.type === 'workStart'"
                v-model="currentAnswer"
                type="number"
                :min="currentYear - 50"
                :max="currentYear"
                placeholder="Rok rozpoczęcia pracy"
                class="form-input"
                @keyup.enter="submitAnswer"
                @focus="hideTypingIndicator"
              />

              <!-- Retirement Year -->
              <input
                v-else-if="currentQuestion.type === 'retirement'"
                v-model="currentAnswer"
                type="number"
                :min="currentYear"
                :max="currentYear + 50"
                placeholder="Planowany rok zakończenia pracy"
                class="form-input"
                @keyup.enter="submitAnswer"
                @focus="hideTypingIndicator"
              />

              <!-- ZUS Account -->
              <input
                v-else-if="currentQuestion.type === 'zusAccount'"
                v-model="currentAnswer"
                type="number"
                min="0"
                step="100"
                placeholder="Wprowadź kwotę (opcjonalnie)"
                class="form-input"
                @keyup.enter="submitAnswer"
                @focus="hideTypingIndicator"
              />

              <!-- ZUS Sub Account -->
              <input
                v-else-if="currentQuestion.type === 'zusSubAccount'"
                v-model="currentAnswer"
                type="number"
                min="0"
                step="100"
                placeholder="Wprowadź kwotę (opcjonalnie)"
                class="form-input"
                @keyup.enter="submitAnswer"
                @focus="hideTypingIndicator"
              />

              <!-- Sick Leave Checkbox -->
              <div
                v-else-if="currentQuestion.type === 'sickLeave'"
                class="checkbox-container"
              >
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="currentAnswer"
                    class="checkbox-input"
                    @change="submitAnswer"
                    @focus="hideTypingIndicator"
                  />
                  <span class="checkbox-custom"></span>
                  Tak, uwzględnij możliwość zwolnień lekarskich
                </label>
              </div>
            </div>
            <button
              @click="submitAnswer"
              class="btn-primary"
              :disabled="!canSubmitAnswer"
              @mousedown="hideTypingIndicator"
            >
              {{
                currentQuestion.type === "sickLeave" ? "Kontynuuj" : "Odpowiedz"
              }}
            </button>
          </div>
        </div>

        <!-- Summary Section -->
        <div v-if="showSummary" class="summary-section">
          <div class="summary-card">
            <h3>Podsumowanie Twoich odpowiedzi</h3>
            <div class="summary-content">
              <div class="summary-item">
                <span class="summary-label">Wiek:</span>
                <span class="summary-value">{{ formData.age }} lat</span>
                <button @click="editField('age')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item">
                <span class="summary-label">Płeć:</span>
                <span class="summary-value">{{
                  formData.gender === "male" ? "Mężczyzna" : "Kobieta"
                }}</span>
                <button @click="editField('gender')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item">
                <span class="summary-label">Wynagrodzenie brutto:</span>
                <span class="summary-value"
                  >{{ formatCurrency(formData.grossSalary) }} zł</span
                >
                <button @click="editField('grossSalary')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item">
                <span class="summary-label">Rok rozpoczęcia pracy:</span>
                <span class="summary-value">{{ formData.workStartYear }}</span>
                <button @click="editField('workStartYear')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item">
                <span class="summary-label"
                  >Planowany rok zakończenia pracy:</span
                >
                <span class="summary-value">{{ formData.retirementYear }}</span>
                <button @click="editField('retirementYear')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item" v-if="formData.zusAccount">
                <span class="summary-label">Konto ZUS:</span>
                <span class="summary-value"
                  >{{ formatCurrency(formData.zusAccount) }} zł</span
                >
                <button @click="editField('zusAccount')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item" v-if="formData.zusSubAccount">
                <span class="summary-label">Subkonto ZUS:</span>
                <span class="summary-value"
                  >{{ formatCurrency(formData.zusSubAccount) }} zł</span
                >
                <button @click="editField('zusSubAccount')" class="edit-btn">
                  Edytuj
                </button>
              </div>
              <div class="summary-item" v-if="formData.includeSickLeave">
                <span class="summary-label">Zwolnienia lekarskie:</span>
                <span class="summary-value">Uwzględnione</span>
                <button @click="editField('includeSickLeave')" class="edit-btn">
                  Edytuj
                </button>
              </div>
            </div>
            <div class="summary-actions">
              <button @click="goBack" class="btn-secondary">
                Wróć do pytań
              </button>
              <button @click="calculatePension" class="btn-primary">
                Oblicz emeryturę
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Modal -->
        <div v-if="editingField" class="edit-modal">
          <div class="modal-content">
            <h3>Edytuj {{ getFieldLabel(editingField) }}</h3>
            <div class="edit-input">
              <input
                v-if="editingField === 'age'"
                v-model="editValue"
                type="number"
                min="18"
                max="70"
                class="form-input"
              />
              <select
                v-else-if="editingField === 'gender'"
                v-model="editValue"
                class="form-select"
              >
                <option value="">Wybierz płeć</option>
                <option value="male">Mężczyzna</option>
                <option value="female">Kobieta</option>
              </select>
              <input
                v-else-if="
                  ['grossSalary', 'zusAccount', 'zusSubAccount'].includes(
                    editingField
                  )
                "
                v-model="editValue"
                type="number"
                min="0"
                step="100"
                class="form-input"
              />
              <input
                v-else-if="
                  ['workStartYear', 'retirementYear'].includes(editingField)
                "
                v-model="editValue"
                type="number"
                :min="
                  editingField === 'workStartYear'
                    ? currentYear - 50
                    : currentYear
                "
                :max="
                  editingField === 'retirementYear'
                    ? currentYear + 50
                    : currentYear
                "
                class="form-input"
              />
              <div
                v-else-if="editingField === 'includeSickLeave'"
                class="checkbox-container"
              >
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="editValue"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  Uwzględnij możliwość zwolnień lekarskich
                </label>
              </div>
            </div>
            <div class="modal-actions">
              <button @click="cancelEdit" class="btn-secondary">Anuluj</button>
              <button @click="saveEdit" class="btn-primary">Zapisz</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div
          v-for="(question, index) in questions"
          :key="index"
          class="progress-step"
          :class="{
            active: index <= currentQuestionIndex,
            completed: index < currentQuestionIndex,
          }"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ question.shortLabel }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "ConversationForm",
  setup() {
    const router = useRouter();
    const currentYear = new Date().getFullYear();

    // Form data
    const formData = ref({
      age: "",
      gender: "",
      grossSalary: "",
      workStartYear: "",
      retirementYear: "",
      zusAccount: "",
      zusSubAccount: "",
      includeSickLeave: false,
    });

    // Conversation state
    const conversationHistory = ref([]);
    const currentQuestionIndex = ref(0);
    const currentAnswer = ref("");
    const showSummary = ref(false);
    const editingField = ref(null);
    const editValue = ref("");
    const isTyping = ref(false);

    // Questions configuration
    const questions = ref([
      {
        type: "age",
        text: "Cześć! 👋 Jestem Twoim asystentem ZUS. Używam najnowszego modelu FUS20 do prognozowania emerytur. Zacznijmy od podstaw - ile masz lat?",
        shortLabel: "Wiek",
      },
      {
        type: "gender",
        text: "Dziękuję! Teraz powiedz mi, jaka jest Twoja płeć? To ważne, ponieważ wiek emerytalny różni się w zależności od płci (mężczyźni 65 lat, kobiety 60 lat).",
        shortLabel: "Płeć",
      },
      {
        type: "salary",
        text: "Świetnie! Teraz powiedz mi, jakie jest Twoje obecne wynagrodzenie brutto? To pomoże mi oszacować Twoje przyszłe składki emerytalne (19,5% ZUS).",
        shortLabel: "Wynagrodzenie",
      },
      {
        type: "workStart",
        text: "W jakim roku rozpocząłeś/aś pracę zawodową? Jeśli pracujesz od niedawna, podaj przybliżony rok. To pomoże mi obliczyć łączny okres składkowy.",
        shortLabel: "Początek pracy",
      },
      {
        type: "retirement",
        text: "W jakim roku planujesz zakończyć aktywność zawodową? Jeśli nie masz konkretnych planów, zostawię domyślny wiek emerytalny.",
        shortLabel: "Zakończenie pracy",
      },
      {
        type: "zusAccount",
        text: "Czy znasz wysokość środków zgromadzonych na swoim koncie ZUS? Jeśli nie, oszacuję to na podstawie Twojego wynagrodzenia i stażu pracy (7,6% składek trafia na Twoje konto).",
        shortLabel: "Konto ZUS",
      },
      {
        type: "zusSubAccount",
        text: "A czy masz jakieś środki na subkoncie ZUS? To również opcjonalne - pomoże mi to dokładniej obliczyć Twoją emeryturę.",
        shortLabel: "Subkonto ZUS",
      },
      {
        type: "sickLeave",
        text: "Ostatnie pytanie - czy chcesz, żebym uwzględnił możliwość zwolnień lekarskich w obliczeniach? Statystycznie mężczyźni biorą 12 dni L4 rocznie, kobiety 18 dni.",
        shortLabel: "Zwolnienia",
      },
    ]);

    const currentQuestion = computed(() => {
      return questions.value[currentQuestionIndex.value] || null;
    });

    const canSubmitAnswer = computed(() => {
      if (!currentQuestion.value) return false;

      if (currentQuestion.value.type === "sickLeave") {
        return true; // Checkbox can always be submitted
      }

      return currentAnswer.value !== "" && currentAnswer.value !== null;
    });

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("pl-PL").format(Math.round(amount));
    };

    const getFieldLabel = (field) => {
      const labels = {
        age: "wiek",
        gender: "płeć",
        grossSalary: "wynagrodzenie brutto",
        workStartYear: "rok rozpoczęcia pracy",
        retirementYear: "planowany rok zakończenia pracy",
        zusAccount: "konto ZUS",
        zusSubAccount: "subkonto ZUS",
        includeSickLeave: "zwolnienia lekarskie",
      };
      return labels[field] || field;
    };

    const addMessage = (text, type) => {
      const message = {
        text,
        type, // 'bot' or 'user'
        timestamp: new Date().toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        visible: type === "user", // User messages are immediately visible
      };
      conversationHistory.value.push(message);

      // Animate message appearance and scroll to bottom
      if (type === "user") {
        // User messages appear immediately
        scrollToBottom();
      } else {
        // Bot messages have animation
        setTimeout(() => {
          message.visible = true;
          scrollToBottom();
        }, 100);
      }
    };

    const scrollToBottom = () => {
      nextTick(() => {
        const messagesContainer = document.querySelector(
          ".conversation-messages"
        );
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    };

    const showTypingIndicator = () => {
      isTyping.value = true;
      scrollToBottom();
    };

    const hideTypingIndicator = () => {
      isTyping.value = false;
    };

    const submitAnswer = () => {
      if (!canSubmitAnswer.value) return;

      // Add user response
      let responseText = currentAnswer.value;
      if (currentQuestion.value.type === "gender") {
        responseText = currentAnswer.value === "male" ? "Mężczyzna" : "Kobieta";
      } else if (currentQuestion.value.type === "sickLeave") {
        responseText = currentAnswer.value ? "Tak" : "Nie";
      } else if (
        ["grossSalary", "zusAccount", "zusSubAccount"].includes(
          currentQuestion.value.type
        )
      ) {
        responseText = formatCurrency(parseInt(currentAnswer.value)) + " zł";
      } else if (
        ["workStartYear", "retirementYear"].includes(currentQuestion.value.type)
      ) {
        responseText = currentAnswer.value + " rok";
      } else if (currentQuestion.value.type === "age") {
        responseText = currentAnswer.value + " lat";
      }

      addMessage(responseText, "user");

      // Store answer
      formData.value[currentQuestion.value.type] = currentAnswer.value;

      // Auto-set retirement year based on age and gender
      if (currentQuestion.value.type === "gender" && formData.value.age) {
        const birthYear = currentYear - parseInt(formData.value.age);
        const retirementAge = currentAnswer.value === "male" ? 65 : 60;
        formData.value.retirementYear = birthYear + retirementAge;
      }

      // Move to next question or show summary
      currentQuestionIndex.value++;
      currentAnswer.value = "";

      if (currentQuestionIndex.value >= questions.value.length) {
        showSummary.value = true;
        addMessage(
          "Doskonale! Oto podsumowanie Twoich odpowiedzi. Sprawdź czy wszystko jest poprawne, a następnie kliknij 'Oblicz emeryturę'.",
          "bot"
        );
      } else {
        // Add next question with delay and typing indicator
        showTypingIndicator();
        setTimeout(() => {
          addMessage(currentQuestion.value.text, "bot");
          setTimeout(() => {
            hideTypingIndicator();
          }, 100);
        }, 1000);
      }
    };

    const editField = (field) => {
      editingField.value = field;
      editValue.value = formData.value[field];
    };

    const saveEdit = () => {
      formData.value[editingField.value] = editValue.value;
      editingField.value = null;
      editValue.value = "";
    };

    const cancelEdit = () => {
      editingField.value = null;
      editValue.value = "";
    };

    const goBack = () => {
      showSummary.value = false;
      currentQuestionIndex.value = questions.value.length - 1;
      showTypingIndicator();
      setTimeout(() => {
        addMessage(
          "Możesz edytować swoje odpowiedzi lub kontynuować z obecnymi danymi.",
          "bot"
        );
        setTimeout(() => {
          hideTypingIndicator();
        }, 100);
      }, 1000);
    };

    const calculatePension = () => {
      // Store form data in sessionStorage for results page
      sessionStorage.setItem("simulationData", JSON.stringify(formData.value));

      // Navigate to results
      router.push("/results");
    };

    onMounted(() => {
      // Start conversation automatically
      showTypingIndicator();
      setTimeout(() => {
        addMessage(currentQuestion.value.text, "bot");
        setTimeout(() => {
          hideTypingIndicator();
        }, 100);
      }, 800);
    });

    return {
      formData,
      conversationHistory,
      currentQuestionIndex,
      currentAnswer,
      showSummary,
      editingField,
      editValue,
      questions,
      currentQuestion,
      canSubmitAnswer,
      currentYear,
      formatCurrency,
      getFieldLabel,
      submitAnswer,
      editField,
      saveEdit,
      cancelEdit,
      goBack,
      calculatePension,
      isTyping,
    };
  },
};
</script>

<style scoped>
.conversation-form {
  padding: 2rem 0;
}

.conversation-header {
  text-align: center;
  margin-bottom: 3rem;
}

.conversation-header h2 {
  font-size: 2.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1rem;
}

.conversation-header p {
  font-size: 1.2rem;
  color: var(--zus-gray);
  max-width: 600px;
  margin: 0 auto;
}

.conversation-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--zus-white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.conversation-messages {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem 2rem;
  background: #f8f9fa;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 1.5rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.message-visible {
  opacity: 1;
  transform: translateY(0);
}

.bot-message {
  justify-content: flex-start;
}

.user-message {
  justify-content: flex-end;
}

.message-avatar {
  margin: 0 1rem;
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--zus-blue);
  color: var(--zus-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-avatar {
  background: var(--zus-orange);
}

.message-content {
  max-width: 70%;
  background: var(--zus-white);
  padding: 1rem 1.5rem;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background: var(--zus-blue);
  color: var(--zus-white);
}

.message-text {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.7;
}

.current-question {
  padding: 2rem;
  border-top: 1px solid #e9ecef;
}

.question-card {
  text-align: center;
}

.question-text {
  font-size: 1.2rem;
  color: var(--zus-dark-blue);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.question-input {
  margin-bottom: 2rem;
}

.form-input,
.form-select {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  font-size: 1.1rem;
  text-align: center;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--zus-blue);
  outline: none;
}

.checkbox-container {
  display: flex;
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--zus-dark-blue);
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--zus-gray);
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background-color: var(--zus-blue);
  border-color: var(--zus-blue);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
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

.summary-section {
  padding: 2rem;
  border-top: 1px solid #e9ecef;
}

.summary-card h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 2rem;
  text-align: center;
}

.summary-content {
  margin-bottom: 2rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.summary-label {
  font-weight: 600;
  color: var(--zus-dark-blue);
}

.summary-value {
  font-weight: 500;
  color: var(--zus-blue);
}

.edit-btn {
  background: var(--zus-orange);
  color: var(--zus-white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: #ff8c42;
  transform: translateY(-1px);
}

.summary-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-secondary {
  background: transparent;
  color: var(--zus-gray);
  border: 2px solid var(--zus-gray);
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--zus-gray);
  color: var(--zus-white);
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  font-size: 1.5rem;
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
  text-align: center;
}

.edit-input {
  margin-bottom: 2rem;
}

.edit-input .form-input,
.edit-input .form-select {
  width: 100%;
  text-align: left;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.progress-indicator {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  transition: opacity 0.3s ease;
  flex: 1;
  min-width: 0;
}

.progress-step.active {
  opacity: 1;
}

.progress-step.completed {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--zus-gray);
  color: var(--zus-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.progress-step.active .step-number {
  background: var(--zus-blue);
}

.progress-step.completed .step-number {
  background: var(--zus-green);
}

.step-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--zus-dark-blue);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

@media (max-width: 768px) {
  .conversation-header h2 {
    font-size: 2rem;
  }

  .message-content {
    max-width: 85%;
  }

  .summary-item {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .summary-actions {
    flex-direction: column;
  }

  .progress-indicator {
    gap: 0.5rem;
  }

  .step-label {
    font-size: 0.8rem;
  }
}

/* Typing Indicator Styles */
.typing-message {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.typing-content {
  background: var(--zus-white);
  padding: 1rem 1.5rem;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  max-width: 70%;
}

.typing-text {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  color: var(--zus-dark-blue);
  opacity: 0.7;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--zus-gray);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
