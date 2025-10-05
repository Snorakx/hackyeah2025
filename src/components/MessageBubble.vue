<template>
  <div
    class="message"
    :class="{
      'bot-message': type === 'bot',
      'user-message': type === 'user',
      'message-visible': visible,
    }"
  >
    <div v-if="type === 'bot'" class="message-avatar">
      <div class="avatar" aria-label="ZUS">ZUS</div>
    </div>
    <div class="message-content">
      <div class="message-text">{{ text }}</div>
      <div class="message-time" aria-label="Czas wiadomości">
        {{ timestamp }}
      </div>
    </div>
    <div v-if="type === 'user'" class="message-avatar">
      <div class="avatar user-avatar" aria-label="Użytkownik">Ty</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MessageBubble",
  props: {
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ["bot", "user"].includes(value),
    },
    timestamp: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.message {
  display: flex;
  margin-bottom: 1rem;
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
  margin: 0 0.5rem;
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--zus-white);
}

.bot-message .avatar {
  background: linear-gradient(135deg, var(--zus-blue), var(--zus-dark-blue));
  box-shadow: 0 2px 8px rgba(63, 132, 210, 0.3);
}

.user-message .avatar {
  background: linear-gradient(135deg, var(--zus-green), var(--zus-dark-green));
  box-shadow: 0 2px 8px rgba(0, 153, 63, 0.3);
}

.message-content {
  max-width: 70%;
  padding: 1rem 1.5rem;
  border-radius: 18px;
  position: relative;
}

.bot-message .message-content {
  background: var(--zus-white);
  border: 1px solid var(--zus-gray);
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background: linear-gradient(135deg, var(--zus-green), var(--zus-dark-green));
  color: var(--zus-white);
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 153, 63, 0.2);
}

.message-text {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
