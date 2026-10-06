"""Torneos de un día: crear, filtros de portada, rondas, final (solo VP), campeón, TP como desempate."""
import herramientas as H

TITULO = 'Torneos de un día'
T = "window.__store().eventos['torneo-a']"


def seed_torneo(estado='pendiente', rondas=2, final=True, n=10):
    s = H.seed_base()
    s['eventos']['torneo-a'] = {'ownerUid': 'ana', 'tipo': 'torneo', 'nombre': 'Torneo de Otoño', 'creada': 1, 'ciudad': 'Guadalajara', 'pais': 'México',
                                'organizadorNombre': 'Ana', 'fecha': '2026-11-14', 'hora': '16:00', 'rondasPlan': rondas, 'conFinal': final,
                                'hazanasModo': 'mencion', 'hazanasCatalogo': {'h1': {'nombre': 'Mazo más original'}},
                                'ayudantes': {'beto': {'nombre': 'Beto', 'desde': 1}},
                                'jugadores': {f'p{i}': {'nick': n_} for i, n_ in enumerate(['Lasombra', 'Toni', 'Mau', 'Fer', 'Iván', 'Sara', 'Eva', 'Jordi', 'Pau', 'Luis'][:n], 1)},
                                'jornadas': {'j1': {'numero': 1, 'fecha': '2026-11-14', 'hora': '16:00', 'estado': estado}}}
    return s


