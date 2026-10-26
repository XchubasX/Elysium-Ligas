"""Ligas de «Partidas libres» (26 oct 2026): solo en línea, cada jugador reporta sus partidas
(o el equipo por él), confirmación antes de guardar, tabla 70% rendimiento + 30% participación,
corregir y borrar solo el organizador, cerrar la temporada."""
import copy
import herramientas as H

TITULO = 'Ligas de partidas libres (en línea)'

INICIO, FIN = '2026-10-01', '2026-12-31'


def semilla(partidas=None, inscrito=False, cerrada=False):
    s = copy.deepcopy(H.seed_base())
    s.setdefault('organizadores', {})['ana'] = True
    s['eventos']['libre-a'] = {
        'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'La Jyhad Eterna', 'creada': 1, 'formato': 'libre',
        'modalidad': 'en-linea', 'zona': 'Europe/Madrid', 'plataforma': 'Lackey', 'hazanasModo': 'no',
        'inicio': INICIO, 'fin': FIN, 'organizadorNombre': 'Ana',
        'ayudantes': {'beto': {'nombre': 'Beto', 'desde': 1}},
        'jugadores': {'p1': {'nick': 'Ana J'}, 'p2': {'nick': 'Beto J'}, 'p3': {'nick': 'Carla'}, 'p4': {'nick': 'Toni'}}}
    if partidas:
        s['eventos']['libre-a']['partidas'] = partidas
    if cerrada:
        s['eventos']['libre-a']['temporada'] = 'cerrada'
    if inscrito:
        s['inscripciones'] = {'libre-a': {'uid-nuevo-123': {'nick': 'Toni', 'nombre': 'Pepe Nuevo', 'creada': 1, 'estado': 'aceptada', 'jid': 'p4'}}}
    return s


def ejemplo():
    """El ejemplo del documento: media de la liga 1 VP (con relleno de partidas en 0)."""
    ps = {}
    n = [0]

    def add(j, vp, mesa=5):
        n[0] += 1
        ps['g%02d' % n[0]] = {'jugador': j, 'fecha': '2026-10-%02d' % (1 + n[0] % 20), 'vp': vp, 'mesa': mesa, 'por': 'ana', 'creada': n[0]}
    add('p1', 3); add('p1', 3)                 # Ana J: 2 partidas, 6 VP
    for _ in range(8): add('p2', 1.5)          # Beto J: 8 partidas, 12 VP
    add('p3', 5)                               # Carla: 1 partida, 5 VP
    for _ in range(12): add('p4', 0)           # Toni: 12 partidas en 0 → media de la liga = 23 / 23 = 1
    return ps


def store(pg, ruta):
    return pg.evaluate("(r) => r.split('/').reduce((n, k) => n == null ? null : (n[k] === undefined ? null : n[k]), window.__store())", ruta)


def filas(pg):
    return pg.evaluate("() => [...document.querySelectorAll('[data-fila]')].map(f => [...f.children].map(c => c.innerText.trim()))")


