<template>
  <div class="pitch">
    <div class="container">
      <div class="card">
        <div class="card-header">
          <span class="badge">Krok {{ currentSlideIndex + 1 }}</span>
        </div>

        <div class="card-body">
          <section v-if="currentSlide === 'hero'" class="hero-slide">
            <span class="pill">Prezentacja projektu</span>
            <h1>Kalkulator Emerytalny</h1>
            <p class="subtitle">Prosta odpowiedź na trudne pytanie:</p>
            <p class="quote">
              "Ile muszę zarabiać dziś, żeby mieć emeryturę o jakiej marzę?"
            </p>
          </section>

          <section v-else-if="currentSlide === 'problem'" class="problem-slide">
            <h2>Problem</h2>
            <p class="lead">
              Młodzi ludzie wiedzą, że
              <span class="green">"coś tam odkładają"</span>, ale nie mają
              pojęcia, ile to będzie warte i co z tego wyniknie.
            </p>
            <ul class="facts">
              <li>
                <span class="dot red"></span>
                <strong>3/4 osób</strong> w wieku 20-35 lat nie potrafi
                oszacować swojej przyszłej emerytury.
              </li>
              <li>
                <span class="dot red"></span>
                <strong>9/10</strong> deklaruje, że temat ZUS jest
                <em>"trudny, nudny lub odrealniany"</em>.
              </li>
              <li class="soft">
                <span class="dot orange"></span>
                Dominują dwie postawy: "ZUS i tak nic nie da" albo "Zajmę się
                tym później".
              </li>
            </ul>
            <div class="effect">
              <strong>Efekt:</strong> brak zaufania, brak świadomości i brak
              działania.
            </div>
          </section>

          <section
            v-else-if="currentSlide === 'solution'"
            class="solution-slide"
          >
            <h2>Nasze rozwiązanie</h2>
            <div class="solution-card">
              <p>
                <strong>Kalkulator Emerytalny</strong> — prosta, interaktywna
                aplikacja, która odpowiada jednym zdaniem:
              </p>
              <blockquote>
                „Ile muszę zarabiać dziś, żeby mieć taką emeryturę, jaką chcę?”
              </blockquote>
            </div>
            <div class="explainer">
              <p>
                Zamiast tabelek — <em>„twój koszyk życia”</em>, gdzie użytkownik
                wybiera styl życia po 60‑tce (mieszkanie, jedzenie, kino,
                podróże). Aplikacja pokazuje, ile musiałby
                <strong>dziś zarabiać</strong>.
              </p>
            </div>
          </section>

          <section
            v-else-if="currentSlide === 'userflow'"
            class="userflow-slide"
          >
            <h2>Jak to działa (User Flow)</h2>
            <ol class="steps">
              <li>
                <span class="num">1</span>
                <div>
                  <strong>Twój Koszyk</strong> — przeciągasz produkty i widzisz
                  koszt życia na emeryturze.
                </div>
              </li>
              <li>
                <span class="num">2</span>
                <div>
                  <strong>Formularz danych</strong> — płeć, rok urodzenia, typ
                  umowy, start pracy.
                </div>
              </li>
              <li>
                <span class="num">3</span>
                <div>
                  <strong>Dashboard</strong> — wynik:
                  <em
                    >"Aby mieć taką emeryturę, musisz dziś zarabiać X zł
                    brutto."</em
                  >
                </div>
              </li>
              <li>
                <span class="num">4</span>
                <div>
                  <strong>Dodaj swoją pensję</strong> — zobacz różnicę między
                  tym, co masz, a tym, czego potrzebujesz.
                </div>
              </li>
              <li>
                <span class="num">5</span>
                <div>
                  <strong>Dostosuj do siebie</strong> — eksperymentuj z wiekiem,
                  oszczędzaniem, PPK i przerwami zawodowymi.
                </div>
              </li>
            </ol>
            <div class="local-note">
              Wszystko lokalnie — bez logowania, bez zbierania danych.
            </div>
          </section>

          <section
            v-else-if="currentSlide === 'audience'"
            class="audience-slide"
          >
            <h2>Dla kogo?</h2>
            <div class="grid3">
              <div class="a-card green">
                <h3>Wiek</h3>
                <p>
                  <strong>20–35 lat</strong> — osoby, które dopiero zaczynają
                  karierę lub są w jej połowie.
                </p>
              </div>
              <div class="a-card orange">
                <h3>Postawy</h3>
                <p>
                  Ci, którzy <strong>nie myślą o emeryturze</strong>, bo „to za
                  daleko” lub „i tak nic z tego nie będzie”.
                </p>
              </div>
              <div class="a-card blue">
                <h3>Oszczędzanie</h3>
                <p>
                  Ci, którzy <strong>nie oszczędzają</strong> na emeryturę, bo
                  nie wiedzą ile i gdzie.
                </p>
              </div>
            </div>
            <div class="goal">
              <strong>Cel:</strong> Zmienić postawę z „to nie dla mnie” na
              <strong>„ok, to się da zrobić”.</strong>
            </div>
          </section>

          <section v-else-if="currentSlide === 'whynow'" class="why-slide">
            <h2>Dlaczego teraz?</h2>
            <ul class="facts">
              <li class="soft">
                <span class="dot green"></span>
                <strong>Demograficzna bomba zegarowa</strong> — za 20–30 lat na
                jednego emeryta przypadnie mniej niż 2 pracujących.
              </li>
              <li>
                <span class="dot orange"></span>
                <strong>Rosnąca świadomość finansowa</strong> — młodzi szukają
                prostych narzędzi do planowania.
              </li>
              <li>
                <span class="dot blue"></span>
                <strong>Cyfryzacja ZUS</strong> — czas na narzędzie, które
                <em>edukuje, a nie straszy</em>.
              </li>
            </ul>
          </section>

          <section v-else-if="currentSlide === 'vision'" class="vision-slide">
            <span class="pill light">Wizja</span>
            <h2>Nasza wizja</h2>
            <p class="subtitle center">
              Odczarować temat emerytur i pokazać, że
              <strong>każdy ma wpływ</strong> na swoją przyszłość finansową.
            </p>
            <div class="grid3">
              <div class="v-card">
                <h3>Edukacja</h3>
                <p>Bez strachu i żargonu.</p>
              </div>
              <div class="v-card">
                <h3>Działanie</h3>
                <p>Motywacja do oszczędzania.</p>
              </div>
              <div class="v-card">
                <h3>Zaufanie</h3>
                <p>Transparentne wyliczenia.</p>
              </div>
            </div>
          </section>

          <section v-else-if="currentSlide === 'roadmap'" class="roadmap-slide">
            <h2>Następne kroki</h2>
            <ol class="roadmap">
              <li class="done">
                <span>✔</span> MVP gotowe — interaktywny kalkulator z koszykiem
                i formularzem.
              </li>
              <li><span>1</span> Testy użytkowników (20–35 lat) i iteracje.</li>
              <li>
                <span>2</span> Rozbudowa funkcjonalności — scenariusze,
                porównania, eksport PDF.
              </li>
              <li>
                <span>3</span> Kampania edukacyjna — social media, współpraca z
                twórcami.
              </li>
            </ol>
          </section>

          <section v-else-if="currentSlide === 'thanks'" class="thanks-slide">
            <h2>Dziękujemy!</h2>
            <p class="subtitle center">
              Gotowi do rozmowy o przyszłości emerytur w Polsce.
            </p>
            <button class="cta" @click="$router.push('/')">
              Wypróbuj kalkulator
            </button>
          </section>
        </div>

        <div class="card-footer">
          <button
            class="nav-btn ghost"
            :disabled="currentSlideIndex === 0"
            @click="prev"
          >
            ← Poprzedni
          </button>
          <div class="dots">
            <span
              v-for="(s, i) in slides"
              :key="s"
              class="dot"
              :class="{ active: i === currentSlideIndex }"
            ></span>
          </div>
          <button
            class="nav-btn primary"
            :disabled="currentSlideIndex === slides.length - 1"
            @click="next"
          >
            Następny →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";

