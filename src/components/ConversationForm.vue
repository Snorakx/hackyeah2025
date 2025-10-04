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

      <!-- Progress Steps -->
      <div class="progress-section">
        <ProgressSteps 
          :current-step="currentQuestionIndex + 1"
          :total-steps="progressSteps.length"
          :steps="progressSteps"
        />
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
            :submit-text="currentQuestion.type === 'sickLeave' ? 'Kontynuuj' : 'Odpowiedz'"
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

    // Questions configuration
    const questions = ref([
      {
        type: "age",
        text: "Ile masz lat?",
        label: "Wiek",
        help: "Wprowadź swój aktualny wiek (od 18 do 70 lat)",
        placeholder: "Wprowadź swój wiek",
      },
      {
        type: "gender",
        text: "Jaka jest Twoja płeć?",
        label: "Płeć",
        help: "Wybierz swoją płeć - wpływa to na wiek emerytalny",
      },
      {
        type: "salary",
        text: "Jaka jest Twoja obecna wysokość wynagrodzenia brutto?",
        label: "Wynagrodzenie brutto",
        help: "Wprowadź miesięczne wynagrodzenie brutto (przed odliczeniem podatków i składek)",
        placeholder: "Wprowadź wynagrodzenie brutto",
      },
      {
        type: "workStart",
        text: "W którym roku rozpocząłeś/rozpoczęłaś pracę?",
        label: "Rok rozpoczęcia pracy",
        help: "Podaj rok, w którym rozpocząłeś aktywność zawodową",
        placeholder: "Wprowadź rok rozpoczęcia pracy",
      },
      {
        type: "retirement",
        text: "W którym roku planujesz przejść na emeryturę?",
        label: "Planowany rok emerytury",
        help: "Podaj rok, w którym chcesz przejść na emeryturę",
        placeholder: "Wprowadź planowany rok emerytury",
      },
      {
        type: "zusAccount",
        text: "Ile masz obecnie zgromadzone na koncie w ZUS? (opcjonalne)",
        label: "Środki na koncie ZUS",
        help: "Jeśli znasz kwotę na swoim koncie ZUS, możesz ją podać (nie jest obowiązkowe)",
        placeholder: "Wprowadź kwotę na koncie ZUS",
      },
      {
        type: "zusSubAccount",
        text: "Ile masz obecnie zgromadzone na subkoncie w ZUS? (opcjonalne)",
        label: "Środki na subkoncie ZUS",
        help: "Jeśli znasz kwotę na swoim subkoncie ZUS, możesz ją podać (nie jest obowiązkowe)",
        placeholder: "Wprowadź kwotę na subkoncie ZUS",
      },
      {
        type: "sickLeave",
        text: "Czy chcesz uwzględnić możliwość zwolnień lekarskich w symulacji?",
        label: "Zwolnienia lekarskie",
        help: "Symulacja może uwzględnić średnią długość zwolnień lekarskich w ciągu życia",
      },
    ]);

    // Progress steps
    const progressSteps = ref([
      { label: "Wiek", description: "Podstawowe dane" },
      { label: "Płeć", description: "Dane osobowe" },
      { label: "Wynagrodzenie", description: "Sytuacja finansowa" },
      { label: "Kariera", description: "Historia pracy" },
      { label: "Emerytura", description: "Plany na przyszłość" },
      { label: "Konto ZUS", description: "Środki zgromadzone" },
      { label: "Subkonto", description: "Dodatkowe środki" },
      { label: "Zwolnienia", description: "Opcje symulacji" },
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
      if (currentQuestion.value?.type === "sickLeave") return;

      if (!currentAnswer.value || currentAnswer.value === "") {
        hasError.value = true;
        errorMessage.value = "To pole jest wymagane";
        return false;
      }

      // Additional validation for specific types
      if (currentQuestion.value?.type === "age") {
        const age = parseInt(currentAnswer.value);
        if (age < 18 || age > 70) {
          hasError.value = true;
          errorMessage.value = "Wiek musi być między 18 a 70 lat";
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

      const responseText = formatResponse(currentAnswer.value, currentQuestion.value);
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
          return `${value} lat`;
        case "gender":
          return value === "male" ? "Mężczyzna" : "Kobieta";
        case "salary":
          return `${parseFloat(value).toLocaleString("pl-PL")} zł`;
        case "workStart":
        case "retirement":
          return value;
        case "zusAccount":
        case "zusSubAccount":
          return value ? `${parseFloat(value).toLocaleString("pl-PL")} zł` : "Nie podano";
        case "sickLeave":
          return value ? "Tak" : "Nie";
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
        addMessage("Możesz edytować swoje odpowiedzi lub kontynuować z obecnymi danymi.", "bot");
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
      const simulationData = {
        age: userResponses.value.find((r) => r.type === "age")?.rawValue,
        gender: userResponses.value.find((r) => r.type === "gender")?.rawValue,
        grossSalary: userResponses.value.find((r) => r.type === "salary")?.rawValue,
        workStartYear: userResponses.value.find((r) => r.type === "workStart")?.rawValue,
        retirementYear: userResponses.value.find((r) => r.type === "retirement")?.rawValue,
        zusAccount: userResponses.value.find((r) => r.type === "zusAccount")?.rawValue || 0,
        zusSubAccount: userResponses.value.find((r) => r.type === "zusSubAccount")?.rawValue || 0,
        includeSickLeave: userResponses.value.find((r) => r.type === "sickLeave")?.rawValue || false,
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
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.conversation-header {
  text-align: center;
  margin-bottom: 2rem;
}

.conversation-header h2 {
  color: var(--zus-dark-blue);
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.conversation-header p {
  color: var(--zus-text-light);
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.progress-section {
  margin-bottom: 2rem;
}

.conversation-container {
  background: var(--zus-white);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.current-question {
  padding: 2rem;
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