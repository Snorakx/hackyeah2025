<template>
  <div v-if="isTyping" class="message bot-message typing-message" aria-live="polite">
    <div class="message-avatar">
      <div class="avatar" aria-label="ZUS">ZUS</div>
    </div>
    <div class="message-content typing-content">
      <div class="typing-text">
        {{ typingText || "Piszę..." }}
      </div>
      <div class="typing-indicator" aria-label="Pisanie wiadomości">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TypingIndicator",
  props: {
    isTyping: {
      type: Boolean,
      default: false,
    },
    typingText: {
      type: String,
      default: "",
    },
  },
};
</script>

<style scoped>
.typing-message {
  opacity: 1;
  transform: translateY(0);
}

.typing-content {
  background: var(--zus-white);
  border: 1px solid var(--zus-gray);
  border-bottom-left-radius: 4px;
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
  background: var(--zus-blue);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
