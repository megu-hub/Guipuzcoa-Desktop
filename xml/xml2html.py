#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generar_rutas.py
================
Lee rutas.xml y genera:
  - output/R<id>_planimetria.kml   (un KML por ruta)
  - output/R<id>_altimetria.svg    (un SVG de altimetría por ruta)
  - rutas.html                     (página HTML con jQuery que carga el XML)
"""

import os
import xml.etree.ElementTree as ET


# ─────────────────────────────────────────────
# Utilidades
# ─────────────────────────────────────────────

def texto(elem, tag):
    child = elem.find(tag)
    return child.text.strip() if child is not None and child.text else ''


def coords_elem(elem):
    lon = texto(elem, 'longitud')
    lat = texto(elem, 'latitud')
    alt = texto(elem, 'altitud')
    return float(lon or 0), float(lat or 0), float(alt or 0)


# ─────────────────────────────────────────────
# Generación de KML
# ─────────────────────────────────────────────

KML_NS = 'http://www.opengis.net/kml/2.2'

def generar_kml(ruta_elem, ruta_id, nombre_ruta, output_dir):
    hitos = ruta_elem.findall('.//hito')

    kml = ET.Element('kml', xmlns=KML_NS)
    doc = ET.SubElement(kml, 'Document')
    ET.SubElement(doc, 'name').text = nombre_ruta

    style = ET.SubElement(doc, 'Style', id='rutaStyle')
    line_style = ET.SubElement(style, 'LineStyle')
    ET.SubElement(line_style, 'color').text = 'ff0000ff'
    ET.SubElement(line_style, 'width').text = '3'
    ET.SubElement(ET.SubElement(style, 'PolyStyle'), 'fill').text = '0'

    placemark_line = ET.SubElement(doc, 'Placemark')
    ET.SubElement(placemark_line, 'name').text = nombre_ruta
    ET.SubElement(placemark_line, 'styleUrl').text = '#rutaStyle'
    line_string = ET.SubElement(placemark_line, 'LineString')
    ET.SubElement(line_string, 'tessellate').text = '1'
    coordinates = ET.SubElement(line_string, 'coordinates')

    coord_list = []
    for hito in hitos:
        c = hito.find('coordenadas')
        if c is not None:
            lon, lat, alt = coords_elem(c)
            coord_list.append(f'{lon},{lat},{alt}')
    coordinates.text = ' '.join(coord_list)

    for hito in hitos:
        h_nombre = texto(hito, 'nombre')
        h_desc   = texto(hito, 'descripcion')
        c = hito.find('coordenadas')
        if c is None:
            continue
        lon, lat, alt = coords_elem(c)
        pm = ET.SubElement(doc, 'Placemark')
        ET.SubElement(pm, 'name').text = h_nombre
        ET.SubElement(pm, 'description').text = h_desc
        ET.SubElement(ET.SubElement(pm, 'Point'), 'coordinates').text = f'{lon},{lat},{alt}'

    arbol = ET.ElementTree(kml)
    ET.indent(arbol, space='  ')
    ruta_kml = os.path.join(output_dir, f'{ruta_id}_planimetria.kml')
    with open(ruta_kml, 'wb') as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        arbol.write(f, encoding='UTF-8', xml_declaration=False)
    print(f'  KML generado: {ruta_kml}')
    return ruta_kml


# ─────────────────────────────────────────────
# Generación de SVG de altimetría
# ─────────────────────────────────────────────

def generar_svg(ruta_elem, ruta_id, nombre_ruta, output_dir):
    hitos = ruta_elem.findall('.//hito')

    puntos = []
    dist_acum = 0.0

    ci = ruta_elem.find('coordenadasInicio')
    alt_inicio = float(texto(ci, 'altitud') or 0) if ci is not None else 0.0
    puntos.append((0.0, alt_inicio))

    for hito in hitos:
        d_elem = hito.find('distanciaDesdeAnterior')
        if d_elem is not None:
            d_val  = float(d_elem.text.strip() or 0)
            unidad = d_elem.get('unidades', 'km')
            if unidad == 'km':
                d_val *= 1000
            elif unidad == 'mi':
                d_val *= 1609.34
        else:
            d_val = 0.0

        dist_acum += d_val
        c   = hito.find('coordenadas')
        alt = float(texto(c, 'altitud') or 0) if c is not None else puntos[-1][1]
        puntos.append((dist_acum, alt))

    if len(puntos) < 2:
        puntos = [(0, 0), (1000, 0)]

    W, H = 800, 340
    PAD_L, PAD_R, PAD_T, PAD_B = 70, 30, 30, 60
    graf_w = W - PAD_L - PAD_R
    graf_h = H - PAD_T - PAD_B

    max_dist = max(p[0] for p in puntos)
    min_alt  = min(p[1] for p in puntos)
    max_alt  = max(p[1] for p in puntos)
    rango_alt = max_alt - min_alt if max_alt != min_alt else 1

    def sx(d): return PAD_L + (d / max_dist) * graf_w if max_dist else PAD_L
    def sy(a): return PAD_T + graf_h - ((a - min_alt) / rango_alt) * graf_h

    profile_pts = [(sx(p[0]), sy(p[1])) for p in puntos]
    closed_pts  = profile_pts + [
        (profile_pts[-1][0], PAD_T + graf_h),
        (profile_pts[0][0],  PAD_T + graf_h),
    ]
    pts_str = ' '.join(f'{x:.1f},{y:.1f}' for x, y in closed_pts)

    n_vert = n_horiz = 5

    grid_lines = []
    for i in range(n_vert + 1):
        xg = PAD_L + (i / n_vert) * graf_w
        grid_lines.append(
            f'<line x1="{xg:.1f}" y1="{PAD_T}" x2="{xg:.1f}" y2="{PAD_T+graf_h}" '
            f'stroke="#ccc" stroke-width="1" stroke-dasharray="4,3"/>'
        )
    for i in range(n_horiz + 1):
        yg = PAD_T + (i / n_horiz) * graf_h
        grid_lines.append(
            f'<line x1="{PAD_L}" y1="{yg:.1f}" x2="{PAD_L+graf_w}" y2="{yg:.1f}" '
            f'stroke="#ccc" stroke-width="1" stroke-dasharray="4,3"/>'
        )

    x_labels = []
    for i in range(n_vert + 1):
        xg      = PAD_L + (i / n_vert) * graf_w
        dist_km = (i / n_vert) * max_dist / 1000
        x_labels.append(
            f'<text x="{xg:.1f}" y="{PAD_T+graf_h+18}" text-anchor="middle" '
            f'font-size="11" fill="#555">{dist_km:.1f} km</text>'
        )

    y_labels = []
    for i in range(n_horiz + 1):
        yg      = PAD_T + (i / n_horiz) * graf_h
        alt_val = max_alt - (i / n_horiz) * rango_alt
        y_labels.append(
            f'<text x="{PAD_L-8}" y="{yg+4:.1f}" text-anchor="end" '
            f'font-size="11" fill="#555">{alt_val:.0f} m</text>'
        )

    hito_marks = [
        f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="#e74c3c" stroke="white" stroke-width="1.5"/>'
        for px, py in profile_pts
    ]

    nombre_escapado = nombre_ruta.replace('&', '&amp;').replace('<', '&lt;')

    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="#f9f9f9" rx="8"/>
  <text x="{W//2}" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="#333">
    Altimetría – {nombre_escapado}
  </text>
  {''.join(grid_lines)}
  <polygon points="{pts_str}" fill="#3498db" fill-opacity="0.25" stroke="#2980b9" stroke-width="2"/>
  {''.join(hito_marks)}
  {''.join(x_labels)}
  {''.join(y_labels)}
  <line x1="{PAD_L}" y1="{PAD_T}" x2="{PAD_L}" y2="{PAD_T+graf_h}" stroke="#333" stroke-width="2"/>
  <line x1="{PAD_L}" y1="{PAD_T+graf_h}" x2="{PAD_L+graf_w}" y2="{PAD_T+graf_h}" stroke="#333" stroke-width="2"/>
  <text x="{PAD_L + graf_w//2}" y="{H-5}" text-anchor="middle" font-size="12" fill="#555">Distancia (km)</text>
  <text x="14" y="{PAD_T + graf_h//2}" text-anchor="middle" font-size="12" fill="#555"
        transform="rotate(-90, 14, {PAD_T + graf_h//2})">Altitud (m)</text>
</svg>'''

    ruta_svg = os.path.join(output_dir, f'{ruta_id}_altimetria.svg')
    with open(ruta_svg, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f'  SVG generado: {ruta_svg}')
    return ruta_svg


# ─────────────────────────────────────────────
# Generación de rutas.html
# ─────────────────────────────────────────────

JQUERY_CDN = 'https://code.jquery.com/jquery-3.7.1.min.js'
LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

# Contenido del archivo js/rutas.js — ECMAScript estricto + jQuery.
# Se exporta como archivo separado; el HTML lo enlaza con <script src="js/rutas.js">.
JS_RUTAS = """\
'use strict';

