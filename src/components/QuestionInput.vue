<template>
  <div class="question-input" :class="{ 'question-error': hasError }">
    <div class="question-header">
      <h3 class="question-title" :id="questionId">{{ question.text }}</h3>
      <div v-if="question.help" class="question-help">
        <button
          type="button"
          class="help-button"
          @click="toggleHelp"
          :aria-expanded="showHelp"
          :aria-describedby="questionId + '-help'"
          aria-label="Pokaż pomoc"
        >
          ❓
        </button>
        <div v-if="showHelp" class="help-content" :id="questionId + '-help'">
          {{ question.help }}
        </div>
      </div>
    </div>

    <div class="input-container">
      <!-- Input dla wieku -->
      <input
        v-if="question.type === 'age'"
        :id="inputId"
        v-model="localValue"
        type="number"
        min="18"
        max="70"
        :placeholder="question.placeholder || 'Wprowadź swój wiek'"
        class="form-input"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @keyup.enter="handleSubmit"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      />

      <!-- Select dla płci -->
      <select
        v-else-if="question.type === 'gender'"
        :id="inputId"
        v-model="localValue"
        class="form-select"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @change="handleChange"
        @focus="handleFocus"
        ref="inputRef"
      >
        <option value="">Wybierz płeć</option>
        <option value="male">Mężczyzna</option>
        <option value="female">Kobieta</option>
      </select>

      <!-- Input dla wynagrodzenia -->
      <input
        v-else-if="question.type === 'salary'"
        :id="inputId"
        v-model="localValue"
        type="number"
        min="0"
        step="100"
        :placeholder="question.placeholder || 'Wprowadź wynagrodzenie brutto'"
        class="form-input"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @keyup.enter="handleSubmit"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      />

      <!-- Input dla roku rozpoczęcia pracy -->
      <input
        v-else-if="question.type === 'workStart'"
        :id="inputId"
        v-model="localValue"
        type="number"
        :min="minYear"
        :max="currentYear"
        :placeholder="question.placeholder || 'Wprowadź rok rozpoczęcia pracy'"
        class="form-input"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @keyup.enter="handleSubmit"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      />

      <!-- Input dla roku emerytury -->
      <input
        v-else-if="question.type === 'retirement'"
        :id="inputId"
        v-model="localValue"
        type="number"
        :min="currentYear"
        :max="currentYear + 50"
        :placeholder="
          question.placeholder || 'Wprowadź planowany rok emerytury'
        "
        class="form-input"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @keyup.enter="handleSubmit"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      />

      <!-- Input dla konta ZUS -->
      <input
        v-else-if="question.type === 'zusAccount'"
        :id="inputId"
        v-model="localValue"
        type="number"
        min="0"
        step="100"
        :placeholder="
          question.placeholder || 'Wprowadź kwotę na koncie ZUS (opcjonalne)'
        "
        class="form-input"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @keyup.enter="handleSubmit"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      />

      <!-- Input dla subkonta ZUS -->
      <input
        v-else-if="question.type === 'zusSubAccount'"
        :id="inputId"
        v-model="localValue"
        type="number"
        min="0"
        step="100"
        :placeholder="
          question.placeholder || 'Wprowadź kwotę na subkoncie ZUS (opcjonalne)'
        "
        class="form-input"
        :class="{ 'input-error': hasError }"
        :aria-describedby="errorId"
        :aria-invalid="hasError"
        @keyup.enter="handleSubmit"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      />

      <!-- Checkbox dla zwolnień lekarskich -->
      <div v-else-if="question.type === 'sickLeave'" class="checkbox-container">
        <input
          :id="inputId"
          v-model="localValue"
          type="checkbox"
          class="form-checkbox"
          :aria-describedby="errorId"
          :aria-invalid="hasError"
          @change="handleChange"
          @focus="handleFocus"
          ref="inputRef"
        />
        <label :for="inputId" class="checkbox-label">
          Tak, uwzględnij możliwość zwolnień lekarskich
        </label>
      </div>
    </div>

    <!-- Komunikat o błędzie -->
    <div v-if="hasError" :id="errorId" class="error-message" role="alert">
      {{ errorMessage }}
    </div>

    <!-- Przycisk submit -->
    <div class="submit-container">
      <button
        type="button"
        @click="handleSubmit"
        class="btn-primary"
        :disabled="!canSubmit"
        :aria-describedby="errorId"
      >
        {{ submitText }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from "vue";

export default {
  name: "QuestionInput",
  props: {
    question: {
      type: Object,
      required: true,
    },
    value: {
      type: [String, Number, Boolean],
      default: "",
    },
    hasError: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    submitText: {
      type: String,
      default: "Odpowiedz",
    },
  },
  emits: ["update:value", "submit", "focus", "blur"],
  setup(props, { emit }) {
    const localValue = ref(props.value);
    const showHelp = ref(false);
    const inputRef = ref(null);
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 60;

    const questionId = computed(() => `question-${props.question.type}`);
    const inputId = computed(() => `input-${props.question.type}`);
    const errorId = computed(() => `error-${props.question.type}`);

    const canSubmit = computed(() => {
      if (props.question.type === "sickLeave") return true;
      return (
        localValue.value !== "" &&
        localValue.value !== null &&
        localValue.value !== undefined
      );
    });

    const toggleHelp = () => {
      showHelp.value = !showHelp.value;
    };

    const handleSubmit = () => {
      if (canSubmit.value) {
        emit("submit", localValue.value);
      }
    };

    const handleChange = () => {
      emit("update:value", localValue.value);
    };

    const handleFocus = () => {
      emit("focus");
    };

    const handleBlur = () => {
      emit("blur");
    };

    // Auto-focus na input po załadowaniu
    watch(
      () => props.question,
      () => {
        nextTick(() => {
          if (inputRef.value) {
            inputRef.value.focus();
          }
        });
      },
      { immediate: true }
    );

    // Obserwuj zmiany wartości
    watch(localValue, (newValue) => {
      emit("update:value", newValue);
    });

    return {
      localValue,
      showHelp,
      inputRef,
      currentYear,
      minYear,
      questionId,
      inputId,
      errorId,
      canSubmit,
      toggleHelp,
      handleSubmit,
      handleChange,
      handleFocus,
      handleBlur,
    };
  },
};
</script>

<style scoped>
.question-input {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  border-left: 4px solid var(--zus-blue);
}

.question-input.question-error {
  border-left-color: var(--zus-red);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.question-title {
  color: var(--zus-dark-blue);
  font-size: 1.3rem;
  line-height: 1.4;
  margin: 0;
  flex: 1;
}

.question-help {
  position: relative;
  margin-left: 1rem;
}

.help-button {
  background: var(--zus-light-gray);
  border: 2px solid var(--zus-gray);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.help-button:hover {
  background: var(--zus-blue);
  color: var(--zus-white);
  border-color: var(--zus-blue);
}

.help-button:focus {
  outline: 2px solid var(--zus-blue);
  outline-offset: 2px;
}

.help-content {
  position: absolute;
  top: 40px;
  right: 0;
  background: var(--zus-dark-blue);
  color: var(--zus-white);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.4;
  max-width: 300px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.input-container {
  margin-bottom: 1rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--zus-gray);
  border-radius: 8px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: var(--zus-white);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--zus-blue);
  box-shadow: 0 0 0 3px rgba(63, 132, 210, 0.2);
}

.form-input.input-error,
.form-select.input-error {
  border-color: var(--zus-red);
}

.form-input.input-error:focus,
.form-select.input-error:focus {
  box-shadow: 0 0 0 3px rgba(240, 94, 94, 0.2);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--zus-blue);
}

.checkbox-label {
  font-size: 1.1rem;
  color: var(--zus-text-dark);
  cursor: pointer;
  line-height: 1.4;
}

.error-message {
  color: var(--zus-red);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.submit-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--zus-blue), var(--zus-dark-blue));
  color: var(--zus-white);
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(63, 132, 210, 0.3);
}

.btn-primary:focus {
  outline: 2px solid var(--zus-blue);
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: var(--zus-gray);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .question-header {
    flex-direction: column;
    gap: 1rem;
  }

  .question-help {
    margin-left: 0;
    align-self: flex-end;
  }

  .help-content {
    right: auto;
    left: 0;
    max-width: 250px;
  }
}
</style>
