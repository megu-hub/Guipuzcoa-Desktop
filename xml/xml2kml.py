#!/usr/bin/env python
# -*- coding: utf-8 -*-

import xml.etree.ElementTree as ET
import os


class Kml:

    def __init__(self):
        """Crea el elemento raíz y el espacio de nombres."""
        self.raiz = ET.Element('kml', xmlns="http://www.opengis.net/kml/2.2")
        self.doc = ET.SubElement(self.raiz, 'Document')

    def addPlacemark(self, nombre, descripcion, long, lat, alt, modoAltitud):
        """Añade un <Placemark> con un punto <Point>."""
        pm = ET.SubElement(self.doc, 'Placemark')
        ET.SubElement(pm, 'name').text = nombre
        ET.SubElement(pm, 'description').text = descripcion
        punto = ET.SubElement(pm, 'Point')
        ET.SubElement(punto, 'coordinates').text = '{},{},{}'.format(long, lat, alt)
        ET.SubElement(punto, 'altitudeMode').text = modoAltitud

    def addLineString(self, nombre, extrude, tesela, listaCoordenadas, modoAltitud, color, ancho):
        """Añade un <Placemark> con un recorrido <LineString>."""
        pm = ET.SubElement(self.doc, 'Placemark')
        ET.SubElement(pm, 'name').text = nombre

        estilo = ET.SubElement(pm, 'Style')
        linea = ET.SubElement(estilo, 'LineStyle')
        ET.SubElement(linea, 'color').text = color
        ET.SubElement(linea, 'width').text = str(ancho)

        ls = ET.SubElement(pm, 'LineString')
        ET.SubElement(ls, 'extrude').text = extrude
        ET.SubElement(ls, 'tessellation').text = tesela
        ET.SubElement(ls, 'altitudeMode').text = modoAltitud

        coords_text = "\n".join(
            f"{lon},{lat},{alt}" for lon, lat, alt in listaCoordenadas
        )
        ET.SubElement(ls, 'coordinates').text = coords_text

    def escribir(self, nombreArchivo):
        """Escribe el archivo KML con declaración XML y codificación UTF-8."""
        arbol = ET.ElementTree(self.raiz)
        ET.indent(arbol)
        arbol.write(nombreArchivo, encoding='UTF-8', xml_declaration=True)
        print(f"Archivo '{nombreArchivo}' generado correctamente")


def leerRutasXML(nombreArchivo):
    """
    Lee el archivo XML de rutas y devuelve una lista de diccionarios con:
      - id, nombre, descripcion
      - hitos: lista de (nombre, descripcion, longitud, latitud, altitud)
      - puntos: lista de (longitud, latitud, altitud)
    """
    try:
        arbol = ET.parse(nombreArchivo)
        raiz = arbol.getroot()
    except Exception as e:
        print(f"Error al parsear '{nombreArchivo}': {e}")
        return []

    rutas = []

    for ruta in raiz.findall('ruta'):
        ruta_id   = ruta.get('id', 'SIN_ID')
        nombre    = ruta.findtext('nombre', default='Sin nombre')
        descripcion = ruta.findtext('descripcion', default='')

        hitos = []
        for hito in ruta.findall('.//hito'):
            h_nombre = hito.findtext('nombre', default='Hito sin nombre')
            h_desc   = hito.findtext('descripcion', default='')
            coords   = hito.find('coordenadas')
            if coords is not None:
                lon = coords.findtext('longitud', default='0')
                lat = coords.findtext('latitud',  default='0')
                alt = coords.findtext('altitud',  default='0')
                hitos.append((h_nombre, h_desc, lon, lat, alt))

        puntos = []
        for punto in ruta.findall('.//puntosRuta/punto'):
            lon = punto.get('longitud', '0')
            lat = punto.get('latitud',  '0')
            alt = punto.get('altitud',  '0')
            puntos.append((lon, lat, alt))

        rutas.append({
            'id':          ruta_id,
            'nombre':      nombre,
            'descripcion': descripcion,
            'hitos':       hitos,
            'puntos':      puntos,
        })

    return rutas


def generarKmlPorRuta(ruta, carpetaSalida='.'):
    """Genera un archivo KML individual para una ruta dada."""
    kml = Kml()

    # Nombre del documento interno
    ET.SubElement(kml.doc, 'name').text = ruta['nombre']
    ET.SubElement(kml.doc, 'description').text = ruta['descripcion']

    # Hitos como Placemarks (puntos)
    for h_nombre, h_desc, lon, lat, alt in ruta['hitos']:
        kml.addPlacemark(
            nombre       = h_nombre,
            descripcion  = h_desc,
            long         = lon,
            lat          = lat,
            alt          = alt,
            modoAltitud  = 'relativeToGround'
        )

    # Recorrido como LineString
    if ruta['puntos']:
        kml.addLineString(
            nombre           = f"Recorrido — {ruta['nombre']}",
            extrude          = '1',
            tesela           = '1',
            listaCoordenadas = ruta['puntos'],
            modoAltitud      = 'relativeToGround',
            color            = 'ff0000ff',  
            ancho            = 4
        )

    nombre_archivo = os.path.join(carpetaSalida, f"{ruta['id']}_planimetria.kml")
    kml.escribir(nombre_archivo)


def main():
    archivo_entrada = 'rutas.xml'      # XML de rutas
    carpeta_salida  = '.'              # Directorio de salida para los KML

    rutas = leerRutasXML(archivo_entrada)

    if not rutas:
        print(f"No se encontraron rutas en '{archivo_entrada}'.")
        return

    print(f"Se encontraron {len(rutas)} ruta(s).")

    for ruta in rutas:
        print(f"\n  [{ruta['id']}] {ruta['nombre']}")
        print(f"    Hitos:  {len(ruta['hitos'])}")
        print(f"    Puntos: {len(ruta['puntos'])}")
        generarKmlPorRuta(ruta, carpeta_salida)

    print("\nProceso completado.")


if __name__ == '__main__':
    main()