/* ── mapas Leaflet: un registro por ruta para no inicializar dos veces ── */
var mapas = {};

/**
 * Inicializa un mapa Leaflet en el div cuyo id es mapId e inserta
 * los marcadores y la polilínea con los hitos de la ruta.
 *
 * @param {string} mapId  - id del div destino (p.ej. "map-R001")
 * @param {Array}  hitos  - [{nombre, desc, lat, lon}, …]
 */
function inicializarMapa(mapId, hitos) {
    if (mapas[mapId]) { return; }

    var mapa = L.map(mapId, { scrollWheelZoom: false });
    mapas[mapId] = mapa;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(mapa);

    var puntos = [];
    hitos.forEach(function (h) {
        var lat = parseFloat(h.lat);
        var lon = parseFloat(h.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
            puntos.push([lat, lon]);
            L.marker([lat, lon]).addTo(mapa)
             .bindPopup('<strong>' + h.nombre + '</strong><br>' + h.desc);
        }
    });

    if (puntos.length > 1) {
        L.polyline(puntos, { color: '#c0392b', weight: 3 }).addTo(mapa);
        mapa.fitBounds(puntos, { padding: [24, 24] });
    } else if (puntos.length === 1) {
        mapa.setView(puntos[0], 13);
    }
}

/**
 * Construye el HTML de la tarjeta de una ruta a partir del nodo
 * XML <ruta> recibido como objeto jQuery y devuelve un objeto con
 * el HTML generado, el id del div del mapa y los datos de los hitos.
 *
 * @param  {jQuery} $r
 * @returns {{ html: string, mapId: string, hitosData: Array }}
 */
