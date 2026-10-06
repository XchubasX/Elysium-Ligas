#!/usr/bin/env python3
"""Corre TODAS las pruebas de Elysium · Ligas y escribe el reporte pruebas/resultados.md.

Uso (desde la carpeta del repositorio):
    python3 pruebas/correr.py            # todas
    python3 pruebas/correr.py sorteo     # solo los grupos cuyo archivo contiene "sorteo"

Termina con código 0 si todo pasó y 1 si algo falló.
"""
import importlib
import subprocess
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import herramientas as H  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def _git(*args):
    try:
        return subprocess.run(['git', '-C', str(H.REPO), *args], capture_output=True, text=True).stdout.strip()
    except Exception:
        return ''


def _escapar(t):
    return str(t).replace('|', '\\|').replace('\n', ' ')


def reporte(grupos, segundos, filtro):
    total = sum(len(g.casos) for g in grupos)
    fallas = [(g, c) for g in grupos for c in g.casos if not c[1]]
    ahora = datetime.now(ZoneInfo('America/Mexico_City')).strftime('%d/%m/%Y %H:%M')
    commit = _git('rev-parse', '--short', 'HEAD') or '¿?'
    # Cambios sin guardar en el SITIO (los de la carpeta pruebas/ no cuentan)
    sucio = _git('status', '--porcelain', '--', '.', ':(exclude)pruebas')
    version = f'`{commit}`' + (' + cambios aún sin guardar' if sucio else '')
    L = ['# Resultados de las pruebas', '',
         f'**{"✅ TODO BIEN" if not fallas else f"❌ {len(fallas)} FALLA(S)"}** — {total - len(fallas)} de {total} casos pasaron.', '',
         f'- Fecha: {ahora} (hora de Ciudad de México)',
         f'- Versión probada: {version}',
         f'- Duración: {segundos:.0f} s',
         f'- Grupos corridos: {"todos" if not filtro else "solo los que contienen «" + filtro + "»"}',
         '- Cómo se prueba: navegador automatizado con Firebase simulado (no toca datos reales). '
         + ('**Las reglas de la base de datos se aplicaron** en cada lectura y escritura (simulador de reglas). ' if H.HAY_REGLAS else '**Sin reglas** (no se encontró la carpeta de reglas). ')
         +
         'No sustituye la revisión en el sitio de pruebas: estilos y servicios de Google reales solo se ven ahí.', '']
    if fallas:
        L += ['## Qué falló', '', '| Grupo | Caso | Detalle |', '|---|---|---|']
        L += [f'| {_escapar(g.titulo)} | {_escapar(c[0])} | {_escapar(c[2])} |' for g, c in fallas]
        L.append('')
    L += ['## Resumen por grupo', '', '| # | Grupo | Casos | Resultado |', '|---|---|---|---|']
    for i, g in enumerate(grupos, 1):
        malos = sum(1 for c in g.casos if not c[1])
        L.append(f'| {i} | {_escapar(g.titulo)} | {len(g.casos)} | {"✅" if not malos else f"❌ {malos} falla(s)"} |')
    L.append('')
    L += ['## Todos los casos', '']
    for i, g in enumerate(grupos, 1):
        L += [f'### {i}. {g.titulo}', '', '| # | Caso | Resultado |', '|---|---|---|']
        for j, (nombre, ok, det) in enumerate(g.casos, 1):
            L.append(f'| {j} | {_escapar(nombre)} | {"✅" if ok else "❌ " + _escapar(det)} |')
        L.append('')
    (AQUI / 'resultados.md').write_text('\n'.join(L), encoding='utf-8')
    return total, len(fallas)


def main():
    filtro = sys.argv[1] if len(sys.argv) > 1 else ''
    modulos = sorted(p.stem for p in AQUI.glob('prueba_*.py') if filtro in p.stem)
    grupos = []
    inicio = time.time()
    with sync_playwright() as p:
        nav = p.chromium.launch()
        for nombre in modulos:
            m = importlib.import_module(nombre)
            g = H.Grupo(m.TITULO)
            print(f'\n▶ {m.TITULO}')
            try:
                m.correr(nav, g)
            except Exception as e:  # una prueba que se cae cuenta como falla, no detiene las demás
                g.caso('el grupo terminó sin caerse', False, f'{type(e).__name__}: {e}')
                traceback.print_exc()
            grupos.append(g)
        nav.close()
    H.limpiar()
    total, fallas = reporte(grupos, time.time() - inicio, filtro)
    print(f'\n{"✅ TODO BIEN" if not fallas else f"❌ {fallas} FALLA(S)"}: {total - fallas} de {total} casos. Reporte: pruebas/resultados.md')
    sys.exit(1 if fallas else 0)


if __name__ == '__main__':
    main()
