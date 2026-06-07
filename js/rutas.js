class LectorXML {
    leerTexto(contenido) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contenido, "text/xml");
        const error = xmlDoc.querySelector("parsererror");
        if (error) {
            throw new Error("Error al parsear el XML: " + error.textContent);
        }
        return xmlDoc;
    }
}

class ExtractorRutas {
    _txt(padre, selector) {
        const elem = padre.querySelector(selector);
        return elem ? elem.textContent.trim() : "";
    }

    extraer(xmlDoc) {
        const rutas = [];
        $(xmlDoc).find("ruta").each((i, rutaElem) => {
            const ruta = {
                id:              $(rutaElem).attr("id"),
                nombre:          this._txt(rutaElem, "nombre"),
                tipo:            this._txt(rutaElem, "tipo"),
                transporte:      this._txt(rutaElem, "medioTransporte"),
                fechaInicio:     this._txt(rutaElem, "fechaInicio"),
                horaInicio:      this._txt(rutaElem, "horaInicio"),
                duracion:        this._txt(rutaElem, "duracion"),
                agencia:         this._txt(rutaElem, "agencia"),
                descripcion:     this._txt(rutaElem, "descripcion"),
                personas:        this._txt(rutaElem, "personasAdecuadas"),
                lugarInicio:     this._txt(rutaElem, "lugarInicio"),
                direccionInicio: this._txt(rutaElem, "direccionInicio"),
                recomendacion:   this._txt(rutaElem, "recomendacion"),
                planimetria:     this._txt(rutaElem, "planimetria"),
                altimetria:      this._txt(rutaElem, "altimetria"),
                coordenadasInicio: {
                    longitud: parseFloat(this._txt(rutaElem, "coordenadasInicio longitud")),
                    latitud:  parseFloat(this._txt(rutaElem, "coordenadasInicio latitud")),
                    altitud:  parseFloat(this._txt(rutaElem, "coordenadasInicio altitud"))
                },
                referencias: [],
                hitos: []
            };

            $(rutaElem).find("referencias referencia").each((j, refElem) => {
                ruta.referencias.push($(refElem).text().trim());
            });

            $(rutaElem).find("hito").each((k, hitoElem) => {
                const hito = {
                    id:          $(hitoElem).attr("id"),
                    nombre:      this._txt(hitoElem, "nombre"),
                    descripcion: this._txt(hitoElem, "descripcion"),
                    coordenadas: {
                        longitud: parseFloat(this._txt(hitoElem, "coordenadas longitud")),
                        latitud:  parseFloat(this._txt(hitoElem, "coordenadas latitud")),
                        altitud:  parseFloat(this._txt(hitoElem, "coordenadas altitud"))
                    },
                    distancia:         this._txt(hitoElem, "distanciaDesdeAnterior"),
                    unidadesDistancia: $(hitoElem).find("distanciaDesdeAnterior").attr("unidades") || "",
                    fotos:  [],
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

class ConstructorHTML {
    renderizar(rutas) {
        $("main p").remove();
        rutas.forEach((ruta) => {
            $("main").append(this._crearSeccionRuta(ruta));
        });
    }

    _crearSeccionRuta(ruta) {
        const $seccion = $("<section>");
        $seccion.append($("<h3>").text(ruta.nombre));
        $seccion.append(this._crearInfoGeneral(ruta));
        $seccion.append(this._crearCoordenadas(ruta.coordenadasInicio));
        $seccion.append(this._crearReferencias(ruta.referencias));
        $seccion.append(this._crearHitos(ruta.hitos));
        $seccion.append(this._crearSeccionMapa(ruta));
        $seccion.append(this._crearSeccionAltimetria(ruta));
        return $seccion;
    }

    _crearInfoGeneral(ruta) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Información general"));

        const filas = [
            ["Tipo",                ruta.tipo],
            ["Medio de transporte", ruta.transporte],
            ["Duración",            ruta.duracion],
            ["Agencia",             ruta.agencia],
            ["Descripción",         ruta.descripcion],
            ["Personas adecuadas",  ruta.personas],
            ["Lugar de inicio",     ruta.lugarInicio],
            ["Dirección de inicio", ruta.direccionInicio],
            ["Recomendación",       ruta.recomendacion ? ruta.recomendacion + " / 10" : ""]
        ];

        if (ruta.fechaInicio) filas.push(["Fecha de inicio", ruta.fechaInicio]);
        if (ruta.horaInicio)  filas.push(["Hora de inicio",  ruta.horaInicio]);

        filas.forEach(([campo, valor]) => {
            if (valor) {
                $sec.append($("<p>").append($("<strong>").text(campo + ": ")).append(document.createTextNode(valor)));
            }
        });

        return $sec;
    }

    _crearCoordenadas(coords) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Coordenadas de inicio"));
        $sec.append($("<p>").text(
            `Longitud: ${coords.longitud} | Latitud: ${coords.latitud} | Altitud: ${coords.altitud} m`
        ));
        return $sec;
    }

    _crearReferencias(referencias) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Referencias"));
        const $ul = $("<ul>");
        referencias.forEach((ref) => {
            $ul.append(
                $("<li>").append(
                    $("<a>").attr("href", ref).attr("target", "_blank").text(ref)
                )
            );
        });
        $sec.append($ul);
        return $sec;
    }

    _crearHitos(hitos) {
        const $sec = $("<section>");
        $sec.append($("<h4>").text("Hitos de la ruta"));

        hitos.forEach((hito) => {
            const $hitoSec = $("<section>");
            $hitoSec.append($("<h5>").text(hito.nombre));
            $hitoSec.append($("<p>").text(hito.descripcion));
            $hitoSec.append($("<p>").text(
                `Coordenadas — Longitud: ${hito.coordenadas.longitud}, ` +
                `Latitud: ${hito.coordenadas.latitud}, ` +
                `Altitud: ${hito.coordenadas.altitud} m`
            ));
            if (hito.distancia) {
                $hitoSec.append($("<p>").text(
                    `Distancia desde el anterior: ${hito.distancia} ${hito.unidadesDistancia}`
                ));
            }

            if (hito.fotos.length > 0) {
                hito.fotos.forEach((foto) => {
                    const $fig = $("<figure>");
                    $fig.append($("<img>").attr("src", foto.src).attr("alt", foto.alt));
                    $fig.append($("<figcaption>").text(foto.alt));
                    $hitoSec.append($fig);
                });
            }

            if (hito.videos.length > 0) {
                hito.videos.forEach((video) => {
                    $hitoSec.append(
                        $("<video>").attr("src", video.src).attr("controls", true).text(video.alt)
                    );
                    $hitoSec.append($("<p>").text(video.alt));
                });
            }

            $sec.append($hitoSec);
        });

        return $sec;
    }

    _crearSeccionMapa(ruta) {
        const $sec            = $("<section>");
        const $mapaContenedor = $("<div>");

        $sec.append($("<h4>").text("Planimetría (Mapa KML)"));
        $sec.append($mapaContenedor);

        const kmlUrl = `xml/${ruta.id}_planimetria.kml`;
        $.ajax({
            url:      kmlUrl,
            dataType: "text",
            success: (contenido) => {
                new CargadorKML($mapaContenedor[0], ruta.coordenadasInicio).cargarDesdeTexto(contenido);
            },
            error: () => {
                $mapaContenedor.text("No se pudo cargar el KML: " + kmlUrl);
            }
        });

        return $sec;
    }

    _crearSeccionAltimetria(ruta) {
        const $sec        = $("<section>");
        const $contenedor = $("<figure>");

        $sec.append($("<h4>").text("Altimetría (SVG)"));
        $sec.append($contenedor);

        const svgUrl = `xml/${ruta.id}_altimetria.svg`;
        $.ajax({
            url:      svgUrl,
            dataType: "text",
            success: (contenido) => {
                const contenidoUnico = contenido.replace(
                    /\bid="([^"]+)"/g,
                    (match, id) => `id="${ruta.id}_${id}"`
                ).replace(
                    /\burl\(#([^)]+)\)/g,
                    (match, id) => `url(#${ruta.id}_${id})`
                ).replace(
                    /\bhref="#([^"]+)"/g,
                    (match, id) => `href="#${ruta.id}_${id}"`
                );

                const docSVG  = new DOMParser().parseFromString(contenidoUnico, "image/svg+xml");
                const svgElem = docSVG.documentElement;
                if (!svgElem.querySelector("parsererror")) {
                    svgElem.setAttribute("width",  "100%");
                    svgElem.removeAttribute("height");
                    $contenedor.empty().append(svgElem);
                }
            },
            error: () => {
                $contenedor.append($("<p>").text("No se pudo cargar el SVG: " + svgUrl));
            }
        });

    return $sec;
}
}

class CargadorKML {
    constructor(contenedor, coordInicio) {
        this.contenedor  = contenedor;
        this.coordInicio = coordInicio;
        this.mapa        = null;
    }