function construirTarjeta($r) {
    var rutaId  = $r.attr('id');
    var nombre  = $r.find('> nombre').text();
    var tipo    = $r.find('> tipo').text();
    var medio   = $r.find('> medioTransporte').text();
    var dur     = $r.find('> duracion').text();
    var agencia = $r.find('> agencia').text();
    var desc    = $r.find('> descripcion').text();
    var pers    = $r.find('> personasAdecuadas').text();
    var lugar   = $r.find('> lugarInicio').text();
    var dir     = $r.find('> direccionInicio').text();
    var recom   = $r.find('> recomendacion').text();
    var svgPath = $r.find('> altimetria').text();
    var fecha   = $r.find('> fechaInicio').text();
    var hora    = $r.find('> horaInicio').text();
    var cLon    = $r.find('coordenadasInicio > longitud').text();
    var cLat    = $r.find('coordenadasInicio > latitud').text();
    var cAlt    = $r.find('coordenadasInicio > altitud').text();

    /* ── tabla de metadatos ── */
    var filas =
        '<tr><th>Tipo</th><td>'                  + tipo    + '</td></tr>' +
        '<tr><th>Medio de transporte</th><td>'   + medio   + '</td></tr>' +
        '<tr><th>Duración</th><td>'              + dur     + '</td></tr>' +
        '<tr><th>Agencia</th><td>'               + agencia + '</td></tr>' +
        (fecha ? '<tr><th>Fecha de inicio</th><td>' + fecha + '</td></tr>' : '') +
        (hora  ? '<tr><th>Hora de inicio</th><td>'  + hora  + '</td></tr>' : '') +
        '<tr><th>Lugar de inicio</th><td>'       + lugar   + '</td></tr>' +
        '<tr><th>Dirección</th><td>'             + dir     + '</td></tr>' +
        '<tr><th>Coordenadas inicio</th><td>'    +
            cLon + ', ' + cLat + ' &middot; Alt: ' + cAlt + ' m</td></tr>' +
        '<tr><th>Personas adecuadas</th><td>'    + pers    + '</td></tr>' +
        '<tr><th>Recomendación</th><td>'         + recom   + '/10</td></tr>';

    /* ── hitos ── */
    var hitosData = [];
    var hitosHtml = '<ul>';

    $r.find('hito').each(function () {
        var $h    = $(this);
        var hNom  = $h.find('> nombre').text();
        var hDesc = $h.find('> descripcion').text();
        var hLon  = $h.find('coordenadas > longitud').text();
        var hLat  = $h.find('coordenadas > latitud').text();
        var hAlt  = $h.find('coordenadas > altitud').text();
        var hDist = $h.find('distanciaDesdeAnterior').text();
        var hUnit = $h.find('distanciaDesdeAnterior').attr('unidades') || '';

        hitosData.push({ nombre: hNom, desc: hDesc, lat: hLat, lon: hLon });

        /* fotos del hito */
        var fotosHtml = '';
        $h.find('galeriaFotos foto').each(function () {
            fotosHtml +=
                '<img src="'  + $(this).text().trim() + '"' +
                ' alt="'      + ($(this).attr('alt') || '') + '"' +
                ' onerror="this.style.display=\'none\'">';
        });

        /* vídeos del hito */
        var videosHtml = '';
        $h.find('galeriaVideos video').each(function () {
            videosHtml +=
                '<video controls title="' + ($(this).attr('alt') || '') + '">' +
                '<source src="' + $(this).text().trim() + '">' +
                'Tu navegador no soporta vídeo HTML5.' +
                '</video>';
        });

        hitosHtml +=
            '<li>' +
                '<h5>' + hNom + '</h5>' +
                '<p>'  + hDesc + '</p>' +
                '<small>' +
                    'Coord: ' + hLat + ', ' + hLon +
                    ' &mdash; Alt: ' + hAlt + ' m' +
                    (hDist ? ' &mdash; Dist. anterior: ' + hDist + ' ' + hUnit : '') +
                '</small>' +
                (fotosHtml  ? '<p>' + fotosHtml  + '</p>' : '') +
                (videosHtml ? '<p>' + videosHtml + '</p>' : '') +
            '</li>';
    });
    hitosHtml += '</ul>';

    /* ── referencias ── */
    var refsHtml = '<ol>';
    $r.find('referencias referencia').each(function () {
        var url = $(this).text().trim();
        refsHtml +=
            '<li><a href="' + url + '" target="_blank" rel="noopener">' + url + '</a></li>';
    });
    refsHtml += '</ol>';

    /* ── tarjeta completa ── */
    var mapId = 'map-' + rutaId;
    var card =
        '<article>' +
            '<h3>' + nombre + ' <small>(' + tipo + ')</small></h3>' +
            '<table><tbody>' + filas + '</tbody></table>' +
            '<blockquote>' + desc + '</blockquote>' +
            '<h4>Mapa de la ruta</h4>' +
            '<div id="' + mapId + '"></div>' +
            '<h4>Perfil de altimetría</h4>' +
            '<figure>' +
                '<img src="' + svgPath + '" alt="Altimetría de ' + nombre + '">' +
            '</figure>' +
            '<h4>Hitos del recorrido</h4>' +
            hitosHtml +
            '<h4>Referencias</h4>' +
            refsHtml +
        '</article>';

    return { html: card, mapId: mapId, hitosData: hitosData };
}

