<template>
  <div class="conversation-form">
    <div class="container">
      <!-- Progress Steps -->
      <div class="progress-section">
        <div class="progress-header">
          <button
            v-if="currentQuestionIndex > 0"
            @click="goBack"
            class="back-button"
            aria-label="Wróć do poprzedniego kroku"
          >
            ←
          </button>
          <div class="progress-info">
            <span class="step-text"
              >Krok {{ currentQuestionIndex + 1 }} z
              {{ progressSteps.length }}</span
            >
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: `${
                    ((currentQuestionIndex + 1) / progressSteps.length) * 100
                  }%`,
                }"
              ></div>
            </div>
            <span class="progress-percentage"
              >{{
                Math.round(
                  ((currentQuestionIndex + 1) / progressSteps.length) * 100
                )
              }}%</span
            >
          </div>
        </div>
      </div>

      <!-- Conversation Flow -->
      <div class="conversation-container">
        <ConversationMessages
          :messages="conversationHistory"
          :is-typing="isTyping"
          :typing-text="currentQuestion ? currentQuestion.text : ''"
        />

        <!-- Current Question Input -->
        <div v-if="currentQuestion && !showSummary" class="current-question">
          <QuestionInput
            :question="currentQuestion"
            :value="currentAnswer"
            :has-error="hasError"
            :error-message="errorMessage"
            :submit-text="
              currentQuestion.type === 'sickLeave' ? 'Kontynuuj' : 'Dalej'
            "
            @update:value="updateAnswer"
            @submit="submitAnswer"
            @focus="hideTypingIndicator"
            @blur="validateAnswer"
          />
        </div>

        <!-- Summary Section -->
        <SummaryCard
          v-if="showSummary"
          :responses="userResponses"
          @edit="editResponse"
          @go-back="goBack"
          @calculate="calculatePension"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import ProgressSteps from "./ProgressSteps.vue";
import QuestionInput from "./QuestionInput.vue";
import ConversationMessages from "./ConversationMessages.vue";
import SummaryCard from "./SummaryCard.vue";

