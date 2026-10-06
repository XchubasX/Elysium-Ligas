"""Herramientas comunes para las pruebas de Elysium · Ligas.

Abren las páginas reales del repositorio en un navegador automatizado (Playwright +
Chromium) con Firebase simulado: no tocan ninguna base de datos real ni necesitan internet.

Reglas de la base de datos: no viven en este repositorio público. Si existe la carpeta
indicada en LIGAS_REGLAS (con reglas.json y simulador.js), el Firebase simulado las aplica
a cada lectura y escritura; si no, las pruebas corren sin reglas y el reporte lo dice.
"""
import copy
import json
import os
import re
import shutil
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PRUEBAS = Path(__file__).resolve().parent
TMP = Path(tempfile.mkdtemp(prefix='ligas-pruebas-'))
ZONA = 'America/Mexico_City'
FIREBASE_SIMULADO = (PRUEBAS / 'firebase-simulado.js').read_text(encoding='utf-8')
CARPETA_REGLAS = Path(os.environ.get('LIGAS_REGLAS', '/tmp/claude-0/-home-claude/e31a9c8f-ba40-5613-9039-0b293fc7eea1/scratchpad/ligas-reglas'))
HAY_REGLAS = (CARPETA_REGLAS / 'reglas.json').exists() and (CARPETA_REGLAS / 'simulador.js').exists()

STUBS = '<style>.hidden{display:none !important}</style><script>window.tailwind = {};</script>'


def reglas_js():
    if not HAY_REGLAS:
        return ''
    sim = (CARPETA_REGLAS / 'simulador.js').read_text(encoding='utf-8')
    reglas = (CARPETA_REGLAS / 'reglas.json').read_text(encoding='utf-8')
    return ('<script>var module = { exports: {} };</script><script>' + sim + '</script>'
            '<script>window.__SIMULAR__ = module.exports.simular; window.__REGLAS__ = ' + reglas + ';</script>')


def armar_pagina(archivo='index.html', seed=None, nombre=None, con_reglas=True, extra_head=''):
    """Copia de la página lista para probar: archivos propios dentro, programas externos fuera, Firebase simulado."""
    html = (REPO / archivo).read_text(encoding='utf-8')

    def meter(m):
        return '<script>' + (REPO / m.group(1)).read_text(encoding='utf-8').replace('</script>', '<\\/script>') + '</script>'
    html = re.sub(r'<script src="(config\.js|js/[a-z]+\.js)\?v=[^"]*"></script>', meter, html)
    html = re.sub(r'<script src="https?://[^"]*"[^>]*></script>', '', html)
    html = re.sub(r'<link [^>]*>', '', html)
    html = re.sub(r'<script>\s*tailwind\.config[\s\S]*?</script>', '', html)
    semilla = '<script>window.__SEED__ = ' + json.dumps(seed or {}) + ';</script>'
    html = html.replace('<head>', '<head>' + STUBS + (reglas_js() if con_reglas else '') + semilla + '<script>' + FIREBASE_SIMULADO + '</script>' + extra_head, 1)
    # Las imágenes se ven igual: se apuntan al repositorio
    html = html.replace('src="iconos/', 'src="' + (REPO / 'iconos').as_uri() + '/').replace('src="darkpack', 'src="' + REPO.as_uri() + '/darkpack')
    destino = TMP / (nombre or ('p_' + archivo))
    destino.write_text(html, encoding='utf-8')
    return destino


def url(ruta, ancla=''):
    return ruta.as_uri() + ancla


def nuevo_contexto(nav, **kw):
    kw.setdefault('timezone_id', ZONA)
    kw.setdefault('viewport', {'width': 390, 'height': 844})
    ctx = nav.new_context(**kw)
    ctx.set_default_timeout(5000)
    return ctx


def abrir(nav, seed, ancla='#/', usuario=None, nombre=None, **kw):
    """Abre la página con datos de prueba y (opcional) una sesión ya iniciada."""
    ctx = nuevo_contexto(nav, **kw)
    pg = ctx.new_page()
    errores = []
    pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.goto(url(armar_pagina(seed=seed, nombre=nombre), ancla))
    if usuario:
        pg.evaluate('(u) => window.__setUser(u)', usuario)
    pg.wait_for_timeout(250)
    return ctx, pg, errores


class Grupo:
    def __init__(self, titulo):
        self.titulo = titulo
        self.casos = []

    def caso(self, nombre, ok, detalle=''):
        ok = bool(ok)
        self.casos.append((nombre, ok, '' if ok else str(detalle)))
        print(('  ✅ ' if ok else '  ❌ ') + nombre + ('' if ok else f'  → {detalle}'))
        return ok

    @property
    def ok(self):
        return all(c[1] for c in self.casos)


def limpiar():
    shutil.rmtree(TMP, ignore_errors=True)


def seed_base():
    """Los mismos datos de prueba que se cargaron en la base de pruebas real (Ana, Carla, Dora, Beto…)."""
    ruta = CARPETA_REGLAS / 'datos-prueba.json'
    if ruta.exists():
        d = json.loads(ruta.read_text(encoding='utf-8'))
        # Desde v1.6 el país y la ciudad son obligatorios: los ejemplos los traen
        for ev in d.get('eventos', {}).values():
            ev.setdefault('pais', 'México'); ev.setdefault('ciudad', 'Ciudad de México')
        return d
    return {'admins': {'superusuario-prueba': True}, 'organizadores': {'ana': True, 'carla': True},
            'eventos': {'liga-a': {'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'Liga A', 'creada': 1,
                                   'ayudantes': {'beto': {'nombre': 'Beto', 'desde': 1}}}}}


def con_resultados(seed):
    """Agrega a liga-a resultados reales en la jornada 2 (cerrada) y en la 1 (abierta, no debe contar)."""
    s = copy.deepcopy(seed)
    ev = s['eventos']['liga-a']
    ev['jugadores'] = {'p1': {'nick': 'Lasombra'}, 'p2': {'nick': 'Toni'}, 'p3': {'nick': 'Mau'},
                       'p4': {'nick': 'Fer'}, 'p5': {'nick': 'Iván'}}
    ev['jornadas']['j2']['rondas'] = {'r1': {'mesas': {'m1': {
        'p1': {'asiento': 1, 'vp': 3}, 'p2': {'asiento': 2, 'vp': 1}, 'p3': {'asiento': 3, 'vp': 1},
        'p4': {'asiento': 4, 'vp': 0}, 'p5': {'asiento': 5, 'vp': 0}}}}}
    ev['jornadas']['j2']['hazanas'] = {'x1': {'hazana': 'h1', 'jugador': 'p2'}}
    ev['jornadas']['j1']['rondas'] = {'r1': {'mesas': {'m1': {
        'p5': {'asiento': 1, 'vp': 5}, 'p1': {'asiento': 2, 'vp': 0}, 'p2': {'asiento': 3, 'vp': 0},
        'p3': {'asiento': 4, 'vp': 0}}}}}
    return s


ANA = {'uid': 'ana', 'displayName': 'Ana López'}
BETO = {'uid': 'beto', 'displayName': 'Beto Ramírez'}
DORA = {'uid': 'dora', 'displayName': 'Dora Pérez'}
NUEVO = {'uid': 'uid-nuevo-123', 'displayName': 'Pepe Nuevo'}
ADMIN = {'uid': 'superusuario-prueba', 'displayName': 'Fede Admin'}


def texto(pg):
    return pg.inner_text('body')


def sin_desborde(pg):
    return pg.evaluate('() => document.documentElement.scrollWidth <= window.innerWidth + 1')