/* ── punto de entrada: espera a que el DOM esté listo ── */
$(function () {
    $.ajax({
        url: 'rutas.xml',
        dataType: 'xml',
        success: function (xml) {
            $('#cargando').hide();

            $(xml).find('ruta').each(function () {
                var resultado = construirTarjeta($(this));
                $('#rutas').append(resultado.html);
                inicializarMapa(resultado.mapId, resultado.hitosData);
            });
        },
        error: function (xhr, status, err) {
            $('#cargando').hide();
            $('#error').show().text(
                'No se pudo cargar rutas.xml. ' +
                'Sirve los archivos desde un servidor local ' +
                '(ej: python -m http.server 8000). Error: ' + err
            );
        }
    });
});
"""


class Html:
    def __init__(self, titulo):
        self.html = ET.Element('html', lang='es')
        self.head = ET.SubElement(self.html, 'head')
        self.body = ET.SubElement(self.html, 'body')
        ET.SubElement(self.head, 'meta', charset='UTF-8')
        ET.SubElement(self.head, 'meta', name='keywords',
                      content='Guipuzcoa, Guipuzcoa-Desktop')
        ET.SubElement(self.head, 'meta', name='author',
                      content='Clara Fernández')
        ET.SubElement(self.head, 'meta', name='description',
                      content='Reservas para realizar en Guipuzcoa')
        ET.SubElement(self.head, 'meta', name='viewport',
                      content='width=device-width, initial-scale=1.0')
        ET.SubElement(self.head, 'title').text = titulo
        ET.SubElement(self.head, 'link', rel='icon',
                      href='multimedia/icono.ico')
        ET.SubElement(self.head, 'link', rel='stylesheet',
                      type='text/css', href='estilo/estilo.css')
        ET.SubElement(self.head, 'link', rel='stylesheet',
                      type='text/css', href='estilo/layout.css')

    def escribir(self, nombre_archivo):
        arbol = ET.ElementTree(self.html)
        ET.indent(arbol, space='\t')
        with open(nombre_archivo, 'wb') as f:
            f.write(b'<!DOCTYPE HTML>\n')
            arbol.write(f, encoding='UTF-8', xml_declaration=False)


def generar_html():
    html = Html('Guipuzcoa-Rutas')

    # ── <head>: solo los scripts externos necesarios (jQuery, Leaflet, rutas.js) ──
    # Los estilos los proveen estilo/estilo.css y estilo/layout.css del proyecto.
    for src in (JQUERY_CDN, LEAFLET_JS, 'js/rutas.js'):
        s = ET.SubElement(html.head, 'script', src=src)
        s.text = ' '   # evita auto-cierre <script/>

    # ── <header> ─────────────────────────────────────────────────────────────
    header = ET.SubElement(html.body, 'header')
    ET.SubElement(ET.SubElement(header, 'h1'),
                  'a', href='index.html', title='Inicio').text = 'Guipuzcoa Desktop'

    nav = ET.SubElement(header, 'nav')
    nav_links = [
        ('Inicio',       'index.html',        'Inicio',                         False),
        ('Gastronomía',  'gastronomia.html',  'Gastronomía de Guipuzcoa',       False),
        ('Rutas',        'rutas.html',        'Rutas de Guipuzcoa',             True),
        ('Meteorología', 'meteorologia.html', 'Información de la meteorología', False),
        ('Juego',        'juego.html',        'Juego',                          False),
        ('Reservas',     'php/reservas.php',  'Reservas en Guipuzcoa',          False),
        ('Ayuda',        'ayuda.html',        'Información de Ayuda',           False),
    ]
    for label, href, title, active in nav_links:
        attrs = {'href': href, 'title': title}
        if active:
            attrs['class'] = 'active'
        ET.SubElement(nav, 'a', **attrs).text = label

    # ── breadcrumb ───────────────────────────────────────────────────────────
    bc = ET.SubElement(html.body, 'p')
    bc.text = 'Estás en:\n\t'
    a_bc = ET.SubElement(bc, 'a', href='index.html', title='Inicio')
    a_bc.text = 'Inicio'
    a_bc.tail = ' >> '
    ET.SubElement(bc, 'strong').text = 'Rutas'

    # ── <main> ───────────────────────────────────────────────────────────────
    main = ET.SubElement(html.body, 'main')
    ET.SubElement(main, 'h2').text = 'Rutas de Guipuzcoa'

    p_cargando = ET.SubElement(main, 'p', id='cargando')
    p_cargando.text = 'Cargando rutas...'

    p_error = ET.SubElement(main, 'p', id='error')
    p_error.text = ' '

    ET.SubElement(main, 'section', id='rutas')

    path_html = 'rutas.html'
    html.escribir(path_html)
    print(f'  HTML generado: {path_html}')


def generar_js(js_dir):
    """Escribe js/rutas.js con el código ECMAScript + jQuery."""
    os.makedirs(js_dir, exist_ok=True)
    path_js = os.path.join(js_dir, 'rutas.js')
    with open(path_js, 'w', encoding='utf-8') as f:
        f.write(JS_RUTAS)
    print(f'  JS  generado: {path_js}')


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    xml_entrada = 'rutas.xml'
    output_dir  = 'output'
    js_dir      = 'js'

    os.makedirs(output_dir, exist_ok=True)

    print(f'Leyendo {xml_entrada} …')
    arbol = ET.parse(xml_entrada)
    raiz  = arbol.getroot()

    for ruta_elem in raiz.findall('ruta'):
        ruta_id     = ruta_elem.get('id', 'RXXX')
        nombre_ruta = texto(ruta_elem, 'nombre')
        print(f'\nProcesando {ruta_id}: {nombre_ruta}')
        generar_kml(ruta_elem, ruta_id, nombre_ruta, output_dir)
        generar_svg(ruta_elem, ruta_id, nombre_ruta, output_dir)

    print('\nGenerando rutas.html …')
    generar_html()

    print('\nGenerando js/rutas.js …')
    generar_js(js_dir)

    print('\n Proceso completado.')


if __name__ == '__main__':
    main()