<template>
  <div>
    <button
      class="chat-fab"
      :aria-expanded="open ? 'true' : 'false'"
      aria-label="Otwórz czat pomocnika"
      @click="toggle"
    >
      <img class="chat-avatar" :src="avatarSrc" alt="Chatbot ZUS" />
    </button>

    <div v-if="open" class="chat-panel" role="dialog" aria-label="Chatbot ZUS">
      <div class="chat-header">
        <div class="header-left">
          <img class="chat-avatar small" :src="avatarSrc" alt="Chatbot ZUS" />
          <div class="title-wrap">
            <div class="chat-title">Zusini Goosini</div>
            <div class="chat-subtitle"><span class="dot"></span> Asystent ZUS • Online</div>
          </div>
        </div>
        <button class="chat-close" aria-label="Zamknij" @click="toggle">
          ×
        </button>
      </div>

      <div class="chat-body" ref="bodyRef">
        <div class="msg bot">
          Cześć! Jestem Zusini Goosini, Twój wirtualny asystent ZUS. Jak mogę Ci
          pomóc?
        </div>
      </div>

      <form class="chat-input" @submit.prevent="send">
        <input
          v-model="draft"
          type="text"
          placeholder="Napisz wiadomość..."
          aria-label="Pole wiadomości"
        />
        <button class="send-btn" :disabled="!draft.trim()" aria-label="Wyślij">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
      <div class="quick-questions" aria-label="Szybkie pytania">
        <button
          v-for="(q, i) in quickQuestions"
          :key="i"
          class="quick-btn"
          @click="askQuick(q)"
        >
          {{ q }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from "vue";
import gooseImg from "../554008777_1146539360240259_7347116293965822534_n.jpg";

export default {
  name: "ChatWidget",
  setup() {
    const open = ref(false);
    const draft = ref("");
    const bodyRef = ref(null);
    // Spróbuj automatycznie wykryć obrazek gąski w public/
    const avatarSrc = ref(gooseImg);

    const quickQuestions = [
      "Jak działa kalkulator?",
      "Ile muszę zarabiać?",
      "Jak zbudować budżet emerytalny?",
    ];

    const qa = {
      "jak działa kalkulator?":
        "Wpisujesz swoją docelową kwotę życia na emeryturze albo dodajesz wydatki do koszyka. Następnie w formularzu odpowiadasz na 4 pytania i dostajesz wyliczenia dla kilku scenariuszy.",
      "ile muszę zarabiać?":
        "Na ekranie z wynikiem pokażemy, ile musisz zarabiać dziś (brutto), aby osiągnąć wskazaną kwotę na emeryturze – z uwzględnieniem inflacji i realnego wzrostu płac.",
      "jak zbudować budżet emerytalny?":
        "Dodaj stałe wydatki (mieszkanie, jedzenie, zdrowie itd.), zobacz sumę miesięczną i sprawdź, jak różne decyzje (typ umowy, dodatkowe oszczędności) wpływają na wynik.",
    };

    const toggle = () => {
      open.value = !open.value;
      if (open.value) {
        nextTick(() =>
          bodyRef.value?.scrollTo({ top: 99999, behavior: "smooth" })
        );
      }
    };

    const send = () => {
      if (!draft.value.trim()) return;
      // Minimalny echo-flow; w realu można podpiąć backend
      const node = document.createElement("div");
      node.className = "msg user";
      node.textContent = draft.value.trim();
      bodyRef.value.appendChild(node);
      const reply = answerFor(draft.value.trim());
      draft.value = "";
      nextTick(() => {
        bodyRef.value?.scrollTo({ top: 99999, behavior: "smooth" });
        appendBot(reply);
      });
    };

    const askQuick = (q) => {
      appendUser(q);
      appendBot(answerFor(q));
    };

    const normalize = (s) => s.toLowerCase().trim();

    const answerFor = (q) => {
      const key = normalize(q);
      // proste dopasowanie kluczy i fraz
      for (const k of Object.keys(qa)) {
        if (key.includes(normalize(k))) return qa[k];
      }
      return "Nie do końca rozumiem pytanie. Spróbuj inaczej, albo wybierz jedną z opcji powyżej.";
    };

    const appendUser = (text) => {
      const node = document.createElement("div");
      node.className = "msg user";
      node.textContent = text;
      bodyRef.value.appendChild(node);
      bodyRef.value?.scrollTo({ top: 99999 });
    };

    const appendBot = (text) => {
      const node = document.createElement("div");
      node.className = "msg bot";
      node.textContent = text;
      bodyRef.value.appendChild(node);
      bodyRef.value?.scrollTo({ top: 99999 });
    };

    onMounted(() => {
      // avatar ustawiony z importu – nic nie robimy
    });

    return {
      open,
      draft,
      bodyRef,
      avatarSrc,
      toggle,
      send,
      quickQuestions,
      askQuick,
    };
  },
};
</script>

<style scoped>
.chat-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
  padding: 0;
  cursor: pointer;
  z-index: 9999;
}

.chat-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.chat-avatar.small {
  width: 28px;
  height: 28px;
}

.chat-panel {
  position: fixed;
  right: 20px;
  bottom: 96px;
  width: 360px;
  max-height: 60vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(180deg, #0f7a3d, #089e4a);
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-wrap { display: flex; flex-direction: column; }
.chat-title { font-weight: 700; color: #fff; }
.chat-subtitle { font-size: 12px; opacity: 0.9; display: flex; align-items: center; gap: 6px; }
.chat-subtitle .dot { width: 8px; height: 8px; background: #9af1b8; border-radius: 50%; display: inline-block; }
.chat-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #ffffff;
}

.chat-body {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.msg {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 80%;
  line-height: 1.4;
  font-size: 14px;
}
.msg.bot { background: #e6f6eb; color: #0b3a6b; align-self: flex-start; box-shadow: 0 1px 0 rgba(0,0,0,.05); }
.msg.user {
  background: #00a651;
  color: #fff;
  align-self: flex-end;
  box-shadow: 0 1px 0 rgba(0,0,0,.05);
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #f7fafc;
}
.chat-input input {
  flex: 1;
  border: 1px solid #dbe5ef;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 14px;
}
.send-btn {
  background: #00a651;
  color: #fff;
  border: none;
  width: 40px; height: 40px;
  border-radius: 50%;
  font-weight: 600;
  cursor: pointer;
}
.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-questions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 10px 12px 12px;
  background: #f7fafc;
  border-top: 1px solid #edf2f7;
}

.quick-btn {
  text-align: left;
  background: #e6f6eb;
  color: #0b3a6b;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
}
.quick-btn:hover {
  background: #d6f0e1;
}

@media (max-width: 420px) {
  .chat-panel {
    width: calc(100vw - 32px);
    right: 16px;
  }
}
</style>
