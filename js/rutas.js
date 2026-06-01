/**
 * rutas.js
 * Carga y visualiza rutas turísticas desde rutas.xml.
 * Usa ECMAScript puro (clases) + jQuery para manipulación DOM/AJAX.
 * Mapbox GL JS para los mapas KML.
 * No se usan ids, clases ni divs SALVO para los mapas dinámicos.
 */

/* ══════════════════════════════════════════════════
   CLASE: LectorXML
   Responsabilidad: leer el archivo rutas.xml y
   devolver el documento XML parseado.
══════════════════════════════════════════════════ */
class LectorXML {
    /**
     * Lee un File object y resuelve con el XMLDocument.
     * @param {File} archivo
     * @returns {Promise<XMLDocument>}
     */
    leer(archivo) {
        return new Promise((resolve, reject) => {
            if (!archivo) {
                reject(new Error("No se ha seleccionado ningún archivo."));
                return;
            }
            if (!archivo.name.endsWith(".xml")) {
                reject(new Error("El archivo seleccionado no es XML."));
                return;
            }

            const lector = new FileReader();
            lector.onload = (e) => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
                const error = xmlDoc.querySelector("parsererror");
                if (error) {
                    reject(new Error("Error al parsear el XML: " + error.textContent));
                } else {
                    resolve(xmlDoc);
                }
            };
            lector.onerror = () => reject(new Error("Error al leer el archivo."));
            lector.readAsText(archivo);
        });
    }
}

/* ══════════════════════════════════════════════════
   CLASE: ExtractorRutas
   Responsabilidad: extraer los datos de cada ruta
   del XMLDocument y devolverlos como array de objetos.
══════════════════════════════════════════════════ */
class ExtractorRutas {
    /**
     * Obtiene el textContent de un selector dentro de un elemento.
     * Devuelve '' si no existe.
     */
    _txt(padre, selector) {
        const elem = padre.querySelector(selector);
        return elem ? elem.textContent.trim() : "";
    }

    /**
     * Extrae todas las rutas del documento XML.
     * @param {XMLDocument} xmlDoc
     * @returns {Array<Object>}
     */
    extraer(xmlDoc) {
        const rutas = [];
        $(xmlDoc).find("ruta").each((i, rutaElem) => {
            const ruta = {
                id: $(rutaElem).attr("id"),
                nombre: this._txt(rutaElem, "nombre"),
                tipo: this._txt(rutaElem, "tipo"),
                transporte: this._txt(rutaElem, "medioTransporte"),
                fechaInicio: this._txt(rutaElem, "fechaInicio"),
                horaInicio: this._txt(rutaElem, "horaInicio"),
                duracion: this._txt(rutaElem, "duracion"),
                agencia: this._txt(rutaElem, "agencia"),
                descripcion: this._txt(rutaElem, "descripcion"),
                personas: this._txt(rutaElem, "personasAdecuadas"),
                lugarInicio: this._txt(rutaElem, "lugarInicio"),
                direccionInicio: this._txt(rutaElem, "direccionInicio"),
                recomendacion: this._txt(rutaElem, "recomendacion"),
                planimetria: this._txt(rutaElem, "planimetria"),
                altimetria: this._txt(rutaElem, "altimetria"),
                coordenadasInicio: {
                    longitud: parseFloat(this._txt(rutaElem, "coordenadasInicio longitud")),
                    latitud: parseFloat(this._txt(rutaElem, "coordenadasInicio latitud")),
                    altitud: parseFloat(this._txt(rutaElem, "coordenadasInicio altitud"))
                },
                referencias: [],
                hitos: []
            };

            // Referencias
            $(rutaElem).find("referencias referencia").each((j, refElem) => {
                ruta.referencias.push($(refElem).text().trim());
            });

            // Hitos
            $(rutaElem).find("hito").each((k, hitoElem) => {
                const hito = {
                    id: $(hitoElem).attr("id"),
                    nombre: this._txt(hitoElem, "nombre"),
                    descripcion: this._txt(hitoElem, "descripcion"),
                    coordenadas: {
                        longitud: parseFloat(this._txt(hitoElem, "coordenadas longitud")),
                        latitud: parseFloat(this._txt(hitoElem, "coordenadas latitud")),
                        altitud: parseFloat(this._txt(hitoElem, "coordenadas altitud"))
                    },
                    distancia: this._txt(hitoElem, "distanciaDesdeAnterior"),
                    unidadesDistancia: $(hitoElem).find("distanciaDesdeAnterior").attr("unidades") || "",
                    fotos: [],
                    videos: []
                };

                $(hitoElem).find("galeriaFotos foto").each((f, fotoElem) => {
                    hito.fotos.push({
                        alt: $(fotoElem).attr("alt") || "",
                        src: $(fotoElem).text().trim()
                    });
                });

                $(hitoElem).find("galeriaVideos video").each((v, videoElem) => {
                    hito.videos.push({
                        alt: $(videoElem).attr("alt") || "",
                        src: $(videoElem).text().trim()
                    });
                });

                ruta.hitos.push(hito);
            });

            rutas.push(ruta);
        });
        return rutas;
    }
}