export default {
  name: "ConversationForm",
  components: {
    ProgressSteps,
    QuestionInput,
    ConversationMessages,
    SummaryCard,
  },
  setup() {
    const router = useRouter();

    // Conversation state
    const conversationHistory = ref([]);
    const isTyping = ref(false);
    const currentQuestionIndex = ref(0);
    const currentAnswer = ref("");
    const userResponses = ref([]);
    const showSummary = ref(false);
    const hasError = ref(false);
    const errorMessage = ref("");

    // Questions configuration - tylko 4 kroki jak na obrazkach
    const questions = ref([
      {
        type: "gender",
        text: "Jesteś kobietą czy mężczyzną?",
        label: "Płeć",
        help: "Wiek emerytalny w Polsce: kobiety – 60 lat, mężczyźni – 65 lat. Dlatego pytamy.",
      },
      {
        type: "age",
        text: "Podaj rok urodzenia.",
        label: "Rok urodzenia",
        help: "Potrzebujemy tego, żeby policzyć, ile lat zostało Ci do emerytury.",
        placeholder: "np. 1999",
      },
      {
        type: "workStart",
        text: "Kiedy była Twoja pierwsza wypłata?",
        label: "Rok pierwszej wypłaty",
        help: "Liczy się rok, kiedy pierwszy raz dostałeś kasę za pracę – nieważne jaka umowa.",
        placeholder: "np. 2020",
      },
      {
        type: "contract",
        text: "Jak zarabiasz?",
        label: "Typ umowy",
        help: "Od typu umowy zależy, ile odkładasz na emeryturę. Na etacie to 19,52% pensji, na zleceniu i dziele – 0%.",
        options: [
          { value: "employment", label: "Etat" },
          { value: "contract", label: "Zlecenie / Dzieło" },
          { value: "business", label: "JDG" },
        ],
      },
      {
        type: "salary",
        text: "Ile zarabiasz miesięcznie?",
        label: "Pensja",
        help: "Podaj kwotę brutto (przed opodatkowaniem). To pomoże nam policzyć, ile odkładasz na emeryturę.",
        placeholder: "np. 5000",
      },
    ]);

    // Progress steps - 5 kroków
    const progressSteps = ref([
      { label: "Płeć", description: "Dane osobowe" },
      { label: "Rok urodzenia", description: "Podstawowe dane" },
      { label: "Pierwsza wypłata", description: "Historia pracy" },
      { label: "Typ umowy", description: "Forma zatrudnienia" },
      { label: "Pensja", description: "Wynagrodzenie" },
    ]);

    // Computed properties
    const currentQuestion = computed(() => {
      return questions.value[currentQuestionIndex.value] || null;
    });

    // Methods
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

    const updateAnswer = (value) => {
      currentAnswer.value = value;
      hasError.value = false;
      errorMessage.value = "";
    };

    const validateAnswer = () => {
      // Wszystkie pola w 5-krokowym formularzu są wymagane

      if (!currentAnswer.value || currentAnswer.value === "") {
        hasError.value = true;
        errorMessage.value = "To pole jest wymagane";
        return false;
      }

      // Additional validation for specific types
      if (currentQuestion.value?.type === "age") {
        const birthYear = parseInt(currentAnswer.value);
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        if (age < 18) {
          hasError.value = true;
          errorMessage.value =
            "Hej, masz mniej niż 18 lat? Wróć do nas za kilka lat 😊";
          return false;
        }
        if (age > 70) {
          hasError.value = true;
          errorMessage.value = "Sprawdź rok urodzenia – coś tu nie gra.";
          return false;
        }
        if (birthYear < 1950 || birthYear > currentYear) {
          hasError.value = true;
          errorMessage.value = "Sprawdź rok urodzenia – podaj prawdziwy rok.";
          return false;
        }
      }

      if (currentQuestion.value?.type === "salary") {
        const salary = parseFloat(currentAnswer.value);
        if (salary < 0) {
          hasError.value = true;
          errorMessage.value = "Wynagrodzenie nie może być ujemne";
          return false;
        }
      }

      hasError.value = false;
      errorMessage.value = "";
      return true;
    };

    const submitAnswer = () => {
      if (!validateAnswer()) return;

      // Wszystkie pola są wymagane w 5-krokowym formularzu
      let valueToSubmit = currentAnswer.value;

      const responseText = formatResponse(valueToSubmit, currentQuestion.value);
      addMessage(responseText, "user");

      // Store user response
      userResponses.value.push({
        question: currentQuestion.value.text,
        label: currentQuestion.value.label,
        value: responseText,
        type: currentQuestion.value.type,
        rawValue: currentAnswer.value,
      });

      // Move to next question or show summary
      if (currentQuestionIndex.value >= questions.value.length - 1) {
        showSummary.value = true;
        addMessage(
          "Doskonale! Oto podsumowanie Twoich odpowiedzi. Sprawdź czy wszystko jest poprawne, a następnie kliknij 'Oblicz emeryturę'.",
          "bot"
        );
      } else {
        currentQuestionIndex.value++;
        currentAnswer.value = "";
        hasError.value = false;
        errorMessage.value = "";

        showTypingIndicator();
        setTimeout(() => {
          addMessage(currentQuestion.value.text, "bot");
          setTimeout(() => {
            hideTypingIndicator();
          }, 100);
        }, 1000);
      }
    };

    const formatResponse = (value, question) => {
      switch (question.type) {
        case "age":
          return `rok ${value}`;
        case "gender":
          return value === "male" ? "Mężczyzna" : "Kobieta";
        case "salary":
          return `${parseFloat(value).toLocaleString("pl-PL")} zł`;
        case "contract":
          const contractOptions = {
            employment: "Umowa o pracę (etat)",
            contract: "Zlecenie",
            work: "Dzieło",
            mixed: "Mieszam różne umowy",
            business: "Własna firma (JDG)",
          };
          return contractOptions[value] || value;
        case "workStart":
        case "retirement":
          return value;
        // Usunięte pola nie są już w formularzu
        default:
          return value;
      }
    };

    const editResponse = (index) => {
      currentQuestionIndex.value = index;
      currentAnswer.value = userResponses.value[index].rawValue;
      showSummary.value = false;
      hasError.value = false;
      errorMessage.value = "";

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

    const goBack = () => {
      showSummary.value = false;
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
      // Store data in sessionStorage
      const birthYear = userResponses.value.find(
        (r) => r.type === "age"
      )?.rawValue;
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      const simulationData = {
        age: age,
        birthYear: birthYear,
        gender: userResponses.value.find((r) => r.type === "gender")?.rawValue,
        grossSalary:
          parseFloat(
            userResponses.value.find((r) => r.type === "salary")?.rawValue
          ) || 0,
        contractType: userResponses.value.find((r) => r.type === "contract")
          ?.rawValue,
        workStartYear:
          parseInt(
            userResponses.value.find((r) => r.type === "workStart")?.rawValue
          ) || 0,
        retirementYear: (() => {
          // Oblicz rok emerytury na podstawie wieku i płci
          const gender = userResponses.value.find(
            (r) => r.type === "gender"
          )?.rawValue;
          const retirementAge = gender === "female" ? 60 : 65;
          return birthYear + retirementAge;
        })(),
        zusAccount: 0, // Nie ma w formularzu
        zusSubAccount: 0, // Nie ma w formularzu
        includeSickLeave: false, // Nie ma w formularzu
      };

      sessionStorage.setItem("simulationData", JSON.stringify(simulationData));
      router.push("/results");
    };

    // Initialize conversation
    onMounted(() => {
      showTypingIndicator();
      setTimeout(() => {
        addMessage(currentQuestion.value.text, "bot");
        setTimeout(() => {
          hideTypingIndicator();
        }, 100);
      }, 800);
    });

    return {
      conversationHistory,
      isTyping,
      currentQuestionIndex,
      currentAnswer,
      userResponses,
      showSummary,
      hasError,
      errorMessage,
      progressSteps,
      currentQuestion,
      updateAnswer,
      submitAnswer,
      editResponse,
      goBack,
      calculatePension,
      hideTypingIndicator,
      validateAnswer,
    };
  },
};
</script>

<style scoped>
.conversation-form {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--zus-light-gray), var(--zus-white));
  padding: 0.5rem 0 1.5rem 0; /* mniejsza przerwa pod headerem */
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 0.75rem;
}

.conversation-header {
  text-align: center;
  margin-bottom: 2rem;
}

.conversation-header h2 {
  color: var(--zus-dark-blue);
  font-size: 2rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.conversation-header p {
  color: var(--zus-text-light);
  font-size: 1rem;
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.5;
}

.progress-section {
  margin: 0 0 1rem 0; /* zero górnego marginesu */
  background: white;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--zus-blue);
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background-color: rgba(63, 132, 210, 0.1);
}

.progress-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-text {
  font-weight: 600;
  color: var(--zus-text-dark);
  white-space: nowrap;
  font-size: 0.95rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--zus-green), var(--zus-light-green));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-weight: 600;
  color: var(--zus-green);
  white-space: nowrap;
  font-size: 0.95rem;
}

.conversation-container {
  background: var(--zus-white);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--zus-light-gray);
}

.current-question {
  padding: 1.25rem;
  border-top: 1px solid var(--zus-light-gray);
  background: var(--zus-white);
}

@media (max-width: 768px) {
  .conversation-header h2 {
    font-size: 2rem;
  }

  .conversation-header p {
    font-size: 1rem;
  }
}
</style>
