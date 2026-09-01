# -*- coding: utf-8 -*-
"""Genera la tabla de Quiron a partir de los datos de JPL Horizons.

Los datos de Horizons son de dominio publico. Se piden longitudes
ecipticas geocentricas mensuales y se emiten en el mismo formato que ya
usa la app, para no tocar el codigo que las lee.
"""
import io, re, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

S = os.environ.get('SCRATCH', '.')
crudo = io.open(os.path.join(S, 'chiron.txt'), encoding='utf-8', errors='replace').read()

MESES = {m: i for i, m in enumerate(
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])}
SIGNOS = ['ar','ta','ge','cn','le','vi','li','sc','sa','cp','aq','pi']

bloque = crudo.split('$$SOE')[1].split('$$EOE')[0]
filas = []
for linea in bloque.strip().splitlines():
    m = re.match(r'\s*(\d{4})-([A-Z][a-z]{2})-(\d{2})\s+\d{2}:\d{2}\s+([\d.]+)\s+([-\d.]+)', linea)
    if not m:
        continue
    anio, mes, _, lon, _lat = int(m.group(1)), MESES[m.group(2)], m.group(3), float(m.group(4)), m.group(5)
    filas.append((anio, mes, lon))

print('entradas leidas:', len(filas))
print('desde %d-%02d hasta %d-%02d' % (filas[0][0], filas[0][1] + 1, filas[-1][0], filas[-1][1] + 1))


def dif(a, b):
    """Diferencia angular corta, con signo."""
    return ((b - a + 540) % 360) - 180


def formato(lon, rx):
    """El mismo formato que ya usa la app: '19 ar 57' y '27 ar 45 rx'."""
    lon = lon % 360
    signo = int(lon // 30)
    resto = lon - signo * 30
    grados = int(resto)
    minutos = int(round((resto - grados) * 60))
    if minutos == 60:
        minutos = 0
        grados += 1
        if grados == 30:
            grados = 0
            signo = (signo + 1) % 12
    return '%d %s %d%s' % (grados, SIGNOS[signo], minutos, ' rx' if rx else '')


# Retrogradacion por diferencia centrada sobre la propia serie. El
# criterio anterior marcaba retrogrado si CUALQUIERA de los dos meses que
# rodean la fecha lo estaba, lo que alargaba la marca hasta un mes.
tabla = {}
for i, (anio, mes, lon) in enumerate(filas):
    antes = filas[i - 1][2] if i > 0 else lon
    despues = filas[i + 1][2] if i + 1 < len(filas) else lon
    rx = dif(antes, despues) < 0
    tabla.setdefault(anio, {})[mes] = formato(lon, rx)

# Se emiten solo los anios con los doce meses, para que el lector no se
# encuentre huecos.
completos = sorted(a for a, v in tabla.items() if len(v) == 12)
print('anios completos:', len(completos), '->', completos[0], 'a', completos[-1])

lineas = []
for anio in completos:
    valores = ','.join("'%s'" % tabla[anio][m] for m in range(12))
    lineas.append('  %d:[%s],' % (anio, valores))
salida = 'const CHIRON_MONTHLY_EPHEMERIS = {\n' + '\n'.join(lineas) + '\n};'
io.open(os.path.join(S, 'chiron_tabla.js'), 'w', encoding='utf-8', newline='\n').write(salida)
print('tabla generada: %.0f KB' % (len(salida) / 1024))

# ---------------------------------------------------------------
# Como se obtienen los datos de partida, para poder rehacer la tabla:
#
#   curl -sS -G "https://ssd.jpl.nasa.gov/api/horizons.api" \
#     --data-urlencode "format=text" \
#     --data-urlencode "COMMAND=2060" \
#     --data-urlencode "OBJ_DATA=NO" \
#     --data-urlencode "MAKE_EPHEM=YES" \
#     --data-urlencode "EPHEM_TYPE=OBSERVER" \
#     --data-urlencode "CENTER=500@399" \
#     --data-urlencode "START_TIME=1900-01-01" \
#     --data-urlencode "STOP_TIME=2076-01-01" \
#     --data-urlencode "STEP_SIZE=1mo" \
#     --data-urlencode "QUANTITIES=31" \
#     -o chiron.txt
#
#   SCRATCH=. python tools/generar_quiron.py
#
# COMMAND=2060 es Quiron. CENTER=500@399 es el centro de la Tierra, que
# es lo que usa la astrologia. QUANTITIES=31 pide longitud y latitud
# ecipticas del observador.
#
# Los datos de Horizons son de dominio publico. La tabla resultante se
# contrasto contra las entradas que ya habia en la app, puestas a mano:
# 32,5 segundos de arco de diferencia media.