/* ══════════════════════════════════════════════════
   CLASE: ConstructorHTML
   Responsabilidad: construir y añadir al DOM los
   elementos HTML para mostrar cada ruta.
   Restricción: NO usa ids, clases ni divs
   salvo los divs necesarios para mapas.
══════════════════════════════════════════════════ */
class ConstructorHTML {
    /**
     * Inserta todas las rutas en <main>.
     * @param {Array<Object>} rutas
     */
    renderizar(rutas) {
        // Eliminar mensaje inicial
        $("#mensaje-carga").remove();

        rutas.forEach((ruta) => {
            const $seccionRuta = this._crearSeccionRuta(ruta);
            $("main").append($seccionRuta);
        });
    }

    /** Crea la sección completa de una ruta */
    _crearSeccionRuta(ruta) {
        const $seccion = $("<section>");

        // Encabezado de ruta
        $seccion.append($("<h3>").text(ruta.nombre));

        // Información general
        $seccion.append(this._crearInfoGeneral(ruta));

        // Coordenadas de inicio
        $seccion.append(this._crearCoordenadas(ruta.coordenadasInicio));

        // Referencias
        $seccion.append(this._crearReferencias(ruta.referencias));

        // Hitos
        $seccion.append(this._crearHitos(ruta.hitos));

        // Planimetría (mapa KML)
        $seccion.append(this._crearSeccionMapa(ruta));

        // Altimetría (SVG)
        $seccion.append(this._crearSeccionAltimetria(ruta));

        return $seccion;
    }

    /** Tabla con los datos generales de la ruta */
    _crearInfoGeneral(ruta) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Información general"));

        const filas = [
            ["Tipo", ruta.tipo],
            ["Medio de transporte", ruta.transporte],
            ["Duración", ruta.duracion],
            ["Agencia", ruta.agencia],
            ["Descripción", ruta.descripcion],
            ["Personas adecuadas", ruta.personas],
            ["Lugar de inicio", ruta.lugarInicio],
            ["Dirección de inicio", ruta.direccionInicio],
            ["Recomendación", ruta.recomendacion + " / 10"]
        ];

        if (ruta.fechaInicio) filas.push(["Fecha de inicio", ruta.fechaInicio]);
        if (ruta.horaInicio) filas.push(["Hora de inicio", ruta.horaInicio]);