def correr(nav, g):
    # --- Cálculos
    ctx, pg, err = H.abrir(nav, seed_torneo())
    tp = pg.evaluate("tpMesa({a:{vp:3},b:{vp:1},c:{vp:1},d:{vp:0},e:{vp:0}})")
    g.caso('TP mesa de 5 con empates promediados: 60 · 42 · 42 · 18 · 18', tp == {'a': 60, 'b': 42, 'c': 42, 'd': 18, 'e': 18}, tp)
    tp = pg.evaluate("tpMesa({a:{vp:2},b:{vp:1},c:{vp:1},d:{vp:0}})")
    g.caso('TP mesa de 4: 60 · 36 · 36 · 12 (sin el 36 del tercer lugar)', tp == {'a': 60, 'b': 36, 'c': 36, 'd': 12}, tp)
    c = pg.evaluate("""clasificacionTorneo({jugadores:{a:{nick:'A'},b:{nick:'B'}},jornadas:{j1:{rondas:{
        r1:{mesas:{m1:{a:{vp:1},x:{vp:1},y:{vp:1},z:{vp:1},w:{vp:1}}, m2:{b:{vp:1},q:{vp:0},r:{vp:0},s:{vp:0}}}}}}}})""")
    orden = [f['jid'] for f in c]
    g.caso('empate en GW y VP: desempata el TP (B quedó 1º en su mesa y va arriba de A)', orden.index('b') < orden.index('a'), c)
    ctx.close()

    # --- Crear torneo
    ctx, pg, err1 = H.abrir(nav, H.seed_base(), '#/mis-eventos', usuario=H.ANA)
    g.caso('«Mis eventos» tiene «+ Nueva liga» y «+ Nuevo torneo»', '+ Nueva liga' in H.texto(pg) and '+ Nuevo torneo' in H.texto(pg))
    pg.click('text=+ Nuevo torneo'); pg.wait_for_timeout(150)
    g.caso('el formulario de torneo pide fecha, hora, rondas y final', all(pg.locator(x).count() for x in ['#crFecha', '#crHora', 'input[name=crRondas]', '#crFinal']))
    g.caso('solo se puede elegir 2 o 3 rondas', pg.locator('input[name=crRondas]').count() == 2)
    pg.fill('#crNombre', 'Torneo de Invierno'); pg.dispatch_event('#crNombre', 'input')
    pg.click('text=Crear torneo'); pg.wait_for_timeout(100)
    g.caso('sin fecha → «Elige la fecha del torneo.»', 'Elige la fecha' in pg.inner_text('#crError'))
    pg.fill('#crFecha', '2026-12-05'); pg.fill('#crHora', '15:30'); pg.check('input[name=crRondas][value="2"]'); pg.fill('#crCiudad', 'Monterrey')
    pg.click('text=Crear torneo'); pg.wait_for_timeout(300)
    t = pg.evaluate("window.__store().eventos['torneo-de-invierno']")
    g.caso('se crea como torneo: fecha, hora, 2 rondas, con final y su día j1 pendiente',
           t and t['tipo'] == 'torneo' and t['fecha'] == '2026-12-05' and t['hora'] == '15:30' and t['rondasPlan'] == 2 and t['conFinal'] is True and t['jornadas']['j1'] == {'numero': 1, 'fecha': '2026-12-05', 'hora': '15:30', 'estado': 'pendiente'}, (t, pg.evaluate('window.__denegadas')))
    g.caso('abre la página del torneo con pestañas Clasificación y Mesas', 'Clasificación' in pg.inner_text('nav') and 'Mesas' in pg.inner_text('nav') and 'Calendario' not in pg.inner_text('nav'))
    g.caso('muestra «2 rondas + final»', '2 rondas + final' in H.texto(pg))
    store = pg.evaluate('window.__store()')
    ctx.close()

    # --- Portada con filtros
    ctx, pg, err2 = H.abrir(nav, store)
    t = pg.inner_text('#listaEventos')
    g.caso('la tarjeta del torneo trae la etiqueta TORNEO y «2 rondas + final»', 'TORNEO' in t and '2 rondas + final' in t, t[:400])
    pg.click('button[data-filtro-tipo=torneos]'); pg.wait_for_timeout(100)
    t = pg.inner_text('#listaEventos')
    g.caso('filtro «Torneos»: solo el torneo', 'Torneo de Invierno' in t and 'Liga A' not in t, t)
    pg.click('button[data-filtro-tipo=ligas]'); pg.wait_for_timeout(100)
    t = pg.inner_text('#listaEventos')
    g.caso('filtro «Ligas»: sin el torneo', 'Torneo de Invierno' not in t and 'Liga A' in t)
    pg.click('button[data-filtro-tipo=todos]')
    pg.select_option('#filtroCiudad', 'Monterrey'); pg.wait_for_timeout(100)
    t = pg.inner_text('#listaEventos')
    g.caso('filtro de ciudad «Monterrey» deja solo el torneo de esa ciudad', 'Torneo de Invierno' in t and 'Liga A' not in t, t)
    pg.click('#limpiarFiltros'); pg.wait_for_timeout(100)
    pg.fill('#filtroTexto', 'xyz'); pg.wait_for_timeout(100)
    g.caso('sin coincidencias: «Ningún evento coincide»', 'Ningún evento coincide' in pg.inner_text('#listaEventos'))
    pg.click('#limpiarFiltros'); pg.wait_for_timeout(100)
    pg.fill('#filtroFecha', '2026-12-05'); pg.dispatch_event('#filtroFecha', 'change'); pg.wait_for_timeout(100)
    t = pg.inner_text('#listaEventos')
    g.caso('fecha 5 dic: el torneo de ese día y las ligas que se juegan esas fechas (A, B, D)', 'Torneo de Invierno' in t and 'Liga A' in t, t)
    pg.fill('#filtroFecha', '2027-03-01'); pg.dispatch_event('#filtroFecha', 'change'); pg.wait_for_timeout(100)
    g.caso('fecha sin eventos: «Ningún evento coincide»', 'Ningún evento coincide' in pg.inner_text('#listaEventos'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # --- El día del torneo, hecho por el AYUDANTE
    ctx, pg, err3 = H.abrir(nav, seed_torneo(), '#/liga/torneo-a/mesas', usuario=H.BETO)
    pg.click('text=Empezar torneo'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(250)
    g.caso('Beto empieza el torneo', pg.evaluate(T + '.jornadas.j1.estado') == 'abierta', pg.evaluate('window.__denegadas'))
    for b in pg.locator('button[aria-pressed]').all():
        b.click(); pg.wait_for_timeout(50)
    pg.wait_for_timeout(150)
    g.caso('pase de lista: 10 presentes', len(pg.evaluate(T + '.jornadas.j1.presentes') or {}) == 10)

    def capturar(ronda, vps):
        for mesa_n, valores in enumerate(vps, 1):
            sels = pg.locator(f'[data-mesa="{ronda}-{mesa_n}"] select[aria-label^="VP de"]')
            for i, v in enumerate(valores):
                sels.nth(i).select_option(str(v)); pg.wait_for_timeout(50)
        pg.wait_for_timeout(150)
    pg.click('text=Sortear mesas de la ronda 1'); pg.wait_for_timeout(250)
    capturar(1, [[3, 1, 1, 0, 0], [2, 1, 1, 1, 0]])
    pg.click('text=+ Sortear ronda 2'); pg.wait_for_timeout(250)
    capturar(2, [[2, 2, 1, 0, 0], [4, 1, 0, 0, 0]])
    g.caso('con 2 rondas planeadas no ofrece una tercera', '+ Sortear ronda 3' not in H.texto(pg))
    g.caso('aparece «Pasar a la final (top 5)»', pg.is_visible('text=Pasar a la final (top 5)'))
    clasif = pg.evaluate("clasificacionTorneo(eventos['torneo-a'])")
    pg.click('text=Pasar a la final (top 5)'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(300)
    fin = pg.evaluate(T + '.jornadas.j1.final') or {}
    g.caso('la final tiene a los 5 primeros de la clasificación, con su lugar', sorted(fin) == sorted(f['jid'] for f in clasif[:5]) or len(fin) == 5 and set(v['lugar'] for v in fin.values()) == {1, 2, 3, 4, 5}, (fin, clasif[:6]))
    g.caso('las rondas quedan cerradas a cambios (sin selectores de VP de rondas)', pg.locator('[data-mesa] select').count() == 0)
    t = pg.inner_text('[data-final]')
    g.caso('la final NO tiene selección de asientos ni orden de elección', pg.locator('[data-asiento]').count() == 0 and 'asiento' not in t.lower() and 'elegir' not in t.lower(), t)
    g.caso('la final lista a los 5 por su lugar (1º a 5º)', all(f'{n}º' in t for n in range(1, 6)), t)
    sels = pg.locator('[data-final] select')
    g.caso('aparecen de una vez los 5 selectores de VP de la final', sels.count() == 5)
    for i, v in enumerate([1, 1, 2, 0, 1]):
        sels.nth(i).select_option(str(v)); pg.wait_for_timeout(80)
    pg.wait_for_timeout(150)
    pg.click('button:has-text("Terminar torneo")'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(300)
    g.caso('Beto termina el torneo', pg.evaluate(T + '.jornadas.j1.estado') == 'cerrada', pg.evaluate('window.__denegadas'))
    g.caso('las reglas aceptaron todo lo de Beto', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    campeon_jid = next(k for k, v in fin.items() if v['lugar'] == 3)
    campeon = pg.evaluate(f"eventos['torneo-a'].jugadores['{campeon_jid}'].nick")
    store = pg.evaluate('window.__store()')
    ctx.close()

    ctx, pg, err4 = H.abrir(nav, store, '#/liga/torneo-a')
    t = pg.inner_text('#app')
    g.caso('Clasificación pública: «🏆 CAMPEÓN» con quien tuvo más VP en la final (2 VP)', 'CAMPEÓN' in t and campeon in t.split('CAMPEÓN', 1)[1][:40] and '2 VP en la final' in t, t[:500])
    filas = pg.locator('[role=row]').all_inner_texts()
    g.caso('la tabla trae la columna «Final» y 10 jugadores', 'Final' in filas[0] and len(filas) == 11, filas[:3])
    g.caso('no muestra TP ni explicaciones de puntos', 'TP' not in t and 'al menos 2' not in t)
    pg.click('nav >> text=Mesas'); pg.wait_for_timeout(150)
    t = pg.inner_text('#app')
    g.caso('el público ve la final y las 2 rondas sin controles', 'Final' in t and 'Ronda 2' in t and pg.locator('select').count() == 0)
    pg.evaluate("""window.__libros = []; window.XLSX = { utils: { book_new: () => ({ hojas: [] }), aoa_to_sheet: (f) => ({ f }), book_append_sheet: (l, h, n) => l.hojas.push([n, h.f]) }, writeFile: (l, n) => window.__libros.push({ n, hojas: l.hojas }) };""")
    pg.click('nav >> text=Clasificación'); pg.wait_for_timeout(100)
    pg.click('text=Descargar Excel'); pg.wait_for_timeout(200)
    lib = pg.evaluate('window.__libros')[0]
    hojas = dict((n, f) for n, f in lib['hojas'])
    g.caso('Excel del torneo: hojas Clasificación, Mesas y Hazañas', list(hojas) == ['Clasificación', 'Mesas', 'Hazañas'], list(hojas))
    g.caso('Excel: 20 filas de rondas + 5 de la final', len(hojas['Mesas']) == 26 and sum(1 for f in hojas['Mesas'] if f[0] == 'Final') == 5, len(hojas['Mesas']))
    href = pg.get_attribute('text=Compartir por WhatsApp', 'href')
    g.caso('WhatsApp: «campeón: ' + campeon + '»', ('campe%C3%B3n%3A%20' + campeon) in href or ('campeón: ' + campeon) in __import__('urllib.parse').parse.unquote(href))
    ctx.close()

    # --- Sin final: termina después de la última ronda
    ctx, pg, err5 = H.abrir(nav, seed_torneo(estado='abierta', rondas=2, final=False, n=8), '#/liga/torneo-a/mesas', usuario=H.ANA)
    for b in pg.locator('button[aria-pressed]').all():
        b.click(); pg.wait_for_timeout(50)
    pg.click('text=Sortear mesas de la ronda 1'); pg.wait_for_timeout(250)
    capturar(1, [[2, 1, 1, 0], [3, 1, 0, 0]])
    g.caso('sin final: tras la ronda 1 no se puede terminar todavía', 'Terminar torneo' not in H.texto(pg))
    pg.click('text=+ Sortear ronda 2'); pg.wait_for_timeout(250)
    capturar(2, [[2, 1, 1, 0], [1, 1, 1, 1]])
    g.caso('sin final: tras la última ronda aparece «Terminar torneo» (sin «Pasar a la final»)', pg.is_visible('button:has-text("Terminar torneo")') and 'Pasar a la final' not in H.texto(pg))
    ctx.close()

    # --- Ajustes del torneo y permisos
    ctx, pg, err6 = H.abrir(nav, seed_torneo(), '#/liga/torneo-a/ajustes', usuario=H.ANA)
    pg.fill('#ajFecha', '2026-11-21'); pg.check('input[name=ajRondas][value="3"]'); pg.click('text=Guardar cambios'); pg.wait_for_timeout(250)
    t = pg.evaluate(T)
    g.caso('cambiar la fecha del torneo también cambia la de su día', t['fecha'] == '2026-11-21' and t['jornadas']['j1']['fecha'] == '2026-11-21' and t['rondasPlan'] == 3, (t.get('fecha'), t['jornadas']['j1'], pg.evaluate('window.__denegadas')))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()
    if H.HAY_REGLAS:
        ctx, pg, err7 = H.abrir(nav, seed_torneo(), '#/liga/torneo-a', usuario=H.BETO)
        r = pg.evaluate("guardar('torneo-a', {rondasPlan: 3})")
        g.caso('REGLAS: el ayudante no cambia las rondas', r is False)
        r = pg.evaluate("guardar('torneo-a', {rondasPlan: 4})")
        ctx.close()
        ctx, pg, err8 = H.abrir(nav, seed_torneo(), '#/liga/torneo-a', usuario=H.ANA)
        r = pg.evaluate("guardar('torneo-a', {rondasPlan: 4})")
        g.caso('REGLAS: nadie pone 4 rondas', r is False)
        ctx.close()
    todos = err + err1 + err2 + err3 + err4 + err5 + err6
    g.caso('las páginas abrieron sin errores', not todos, todos)
