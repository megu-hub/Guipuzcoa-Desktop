"use strict";
class Memoria {
    #indiceActual;
    #puntuacion;

    constructor() {
        this.#indiceActual = 0;
        this.#puntuacion = 0;
    }

    inicializar(){
        const cartas = document.querySelectorAll('main > article');
        cartas.forEach(carta => {
            carta.addEventListener('click', () => this.voltearCarta(carta));
        });
    }

    

    finalizarJuego() {
        formulario.innerHTML = `<h2>¡Completado! Puntuación final: ${this.#puntuacion}</h2>`;
    }

    
    
}