        const $tabla = $("<table>");
        const $tbody = $("<tbody>");
        filas.forEach(([campo, valor]) => {
            if (valor) {
                $tbody.append(
                    $("<tr>")
                        .append($("<th>").text(campo))
                        .append($("<td>").text(valor))
                );
            }
        });
        $tabla.append($tbody);
        $sec.append($tabla);
        return $sec;
    }

    /** Párrafo con las coordenadas del punto de inicio */
    _crearCoordenadas(coords) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Coordenadas de inicio"));
        $sec.append($("<p>").text(
            `Longitud: ${coords.longitud} | Latitud: ${coords.latitud} | Altitud: ${coords.altitud} m`
        ));
        return $sec;
    }

    /** Lista de referencias */
    _crearReferencias(referencias) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Referencias"));
        const $ul = $("<ul>");
        referencias.forEach((ref) => {
            $ul.append(
                $("<li>").append($("<a>").attr("href", ref).attr("target", "_blank").text(ref))
            );
        });
        $sec.append($ul);
        return $sec;
    }

    /** Sección con todos los hitos */
    _crearHitos(hitos) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Hitos de la ruta"));

        hitos.forEach((hito) => {
            const $hitoSec = $("<section>");
            $hitoSec.append($("<h5>").text(hito.nombre));
            $hitoSec.append($("<p>").text(hito.descripcion));
            $hitoSec.append($("<p>").text(
                `Coordenadas — Longitud: ${hito.coordenadas.longitud}, Latitud: ${hito.coordenadas.latitud}, Altitud: ${hito.coordenadas.altitud} m`
            ));
            if (hito.distancia) {
                $hitoSec.append($("<p>").text(
                    `Distancia desde el anterior: ${hito.distancia} ${hito.unidadesDistancia}`
                ));
            }

            // Fotos
            if (hito.fotos.length > 0) {
                const $figuras = $("<figure>");
                hito.fotos.forEach((foto) => {
                    $figuras.append($("<img>").attr("src", foto.src).attr("alt", foto.alt));
                    $figuras.append($("<figcaption>").text(foto.alt));
                });
                $hitoSec.append($figuras);
            }

            // Vídeos
            if (hito.videos.length > 0) {
                hito.videos.forEach((video) => {
                    $hitoSec.append(
                        $("<video>")
                            .attr("src", video.src)
                            .attr("controls", true)
                            .text(video.alt)
                    );
                    $hitoSec.append($("<p>").text(video.alt));
                });
            }

            $sec.append($hitoSec);
        });

        return $sec;
    }

    /**
     * Crea la sección del mapa con un <div> (permitido para mapas dinámicos).
     * El div recibe el atributo data-ruta-id para que CargadorKML pueda
     * identificarlo, sin usar id ni clases propias.
     */
    _crearSeccionMapa(ruta) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Planimetría (Mapa KML)"));

        const $label = $("<label>")
            .attr("for", "kml-" + ruta.id)
            .text("Cargar archivo KML de la planimetría:");
        const $input = $("<input>")
            .attr("type", "file")
            .attr("accept", ".kml")
            .attr("name", "kml-" + ruta.id);

        // El div del mapa — único uso permitido de div/clase según enunciado
        const $mapaDiv = $("<div>")
            .addClass("mapa-ruta")
            .attr("data-ruta-id", ruta.id);

        $input.on("change", (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                const cargador = new CargadorKML($mapaDiv[0], ruta.coordenadasInicio);
                cargador.leerArchivoKML(archivo);
            }
        });

        $sec.append($label).append($input).append($mapaDiv);
        return $sec;
    }

    /** Crea la sección para la altimetría SVG */
    _crearSeccionAltimetria(ruta) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Altimetría (SVG)"));

        const $label = $("<label>")
            .text("Cargar archivo SVG de la altimetría:");
        const $input = $("<input>")
            .attr("type", "file")
            .attr("accept", ".svg");

        const $contenedor = $("<figure>");

        $input.on("change", (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                const cargador = new CargadorSVGRutas($contenedor[0], ruta.hitos);
                cargador.leerArchivoSVG(archivo);
            }
        });

        $sec.append($label).append($input).append($contenedor);
        return $sec;
    }
}

/* ══════════════════════════════════════════════════
   CLASE: CargadorKML
   Responsabilidad: leer el KML y renderizar el mapa
   Mapbox con marcadores y traza de la ruta.
══════════════════════════════════════════════════ */
class CargadorKML {
    /**
     * @param {HTMLElement} contenedor  El div del mapa
     * @param {Object}      coordInicio Coordenadas de inicio de la ruta
     */
    constructor(contenedor, coordInicio) {
        this.contenedor = contenedor;
        this.coordInicio = coordInicio;
        this.mapa = null;
    }

    leerArchivoKML(archivo) {
        const lector = new FileReader();
        lector.onload = (e) => this._procesarKML(e.target.result);
        lector.onerror = () => alert("Error al leer el archivo KML.");
        lector.readAsText(archivo);
    }

    _procesarKML(contenidoKML) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contenidoKML, "text/xml");

        // Punto de origen
        let coordOrigen = this.coordInicio;
        const puntoCoords = xmlDoc.querySelector("Placemark Point coordinates");
        if (puntoCoords) {
            const partes = puntoCoords.textContent.trim().split(",").map(Number);
            if (!isNaN(partes[0]) && !isNaN(partes[1])) {
                coordOrigen = { longitud: partes[0], latitud: partes[1] };
            }
        }

        // Línea del recorrido
        let coordenadasLinea = [];
        const lineaCoords = xmlDoc.querySelector("Placemark LineString coordinates");
        if (lineaCoords) {
            coordenadasLinea = lineaCoords.textContent.trim()
                .split(/\s+/)
                .filter(l => l.trim() !== "")
                .map(l => {
                    const p = l.split(",").map(Number);
                    return [p[0], p[1]];
                });
        }

        this._inicializarMapa(coordOrigen, coordenadasLinea);
    }

    _inicializarMapa(coordOrigen, coordenadasLinea) {
        // Destruir mapa anterior si existía
        if (this.mapa) {
            this.mapa.remove();
            this.mapa = null;
        }

        mapboxgl.accessToken = 'pk.eyJ1IjoibWVndXNldyIsImEiOiJjbWlmNmNhNDMwOXhmM2tzOXcxOWR4ejk3In0.pQD9ydhii7vFLSjupm9Hmg';

        this.mapa = new mapboxgl.Map({
            container: this.contenedor,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [coordOrigen.longitud, coordOrigen.latitud],
            zoom: 12
        });

        this.mapa.on('load', () => {
            // Marcador de inicio
            const marcadorElem = document.createElement('section');
            marcadorElem.style.width = '14px';
            marcadorElem.style.height = '14px';
            marcadorElem.style.background = '#e53935';
            marcadorElem.style.border = '2px solid #fff';
            marcadorElem.style.borderRadius = '50%';

            new mapboxgl.Marker(marcadorElem)
                .setLngLat([coordOrigen.longitud, coordOrigen.latitud])
                .addTo(this.mapa);

            // Traza de la ruta
            if (coordenadasLinea.length > 1) {
                this.mapa.addSource('ruta-linea', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordenadasLinea
                        }
                    }
                });

                this.mapa.addLayer({
                    id: 'ruta-linea-capa',
                    type: 'line',
                    source: 'ruta-linea',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#1565C0', 'line-width': 4 }
                });
            }
        });
    }
}

