"use strict"
class Noticias{
    
    #busqueda

    constructor(busqueda) {
        this.#busqueda = busqueda;
    }

    buscar() {
        const api_key = "JExgBB1xK0UaClntkePeSmGz7b1lEcwjIC5fpWc2"; 
        
        const urlCompleta = `https://api.thenewsapi.com/v1/news/all?api_token=${api_key}&search=${this.#busqueda}&language=es&limit=10`


        return fetch(urlCompleta)
            .then(respuesta => respuesta.json())
            .catch(error => console.error("Error al obtener noticias:", error));
    }

    procesarInformacion(datosJSON) {
        const noticias = datosJSON.data;

        return noticias.map(noticia => {
            return {
                titulo: noticia.title,
                descripcion: noticia.description,
                url: noticia.url,
                imagen: noticia.image_url,
                fecha: noticia.published_at,
                fuente: noticia.source
            };
        });
    }

    mostrarNoticias(noticias) {
        
        noticias.forEach(noticia => {
            const articulo = $("<article></article>");
            const titulo = $("<h2></h2>").text(noticia.titulo);
            const entradilla = $("<p></p>").text(noticia.descripcion);
            const enlace = $("<a></a>")
                .attr("href", noticia.url)
                .attr("target", "_blank")
                .text("Leer noticia completa");
            const fuente = $("<p></p>").text("Fuente: " + noticia.fuente);
            
            articulo.append(titulo, entradilla, enlace, fuente);
            $("main").append(articulo);
        });
        
    }


}