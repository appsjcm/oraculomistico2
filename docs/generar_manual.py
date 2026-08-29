# -*- coding: utf-8 -*-
"""
Genera el manual de usuario de Oraculo Mistico en PDF.

Se mantiene en el repositorio a proposito: el manual debe poder
regenerarse cuando la app cambie, sin depender de un .docx suelto.

    python docs/generar_manual.py

Tipografias: Fraunces para los titulos, la misma que la app, tomada del
woff2 que ya vive en assets/vendor/fonts. Como es una fuente variable y
reportlab no las entiende, se instancia al vuelo en los ejes que
interesan (opsz alto = corte de titulares) y se guarda como TTF en un
directorio temporal; no se duplica ningun archivo en el repositorio.
Requiere fonttools y brotli. Si faltan, o si falta el woff2, los titulos
caen a Georgia y el manual se genera igual.

El texto sigue en Calibri: Fraunces es una tipografia de titulares y a
10 puntos se lee peor.

Color: la portada usa el fondo oscuro de la app; las paginas interiores
son claras para poder leerse e imprimirse. El oro sobre claro es el
profundo (#b8832d, 4.3:1), no el brillante, que sobre crema se queda en
1.67:1 y resulta ilegible.
"""
import os
import sys
import tempfile

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, ListFlowable,
                                ListItem, NextPageTemplate, PageBreak, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

# --------------------------------------------------------------------
# Identidad visual: los mismos tokens que styles/tokens.css
# --------------------------------------------------------------------
VOID = colors.HexColor('#080713')
NIGHT = colors.HexColor('#130d25')
NEBULA = colors.HexColor('#160b2d')
GOLD = colors.HexColor('#f2cc65')        # solo sobre fondo oscuro
GOLD_DEEP = colors.HexColor('#b8832d')   # sobre fondo claro
VIOLET = colors.HexColor('#8d66ff')
IVORY = colors.HexColor('#fff7ea')
INK = colors.HexColor('#1b1626')
INK_SOFT = colors.HexColor('#4a4257')
PAPER = colors.HexColor('#fffdf8')
RULE = colors.HexColor('#e4dccb')
BOX_BG = colors.HexColor('#faf4e6')

VERSION = '1.0'
BUILD = 'fraunces-95'

# --------------------------------------------------------------------
# Tipografias
# --------------------------------------------------------------------
WOFF2 = os.path.join('assets', 'vendor', 'fonts', 'fraunces-latin.woff2')


def instanciar_fraunces(destino):
    """Saca de la fuente variable dos cortes fijos para el PDF.

    reportlab no entiende fuentes variables, asi que hay que congelar los
    ejes. Se pide opsz alto a proposito: Fraunces cambia de dibujo con el
    tamano optico y el corte de titulares es mas estrecho y contrastado,
    que es justo lo que se quiere en un titulo. Devuelve (regular, bold)
    o None si no se puede.
    """
    if not os.path.exists(WOFF2):
        return None
    try:
        from fontTools.ttLib import TTFont as TTLib
        from fontTools.varLib import instancer
    except ImportError:
        return None
    salidas = []
    for etiqueta, opsz, peso in (('Regular', 22, 500), ('Bold', 22, 650), ('Display', 96, 620)):
        try:
            f = TTLib(WOFF2)
            instancer.instantiateVariableFont(f, {'opsz': opsz, 'wght': peso}, inplace=True)
            # Instanciar no renombra: los tres cortes salian llamandose
            # igual y reportlab acababa embebiendo uno solo para los tres,
            # asi que ni la negrita ni el corte de titulares llegaban al
            # PDF. Cada uno necesita su propio nombre interno.
            nuevo = 'Fraunces-%s' % etiqueta
            for registro in f['name'].names:
                if registro.nameID in (1, 3, 4, 6):
                    valor = nuevo if registro.nameID != 3 else nuevo + '-om'
                    registro.string = valor.encode('utf-16-be') if registro.platformID == 3 else valor.encode('latin-1')
            f.flavor = None                      # de woff2 a ttf plano
            ruta = os.path.join(destino, 'fraunces-%s.ttf' % etiqueta.lower())
            f.save(ruta)
            salidas.append(ruta)
        except Exception as e:
            print('  (aviso) no se pudo instanciar Fraunces: %s' % e)
            return None
    return salidas


def registrar_fuentes():
    """Devuelve (titulo, titulo_negrita, texto, texto_negrita, texto_cursiva)."""
    win = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts')

    # --- el texto: Calibri, con Georgia y las de serie como respaldo ---
    cuerpo = [('OMTexto', 'calibri.ttf'), ('OMTextoBold', 'calibrib.ttf'),
              ('OMTextoItal', 'calibrii.ttf')]
    hay_cuerpo = True
    for nombre, fichero in cuerpo:
        ruta = os.path.join(win, fichero)
        if not os.path.exists(ruta):
            hay_cuerpo = False
            break
        try:
            pdfmetrics.registerFont(TTFont(nombre, ruta))
        except Exception:
            hay_cuerpo = False
            break
    if not hay_cuerpo:
        print('  (aviso) tipografias del sistema no disponibles: se usan las de serie')
        return 'Times-Roman', 'Times-Bold', 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique'
    pdfmetrics.registerFontFamily('OMTexto', normal='OMTexto', bold='OMTextoBold',
                                  italic='OMTextoItal', boldItalic='OMTextoBold')

    # --- los titulos: Fraunces si se puede, Georgia si no ---
    tmp = tempfile.mkdtemp(prefix='om-fuentes-')
    rutas = instanciar_fraunces(tmp)
    if rutas:
        try:
            pdfmetrics.registerFont(TTFont('OMTitulo', rutas[0]))
            pdfmetrics.registerFont(TTFont('OMTituloBold', rutas[1]))
            pdfmetrics.registerFont(TTFont('OMDisplay', rutas[2]))
            pdfmetrics.registerFontFamily('OMTitulo', normal='OMTitulo',
                                          bold='OMTituloBold', italic='OMTitulo',
                                          boldItalic='OMTituloBold')
            print('  titulos: Fraunces (la misma que la app)')
            return 'OMTitulo', 'OMTituloBold', 'OMTexto', 'OMTextoBold', 'OMTextoItal'
        except Exception as e:
            print('  (aviso) Fraunces no se pudo registrar: %s' % e)

    for nombre, fichero in (('OMTitulo', 'georgia.ttf'), ('OMTituloBold', 'georgiab.ttf')):
        ruta = os.path.join(win, fichero)
        if os.path.exists(ruta):
            pdfmetrics.registerFont(TTFont(nombre, ruta))
    pdfmetrics.registerFontFamily('OMTitulo', normal='OMTitulo', bold='OMTituloBold',
                                  italic='OMTitulo', boldItalic='OMTituloBold')
    print('  titulos: Georgia (Fraunces no disponible)')
    return 'OMTitulo', 'OMTituloBold', 'OMTexto', 'OMTextoBold', 'OMTextoItal'


