"use strict";

class Meteorologia {
    #nombre;
    #latitud;
    #longitud;

    constructor(nombre, latitud, longitud) {
        this.#nombre = nombre;
        this.#latitud = latitud;
        this.#longitud = longitud;
    }

    getNombre() {
        return `Ciudad: ${this.#nombre}`;
    }

    getMeteorologia() {
        const ahora = new Date();
        const fecha = ahora.toISOString().slice(0, 10);
        const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:00`;

        $.getJSON("https://archive-api.open-meteo.com/v1/archive", {
            latitude: this.#latitud,
            longitude: this.#longitud,
            start_date: fecha,
            end_date: fecha,
            hourly: "temperature_2m,apparent_temperature,precipitation,relative_humidity_2m,windspeed_10m,winddirection_10m",
            daily: "sunrise,sunset",
            timezone: "Europe/Madrid"
        }).done(data => {
            const index = data?.hourly?.time?.indexOf(`${fecha}T${horaActual}`) ?? -1;
            this.meteorologia = index === -1 ? null : {
                hora: horaActual,
                temperatura: data.hourly.temperature_2m[index],
                sensacion: data.hourly.apparent_temperature[index],
                lluvia: data.hourly.precipitation[index],
                humedad: data.hourly.relative_humidity_2m[index],
                vientoVelocidad: data.hourly.windspeed_10m[index],
                vientoDireccion: data.hourly.winddirection_10m[index],
                salidaSol: data.daily.sunrise[0].slice(-5),
                puestaSol: data.daily.sunset[0].slice(-5)
            };
            this.mostrarMeteorologia();
        }).fail(() => {
            this.meteorologia = null;
            this.mostrarMeteorologia();
        });
    }

    mostrarMeteorologia() {
        const $main = $("main");
        if (!this.meteorologia) {
            $main.append("<p>No hay datos meteorológicos disponibles.</p>");
            return;
        }
        const m = this.meteorologia;
        $main.append(`
            <article>
                <h3>Meteorología actual en ${this.#nombre}</h3>
                <ul>
                    <li>Hora: ${m.hora}</li>
                    <li>Temperatura: ${m.temperatura} °C</li>
                    <li>Sensación térmica: ${m.sensacion} °C</li>
                    <li>Lluvia: ${m.lluvia} mm</li>
                    <li>Humedad: ${m.humedad} %</li>
                    <li>Viento: ${m.vientoVelocidad} km/h a ${m.vientoDireccion}°</li>
                    <li>Salida del sol: ${m.salidaSol}</li>
                    <li>Puesta del sol: ${m.puestaSol}</li>
                </ul>
            </article>
        `);
    }

    getPrevisiones() {
        const ahora = new Date();
        const hoy = ahora.toISOString().slice(0, 10);

        const fin = new Date(ahora);
        fin.setDate(fin.getDate() + 6);
        const fechaFin = fin.toISOString().slice(0, 10);

        $.getJSON("https://api.open-meteo.com/v1/forecast", {
            latitude: this.#latitud,
            longitude: this.#longitud,
            daily: "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant,sunrise,sunset",
            start_date: hoy,
            end_date: fechaFin,
            timezone: "Europe/Madrid"
        }).done(data => {
            this.previsiones = data?.daily?.time?.map((fecha, i) => ({
                fecha,
                tempMax: data.daily.temperature_2m_max[i],
                tempMin: data.daily.temperature_2m_min[i],
                sensacionMax: data.daily.apparent_temperature_max[i],
                sensacionMin: data.daily.apparent_temperature_min[i],
                lluvia: data.daily.precipitation_sum[i],
                vientoMax: data.daily.windspeed_10m_max[i],
                vientoDireccion: data.daily.winddirection_10m_dominant[i],
                salidaSol: data.daily.sunrise[i].slice(-5),
                puestaSol: data.daily.sunset[i].slice(-5)
            })) ?? null;
            this.mostrarPrevisiones();
        }).fail(() => {
            this.previsiones = null;
            this.mostrarPrevisiones();
        });
    }

    
    mostrarPrevisiones() {
        const $main = $("main");
        if (!this.previsiones || this.previsiones.length === 0) {
            $main.append("<p>No hay previsiones disponibles.</p>");
            return;
        }

        const dias = this.previsiones.map(p => `
            <li>
                <h4>${p.fecha}</h4>
                <p>
                    Temperatura entre ${p.tempMin} °C y ${p.tempMax} °C,
                    con sensación térmica de ${p.sensacionMin} °C a ${p.sensacionMax} °C.
                    Se esperan ${p.lluvia} mm de lluvia y viento de hasta ${p.vientoMax} km/h
                    con dirección ${p.vientoDireccion}°.
                    El sol saldrá a las ${p.salidaSol} y se pondrá a las ${p.puestaSol}.
                </p>
            </li>
        `).join("");

        $main.append(`
            <article>
                <h3>Previsión para los próximos 7 días en ${this.#nombre}</h3>
                <ul>
                    ${dias}
                </ul>
            </article>
        `);
    }
}