def correr(nav, g):
    err = []

    # ---------------- Cálculo (sin pantalla)
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/'); err += e
    t = pg.evaluate("() => tablaLibre(eventos['libre-a']).map(f => [f.nick, f.partidas, f.vp, Math.round(f.rendimiento*10)/10, Math.round(f.participacion*10)/10, Math.round(f.total*10)/10, f.provisional])")
    g.caso('media de la liga = 1 VP por partida', pg.evaluate("() => mediaLiga(eventos['libre-a'])") == 1)
    esperado = {'Carla': [1, 5, 200, 8.3, 142.5, True], 'Ana J': [2, 6, 180, 16.7, 131, True], 'Beto J': [8, 12, 136.4, 66.7, 115.5, False]}
    for nick, v in esperado.items():
        fila = next((f for f in t if f[0] == nick), None)
        g.caso(f'{nick}: partidas, VP, rendimiento, participación, total y provisional como el documento', fila and fila[1:] == v, fila)
    g.caso('orden: Carla, Ana J, Beto J, Toni', [f[0] for f in t] == ['Carla', 'Ana J', 'Beto J', 'Toni'], t)
    g.caso('Toni (12 partidas): participación 100 (tope)', t[-1][4] == 100, t[-1])
    t2 = pg.evaluate("""() => { const ev = { tipo:'liga', formato:'libre', jugadores:{a:{nick:'A'},b:{nick:'B'},c:{nick:'C'}}, partidas:{
        x1:{jugador:'a',vp:2,fecha:'2026-10-01',mesa:4}, x2:{jugador:'b',vp:2,fecha:'2026-10-01',mesa:4}, x3:{jugador:'b',vp:0,fecha:'2026-10-02',mesa:4}, x4:{jugador:'c',vp:0,fecha:'2026-10-02',mesa:4} } };
        return tablaLibre(ev).map(f => f.nick); }""")
    g.caso('desempate y orden con varios casos: A, B, C', t2 == ['A', 'B', 'C'], t2)
    t3 = pg.evaluate("""() => { const ev = { tipo:'liga', formato:'libre', jugadores:{a:{nick:'A'}}, partidas:{ x1:{jugador:'a',vp:0,fecha:'2026-10-01',mesa:4} } };
        const f = tablaLibre(ev)[0]; return [f.rendimiento, isFinite(f.total)]; }""")
    g.caso('si nadie tiene VP (media 0), no hay división entre cero: rendimiento 100', t3 == [100, True], t3)
    ctx.close()

    # ---------------- Portada
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/'); err += e
    t = pg.inner_text('a[href="#/liga/libre-a"]')
    g.caso('portada: «Partidas libres · en juego», 23 partidas y líder con puntos', 'PARTIDAS LIBRES · EN JUEGO' in t.upper() and '23 partidas' in t and 'Líder: Carla · 142.5 pts' in t, t)
    g.caso('portada: dice «🌐 En línea · Lackey»', 'En línea · Lackey' in t, t)
    ctx.close()

    # ---------------- Página pública: tabla
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/liga/libre-a'); err += e
    nav_t = pg.inner_text('nav')
    g.caso('pestañas públicas: Tabla y Partidas (sin Calendario ni Hazañas)', 'Tabla' in nav_t and 'Partidas' in nav_t and 'Calendario' not in nav_t and 'Hazañas' not in nav_t, nav_t)
    body = H.texto(pg)
    g.caso('cabecera: «🎲 Liga de partidas libres»', 'Liga de partidas libres' in body)
    g.caso('tabla: «Clasificación provisional» y media de la liga 1 VP', 'CLASIFICACIÓN PROVISIONAL' in body.upper() and 'Media de la liga: 1 VP' in body, body[:500])
    f = filas(pg)
    g.caso('tabla: Carla 1.º con 1 partida, 5 VP, 200, 8.3, 142.5 y PROVISIONAL', f and f[0][0] == '1' and 'Carla' in f[0][1] and 'PROVISIONAL' in f[0][1] and f[0][2:] == ['1', '5', '200', '8.3', '142.5'], f[:1])
    g.caso('tabla: Beto J sin marca de provisional', any('Beto J' in x[1] and 'PROVISIONAL' not in x[1] for x in f), f)
    pg.click('[data-como-se-calcula] summary'); pg.wait_for_timeout(100)
    t = pg.inner_text('[data-como-se-calcula]')
    g.caso('«¿Cómo se calcula?» explica 70/30, relleno de 3 partidas y 12 partidas', '70%' in t and '30%' in t and '3 partidas' in t and '12 partidas' in t, t[:300])
    g.caso('botones Compartir por WhatsApp y Excel', pg.is_visible('text=Compartir por WhatsApp') and pg.is_visible('text=Descargar Excel'))
    href = pg.get_attribute('a[href*="wa.me"]', 'href') or ''
    g.caso('WhatsApp: «clasificación provisional» y «Carla · 142.5 pts»', 'provisional' in href and 'Carla%20%C2%B7%20142.5%20pts' in href, href[:300])
    hojas = pg.evaluate("() => hojasExcel(eventos['libre-a']).map(h => [h[0], h[1].length, h[1][0]])")
    g.caso('Excel: hojas Clasificación (4 jugadores) y Partidas (23)', hojas[0][0] == 'Clasificación' and hojas[0][1] == 5 and hojas[1][0] == 'Partidas' and hojas[1][1] == 24, hojas)
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    pg.click('nav >> text=Partidas'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('pestaña Partidas pública: lista sin formulario ni botones de corregir', pg.locator('[data-partida]').count() == 23 and not pg.locator('[data-reportar]').count() and 'Corregir' not in t, t[:300])
    g.caso('sin sesión: invita a entrar e inscribirse para reportar', 'inscríbete para reportar' in t)
    ctx.close()

    # Liga sin partidas
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a'); err += e
    g.caso('sin partidas: «Todavía no hay partidas reportadas»', 'Todavía no hay partidas reportadas' in H.texto(pg))
    ctx.close()

    # ---------------- Jugador inscrito reporta su partida
    ctx, pg, e = H.abrir(nav, semilla(inscrito=True), '#/liga/libre-a', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(200)
    t = pg.inner_text('[data-inscripcion]') if pg.locator('[data-inscripcion]').count() else ''
    g.caso('jugador inscrito: «Estás inscrito como «Toni»» con botón «🎲 Reportar partida»', 'Estás inscrito como «Toni»' in t and 'Reportar partida' in t, t)
    pg.click('[data-inscripcion] >> text=Reportar partida'); pg.wait_for_timeout(250)
    t = pg.inner_text('[data-reportar]')
    g.caso('formulario: el jugador es él mismo (sin poder elegir otro)', 'Jugador: Toni' in t and not pg.locator('#rpJugador').count(), t)
    g.caso('VP de 0 a 5 en mesa de 5', pg.evaluate("() => [...document.querySelectorAll('#rpVp option')].map(o=>o.value).filter(Boolean).join(',')") == '0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5')
    pg.check('input[name="rpMesa"][value="4"]'); pg.wait_for_timeout(150)
    g.caso('al elegir mesa de 4, VP solo hasta 4', pg.evaluate("() => [...document.querySelectorAll('#rpVp option')].map(o=>o.value).filter(Boolean).pop()") == '4')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(100)
    g.caso('sin VP no deja seguir: «Elige los VP»', 'Elige los VP' in pg.inner_text('#rpError'))
    pg.fill('#rpFecha', '2026-10-20'); pg.dispatch_event('#rpFecha', 'change')
    pg.select_option('#rpVp', '2.5')
    pg.check('[data-rival="p3"]'); pg.check('[data-rival="p2"]')
    pg.fill('#rpInvitados', 'Pedro')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(200)
    t = pg.inner_text('[data-reportar]')
    g.caso('confirmación: resumen con jugador, fecha, mesa, VP y rivales', 'Revisa antes de guardar' in t and 'Toni' in t and '20 oct 2026' in t and 'Mesa de 4' in t and '2.5 VP' in t and 'Beto J' in t and 'Carla' in t and 'Pedro (invitados)' in t, t)
    g.caso('confirmación: avisa que después no podrá cambiarla', pg.is_visible('[data-aviso-sin-cambios]') and 'no podrás cambiar' in pg.inner_text('[data-aviso-sin-cambios]'))
    g.caso('todavía no se guarda nada antes de confirmar', store(pg, 'eventos/libre-a/partidas') is None)
    pg.click('text=Volver a editar'); pg.wait_for_timeout(150)
    g.caso('«Volver a editar» conserva lo capturado', pg.input_value('#rpVp') == '2.5' and pg.is_checked('[data-rival="p3"]') and pg.input_value('#rpInvitados') == 'Pedro')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    ps = store(pg, 'eventos/libre-a/partidas') or {}
    p = next(iter(ps.values()), {})
    g.caso('se guarda la partida con jugador, fecha, VP, mesa, rivales, invitados, por y creada',
           len(ps) == 1 and p.get('jugador') == 'p4' and p.get('fecha') == '2026-10-20' and p.get('vp') == 2.5 and p.get('mesa') == 4
           and p.get('rivales') == {'p2': True, 'p3': True} and p.get('invitados') == 'Pedro' and p.get('por') == 'uid-nuevo-123' and isinstance(p.get('creada'), int), ps)
    t = H.texto(pg)
    g.caso('aparece en la lista sin botones de corregir para el jugador', pg.locator('[data-partida]').count() == 1 and 'Corregir' not in t and 'Borrar' not in t, t[:300])
    g.caso('el formulario queda limpio para otra partida', pg.is_visible('#rpVp') and pg.input_value('#rpVp') == '')
    ctx.close()

    # Validaciones de fecha y rivales
    ctx, pg, e = H.abrir(nav, semilla(inscrito=True), '#/liga/libre-a/partidas', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(200)
    pg.select_option('#rpVp', '1')
    pg.fill('#rpFecha', '2026-09-20'); pg.dispatch_event('#rpFecha', 'change')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(100)
    g.caso('fecha antes del inicio: no deja seguir', 'antes del inicio' in pg.inner_text('#rpError'), pg.inner_text('#rpError'))
    pg.fill('#rpFecha', '2026-10-20'); pg.dispatch_event('#rpFecha', 'change')
    pg.check('input[name="rpMesa"][value="4"]'); pg.wait_for_timeout(150)
    pg.select_option('#rpVp', '1')
    for r in ['p1', 'p2', 'p3']:
        pg.check(f'[data-rival="{r}"]')
    msg = pg.evaluate("() => problemaReporte(eventos['libre-a'], Object.assign({}, ui.reporte, { rivales: {p1:true,p2:true,p3:true,p5:true} }))")
    g.caso('más rivales que lugares en la mesa: no deja seguir', 'solo hay 3 rivales' in msg, msg)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    g.caso('mesa de 4 con 3 rivales de la liga: sí pasa a la confirmación', pg.is_visible('text=Revisa antes de guardar'))
    ctx.close()

    # Usuario con sesión pero no inscrito: no puede reportar
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a/partidas', usuario=H.DORA); err += e
    pg.wait_for_timeout(200)
    g.caso('cuenta no inscrita: no ve el formulario de reportar', not pg.locator('[data-reportar]').count())
    ctx.close()

    # ---------------- Organizador: reporta por otro, corrige, borra, cierra temporada
    ctx, pg, e = H.abrir(nav, semilla({'g1': {'jugador': 'p3', 'fecha': '2026-10-05', 'vp': 3, 'mesa': 5, 'por': 'x', 'creada': 5, 'rivales': {'p1': True}}}), '#/liga/libre-a/partidas', usuario=H.ANA); err += e
    nav_t = pg.inner_text('nav')
    g.caso('organizador: pestañas Tabla, Partidas, Jugadores, Equipo y Ajustes', all(x in nav_t for x in ['Tabla', 'Partidas', 'Jugadores', 'Equipo', 'Ajustes']), nav_t)
    g.caso('organizador: elige el jugador de una lista', pg.locator('#rpJugador').count() == 1)
    pg.select_option('#rpJugador', 'p1'); pg.wait_for_timeout(150)
    g.caso('el jugador elegido no sale como su propio rival', not pg.locator('[data-rival="p1"]').count())
    pg.fill('#rpFecha', '2026-10-15'); pg.dispatch_event('#rpFecha', 'change')
    pg.select_option('#rpVp', '4'); pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    t = pg.inner_text('[data-reportar]')
    g.caso('organizador: la confirmación dice que después puede corregirla', 'puedes corregirla o borrarla' in t and not pg.locator('[data-aviso-sin-cambios]').count(), t)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    ps = store(pg, 'eventos/libre-a/partidas') or {}
    g.caso('se guarda la partida de «Ana J» reportada por el organizador', len(ps) == 2 and any(p['jugador'] == 'p1' and p['vp'] == 4 and p['por'] == 'ana' for p in ps.values()), ps)
    pg.click('[data-partida="g1"] >> text=Corregir'); pg.wait_for_timeout(150)
    pg.select_option('#cpVp', '2'); pg.select_option('#cpMesa', '4')
    pg.click('text=Guardar corrección'); pg.wait_for_timeout(300)
    g1 = store(pg, 'eventos/libre-a/partidas/g1') or {}
    g.caso('corregir: cambia VP y mesa, conserva quién la reportó y cuándo', g1.get('vp') == 2 and g1.get('mesa') == 4 and g1.get('por') == 'x' and g1.get('creada') == 5 and g1.get('rivales') == {'p1': True}, g1)
    pg.locator('[data-partida="g1"] button', has_text='Borrar').click()
    pg.locator('[data-partida="g1"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    g.caso('borrar (dos toques) quita la partida', store(pg, 'eventos/libre-a/partidas/g1') is None)
    pg.click('nav >> text=Jugadores'); pg.wait_for_timeout(150)
    pg.locator('[data-jugador="Ana J"] button', has_text='Quitar').click()
    pg.locator('[data-jugador="Ana J"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(200)
    g.caso('no se puede quitar a un jugador con partidas reportadas', store(pg, 'eventos/libre-a/jugadores/p1') is not None and 'partidas reportadas' in H.texto(pg))
    pg.click('nav >> text=Ajustes'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('Ajustes: «Liga de partidas libres (no se puede cambiar)», sin hazañas', 'partidas libres (no se puede cambiar)' in t and 'Hazañas que se pueden otorgar' not in t and not pg.locator('input[name="ajHazanas"]').count(), t[:600])
    g.caso('Ajustes: «Presencial» deshabilitado (solo en línea)', pg.is_disabled('input[name="ajModalidad"][value="presencial"]') and pg.is_checked('input[name="ajModalidad"][value="en-linea"]'))
    pg.fill('#ajInicio', '2026-12-01'); pg.click('#formAjustes button:has-text("Guardar cambios")'); pg.wait_for_timeout(200)
    g.caso('Ajustes: no deja mover el inicio si deja partidas fuera', 'fuera de esas fechas' in pg.inner_text('#ajError') and store(pg, 'eventos/libre-a/inicio') == INICIO, pg.inner_text('#ajError'))
    pg.fill('#ajInicio', INICIO); pg.fill('#ajNombre', 'La Jyhad Eterna T1'); pg.click('#formAjustes button:has-text("Guardar cambios")'); pg.wait_for_timeout(200)
    ev = store(pg, 'eventos/libre-a') or {}
    g.caso('Ajustes: guardar no cambia formato, modalidad ni hazañas', ev.get('nombre') == 'La Jyhad Eterna T1' and ev.get('formato') == 'libre' and ev.get('modalidad') == 'en-linea' and ev.get('hazanasModo') == 'no', {k: ev.get(k) for k in ['nombre', 'formato', 'modalidad', 'hazanasModo']})
    pg.locator('[data-temporada] button', has_text='Cerrar temporada').click()
    pg.locator('[data-temporada] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(250)
    g.caso('Cerrar temporada (dos toques) guarda temporada: «cerrada»', store(pg, 'eventos/libre-a/temporada') == 'cerrada')
    pg.click('nav >> text=Tabla'); pg.wait_for_timeout(150)
    g.caso('tabla: «Clasificación definitiva · temporada cerrada»', 'CLASIFICACIÓN DEFINITIVA' in H.texto(pg).upper())
    pg.click('nav >> text=Partidas'); pg.wait_for_timeout(150)
    g.caso('temporada cerrada: ya no hay formulario de reportar', not pg.locator('[data-reportar]').count() and 'ya no se reportan partidas' in H.texto(pg))
    pg.click('nav >> text=Ajustes'); pg.wait_for_timeout(150)
    pg.locator('[data-temporada] button', has_text='Reabrir temporada').click()
    pg.locator('[data-temporada] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(250)
    g.caso('Reabrir temporada borra el campo', store(pg, 'eventos/libre-a/temporada') is None)
    ctx.close()

    # ---------------- Ayudante: reporta por otros, pero no corrige ni borra
    ctx, pg, e = H.abrir(nav, semilla({'g1': {'jugador': 'p3', 'fecha': '2026-10-05', 'vp': 3, 'mesa': 5, 'por': 'x', 'creada': 5}}), '#/liga/libre-a/partidas', usuario=H.BETO); err += e
    g.caso('ayudante: puede elegir cualquier jugador para reportar', pg.locator('#rpJugador').count() == 1)
    g.caso('ayudante: no ve Corregir ni Borrar', not pg.locator('[data-partida] button').count())
    pg.select_option('#rpJugador', 'p2'); pg.wait_for_timeout(100); pg.select_option('#rpVp', '1')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    g.caso('ayudante: la confirmación avisa que no habrá cambios', pg.is_visible('[data-aviso-sin-cambios]'))
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    ps = store(pg, 'eventos/libre-a/partidas') or {}
    g.caso('ayudante: se guarda la partida de «Beto J»', any(p['jugador'] == 'p2' and p['por'] == 'beto' for p in ps.values()), ps)
    pg.click('nav >> text=Equipo') if pg.locator('nav >> text=Equipo').count() else None
    ctx.close()
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a/equipo', usuario=H.ANA); err += e
    t = H.texto(pg)
    g.caso('Equipo (partidas libres): explica que el ayudante reporta por otros y no corrige', 'reportar partidas por cualquier jugador' in t and 'corregir ni borrar partidas' in t, t[-500:])
    ctx.close()
    # Otras ligas: el texto del ayudante no cambia
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/liga-a/equipo', usuario=H.ANA); err += e
    t = H.texto(pg)
    g.caso('Equipo (liga por jornadas): el ayudante sigue igual que antes', 'pasar lista, sortear mesas' in t and 'reportar partidas' not in t, t[-400:])
    ctx.close()

    # ---------------- Crear una liga de partidas libres
    ctx, pg, e = H.abrir(nav, semilla(), '#/crear', usuario=H.ANA); err += e
    g.caso('crear: el formato no se ve si es presencial', not pg.is_visible('input[name="crFormato"][value="libre"]'))
    pg.check('input[name="crModalidad"][value="en-linea"]'); pg.wait_for_timeout(100)
    g.caso('crear en línea: aparece «🎲 Partidas libres»', pg.is_visible('input[name="crFormato"][value="libre"]'))
    pg.check('input[name="crFormato"][value="libre"]'); pg.wait_for_timeout(100)
    g.caso('al elegir partidas libres se ocultan las hazañas', not pg.is_visible('#crHazanasSet'))
    pg.fill('#crNombre', 'Liga Libre Prueba'); pg.dispatch_event('#crNombre', 'input')
    pg.fill('#crInicio', INICIO); pg.fill('#crFin', FIN)
    pg.click('#formCrear button[type=submit]'); pg.wait_for_timeout(300)
    ev = store(pg, 'eventos/liga-libre-prueba') or {}
    g.caso('se crea con formato «libre», en línea y sin hazañas', ev.get('formato') == 'libre' and ev.get('modalidad') == 'en-linea' and ev.get('hazanasModo') == 'no' and ev.get('tipo') == 'liga', ev)
    ctx.close()
    ctx, pg, e = H.abrir(nav, semilla(), '#/crear', usuario=H.ANA); err += e
    pg.check('input[name="crModalidad"][value="en-linea"]'); pg.check('input[name="crFormato"][value="libre"]')
    pg.check('input[name="crModalidad"][value="presencial"]'); pg.wait_for_timeout(100)
    pg.fill('#crNombre', 'Liga Presencial X'); pg.dispatch_event('#crNombre', 'input'); pg.fill('#crCiudad', 'Puebla')
    pg.fill('#crInicio', INICIO); pg.fill('#crFin', FIN)
    pg.click('#formCrear button[type=submit]'); pg.wait_for_timeout(300)
    ev = store(pg, 'eventos/liga-presencial-x') or {}
    g.caso('presencial: aunque se haya marcado «libre», se crea por jornadas', ev.get('nombre') == 'Liga Presencial X' and 'formato' not in ev, ev)
    ctx.close()
    ctx, pg, e = H.abrir(nav, semilla(), '#/crear/torneo', usuario=H.ANA); err += e
    pg.check('input[name="crModalidad"][value="en-linea"]'); pg.wait_for_timeout(100)
    g.caso('torneo en línea: no ofrece partidas libres', not pg.locator('input[name="crFormato"]').count())
    ctx.close()

    # ---------------- Guía
    ctx, pg, e = H.abrir(nav, semilla(), '#/ayuda'); err += e
    t = H.texto(pg)
    g.caso('guía: pregunta «¿Qué es una liga de partidas libres?»', '¿Qué es una liga de partidas libres?' in t and '70%' in t)
    g.caso('guía: el ayudante reporta por otros en partidas libres', 'reportar partidas por otros jugadores' in t)
    ctx.close()

    # ---------------- Mis eventos
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/mis-eventos', usuario=H.ANA); err += e
    g.caso('Mis eventos: «Partidas libres · 23 partidas»', 'Partidas libres · 23 partidas' in H.texto(pg))
    ctx.close()

    g.caso('sin errores de JavaScript', not err, err[:3])