export default {
  name: "Pitch",
  setup() {
    const slides = [
      "hero",
      "problem",
      "solution",
      "userflow",
      "audience",
      "whynow",
      "vision",
      "roadmap",
      "thanks",
    ];
    const currentSlideIndex = ref(0);
    const currentSlide = computed(() => slides[currentSlideIndex.value]);

    const next = () => {
      if (currentSlideIndex.value < slides.length - 1)
        currentSlideIndex.value += 1;
    };
    const prev = () => {
      if (currentSlideIndex.value > 0) currentSlideIndex.value -= 1;
    };

    return { slides, currentSlideIndex, currentSlide, next, prev };
  },
};
</script>

<style scoped>
.pitch {
  padding: 32px 0 64px;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
  padding: 24px;
}
.card-header {
  margin-bottom: 8px;
}
.badge {
  display: inline-block;
  padding: 6px 12px;
  background: #eef6ff;
  color: #2563eb;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
}
.card-body {
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
}
.hero-slide {
  text-align: center;
}
.hero-slide .pill {
  display: inline-block;
  background: #eaf7ef;
  color: #007834;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
}
.hero-slide h1 {
  font-size: 44px;
  color: #0b3a6b;
  margin: 18px 0 8px;
}
.hero-slide .subtitle {
  color: #4a5568;
  font-size: 18px;
  margin-bottom: 6px;
}
.hero-slide .quote {
  color: #0aa34f;
  font-weight: 600;
  font-size: 18px;
}