TIT, TIT_B, TXT, TXT_B, TXT_I = registrar_fuentes()

# --------------------------------------------------------------------
# Estilos
# --------------------------------------------------------------------
base = getSampleStyleSheet()

S = {}
S['portada_marca'] = ParagraphStyle(
    'pm', parent=base['Normal'], fontName=TXT_B, fontSize=10.5, leading=14,
    textColor=GOLD, alignment=TA_CENTER, spaceAfter=0)
# El titulo de portada va a 40 puntos: ahi si conviene el corte de
# titulares, mas estrecho y contrastado.
DISPLAY = 'OMDisplay' if 'OMDisplay' in pdfmetrics.getRegisteredFontNames() else TIT_B
S['portada_titulo'] = ParagraphStyle(
    'pt', parent=base['Normal'], fontName=DISPLAY, fontSize=40, leading=46,
    textColor=IVORY, alignment=TA_CENTER)
S['portada_sub'] = ParagraphStyle(
    'ps', parent=base['Normal'], fontName=TIT, fontSize=15, leading=22,
    textColor=colors.HexColor('#cfc4de'), alignment=TA_CENTER)
S['portada_pie'] = ParagraphStyle(
    'pp', parent=base['Normal'], fontName=TXT, fontSize=9.5, leading=15,
    textColor=colors.HexColor('#9d92ae'), alignment=TA_CENTER)

S['h1'] = ParagraphStyle(
    'h1', parent=base['Normal'], fontName=TIT_B, fontSize=21, leading=26,
    textColor=INK, spaceBefore=0, spaceAfter=3)
S['h1num'] = ParagraphStyle(
    'h1n', parent=base['Normal'], fontName=TXT_B, fontSize=9.5, leading=12,
    textColor=GOLD_DEEP, spaceAfter=2)
S['h2'] = ParagraphStyle(
    'h2', parent=base['Normal'], fontName=TIT_B, fontSize=13, leading=17,
    textColor=INK, spaceBefore=13, spaceAfter=4,
    # un titulo solo al pie de pagina se lee como un fallo de maquetacion
    keepWithNext=1)
S['cuerpo'] = ParagraphStyle(
    'c', parent=base['Normal'], fontName=TXT, fontSize=10.2, leading=15.4,
    textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6)
S['entradilla'] = ParagraphStyle(
    'e', parent=S['cuerpo'], fontName=TXT_I, fontSize=10.8, leading=16.5,
    textColor=INK_SOFT, spaceAfter=10)
S['lista'] = ParagraphStyle(
    'l', parent=S['cuerpo'], alignment=0, spaceAfter=2, leading=14.6)
S['nota'] = ParagraphStyle(
    'n', parent=base['Normal'], fontName=TXT, fontSize=9.6, leading=14.2,
    textColor=INK, alignment=TA_JUSTIFY)
S['nota_tit'] = ParagraphStyle(
    'nt', parent=base['Normal'], fontName=TXT_B, fontSize=9.6, leading=14,
    textColor=GOLD_DEEP, spaceAfter=2)
S['indice'] = ParagraphStyle(
    'i', parent=base['Normal'], fontName=TXT, fontSize=10.6, leading=19,
    textColor=INK)
S['tabla'] = ParagraphStyle(
    't', parent=base['Normal'], fontName=TXT, fontSize=9.3, leading=12.6,
    textColor=INK)
S['tabla_b'] = ParagraphStyle(
    'tb', parent=S['tabla'], fontName=TXT_B)

ANCHO, ALTO = A4
MARGEN = 22 * mm


# --------------------------------------------------------------------
# Plantillas de pagina
# --------------------------------------------------------------------
def portada(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VOID)
    canvas.rect(0, 0, ANCHO, ALTO, stroke=0, fill=1)
    # aura violeta difusa, en circulos concentricos muy tenues
    cx, cy = ANCHO / 2, ALTO * 0.705
    for i in range(26, 0, -1):
        r = i * 5.6 * mm
        t = i / 26.0
        canvas.setFillColorRGB(0.34 * t * 0.42, 0.22 * t * 0.42, 0.62 * t * 0.42)
        canvas.circle(cx, cy, r, stroke=0, fill=1)
    # disco central
    canvas.setFillColor(NEBULA)
    canvas.circle(cx, cy, 26 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.9)
    canvas.circle(cx, cy, 26 * mm, stroke=1, fill=0)
    canvas.setStrokeColorRGB(0.95, 0.80, 0.40, 0.35)
    canvas.setLineWidth(0.4)
    canvas.circle(cx, cy, 30.5 * mm, stroke=1, fill=0)
    # filetes superior e inferior
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.8)
    canvas.line(MARGEN, ALTO - 16 * mm, ANCHO - MARGEN, ALTO - 16 * mm)
    canvas.line(MARGEN, 16 * mm, ANCHO - MARGEN, 16 * mm)
    canvas.restoreState()


