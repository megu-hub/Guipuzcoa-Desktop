class Juego {
  #preguntas = [
      { q: "¿Cuántas rutas de Guipúzcoa se describen en el rutas?", ops: ["2", "3", "4", "5"], r: 1 },
      { q: "¿Cuántas estrellas Michelin tiene el restaurante Arzak (San Sebastián)?", ops: ["1 estrella", "2 estrellas", "3 estrellas", "4 estrellas"], r: 2 },
      { q: "¿Cuál es el medio de transporte de todas las rutas?", ops: ["En bicicleta", "A pie", "En coche", "En tren"], r: 1 },
      { q: "¿Cuántos hitos tiene la Ruta de la Costa Vasca (Getaria a Zumaia)?", ops: ["4", "5", "6", "7"], r: 2 },
      { q: "¿Cuántos restaurantes con estrella Michelin aparecen en la tabla de gastronomía?", ops: ["3", "4", "5", "6"], r: 1 },
      { q: "¿Cuántos términos aparecen en el glosario de gastronomía vasca?", ops: ["2", "3", "4", "5"], r: 2 },
      { q: "¿Cuántos días dura la Ruta del Camino de Santiago del Norte por Gipuzkoa?", ops: ["1 día", "2 días", "3 días", "5 días"], r: 2 },
      { q: "¿Cuántos campos horarios aparecen en meteorología?", ops: ["5", "6", "7", "8"], r: 3 },
      { q: "¿Cuál es la puntuación de recomendación de la Ruta de Pintxos por la Parte Vieja de Donostia?", ops: ["7", "8", "9", "10"], r: 3 },
      { q: "¿Cuántos hitos tiene la Ruta del Camino de Santiago del Norte por Gipuzkoa?", ops: ["4", "5", "6", "8"], r: 2 }
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