.problem-slide h2,
.userflow-slide h2 {
  color: #0b3a6b;
  font-size: 36px;
  margin-bottom: 16px;
}
.problem-slide .lead {
  color: #2d3748;
  font-size: 18px;
  margin-bottom: 18px;
}
.problem-slide .green {
  color: #0aa34f;
  font-weight: 700;
}
.facts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.facts li {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.facts li.soft {
  background: #fff7f5;
  border-color: #fbd5d5;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.red {
  background: #ef4444;
}
.dot.orange {
  background: #f59e0b;
}
.effect {
  margin-top: 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 14px 16px;
  color: #2d3748;
}

/* Added blocks for solution/audience/vision/roadmap/thanks to match screenshots */
.solution-slide h2 {
  color: #0b3a6b;
  font-size: 36px;
  margin-bottom: 16px;
}
.solution-card {
  background: #eaf7ef;
  border: 1px solid #b7e5c7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.solution-card blockquote {
  font-size: 20px;
  font-style: italic;
  color: #0b3a6b;
  margin: 8px 0 0;
}
.explainer {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
}

.audience-slide h2,
.why-slide h2,
.vision-slide h2,
.roadmap-slide h2,
.thanks-slide h2 {
  color: #0b3a6b;
  font-size: 32px;
  margin-bottom: 16px;
}
.grid3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.a-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
}
.a-card.green {
  border-color: #b7e5c7;
  background: #eaf7ef;
}
.a-card.orange {
  border-color: #fde68a;
  background: #fff7ed;
}
.a-card.blue {
  border-color: #c7dbff;
  background: #f0f5ff;
}
.goal {
  margin-top: 12px;
  background: #0b3a6b;
  color: #fff;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: 700;
}

.dot.green {
  background: #00a651;
}

.vision-slide .pill.light {
  background: #eef6ff;
  color: #2563eb;
}
.vision-slide .grid3 .v-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
}

.roadmap {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.roadmap li {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.roadmap li span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #eaf7ef;
  color: #007834;
  font-weight: 700;
}
.roadmap li.done {
  background: #eaf9f0;
  border-color: #b7e5c7;
}
.roadmap li.done span {
  background: #d1fae5;
  color: #065f46;
}

.thanks-slide .cta {
  background: #00a651;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
}
.steps .num {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #eaf7ef;
  color: #007834;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.local-note {
  margin-top: 18px;
  background: #eaf7ef;
  color: #1f2937;
  border: 1px solid #b7e5c7;
  padding: 14px 16px;
  border-radius: 12px;
  font-weight: 600;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
}
.nav-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}
.nav-btn.ghost {
  background: #f1f5f9;
  color: #334155;
}
.nav-btn.primary {
  background: #00a651;
  color: white;
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dots {
  display: flex;
  gap: 6px;
}
.dots .dot {
  width: 8px;
  height: 8px;
  background: #e5e7eb;
}
.dots .dot.active {
  background: #00a651;
}

@media (max-width: 620px) {
  .hero-slide h1 {
    font-size: 32px;
  }
  .grid3 {
    grid-template-columns: 1fr;
  }
}
</style>
