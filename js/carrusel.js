"use strict";

class Carrusel {
    #busqueda;
    #actual;
    #maximo;

    constructor(busqueda) {
        this.#busqueda = busqueda;
        this.#actual = 0;
        this.#maximo = 5;
        this.fotos = [];
    }

    getFotografias() {
        const flickrAPI = "https://www.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";

        $.getJSON(flickrAPI, {
            tags: this.#busqueda,
            tagmode: "any",
            format: "json"
        })
        .done(data => {
            this.procesarJSONFotografias(data);
            this.mostrarFotografias();
        })
        .fail(() => {
            $("main").html("<h2>No se pudieron obtener las imágenes de Flickr</h2>");
        });
    }

    procesarJSONFotografias(jsonData) {
        this.fotos = jsonData.items.slice(0, this.#maximo).map(item => ({
            titulo: item.title,
            url: item.media.m.replace("_m.jpg", "_z.jpg"),
            enlace: item.link,
            alt: item.title?.trim() || `Imagen del circuito de ${this.#busqueda}`  
            // manejar en caso de que este vacio el titulo
        }));
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
        const $img = $("main article img");
        if ($img.length) {
            $img.attr("src", foto.url).attr("alt", foto.alt);
        } else {
            const $article = $(`
                <article>
                    <h2>Imágenes de ${this.#busqueda}</h2>
                    <img src="${foto.url}" alt="${foto.alt}">
                </article>
            `);
            $("main").prepend($article);
        }   
    }
}