<template>
  <div class="pension-explanation">
    <div class="explanation-card">
      <h3>Co oznaczają te kwoty? 💡</h3>

      <div class="explanation-grid">
        <div class="explanation-item">
          <div class="explanation-icon">💰</div>
          <div class="explanation-content">
            <h4>Wysokość rzeczywista</h4>
            <p>
              To kwota, którą otrzymasz "na rękę" w momencie przejścia na
              emeryturę. To jest ta suma, którą zobaczysz na swoim koncie
              bankowym.
            </p>
          </div>
        </div>

        <div class="explanation-item">
          <div class="explanation-icon">📈</div>
          <div class="explanation-content">
            <h4>Wysokość urealniona</h4>
            <p>
              To ta sama kwota, ale przeliczona na dzisiejsze pieniądze.
              Pokazuje, ile rzeczywiście będzie warta Twoja emerytura, gdy
              uwzględnimy inflację (czyli wzrost cen).
            </p>
          </div>
        </div>

        <div class="explanation-item">
          <div class="explanation-icon">🌍</div>
          <div class="explanation-content">
            <h4>Wysokość zrównoważona</h4>
            <p>
              To emerytura, która uwzględnia zmiany demograficzne (starzenie się
              społeczeństwa). Pokazuje, jaką emeryturę będziesz mógł otrzymać w
              rzeczywistości.
            </p>
          </div>
        </div>
      </div>

      <div class="simple-example">
        <h4>Przykład w prostych słowach:</h4>
        <p>
          Jeśli dzisiaj chleb kosztuje 4 zł, a za 30 lat będzie kosztował 8 zł,
          to Twoja emerytura 2000 zł będzie warta tyle, co dzisiejsze 1000 zł.
          To właśnie pokazuje "wysokość urealniona".
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PensionExplanation",
};
</script>

<style scoped>
.pension-explanation {
  margin: 2rem 0;
}

.explanation-card {
  background: var(--zus-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--zus-green);
}

.explanation-card h3 {
  color: var(--zus-dark-blue);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.explanation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.explanation-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--zus-light-gray);
  border-radius: 8px;
  border-left: 3px solid var(--zus-green);
}

.explanation-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.explanation-content h4 {
  color: var(--zus-dark-blue);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.explanation-content p {
  color: var(--zus-text-dark);
  line-height: 1.6;
  font-size: 0.95rem;
}

.simple-example {
  background: var(--zus-light-green);
  background: linear-gradient(135deg, var(--zus-light-green), var(--zus-green));
  color: var(--zus-white);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.simple-example h4 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.simple-example p {
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .explanation-grid {
    grid-template-columns: 1fr;
  }

  .explanation-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>