def interior(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, ANCHO, ALTO, stroke=0, fill=1)
    # cabecera
    canvas.setFont(TXT, 8)
    canvas.setFillColor(colors.HexColor('#8b8296'))
    canvas.drawString(MARGEN, ALTO - 14 * mm, 'Oráculo Místico · Manual de usuario')
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGEN, ALTO - 16 * mm, ANCHO - MARGEN, ALTO - 16 * mm)
    # pie
    canvas.line(MARGEN, 15 * mm, ANCHO - MARGEN, 15 * mm)
    canvas.setFont(TXT, 8)
    canvas.setFillColor(colors.HexColor('#8b8296'))
    canvas.drawString(MARGEN, 11 * mm, 'Experiencia simbólica y de entretenimiento')
    canvas.setFillColor(GOLD_DEEP)
    canvas.setFont(TXT_B, 8.6)
    canvas.drawRightString(ANCHO - MARGEN, 11 * mm, str(canvas.getPageNumber() - 1))
    canvas.restoreState()


# --------------------------------------------------------------------
# Piezas de contenido
# --------------------------------------------------------------------
def h1(numero, titulo):
    return KeepTogether([
        Spacer(1, 2 * mm),
        Paragraph(numero, S['h1num']),
        Paragraph(titulo, S['h1']),
        Barra(),
        Spacer(1, 4 * mm),
    ])


from reportlab.platypus import Flowable


class Barra(Flowable):
    """Filete corto en oro bajo cada titulo de seccion."""
    def __init__(self, ancho=34 * mm, grosor=1.6):
        Flowable.__init__(self)
        self.ancho, self.grosor = ancho, grosor
        self.width, self.height = ancho, grosor + 2

    def draw(self):
        self.canv.setFillColor(GOLD_DEEP)
        self.canv.rect(0, 0, self.ancho, self.grosor, stroke=0, fill=1)


def p(texto):
    return Paragraph(texto, S['cuerpo'])


def entradilla(texto):
    return Paragraph(texto, S['entradilla'])


def h2(texto):
    return Paragraph(texto, S['h2'])


def vinetas(items, titulo=None):
    """Las listas cortas no se parten, y si llevan subtitulo viaja con
       ellas: una vineta suelta, o un titulo al pie de pagina sin su
       contenido, se leen como un fallo de maquetacion."""
    lista = _lista(items)
    if titulo is None:
        return KeepTogether(lista) if len(items) <= 7 else lista
    if len(items) <= 7:
        return KeepTogether([h2(titulo), lista])
    # Igual que en tabla(): un flowable, nunca una lista.
    return KeepTogether([h2(titulo), lista])


def _lista(items):
    return ListFlowable(
        [ListItem(Paragraph(x, S['lista']), leftIndent=14) for x in items],
        bulletType='bullet', start='●', bulletFontName=TXT,
        bulletFontSize=5, bulletOffsetY=-1.5, bulletDedent=10,
        leftIndent=16, bulletColor=GOLD_DEEP, spaceAfter=9, spaceBefore=1)


def aviso(titulo, texto):
    """Recuadro de apoyo, en crema con filete dorado a la izquierda."""
    t = Table(
        [[Paragraph(titulo, S['nota_tit'])], [Paragraph(texto, S['nota'])]],
        colWidths=[ANCHO - 2 * MARGEN - 6 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BOX_BG),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, 1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 0),
        ('LINEBEFORE', (0, 0), (0, -1), 2.4, GOLD_DEEP),
    ]))
    return KeepTogether([Spacer(1, 3 * mm), t, Spacer(1, 5 * mm)])


def tabla(cabeceras, filas, anchos):
    datos = [[Paragraph(c, S['tabla_b']) for c in cabeceras]]
    datos += [[Paragraph(str(c), S['tabla']) for c in f] for f in filas]
    t = Table(datos, colWidths=anchos, repeatRows=1)
    estilo = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3ecdb')),
        ('LINEBELOW', (0, 0), (-1, 0), 1.1, GOLD_DEEP),
        ('LINEBELOW', (0, 1), (-1, -2), 0.4, RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5.5),
    ]
    for i in range(1, len(datos)):
        if i % 2 == 0:
            estilo.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#fbf7ee')))
    t.setStyle(TableStyle(estilo))
    # Una tabla larga se parte entre paginas: para eso repite la cabecera.
    # Forzarla entera dejaba el titulo solo al pie con un hueco enorme.
    if len(datos) <= 8:
        return KeepTogether([Spacer(1, 1 * mm), t, Spacer(1, 6 * mm)])
    # Los margenes van en el propio objeto: devolver una lista rompe el
    # append de quien la usa, y el marco de reportlab no la entiende.
    t.spaceBefore = 1 * mm
    t.spaceAfter = 6 * mm
    return t


