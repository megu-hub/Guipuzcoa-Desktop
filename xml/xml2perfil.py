#!/usr/bin/env python
# -*- coding: utf-8 -*-

import xml.etree.ElementTree as ET
import os


# ──────────────────────────────────────────────
# Capa de presentación: SVG
# ──────────────────────────────────────────────

class Svg:
    """Genera y escribe un fichero SVG."""

    def __init__(self, width: int = 800, height: int = 900):
        self._width  = width
        self._height = height
        self._raiz   = ET.Element(
            'svg',
            xmlns="http://www.w3.org/2000/svg",
            version="2.0",
            width=str(width),
            height=str(height),
            viewBox=f"0 0 {width} {height}",
        )

    # ── primitivas ───────────────────────────

    def add_polyline(self, points: str, stroke: str,
                     stroke_width: str, fill: str) -> None:
        ET.SubElement(
            self._raiz, 'polyline',
            points=points,
            stroke=stroke,
            **{'stroke-width': stroke_width},
            fill=fill,
        )

    def add_text(self, texto: str, x: float, y: float,
                 font_family: str, font_size: str, style: str) -> None:
        elem = ET.SubElement(
            self._raiz, 'text',
            x=str(x), y=str(y),
            **{'font-family': font_family, 'font-size': font_size},
            style=style,
        )
        elem.text = texto

    def add_line(self, x1: float, y1: float,
                 x2: float, y2: float,
                 stroke: str, stroke_width: str) -> ET.Element:
        return ET.SubElement(
            self._raiz, 'line',
            x1=str(x1), y1=str(y1),
            x2=str(x2), y2=str(y2),
            stroke=stroke,
            **{'stroke-width': stroke_width},
        )

    def add_raw_element(self, elem: ET.Element) -> None:
        self._raiz.append(elem)

    def last_element(self) -> ET.Element:
        return list(self._raiz)[-1]

    def escribir(self, ruta: str) -> None:
        arbol = ET.ElementTree(self._raiz)
        ET.indent(arbol)
        arbol.write(ruta, encoding='utf-8', xml_declaration=True)
        print(f"  Creado: {ruta}")


# ──────────────────────────────────────────────
# Modelo de dominio
# ──────────────────────────────────────────────

class PuntoRuta:
    """Un punto de la ruta: nombre, altitud y distancia desde el punto anterior."""

    def __init__(self, nombre: str, altitud: float, distancia_desde_anterior: float = 0.0):
        self.nombre    = nombre
        self.altitud   = altitud
        self.distancia = distancia_desde_anterior   # siempre en metros

    def __repr__(self) -> str:
        return (f"PuntoRuta(nombre={self.nombre!r}, "
                f"alt={self.altitud:.0f}m, dist={self.distancia:.0f}m)")


class Ruta:
    """Modelo de una ruta de senderismo leída desde XML."""

    def __init__(self, ruta_id: str, titulo: str,
                 puntos: list[PuntoRuta]):
        self.id     = ruta_id
        self.titulo = titulo
        self.puntos = puntos

    @property
    def nombres_hitos(self) -> list[str]:
        """Devuelve los nombres de todos los puntos intermedios (hitos)."""
        return [p.nombre for p in self.puntos[1:] if p.nombre]

    def __repr__(self) -> str:
        return f"Ruta(id={self.id!r}, titulo={self.titulo!r}, puntos={len(self.puntos)})"


# ──────────────────────────────────────────────
# Lector XML
# ──────────────────────────────────────────────

class LectorRutasXML:
    """Parsea un fichero XML y devuelve una lista de objetos Ruta."""

    import re