/* ══════════════════════════════════════════════════
   CLASE: CargadorSVGRutas
   Responsabilidad: leer el SVG de altimetría,
   insertarlo en el DOM y añadir etiquetas de hitos.
══════════════════════════════════════════════════ */
class CargadorSVGRutas {
    /**
     * @param {HTMLElement} contenedor  El <figure> donde se insertará el SVG
     * @param {Array}       hitos       Array de hitos con nombre y altitud
     */
    constructor(contenedor, hitos) {
        this.contenedor = contenedor;
        this.hitos = hitos;
    }

    leerArchivoSVG(archivo) {
        const lector = new FileReader();
        lector.onload = (e) => this._procesarSVG(e.target.result);
        lector.onerror = () => alert("Error al leer el archivo SVG.");
        lector.readAsText(archivo);
    }

    _procesarSVG(contenidoSVG) {
        const parser = new DOMParser();
        const docSVG = parser.parseFromString(contenidoSVG, "image/svg+xml");
        const svgElem = docSVG.documentElement;

        if (svgElem.querySelector("parsererror")) {
            alert("Error al procesar el archivo SVG.");
            return;
        }

        // Añadir etiquetas de hitos al SVG
        this._anadirEtiquetasHitos(svgElem);

        // Vaciar contenedor e insertar SVG
        $(this.contenedor).empty().append(svgElem);
    }

    /**
     * Distribuye etiquetas de texto con los nombres de los hitos
     * a lo largo del perfil SVG, alternando entre horizontal y vertical.
     */
    _anadirEtiquetasHitos(svgElem) {
        const ancho = parseFloat(svgElem.getAttribute("width") || svgElem.viewBox?.baseVal?.width || 800);
        const alto = parseFloat(svgElem.getAttribute("height") || svgElem.viewBox?.baseVal?.height || 300);
        const n = this.hitos.length;
        if (n === 0) return;

        const ns = "http://www.w3.org/2000/svg";

        this.hitos.forEach((hito, i) => {
            const x = Math.round((ancho / (n + 1)) * (i + 1));
            const y = Math.round(alto * 0.15); // Zona superior del gráfico

            const texto = document.createElementNS(ns, "text");
            texto.setAttribute("x", x);
            texto.setAttribute("y", y);
            texto.setAttribute("font-size", "11");
            texto.setAttribute("fill", "#1a237e");
            texto.setAttribute("text-anchor", "middle");

            // Alternar entre etiqueta horizontal y vertical
            if (i % 2 === 0) {
                texto.textContent = hito.nombre;
            } else {
                texto.setAttribute("transform", `rotate(-90, ${x}, ${y})`);
                texto.textContent = hito.nombre;
            }

            // Línea vertical de referencia
            const linea = document.createElementNS(ns, "line");
            linea.setAttribute("x1", x);
            linea.setAttribute("y1", y + 5);
            linea.setAttribute("x2", x);
            linea.setAttribute("y2", alto * 0.8);
            linea.setAttribute("stroke", "#9e9e9e");
            linea.setAttribute("stroke-width", "1");
            linea.setAttribute("stroke-dasharray", "4 3");

            svgElem.appendChild(linea);
            svgElem.appendChild(texto);
        });
    }
}

/* ══════════════════════════════════════════════════
   CONTROLADOR PRINCIPAL
   Se ejecuta cuando el DOM está listo (jQuery).
══════════════════════════════════════════════════ */
$(document).ready(() => {
    const lectorXML = new LectorXML();
    const extractor = new ExtractorRutas();
    const constructor = new ConstructorHTML();

    $("#archivo-xml").on("change", function () {
        const archivo = this.files[0];
        lectorXML.leer(archivo)
            .then((xmlDoc) => {
                const rutas = extractor.extraer(xmlDoc);
                if (rutas.length === 0) {
                    alert("No se encontraron rutas en el archivo XML.");
                    return;
                }
                // Eliminar rutas previas si las hubiera
                $("main section").remove();
                constructor.renderizar(rutas);
            })
            .catch((err) => {
                alert("Error: " + err.message);
            });
    });
});