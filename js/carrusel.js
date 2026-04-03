"use strict";

class Carrusel {
    #busqueda;
    #actual;
    #maximo;

    constructor(busqueda, imagenes = []) {
        this.#busqueda = busqueda;
        this.#actual   = 0;
        this.#maximo   = 5;
        this.fotos     = [];
        this._imagenes = imagenes;
    }

    getFotografias() {
        if (!this._imagenes.length) {
            document.querySelector("main").innerHTML =
                "<h2>No se han proporcionado imágenes locales.</h2>";
            return;
        }

        this.fotos = this._imagenes.slice(0, this.#maximo);
        this.mostrarFotografias();
    }

    cambiarFotografia() {
        if (!this.fotos.length) return;
        this.#actual = (this.#actual + 1) % this.fotos.length;
        this.insertarFoto(this.fotos[this.#actual]);
    }

    mostrarFotografias() {
        this.insertarFoto(this.fotos[this.#actual]);

        if (this._timer) clearInterval(this._timer);
        this._timer = setInterval(() => this.cambiarFotografia(), 3000);
    }

    insertarFoto(foto) {
        const img = document.querySelector("main article img");
        if (img) {
            img.src = foto.url;
            img.alt = foto.alt;
        } else {
            const article = document.createElement("article");
            article.innerHTML = `
                <h2>Imágenes de ${this.#busqueda}</h2>
                <img src="${foto.url}" alt="${foto.alt}">
            `;
            document.querySelector("main").prepend(article);
        }
    }

    detener() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }
}