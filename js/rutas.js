// clase base del año pasado, para cambiar entera

class CargadorSVG {
    constructor() {
        this.contenidoSVG = null;
    }
    leerArchivoSVG(event) {
        const archivo = event.target.files[0];
        
        if (!archivo) {
            alert("No se ha seleccionado ningún archivo SVG");
            return;
        }

        if (!archivo.name.endsWith('.svg')) {
            alert("Por favor, selecciona un archivo SVG válido");
            return;
        }

        const lector = new FileReader();

        lector.onload = (e) => {
            this.contenidoSVG = e.target.result;
            this.insertarSVG();
        };

        lector.onerror = () => {
            alert("Error al leer el archivo SVG");
        };

        lector.readAsText(archivo);
    }

    insertarSVG() {
        if (!this.contenidoSVG) {
            alert("No hay contenido SVG para insertar");
            return;
        }

        const seccionSVG = document.createElement("section");

        const titulo = document.createElement("h3");
        titulo.textContent = "Perfil de Altimetría del Circuito";
        seccionSVG.appendChild(titulo);

        const parser = new DOMParser();
        const docSVG = parser.parseFromString(this.contenidoSVG, "image/svg+xml");
        const elementoSVG = docSVG.documentElement;

        const errorNode = elementoSVG.querySelector("parsererror");
        if (errorNode) {
            alert("Error al procesar el archivo SVG");
            return;
        }

        seccionSVG.appendChild(elementoSVG);

        const main = document.querySelector("main");
        
        const secciones = main.querySelectorAll("section");
        let seccionExistente = null;
        
        secciones.forEach(seccion => {
            const h3 = seccion.querySelector("h3");
            if (h3 && h3.textContent === "Perfil de Altimetría del Circuito") {
                seccionExistente = seccion;
            }
        });
        
        if (seccionExistente) {
            main.replaceChild(seccionSVG, seccionExistente);
        } else {
            main.appendChild(seccionSVG);
        }
    }
}


class CargadorKML {
    constructor() {
        this.coordenadasOrigen = null;
        this.coordenadasCircuito = [];
        this.mapa = null;
    }

   leerArchivoKML(archivo) {
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (evento) => {
        this.procesarKML(evento.target.result);
    };
    lector.onerror = () => alert("Error al leer el archivo KML");
    lector.readAsText(archivo);
}


    procesarKML(contenidoKML) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contenidoKML, "text/xml");
        
        const puntoOrigen = xmlDoc.querySelector("Placemark Point coordinates");
if (puntoOrigen) {
    const coordsTexto = puntoOrigen.textContent.trim();
    const [lng, lat] = coordsTexto.split(',').map(Number);
    if (!isNaN(lng) && !isNaN(lat)) {
        this.coordenadasOrigen = { lng, lat };
    } else {
        this.coordenadasOrigen = null;
    }
}
        
        const lineaCircuito = xmlDoc.querySelector("Placemark LineString coordinates");
        if (lineaCircuito) {
            const coordsTexto = lineaCircuito.textContent.trim();
            const lineas = coordsTexto.split('\n');
            
            this.coordenadasCircuito = lineas
                .filter(linea => linea.trim() !== '')
                .map(linea => {
                    const coords = linea.trim().split(',');
                    return [parseFloat(coords[0]), parseFloat(coords[1])];
                });
        }
        
        this.inicializarMapa();
    }

    inicializarMapa() {
        if (!this.coordenadasOrigen) {
            alert("No se pudo obtener el punto de origen del circuito");
            return;
        }

        mapboxgl.accessToken = 'pk.eyJ1IjoibWVndXNldyIsImEiOiJjbWlmNmNhNDMwOXhmM2tzOXcxOWR4ejk3In0.pQD9ydhii7vFLSjupm9Hmg';
        
        this.mapa = new mapboxgl.Map({
            container: document.querySelector('body > div'),
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [this.coordenadasOrigen.lng, this.coordenadasOrigen.lat],
            zoom: 14
        });

        this.mapa.on('load', () => {
            this.insertarCapaKML();
        });
    }

    insertarCapaKML() {
        const marcador = document.createElement('section');
        marcador.className = 'marcador';
        
        new mapboxgl.Marker(marcador)
            .setLngLat([this.coordenadasOrigen.lng, this.coordenadasOrigen.lat])
            .addTo(this.mapa);

        this.mapa.addSource('circuito', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: this.coordenadasCircuito
                }
            }
        });

        this.mapa.addLayer({
            id: 'circuito-linea',
            type: 'line',
            source: 'circuito',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ff0000',
                'line-width': 5
            }
        });

        
    }
}