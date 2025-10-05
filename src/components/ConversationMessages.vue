<template>
  <div
    class="conversation-messages"
    role="log"
    aria-live="polite"
    aria-label="Historia rozmowy"
  >
    <!-- All Messages in Order -->
    <MessageBubble
      v-for="(message, index) in messages"
      :key="`message-${index}`"
      :text="message.text"
      :type="message.type"
      :timestamp="message.timestamp"
      :visible="message.visible"
    />

    <!-- Typing Indicator -->
    <TypingIndicator :is-typing="isTyping" :typing-text="typingText" />
  </div>
</template>

<script>
import MessageBubble from "./MessageBubble.vue";
import TypingIndicator from "./TypingIndicator.vue";

export default {
  name: "ConversationMessages",
  components: {
    MessageBubble,
    TypingIndicator,
  },
  props: {
    messages: {
      type: Array,
      required: true,
    },
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
.conversation-messages {
  flex: 1;
  padding: 2rem;
  max-height: 500px;
  overflow-y: auto;
  scroll-behavior: smooth;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 16px 16px 0 0;
}
</style>