class LectorRutasXML:

    _FACTORES_DISTANCIA = {'km': 1000.0, 'mi': 1609.34, 'm': 1.0}

    def __init__(self, ruta_fichero: str):
        self._ruta_fichero = ruta_fichero

    @staticmethod
    def _quitar_namespace(arbol: ET.ElementTree) -> None:
        """Elimina el namespace de todos los tags del árbol en memoria."""
        for elem in arbol.iter():
            if '}' in elem.tag:
                elem.tag = elem.tag.split('}', 1)[1]

    def leer(self) -> list[Ruta]:
        print(f"Leyendo '{self._ruta_fichero}'…")
        try:
            arbol = ET.parse(self._ruta_fichero)
        except ET.ParseError as e:
            raise ValueError(f"Error al parsear el XML: {e}") from e

        self._quitar_namespace(arbol)  

        raiz  = arbol.getroot()
        rutas = raiz.findall('ruta')
        print(f"  {len(rutas)} ruta(s) encontrada(s).\n")
        return [self._parsear_ruta(r) for r in rutas]

    def _parsear_ruta(self, elem: ET.Element) -> Ruta:
        ruta_id = elem.get('id', 'SIN_ID')
        titulo  = elem.findtext('nombre', '').strip()
        puntos  = self._parsear_puntos(elem)
        return Ruta(ruta_id, titulo, puntos)

    def _parsear_puntos(self, ruta_elem: ET.Element) -> list[PuntoRuta]:
        puntos: list[PuntoRuta] = []

        ci = ruta_elem.find('coordenadasInicio')
        if ci is not None:
            puntos.append(PuntoRuta(
                nombre=ruta_elem.findtext('lugarInicio', '').strip(),
                altitud=float(ci.findtext('altitud', '0')),
                distancia_desde_anterior=0.0,
            ))

        for hito in ruta_elem.findall('hitos/hito'):
            altitud  = float(hito.findtext('coordenadas/altitud', '0').strip())
            distancia = self._leer_distancia(hito)
            puntos.append(PuntoRuta(
                nombre=hito.findtext('nombre', '').strip(),
                altitud=altitud,
                distancia_desde_anterior=distancia,
            ))

        return puntos

    def _leer_distancia(self, hito: ET.Element) -> float:
        dist_el = hito.find('distanciaDesdeAnterior')
        if dist_el is None or dist_el.text is None:
            return 0.0
        valor  = float(dist_el.text.strip())
        unidad = dist_el.get('unidades', 'm')
        factor = self._FACTORES_DISTANCIA.get(unidad, 1.0)
        return valor * factor


# ──────────────────────────────────────────────
# Generador de altimetría
# ──────────────────────────────────────────────

class GeneradorAltimetria:
    """
    Transforma una Ruta en un gráfico de altimetría SVG.

    Parámetros de layout configurables en el constructor.
    """

    def __init__(self, ancho: int = 800, alto: int = 500, margen: int = 100):
        self._ancho  = ancho
        self._alto   = alto
        self._margen = margen

    # ── API pública ──────────────────────────

    def generar(self, ruta: Ruta, ruta_salida: str) -> None:
        """Genera el SVG de altimetría para una ruta y lo escribe en disco."""
        svg          = Svg(self._ancho, self._alto)
        eje_alt      = self._calcular_eje_altitudes(ruta.puntos)
        dist_acum    = self._calcular_distancias_acumuladas(ruta.puntos)
        coords_px    = self._proyectar_puntos(ruta.puntos, dist_acum, eje_alt)

        self._dibujar_ejes(svg)
        self._dibujar_etiquetas_altitud(svg, eje_alt)
        self._dibujar_etiqueta_distancia(svg, dist_acum[-1])
        self._dibujar_titulo(svg, ruta.titulo)
        self._dibujar_perfil(svg, coords_px)
        self._dibujar_cimas(svg, coords_px, eje_alt.max_original)
        self._dibujar_hitos(svg, ruta.nombres_hitos)

        svg.escribir(ruta_salida)

    # ── cálculos ─────────────────────────────

    class _EjeAltitudes:
        """Encapsula los límites del eje Y."""
        def __init__(self, min_orig: float, max_orig: float):
            self.min_original = min_orig
            self.max_original = max_orig
            rango    = max_orig - min_orig if max_orig != min_orig else 1.0
            padding  = rango * 0.10
            self.lo  = min_orig - padding
            self.hi  = max_orig + padding
            self.rango_ext = (self.hi - self.lo) if (self.hi - self.lo) > 0 else 1.0

    def _calcular_eje_altitudes(self, puntos: list[PuntoRuta]) -> '_EjeAltitudes':
        altitudes = [p.altitud for p in puntos]
        return self._EjeAltitudes(min(altitudes), max(altitudes))

    @staticmethod
    def _calcular_distancias_acumuladas(puntos: list[PuntoRuta]) -> list[float]:
        acum = [0.0]
        for p in puntos[1:]:
            acum.append(acum[-1] + p.distancia)
        return acum

    def _proyectar_puntos(self, puntos: list[PuntoRuta],
                          dist_acum: list[float],
                          eje: '_EjeAltitudes') -> list[tuple]:
        """Devuelve lista de (px_x, px_y, altitud, nombre)."""
        ancho_g = self._ancho - 2 * self._margen
        alto_g  = self._alto  - 2 * self._margen
        dist_total = dist_acum[-1] if dist_acum[-1] > 0 else 1.0

        resultado = []
        for i, punto in enumerate(puntos):
            x = self._margen + (dist_acum[i] / dist_total * ancho_g)
            y = self._margen + (alto_g - ((punto.altitud - eje.lo) / eje.rango_ext * alto_g))
            resultado.append((x, y, punto.altitud, punto.nombre))
        return resultado

    # ── dibujado ─────────────────────────────

    def _dibujar_ejes(self, svg: Svg) -> None:
        m = self._margen
        svg.add_line(m, m,                          m,                self._alto - m, 'black', '2')
        svg.add_line(m, self._alto - m, self._ancho - m, self._alto - m, 'black', '2')

    def _dibujar_etiquetas_altitud(self, svg: Svg, eje: '_EjeAltitudes') -> None:
        m = self._margen
        svg.add_text(f"{eje.max_original:.0f}m",
                     m - 60, m + 5, 'Arial', '14', 'fill:black')
        svg.add_text(f"{eje.min_original:.0f}m",
                     m - 60, self._alto - m + 5, 'Arial', '14', 'fill:black')

    def _dibujar_etiqueta_distancia(self, svg: Svg, dist_total: float) -> None:
        usa_km = dist_total >= 2000
        label  = (f"{dist_total / 1000:.1f} km" if usa_km
                  else f"{dist_total:.0f} m")
        svg.add_text(f"Distancia total: {label}",
                     self._ancho / 2 - 80, self._alto - self._margen + 40,
                     'Arial', '16', 'fill:black')

    def _dibujar_titulo(self, svg: Svg, titulo: str) -> None:
        svg.add_text(titulo,
                     self._ancho / 2 - 150, self._margen - 20,
                     'Arial', '14', 'fill:black;font-weight:bold')

    def _dibujar_perfil(self, svg: Svg, coords_px: list[tuple]) -> None:
        m      = self._margen
        points = [f"{x:.1f},{y:.1f}" for x, y, *_ in coords_px]
        x_last, x_first = float(m + self._ancho - 2 * m), float(m)
        y_base = float(m + self._alto - 2 * m)
        points += [f"{x_last:.1f},{y_base:.1f}", f"{x_first:.1f},{y_base:.1f}"]
        svg.add_polyline(" ".join(points), 'blue', '4', 'lightblue')

    def _dibujar_cimas(self, svg: Svg, coords_px: list[tuple],
                       max_alt: float) -> None:
        umbral = max_alt - 5
        for x, y, alt, _ in coords_px:
            if alt >= umbral:
                svg.add_line(x, y, x, y - 18, 'black', '1')
                svg.add_text(f"{alt:.0f}m",
                             x - 18, y - 22,
                             'Arial', '12', 'fill:black;font-weight:bold')

    def _dibujar_hitos(self, svg: Svg, nombres: list[str]) -> None:
        if not nombres:
            return
        n             = len(nombres)
        alto_g        = self._alto - 2 * self._margen
        ancho_g       = self._ancho - 2 * self._margen
        margen_sup    = int(alto_g * 0.20)
        font_size     = int(self._ancho * 0.012)

        for i, nombre in enumerate(nombres):
            x = self._margen + (ancho_g / (n + 1)) * (i + 1)
            y_top    = self._margen - margen_sup
            y_bottom = self._margen + alto_g

            linea = svg.add_line(x, y_top, x, y_bottom, '#9e9e9e', '1')
            linea.set('stroke-dasharray', '4 3')

            text_elem = ET.Element(
                'text',
                x=f"{x:.1f}",
                y=str(y_top + 4),
                **{
                    'font-family': 'Arial',
                    'font-size':   str(font_size),
                    'fill':        '#1a237e',
                    'text-anchor': 'end',
                    'transform':   f"rotate(-90,{x:.1f},{y_top + 4})",
                },
            )
            text_elem.text = nombre
            svg.add_raw_element(text_elem)


