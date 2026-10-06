"""Compartir la tabla por WhatsApp (top 5 + enlace) y Excel con 3 hojas, para cualquier visitante."""
import urllib.parse
import herramientas as H

TITULO = 'Compartir por WhatsApp y descargar Excel'

STUB_XLSX = """window.__libros = []; window.XLSX = { utils: {
  book_new: () => ({ hojas: [] }),
  aoa_to_sheet: (filas) => ({ filas }),
  book_append_sheet: (l, h, n) => l.hojas.push([n, h.filas]) },
  writeFile: (l, nombre) => window.__libros.push({ nombre, hojas: l.hojas }) };"""


def correr(nav, g):
    seed = H.con_resultados(H.seed_base())
    ev = seed['eventos']['liga-a']
    for i, n in enumerate(['Eva', 'Jordi'], 6):
        ev['jugadores'][f'p{i}'] = {'nick': n}
    ctx, pg, err = H.abrir(nav, seed, '#/liga/liga-a')
    href = pg.get_attribute('text=Compartir por WhatsApp', 'href')
    texto = urllib.parse.unquote(href.split('text=', 1)[1])
    g.caso('el visitante (sin cuenta) ve «Compartir por WhatsApp» y «Descargar Excel»', pg.is_visible('text=Descargar Excel'))
    g.caso('el mensaje dice la liga y «tabla tras la jornada 2»', texto.startswith('🏆 Liga A · tabla tras la jornada 2'), texto)
    g.caso('el primero es «1. Lasombra · 1 GW · 3 VP»', '\n1. Lasombra · 1 GW · 3 VP\n' in texto, texto)
    g.caso('trae como máximo 5 jugadores', texto.count(' GW · ') == 5, texto)
    g.caso('termina con el enlace a la liga', texto.rstrip().endswith('#/liga/liga-a'), texto)

    pg.evaluate(STUB_XLSX)
    pg.click('text=Descargar Excel'); pg.wait_for_timeout(200)
    libros = pg.evaluate('window.__libros')
    g.caso('descarga «liga-a.xlsx»', len(libros) == 1 and libros[0]['nombre'] == 'liga-a.xlsx', libros)
    hojas = dict((n, f) for n, f in libros[0]['hojas']) if libros else {}
    g.caso('tiene 3 hojas: Tabla, Jornadas, Hazañas', list(hojas) == ['Tabla', 'Jornadas', 'Hazañas'], list(hojas))
    g.caso('Tabla: encabezados y primer lugar Lasombra (1 GW, 3 VP)', hojas.get('Tabla', [[]])[0] == ['#', 'Jugador', 'GW', 'VP', 'Hazañas', 'Jornadas jugadas'] and hojas['Tabla'][1][:4] == [1, 'Lasombra', 1, 3], hojas.get('Tabla'))
    g.caso('Jornadas: una fila por jugador de cada mesa jugada (5) y la abierta no sale', len(hojas.get('Jornadas', [])) == 6 and all(f[0] == 2 for f in hojas['Jornadas'][1:]), hojas.get('Jornadas'))
    g.caso('Jornadas: el de 3 VP tiene GW = 1', any(f[5] == 'Lasombra' and f[6] == 3 and f[7] == 1 for f in hojas.get('Jornadas', [])))
    g.caso('Hazañas: «Sangrado más cuantioso» de Toni en la jornada 2', hojas.get('Hazañas', [None, []])[1] == [2, '2026-10-24', 'Sangrado más cuantioso', 'Toni'], hojas.get('Hazañas'))
    ctx.close()

    seed['eventos']['liga-a']['hazanasModo'] = 'no'
    ctx, pg, e2 = H.abrir(nav, seed, '#/liga/liga-a')
    pg.evaluate(STUB_XLSX); pg.click('text=Descargar Excel'); pg.wait_for_timeout(200)
    hojas = [n for n, _ in pg.evaluate('window.__libros')[0]['hojas']]
    g.caso('liga sin hazañas: el Excel no lleva hoja de hazañas', hojas == ['Tabla', 'Jornadas'], hojas)
    pg.evaluate('delete window.XLSX'); pg.click('text=Descargar Excel'); pg.wait_for_timeout(300)
    g.caso('sin internet para el Excel: aviso claro', 'No se pudo preparar el Excel' in H.texto(pg))
    ctx.close()
    todos = err + e2
    g.caso('las páginas abrieron sin errores', not todos, todos)