# --------------------------------------------------------------------
# Contenido del manual
# --------------------------------------------------------------------
def construir():
    F = []

    # ---------- PORTADA ----------
    F.append(Spacer(1, 14 * mm))
    F.append(Paragraph('&#9670;&nbsp;&nbsp;E&nbsp;X&nbsp;P&nbsp;E&nbsp;R&nbsp;I&nbsp;E&nbsp;N&nbsp;C&nbsp;I&nbsp;A&nbsp;&nbsp;&nbsp;S&nbsp;I&nbsp;M&nbsp;B&nbsp;&Oacute;&nbsp;L&nbsp;I&nbsp;C&nbsp;A&nbsp;&nbsp;&#9670;', S['portada_marca']))
    F.append(Spacer(1, 86 * mm))
    F.append(Paragraph('Oráculo Místico', S['portada_titulo']))
    F.append(Spacer(1, 5 * mm))
    F.append(Paragraph('Manual de usuario', S['portada_sub']))
    F.append(Spacer(1, 3 * mm))
    F.append(Paragraph(
        'Tarot · Runas · Luna · Sueños · Numerología · Astros · Grabovoi',
        S['portada_pie']))
    F.append(Spacer(1, 40 * mm))
    F.append(Paragraph(
        'Versión %s · compilación %s<br/>Disponible en español, catalán, inglés, '
        'francés, alemán y chino' % (VERSION, BUILD), S['portada_pie']))

    F.append(NextPageTemplate('interior'))
    F.append(PageBreak())

    # ---------- INDICE ----------
    F.append(Spacer(1, 2 * mm))
    F.append(Paragraph('Índice', S['h1']))
    F.append(Barra())
    F.append(Spacer(1, 6 * mm))
    secciones = [
        'Qué es Oráculo Místico', 'Primeros pasos', 'El Santuario',
        'Idiomas', 'La Mesa de Lectura: tarot', 'Runas', 'Luna', 'Sueños',
        'Numerología y sinastría', 'Astros', 'Grabovoi', 'Mensaje del día',
        'Chat ritual', 'Biblioteca Arcana y Mi Grimorio', 'Voz, avatar y lectura hablada',
        'Apariencia, 3D y rendimiento', 'Accesibilidad', 'Exportar y copias de seguridad',
        'La IA es opcional', 'Privacidad y datos', 'Instalar la app y uso sin conexión',
        'Si algo no funciona', 'Uso responsable',
    ]
    filas = []
    for i, s in enumerate(secciones, 1):
        filas.append(['%02d' % i, s])
    t = Table(filas, colWidths=[14 * mm, ANCHO - 2 * MARGEN - 14 * mm])
    t.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), TXT_B, 9.6),
        ('TEXTCOLOR', (0, 0), (0, -1), GOLD_DEEP),
        ('FONT', (1, 0), (1, -1), TXT, 10.6),
        ('TEXTCOLOR', (1, 0), (1, -1), INK),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4.6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.6),
        ('LEFTPADDING', (0, 0), (0, -1), 0),
        ('LINEBELOW', (0, 0), (-1, -2), 0.4, colors.HexColor('#efe8d9')),
    ]))
    F.append(t)
    F.append(PageBreak())

    # ---------- 01 ----------
    F.append(h1('SECCIÓN 01', 'Qué es Oráculo Místico'))
    F.append(entradilla(
        'Una aplicación de consulta simbólica que reúne siete oráculos en un mismo lugar '
        'y guarda lo que haces en tu propio dispositivo.'))
    F.append(p(
        'Oráculo Místico es una aplicación web que funciona en el navegador del móvil, la '
        'tableta o el ordenador, y que también puede instalarse como si fuera una app '
        'nativa. No necesita cuenta, ni registro, ni conexión permanente.'))
    F.append(p(
        'Reúne tarot, runas, lecturas lunares, interpretación de sueños, numerología, '
        'astrología simbólica y secuencias numéricas Grabovoi. Todo se abre desde una '
        'misma pantalla, El Santuario, para que la experiencia no se sienta como piezas '
        'sueltas cosidas entre sí.'))
    F.append(vinetas(titulo='Lo que puedes esperar', items=[
        'Siete oráculos con contenido propio, redactado para esta app.',
        'Veintiuna tiradas de tarot, desde una carta hasta el Árbol de la Vida.',
        'Interfaz completa en seis idiomas, incluidas las 78 cartas.',
        'Tus lecturas guardadas en el dispositivo, no en un servidor.',
        'Exportación a PDF de cualquier lectura, también sin conexión.',
        'Inteligencia artificial opcional: la app funciona entera sin ella.',
    ]))
    F.append(aviso(
        'Qué no es esta app',
        'Oráculo Místico es una herramienta simbólica y de entretenimiento. No predice el '
        'futuro, no diagnostica ni trata ninguna enfermedad, y no sustituye la atención '
        'médica, psicológica, legal ni financiera. Los textos están redactados en términos '
        'de posibilidad —“esta carta puede señalar”, “te invita a mirar”— precisamente '
        'porque una lectura es material para pensar, no una sentencia.'))

    # ---------- 02 ----------
    F.append(h1('SECCIÓN 02', 'Primeros pasos'))
    F.append(p(
        'La primera vez que abres la app aparece una pantalla de bienvenida y, tras ella, '
        'una guía breve de primeros pasos. Puedes recorrerla o cerrarla: nada de lo que '
        'ofrece es obligatorio.'))
    F.append(h2('El nombre es opcional'))
    F.append(p(
        'Si escribes tu nombre, la app y las lecturas se dirigirán a ti de forma más '
        'cercana. Si no lo escribes, todo funciona igual. El nombre se guarda únicamente '
        'en este dispositivo y puedes borrarlo cuando quieras desde Ajustes.'))
    F.append(vinetas(titulo='Una primera lectura', items=[
        'Abre <b>Tarot</b> y pulsa <b>Carta rápida</b>: es la entrada más sencilla.',
        'O usa el <b>Mensaje del día</b>, que combina carta, runa y fase lunar.',
        'Si prefieres algo guiado, entra en el <b>ritual</b>: propone una intención antes de la tirada.',
    ]))
    F.append(p(
        'Puedes volver a abrir la guía en cualquier momento desde el botón <b>Guía</b> de '
        'la barra superior.'))

    # ---------- 03 ----------
    F.append(h1('SECCIÓN 03', 'El Santuario'))
    F.append(entradilla(
        'La pantalla principal. Desde aquí se llega a todo, y muestra de un vistazo el '
        'estado de la app.'))
    F.append(p(
        'El Santuario está pensado para que la pantalla no se llene de texto: los módulos '
        'se abren en ventanas superpuestas y se cierran devolviéndote siempre al mismo '
        'sitio. Los indicadores de la parte superior muestran si la IA está conectada, '
        'cuál es tu intención activa y si la app puede instalarse.'))
    F.append(h2('Zonas del Santuario'))
    F.append(tabla(
        ['Zona', 'Para qué sirve'],
        [
            ['Los Arcanos', 'Accesos directos a las lecturas más frecuentes y a la carta del día.'],
            ['Mesa de Lectura', 'El espacio de tarot: elegir tirada, revelar cartas y leer el resultado.'],
            ['Biblioteca Arcana', 'Recorrer las 78 cartas con buscador y filtros por palo.'],
            ['Mi Grimorio', 'Tus lecturas guardadas, notas y favoritos.'],
            ['Guardián del Santuario', 'Tema visual, nota rápida y actividad reciente.'],
            ['Tu espacio', 'Perfil, búsqueda avanzada y accesos rápidos.'],
        ],
        [42 * mm, ANCHO - 2 * MARGEN - 42 * mm]))

    # ---------- 04 ----------
    F.append(h1('SECCIÓN 04', 'Idiomas'))
    F.append(p(
        'La app está disponible en <b>seis idiomas</b>: español, catalán, inglés, francés, '
        'alemán y chino simplificado. La traducción no se queda en los botones: alcanza '
        'las 78 cartas del tarot con sus significados al derecho e invertidos, las 24 '
        'runas, las fases lunares, las posiciones de cada tirada y los avisos.'))
    F.append(p(
        'Se cambia desde <b>Ajustes → Idioma de la aplicación</b>. La opción '
        '<b>Automático</b> sigue el idioma del navegador. El cambio se aplica al momento, '
        'sin recargar.'))
    F.append(aviso(
        'Lo que no cambia de idioma, y por qué',
        'Las lecturas que ya has guardado conservan el idioma en el que se hicieron: son un '
        'registro de aquel momento, no una plantilla. Los nombres de las entradas Grabovoi '
        'se mantienen en su forma original, por ser nomenclatura de origen. Y en los PDF, '
        'el chino se sustituye por inglés: las tipografías del generador de PDF no incluyen '
        'caracteres chinos y el texto saldría vacío.'))

    # ---------- 05 ----------
    F.append(h1('SECCIÓN 05', 'La Mesa de Lectura: tarot'))
    F.append(entradilla(
        'Setenta y ocho cartas, veintiuna tiradas y una ceremonia de revelación que puedes '
        'ajustar a tu ritmo.'))
    F.append(p(
        'Cada carta trae su significado al derecho y su lectura invertida, sus palabras '
        'clave, su elemento y su imagen. La probabilidad de que salgan invertidas depende '
        'de la tirada, y se indica al pie de cada lectura.'))
    F.append(h2('Las veintiuna tiradas'))
    F.append(tabla(
        ['Tirada', 'Cartas', 'Para qué'],
        [
            ['Carta rápida', '1', 'Una orientación breve.'],
            ['Sí o No orientativo', '1', 'Una respuesta simbólica, nunca categórica.'],
            ['Pasado · Presente · Futuro', '3', 'La lectura clásica de tres tiempos.'],
            ['Tirada de 5 cartas', '5', 'Situación, reto, apoyo, consejo y resultado probable.'],
            ['Tirada del amor', '5', 'Las dos energías, el vínculo, el bloqueo y el consejo.'],
            ['Estrella', '5', 'Centro y cuatro direcciones.'],
            ['5 Elementos', '5', 'Fuego, agua, aire, tierra y espíritu.'],
            ['Karma', '5', 'Origen, patrón, aprendizaje, liberación y consejo.'],
            ['Trabajo / estudios', '5', 'Situación, talento, reto, oportunidad y consejo.'],
            ['Tirada de decisión', '4', 'Dos opciones, lo que conviene mirar y un consejo final.'],
            ['Bloqueo y consejo', '4', 'Bloqueo, origen, llave y paso práctico.'],
            ['Pirámide', '6', 'Tres bases, dos puentes y una cima.'],
            ['Relación', '6', 'Tú, la otra persona, lo que une, lo que separa y el potencial.'],
            ['Semana', '7', 'Una carta por día.'],
            ['7 Chakras', '7', 'De la raíz a la corona.'],
            ['Herradura', '7', 'Pasado, presente, influencias ocultas, obstáculos y entorno.'],
            ['Relaciones kármicas', '9', 'Origen, vínculo, lección, herida, don y liberación.'],
            ['Cruz Celta', '10', 'La tirada extensa por excelencia.'],
            ['Árbol de la Vida', '10', 'Las diez sefirot, de Kéter a Maljut.'],
            ['Mes completo', '12', 'Cuatro semanas más ámbitos de vida.'],
            ['Astrológica', '12', 'Una carta por casa astrológica.'],
        ],
        [46 * mm, 15 * mm, ANCHO - 2 * MARGEN - 61 * mm]))
    F.append(vinetas(titulo='Después de la tirada', items=[
        'Escuchar la lectura en voz alta.',
        'Guardarla en Mi Grimorio.',
        'Copiarla o compartirla como texto.',
        'Exportarla a PDF, con las cartas y el resumen.',
        'Ampliarla con IA, si la has conectado.',
    ]))

    # ---------- 06 ----------
    F.append(h1('SECCIÓN 06', 'Runas'))
    F.append(p(
        'Las veinticuatro runas del futhark antiguo, con su significado al derecho y, '
        'cuando la runa lo admite, su lectura invertida. Algunas runas no tienen inversión: '
        'son simétricas, y la app lo respeta en vez de inventarle una.'))
    F.append(p(
        'La revelación se presenta como un saquito del que las piedras emergen de una en '
        'una. Puedes sacar una runa rápida o tiradas de tres y cinco, y recorrer la '
        'biblioteca completa cuando quieras consultar una en concreto.'))

    # ---------- 07 ----------
    F.append(h1('SECCIÓN 07', 'Luna'))
    F.append(p(
        'La lectura lunar parte de la fase real del día y añade un enfoque que eliges tú: '
        'claridad, amor, trabajo, descanso o soltar. Incluye el sentido de la fase, un '
        'ritual simbólico sencillo y una afirmación.'))
    F.append(p(
        'Los rituales que propone la app son siempre seguros y simbólicos: respirar, '
        'escribir, observar. Nunca implican sustancias, ayunos ni nada que pueda hacerte daño.'))

    # ---------- 08 ----------
    F.append(h1('SECCIÓN 08', 'Sueños'))
    F.append(p(
        'Escribe o dicta el sueño y la app lo interpreta de forma simbólica a partir de sus '
        'elementos: la emoción principal que elijas y los símbolos que aparezcan. Puedes '
        'contarlo también desde el chat ritual, con tus palabras.'))
    F.append(p(
        'La interpretación funciona sin conexión. Si has conectado la IA, puedes pedir una '
        'lectura más extensa.'))

    # ---------- 09 ----------
    F.append(h1('SECCIÓN 09', 'Numerología y sinastría'))
    F.append(p(
        'A partir del nombre y la fecha de nacimiento, la app calcula los números '
        'simbólicos habituales y los presenta en fichas claras.'))
    F.append(vinetas([
        '<b>Camino de vida</b>, el número que se obtiene de la fecha completa.',
        '<b>Expresión</b> y <b>alma</b>, a partir de las letras del nombre.',
        '<b>Personalidad</b> y <b>actitud</b>.',
        '<b>Año personal</b> y <b>energía del día</b>.',
    ]))
    F.append(h2('Sinastría'))
    F.append(p(
        'Introduciendo dos nombres y dos fechas, la app calcula una vibración común y '
        'describe qué favorece el vínculo y a qué conviene prestar atención. Está redactada '
        'como una invitación a mirar la relación, no como un veredicto sobre ella.'))

    # ---------- 10 ----------
    F.append(h1('SECCIÓN 10', 'Astros'))
    F.append(entradilla(
        'Carta natal simbólica, lectura del día y revolución solar, con rueda dibujada.'))
    F.append(p(
        'Con la fecha, la hora y el lugar de nacimiento, Astros calcula las posiciones '
        'planetarias y las dibuja en una rueda con signos, casas y aspectos. Incluye '
        'también <b>Quirón</b> y <b>Lilith</b>.'))
    F.append(vinetas([
        '<b>Carta natal</b>: el mapa completo, con su tríada de Sol, Luna y Ascendente.',
        '<b>Lectura del día</b>: cómo se relacionan los tránsitos con tu carta.',
        '<b>Revolución solar</b>: las posiciones del año que empieza en tu cumpleaños.',
    ]))
    F.append(p(
        'El buscador de ciudades funciona sin conexión con una base local. Si tu lugar no '
        'aparece, puedes escribirlo a mano. Cuando la rueda no encuentra aspectos mayores '
        'exactos, la lectura se apoya en signos y casas y así lo indica.'))
    F.append(aviso(
        'Sobre la precisión',
        'Los cálculos son aproximados y de uso simbólico. La hora de nacimiento influye '
        'especialmente en el Ascendente y en las casas: si no la conoces con exactitud, '
        'toma esa parte de la lectura con más holgura.'))

    # ---------- 11 ----------
    F.append(h1('SECCIÓN 11', 'Grabovoi'))
    F.append(p(
        'Una colección amplia de secuencias numéricas organizadas por categoría, con '
        'buscador y filtros. Cada entrada abre una ficha con la estructura del código, el '
        'sentido simbólico de sus cifras y una forma de trabajar la concentración.'))
    F.append(h2('Varias secuencias a la vez'))
    F.append(p(
        'Puedes marcar varias secuencias y generar un <b>PDF conjunto</b> con todas las '
        'elegidas. La selección se guarda por entrada, de modo que dos códigos idénticos '
        'con nombres distintos no se arrastran el uno al otro.'))
    F.append(aviso(
        'Aviso importante sobre las entradas de salud',
        'La colección incluye entradas relacionadas con enfermedades, y aparecen marcadas '
        'como tales. Se ofrecen únicamente como práctica simbólica de concentración. '
        '<b>No diagnostican, no tratan y no curan nada, y no sustituyen la atención '
        'médica.</b> Si tienes un problema de salud, consulta a un profesional sanitario.'))

    # ---------- 12 ----------
    F.append(h1('SECCIÓN 12', 'Mensaje del día'))
    F.append(p(
        'Combina la carta, la runa y la fase lunar del día en una sola lectura breve. Es '
        'estable: si lo abres varias veces el mismo día obtienes lo mismo, y también si '
        'cambias de idioma, porque internamente se guarda qué carta y qué runa salieron, '
        'no su nombre traducido.'))
    F.append(p(
        'Puede convertirse en un ritual diario con ánimo, intención y una reflexión breve '
        'que queda guardada en Mi Grimorio.'))

    # ---------- 13 ----------
    F.append(h1('SECCIÓN 13', 'Chat ritual'))
    F.append(p(
        'Una sala privada donde escribir al Oráculo con tus palabras. Puede sacar cartas y '
        'runas sin salir de la conversación, y acompañar consultas sobre sueños, luna o '
        'numerología.'))
    F.append(p(
        'Sin IA conectada responde con su contenido simbólico local. Con IA conectada, '
        'mantiene el hilo de la conversación reciente.'))

    # ---------- 14 ----------
    F.append(h1('SECCIÓN 14', 'Biblioteca Arcana y Mi Grimorio'))
    F.append(h2('Biblioteca Arcana'))
    F.append(p(
        'El archivo de las 78 cartas, con buscador y filtros por palo, por arcanos mayores '
        'o por cartas de la corte. Sirve para estudiar el mazo sin necesidad de hacer una tirada.'))
    F.append(h2('Mi Grimorio'))
    F.append(p(
        'Donde queda todo lo que guardas: lecturas, notas y reflexiones. Puedes buscar, '
        'filtrar por módulo, marcar favoritos, exportar en PDF y borrar lo que ya no quieras.'))
    F.append(aviso(
        'Modo privado',
        'Si activas el modo privado en Ajustes, las lecturas nuevas dejan de guardarse. Lo '
        'que ya estaba guardado no se borra: sigue ahí hasta que decidas eliminarlo.'))

    # ---------- 15 ----------
    F.append(h1('SECCIÓN 15', 'Voz, avatar y lectura hablada'))
    F.append(p(
        'La app usa las voces del propio dispositivo, no voces generadas en un servidor. '
        'Por eso el catálogo depende de tu teléfono o navegador. Desde Ajustes puedes '
        'elegir el idioma de la voz, una voz concreta, la velocidad y un preajuste de '
        'carácter: mística femenina, guía suave, oráculo neutro, sabio masculino, guardián '
        'profundo o lectura rápida.'))
    F.append(p(
        'Si tu dispositivo tiene pocas voces instaladas, la app incluye una guía para '
        'añadir más en iPhone y en Android.'))
    F.append(h2('El avatar'))
    F.append(p(
        'Un rostro que acompaña la lectura hablada y mueve los labios mientras habla. Puedes '
        'elegir estilo, posición, tamaño y expresión, o desactivarlo por completo.'))

    # ---------- 16 ----------
    F.append(h1('SECCIÓN 16', 'Apariencia, 3D y rendimiento'))
    F.append(h2('Temas'))
    F.append(p(
        'Seis temas visuales: Dorado místico, Noche violeta, Bosque rúnico, Luna azul, '
        'Tarot clásico y Claro elegante. Además, un ajuste de luz que cambia entre noche y día.'))
    F.append(h2('Escenas en tres dimensiones'))
    F.append(p(
        'Algunas zonas del Santuario muestran objetos en 3D. Son pesados, así que la app es '
        'prudente con ellos: carga como mucho una escena de alta calidad a la vez, descarga '
        'lo que sale de pantalla y libera la memoria gráfica al cerrar.'))
    F.append(p(
        'En <b>Ajustes → Efectos 3D</b> puedes elegir entre automático, alto, equilibrado, '
        'reducido o desactivado. Si tu dispositivo no admite WebGL, o si pides menos '
        'movimiento, la app cambia sola a una vista plana equivalente.'))
    F.append(aviso(
        'Si el móvil va justo',
        'Activa el <b>modo rendimiento</b> y pon los efectos 3D en <b>reducido</b> o '
        '<b>desactivado</b>. La app respeta además la preferencia del sistema de reducir '
        'movimiento: si la tienes puesta, las animaciones se calman por sí solas.'))

    # ---------- 17 ----------
    F.append(h1('SECCIÓN 17', 'Accesibilidad'))
    F.append(vinetas([
        '<b>Alto contraste</b>, para reforzar la separación entre texto y fondo.',
        '<b>Texto grande</b>, que aumenta el tamaño en toda la app.',
        '<b>Modo foco</b>, que reduce animaciones y quita distracciones.',
        'Lectura en voz alta de cualquier lectura.',
        'Dictado por micrófono en los campos de texto compatibles.',
        'Etiquetas de accesibilidad traducidas a los seis idiomas.',
    ]))
    F.append(p(
        'Si tu sistema operativo tiene activada la preferencia de <i>reducir movimiento</i>, '
        'la app la respeta sin que tengas que configurar nada.'))

    # ---------- 18 ----------
    F.append(h1('SECCIÓN 18', 'Exportar y copias de seguridad'))
    F.append(h2('PDF'))
    F.append(p(
        'Cualquier lectura puede exportarse en PDF, con las cartas o runas, el resumen y la '
        'interpretación. Hay dos estilos: completo ilustrado y resumen de una página. El '
        'generador de PDF está alojado en la propia app, así que <b>funciona también sin '
        'conexión</b>. Si por lo que sea no pudiera generarse, la app exporta un archivo de '
        'texto en su lugar.'))
    F.append(h2('Copia de seguridad'))
    F.append(p(
        'Desde Ajustes puedes exportar todos tus datos a un archivo y volver a cargarlo '
        'después. Es la única forma de llevar tus lecturas a otro dispositivo, porque no '
        'hay cuenta ni sincronización: todo vive donde tú lo creaste.'))
    F.append(aviso(
        'Haz copia de vez en cuando',
        'Si borras los datos del navegador o desinstalas la app sin haber exportado, las '
        'lecturas guardadas se pierden. No hay copia en ningún servidor desde la que '
        'recuperarlas.'))

    # ---------- 19 ----------
    F.append(h1('SECCIÓN 19', 'La IA es opcional'))
    F.append(p(
        'La app funciona completa sin inteligencia artificial. Todo el contenido simbólico '
        '—cartas, runas, lunas, sueños, números— está escrito y vive dentro de la app.'))
    F.append(p(
        'Si conectas el servicio de IA, se añade la posibilidad de ampliar una lectura y de '
        'mantener una conversación más fluida en el chat ritual. Puedes elegir el tono: '
        'mística, práctica, breve, profunda, directa o cálida.'))
    F.append(aviso(
        'Qué sale de tu dispositivo',
        'Mientras no conectes la IA, nada de lo que escribes sale del navegador. Cuando la '
        'usas, el texto de esa consulta se envía al servicio para generar la respuesta. Es '
        'la única situación en la que tus datos salen del dispositivo, y por eso conviene '
        'no escribir ahí información sensible.'))

    # ---------- 20 ----------
    F.append(h1('SECCIÓN 20', 'Privacidad y datos'))
    F.append(p(
        'Oráculo Místico no tiene cuentas, ni servidor propio de usuarios, ni seguimiento '
        'publicitario. Tus lecturas, tu perfil, tus notas y tus ajustes se guardan en el '
        'almacenamiento local del navegador, en tu dispositivo.'))
    F.append(vinetas([
        'No se pide correo, teléfono ni registro.',
        'No se comparte nada con terceros salvo la consulta que envíes a la IA, si la usas.',
        'Puedes exportar tus datos cuando quieras.',
        'Puedes borrarlos por completo desde Ajustes.',
    ]))
    F.append(p(
        'La política de privacidad completa está disponible dentro de la app, en '
        '<b>Ajustes → Privacidad y datos</b>.'))

    # ---------- 21 ----------
    F.append(h1('SECCIÓN 21', 'Instalar la app y uso sin conexión'))
    F.append(p(
        'Oráculo Místico puede instalarse en la pantalla de inicio y abrirse como una app '
        'más, sin barra de navegador.'))
    F.append(tabla(
        ['Dispositivo', 'Cómo instalarla'],
        [
            ['Chrome y Edge', 'Botón Instalar en la barra de direcciones, o el menú del navegador.'],
            ['iPhone y iPad', 'Compartir → Añadir a pantalla de inicio.'],
            ['Android', 'Menú del navegador → Instalar aplicación o Añadir a pantalla de inicio.'],
        ],
        [38 * mm, ANCHO - 2 * MARGEN - 38 * mm]))
    F.append(p(
        'Una vez instalada, la app guarda sus archivos para funcionar sin conexión: puedes '
        'hacer tiradas, consultar la biblioteca y exportar PDF sin red. Solo la IA y la '
        'búsqueda externa necesitan conexión.'))

    # ---------- 22 ----------
    F.append(h1('SECCIÓN 22', 'Si algo no funciona'))
    F.append(tabla(
        ['Qué ocurre', 'Qué probar'],
        [
            ['Ves algo raro tras una actualización',
             'Ajustes → Limpiar caché y recargar. Es lo primero que conviene probar.'],
            ['La app va lenta o el móvil se calienta',
             'Activa el modo rendimiento y pon los efectos 3D en reducido o desactivado.'],
            ['No se oye la voz',
             'Comprueba el volumen y el silencio del dispositivo, y prueba otra voz desde Ajustes.'],
            ['No aparecen voces en tu idioma',
             'Instálalas desde los ajustes del sistema. La app incluye una guía para iPhone y Android.'],
            ['El micrófono no responde',
             'Revisa los permisos del navegador. En algunos navegadores el dictado no está disponible.'],
            ['El PDF no se genera',
             'La app exporta un archivo de texto en su lugar; el contenido es el mismo.'],
            ['La IA no responde',
             'Puede tardar o estar saturada. La lectura simbólica sigue disponible mientras tanto.'],
            ['No encuentro mi ciudad en Astros',
             'Escribe el lugar a mano; el cálculo sigue funcionando.'],
            ['Perdí mis lecturas',
             'Si no hay copia exportada, no hay forma de recuperarlas: no existe copia en servidor.'],
        ],
        [50 * mm, ANCHO - 2 * MARGEN - 50 * mm]))

    # ---------- 23 ----------
    F.append(h1('SECCIÓN 23', 'Uso responsable'))
    F.append(p(
        'Esta app propone símbolos para pensar, no respuestas cerradas. Sus textos están '
        'escritos a propósito en términos de posibilidad, y ninguna lectura debería '
        'entenderse como una afirmación sobre lo que va a pasar ni sobre lo que debes hacer.'))
    F.append(aviso(
        'Cuándo buscar ayuda profesional',
        'Oráculo Místico no sustituye la atención médica, psicológica, legal ni financiera. '
        'Si atraviesas un problema de salud, una decisión legal o económica importante, o un '
        'momento de sufrimiento emocional, busca a un profesional cualificado. Si estás en '
        'crisis, acude a los servicios de emergencia de tu país.'))
    F.append(Spacer(1, 6 * mm))
    F.append(p(
        'Gracias por usar Oráculo Místico. Que las cartas te den buenas preguntas.'))

    return F


def main():
    salida = os.path.join('docs', 'manual_usuario_oraculo_mistico_v1_0.pdf')
    doc = BaseDocTemplate(
        salida, pagesize=A4,
        leftMargin=MARGEN, rightMargin=MARGEN,
        topMargin=22 * mm, bottomMargin=22 * mm,
        title='Oráculo Místico · Manual de usuario',
        author='Oráculo Místico',
        subject='Manual de usuario de la aplicación Oráculo Místico',
        creator='Oráculo Místico')

    marco_portada = Frame(MARGEN, 22 * mm, ANCHO - 2 * MARGEN, ALTO - 44 * mm,
                          id='portada', showBoundary=0)
    marco_interior = Frame(MARGEN, 22 * mm, ANCHO - 2 * MARGEN, ALTO - 46 * mm,
                           id='interior', showBoundary=0)
    doc.addPageTemplates([
        PageTemplate(id='portada', frames=[marco_portada], onPage=portada),
        PageTemplate(id='interior', frames=[marco_interior], onPage=interior),
    ])
    doc.build(construir())
    tam = os.path.getsize(salida)
    print('generado: %s  (%.1f KB)' % (salida, tam / 1024.0))


if __name__ == '__main__':
    main()