    cargarDesdeTexto(contenidoKML) {
        this._procesarKML(contenidoKML);
    }

    leerArchivoKML(archivo) {
        const lector = new FileReader();
        lector.onload  = (e) => this._procesarKML(e.target.result);
        lector.onerror = () => alert("Error al leer el archivo KML.");
        lector.readAsText(archivo);
    }

_procesarKML(contenidoKML) {
    const xmlDoc = new DOMParser().parseFromString(contenidoKML, "text/xml");

    let coordOrigen = this.coordInicio;
    const marcadores = [];

    // Recorrer todos los Placemark
    xmlDoc.querySelectorAll("Placemark").forEach((pm) => {
        const pointCoords = pm.querySelector("Point coordinates");
        const nombre      = pm.querySelector("name");

        if (pointCoords) {
            const partes = pointCoords.textContent.trim().split(",").map(Number);
            if (!isNaN(partes[0]) && !isNaN(partes[1])) {
                const punto = {
                    longitud: partes[0],
                    latitud:  partes[1],
                    nombre:   nombre ? nombre.textContent.trim() : ""
                };
                marcadores.push(punto);

                // El primero sirve como centro del mapa
                if (marcadores.length === 1) {
                    coordOrigen = punto;
                }
            }
        }
    });

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

    this._inicializarMapa(coordOrigen, coordenadasLinea, marcadores);
}

_procesarKML(contenidoKML) {
    const xmlDoc = new DOMParser().parseFromString(contenidoKML, "text/xml");

    let coordOrigen = this.coordInicio;
    const marcadores = [];

    xmlDoc.querySelectorAll("Placemark").forEach((pm) => {
        const pointCoords = pm.querySelector("Point coordinates");
        const nombre = pm.querySelector("name");

        if (pointCoords) {
            const partes = pointCoords.textContent.trim().split(",").map(Number);
            if (!isNaN(partes[0]) && !isNaN(partes[1])) {
                const punto = {
                    longitud: partes[0],
                    latitud:  partes[1],
                    nombre:   nombre ? nombre.textContent.trim() : ""
                };
                marcadores.push(punto);
                if (marcadores.length === 1) {
                    coordOrigen = punto;
                }
            }
        }
    });

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

    this._inicializarMapa(coordOrigen, coordenadasLinea, marcadores);
}

_inicializarMapa(coordOrigen, coordenadasLinea, marcadores) {
    if (this.mapa) {
        this.mapa.remove();
        this.mapa = null;
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoibWVndXNldyIsImEiOiJjbWlmNmNhNDMwOXhmM2tzOXcxOWR4ejk3In0.pQD9ydhii7vFLSjupm9Hmg';

    this.mapa = new mapboxgl.Map({
        container: this.contenedor,
        style:     'mapbox://styles/mapbox/streets-v12',
        center:    [coordOrigen.longitud, coordOrigen.latitud],
        zoom:      12
    });

    const marcadoresCapturados = marcadores;   // captura explícita para el closure

    this.mapa.on('load', () => {
        this.mapa.resize();

        marcadoresCapturados.forEach((m) => {
            new mapboxgl.Marker()
                .setLngLat([m.longitud, m.latitud])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(m.nombre))
                .addTo(this.mapa);
        });

        if (coordenadasLinea.length > 1) {
            this.mapa.addSource('ruta-linea', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: coordenadasLinea }
                }
            });
            this.mapa.addLayer({
                id:     'ruta-linea-capa',
                type:   'line',
                source: 'ruta-linea',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint:  { 'line-color': '#1565C0', 'line-width': 4 }
            });
        }
    });}
}

$(document).ready(() => {
    const lectorXML   = new LectorXML();
    const extractor   = new ExtractorRutas();
    const constructor = new ConstructorHTML();

    $.ajax({
        type:     "GET",
        url:      "xml/rutas.xml",
        dataType: "text",
        success: (texto) => {
            try {
                const xmlDoc = lectorXML.leerTexto(texto);
                const rutas  = extractor.extraer(xmlDoc);
                if (rutas.length === 0) {
                    $("main p").text("No se encontraron rutas en el archivo XML.");
                    return;
                }
                constructor.renderizar(rutas);
            } catch (err) {
                $("main p").text("Error al procesar el XML: " + err.message);
            }
        },
        error: (xhr) => {
            $("main p").text("Error al cargar las rutas (estado: " + xhr.status + ").");
        }
    });
});