# ──────────────────────────────────────────────
# Orquestador de la aplicación
# ──────────────────────────────────────────────

class AplicacionAltimetria:
    """
    Orquesta la lectura de rutas y la generación de SVGs.

    Uso:
        app = AplicacionAltimetria('rutas.xml', directorio_salida='.')
        app.ejecutar()
    """

    def __init__(self, fichero_xml: str = 'rutas.xml',
                 directorio_salida: str = '.'):
        self._fichero_xml        = fichero_xml
        self._directorio_salida  = directorio_salida
        self._lector             = LectorRutasXML(fichero_xml)
        self._generador          = GeneradorAltimetria()

    def ejecutar(self) -> None:
        os.makedirs(self._directorio_salida, exist_ok=True)

        try:
            rutas = self._lector.leer()
        except ValueError as e:
            print(e)
            return

        for ruta in rutas:
            self._procesar_ruta(ruta)

        print("\nProceso completado.")

    def _procesar_ruta(self, ruta: Ruta) -> None:
        if not ruta.puntos:
            print(f"  [SKIP] {ruta.id}: sin coordenadas de altitud")
            return

        print(f"  [{ruta.id}] {ruta.titulo}")
        print(f"    Puntos leídos: {len(ruta.puntos)}")

        salida = os.path.join(self._directorio_salida,
                              f"{ruta.id}_altimetria.svg")
        self._generador.generar(ruta, salida)


# ──────────────────────────────────────────────
# Punto de entrada
# ──────────────────────────────────────────────

def main() -> None:
    AplicacionAltimetria(
        fichero_xml='rutas.xml',
        directorio_salida='.',
    ).ejecutar()


if __name__ == '__main__':
    main()