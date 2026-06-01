#!/usr/bin/env python
# -*- coding: utf-8 -*-

import xml.etree.ElementTree as ET
import os

# ── Configuración ─────────────────────────────────────────────────────────────
XML_FILE   = "../rutas.xml"
OUTPUT_DIR = "output"


class Svg:
    """Clase para generar archivos SVG simples con polylines y texto."""

    def __init__(self, width="800", height="600"):
        """
        Crea el elemento raíz, el espacio de nombres y la versión
        """
        self.raiz = ET.Element('svg',
                               xmlns="http://www.w3.org/2000/svg",
                               version="2.0",
                               width=width,
                               height=height)

    def addPolyline(self, points, stroke, strokeWidth, fill):
        """
        Añade un elemento polyline
        """
        ET.SubElement(self.raiz, 'polyline',
                      points=points,
                      stroke=stroke,
                      **{'stroke-width': strokeWidth},
                      fill=fill)

    def addText(self, texto, x, y, fontFamily, fontSize, style):
        """
        Añade un elemento texto
        """
        text_elem = ET.SubElement(self.raiz, 'text',
                                   x=x,
                                   y=y,
                                   **{'font-family': fontFamily,
                                      'font-size': fontSize},
                                   style=style)
        text_elem.text = texto

    def addLine(self, x1, y1, x2, y2, stroke, strokeWidth):
        """
        Añade un elemento line
        """
        ET.SubElement(self.raiz, 'line',
                      x1=x1,
                      y1=y1,
                      x2=x2,
                      y2=y2,
                      stroke=stroke,
                      **{'stroke-width': strokeWidth})

    def escribir(self, nombreArchivoSVG):
        """
        Escribe el archivo SVG con declaración y codificación
        """
        arbol = ET.ElementTree(self.raiz)
        """
        Introduce indentación y saltos de línea
        para generar XML en modo texto
        """
        ET.indent(arbol)
        arbol.write(nombreArchivoSVG,
                    encoding='utf-8',
                    xml_declaration=True)


def leerRutaXML(ruta_elem):
    """
    Lee los hitos de un elemento <ruta> y devuelve lista de dicts
    con alt (altitud) y dist (distancia desde anterior en metros).
    """
    datos_puntos = []

    # Punto de inicio desde <coordenadasInicio>
    ci = ruta_elem.find('coordenadasInicio')
    if ci is not None:
        datos_puntos.append({
            'nombre': ruta_elem.findtext('lugarInicio', '').strip(),
            'alt': float(ci.findtext('altitud', '0')),
            'dist': 0.0
        })

    for hito in ruta_elem.findall('hitos/hito'):
        alt  = float(hito.findtext('coordenadas/altitud', '0'))
        dist_el = hito.find('distanciaDesdeAnterior')
        raw  = float(dist_el.text.strip()) if dist_el is not None else 0.0
        unit = dist_el.get('unidades', 'm') if dist_el is not None else 'm'
        if unit == 'km':
            raw *= 1000
        elif unit == 'mi':
            raw *= 1609.34
        datos_puntos.append({
            'nombre': hito.findtext('nombre', '').strip(),
            'alt': alt,
            'dist': raw
        })

    return datos_puntos


def generarAltimetria(datos_puntos, nombreArchivo, titulo):
    print(Svg.__doc__)

    nuevoSVG = Svg()

    ancho_svg = 800
    alto_svg  = 600
    margen    = 100

    altitudes = [p['alt'] for p in datos_puntos]
    min_alt   = min(altitudes)
    max_alt   = max(altitudes)
    rango_alt = max_alt - min_alt if max_alt != min_alt else 1

    padding_alt = rango_alt * 0.10
    alt_lo = min_alt - padding_alt
    alt_hi = max_alt + padding_alt
    rango_ext = alt_hi - alt_lo

    distancias_acum = [0.0]
    for i in range(len(datos_puntos) - 1):
        distancias_acum.append(distancias_acum[-1] + datos_puntos[i + 1]['dist'])

    distancia_total = distancias_acum[-1] if distancias_acum[-1] > 0 else 1

    ancho_grafico = ancho_svg - 2 * margen
    alto_grafico  = alto_svg  - 2 * margen

    points = []
    coords_px = []  
    for i, punto in enumerate(datos_puntos):
        x = margen + (distancias_acum[i] / distancia_total * ancho_grafico)
        y = margen + (alto_grafico - ((punto['alt'] - alt_lo) / rango_ext * alto_grafico))
        points.append(f"{x:.1f},{y:.1f}")
        coords_px.append((x, y, punto['alt'], punto['nombre']))

    y_base  = margen + (alto_grafico - ((alt_lo - alt_lo) / rango_ext * alto_grafico))
    x_last  = margen + ancho_grafico
    x_first = float(margen)
    points_cerrados = points + [f"{x_last:.1f},{y_base:.1f}", f"{x_first:.1f},{y_base:.1f}"]
    points_str = " ".join(points_cerrados)

    nuevoSVG.addLine(str(margen), str(margen), str(margen), str(alto_svg - margen), 'black', '2')
    nuevoSVG.addLine(str(margen), str(alto_svg - margen), str(ancho_svg - margen), str(alto_svg - margen), 'black', '2')

    nuevoSVG.addText(f"{max_alt:.0f}m", str(margen - 60), str(margen + 5),
                     'Arial', '14', 'fill:black')
    nuevoSVG.addText(f"{min_alt:.0f}m", str(margen - 60), str(alto_svg - margen + 5),
                     'Arial', '14', 'fill:black')

    usa_km = distancia_total >= 2000
    dist_label = f"{distancia_total/1000:.1f}km" if usa_km else f"{distancia_total:.0f}m"
    nuevoSVG.addText(f"Distancia (Total: {dist_label})", str(ancho_svg / 2 - 80),
                     str(alto_svg - margen + 40), 'Arial', '16', 'fill:black')

    nuevoSVG.addText(titulo, str(ancho_svg / 2 - 150), str(margen - 20),
                     'Arial', '14', 'fill:black;font-weight:bold')

    nuevoSVG.addPolyline(points_str, 'blue', '4', 'none')

    umbral = max_alt - 5
    for (x, y, alt, nombre) in coords_px:
        if alt >= umbral:
            nuevoSVG.addLine(f"{x:.1f}", f"{y:.1f}", f"{x:.1f}", f"{y - 18:.1f}",
                             'black', '1')
            nuevoSVG.addText(f"{alt:.0f}m", f"{x - 18:.1f}", f"{y - 22:.1f}",
                             'Arial', '12', 'fill:black;font-weight:bold')

    nuevoSVG.escribir(nombreArchivo)
    print("Creado el archivo: ", nombreArchivo)


def main():
    print(f"Leyendo {XML_FILE}…")
    arbol = ET.parse(XML_FILE)
    raiz  = arbol.getroot()

    rutas = raiz.findall('ruta')
    print(f"  {len(rutas)} rutas encontradas.\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for ruta in rutas:
        ruta_id = ruta.get('id')
        titulo  = ruta.findtext('nombre', '').strip()
        datos   = leerRutaXML(ruta)

        if not datos:
            print(f"  [SKIP] {ruta_id}: sin coordenadas")
            continue

        salida = os.path.join(OUTPUT_DIR, f"{ruta_id}_altimetria.svg")
        generarAltimetria(datos, salida, titulo)


if __name__ == '__main__':
    main()