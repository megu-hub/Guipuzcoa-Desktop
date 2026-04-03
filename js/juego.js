class Juego {
  #preguntas = [
    { q: "¿Cuál es el planeta más grande del sistema solar?",      ops: ["Tierra","Saturno","Júpiter","Urano","Neptuno"],              r: 2 },
    { q: "¿En qué año llegó el hombre a la Luna?",                 ops: ["1965","1967","1969","1971","1973"],                          r: 2 },
    { q: "¿Cuántos huesos tiene el cuerpo humano adulto?",         ops: ["186","206","226","246","256"],                               r: 1 },
    { q: "¿Cuál es el río más largo del mundo?",                   ops: ["Amazonas","Yangtsé","Misisipi","Nilo","Danubio"],             r: 3 },
    { q: "¿Qué elemento químico tiene el símbolo Au?",             ops: ["Plata","Aluminio","Oro","Arsénico","Argón"],                  r: 2 },
    { q: "¿Quién pintó La Gioconda?",                              ops: ["Miguel Ángel","Rafael","Botticelli","Caravaggio","Leonardo"], r: 4 },
    { q: "¿Cuántos lados tiene un heptágono?",                     ops: ["5","6","7","8","9"],                                         r: 2 },
    { q: "¿Cuál es el país más grande del mundo por superficie?",  ops: ["China","Canadá","EE.UU.","Rusia","Brasil"],                  r: 3 },
    { q: "¿En qué año se fundó la ONU?",                           ops: ["1939","1942","1945","1948","1950"],                          r: 2 },
    { q: "¿Cuántos cromosomas tiene una célula humana normal?",    ops: ["23","36","46","48","52"],                                    r: 2 }
  ];

  #actual = 0;
  #puntos = 0;
  #raiz;

  constructor(raiz) {
    this.#raiz = raiz;
    this.#render();
  }

  #limpiar() {
    while (this.#raiz.firstChild) this.#raiz.removeChild(this.#raiz.firstChild);
  }

  #render() {
    this.#limpiar();
    if (this.#actual < this.#preguntas.length) {
      this.#renderPregunta();
    } else {
      this.#renderResultado();
    }
  }

  #renderPregunta() {
    const p = this.#preguntas[this.#actual];

    const progreso = document.createElement("p");
    progreso.textContent = `Pregunta ${this.#actual + 1} de ${this.#preguntas.length}`;
    this.#raiz.appendChild(progreso);

    const enunciado = document.createElement("p");
    enunciado.textContent = p.q;
    this.#raiz.appendChild(enunciado);

    const feedback = document.createElement("p");

    p.ops.forEach((texto, i) => {
      const btn = document.createElement("button");
      btn.textContent = texto;
      btn.addEventListener("click", () => this.#responder(i, p, feedback));
      this.#raiz.appendChild(btn);
      this.#raiz.appendChild(document.createElement("br"));
    });

    this.#raiz.appendChild(feedback);
  }

  #responder(indice, pregunta, feedback) {
    this.#raiz.querySelectorAll("button").forEach(b => b.disabled = true);

    if (indice === pregunta.r) {
      this.#puntos++;
      feedback.textContent = "✓ Correcto";
    } else {
      feedback.textContent = `✗ Incorrecto. La respuesta era: ${pregunta.ops[pregunta.r]}`;
    }

    const siguiente = document.createElement("button");
    siguiente.textContent = this.#actual + 1 < this.#preguntas.length ? "Siguiente" : "Ver resultado";
    siguiente.addEventListener("click", () => { this.#actual++; this.#render(); });
    this.#raiz.appendChild(siguiente);
  }

  #renderResultado() {
    const titulo = document.createElement("h2");
    titulo.textContent = "Resultado final";
    this.#raiz.appendChild(titulo);

    const resultado = document.createElement("p");
    resultado.textContent = `Has acertado ${this.#puntos} de ${this.#preguntas.length} preguntas.`;
    this.#raiz.appendChild(resultado);

    const reiniciar = document.createElement("button");
    reiniciar.textContent = "Reiniciar";
    reiniciar.addEventListener("click", () => { this.#actual = 0; this.#puntos = 0; this.#render(); });
    this.#raiz.appendChild(reiniciar);
  }
}