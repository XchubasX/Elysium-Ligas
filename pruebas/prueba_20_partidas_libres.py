"""Ligas de «Partidas libres» (26 oct 2026): solo en línea. Un jugador que estuvo en la mesa la
reporta COMPLETA (jugadores de la liga con VP + invitados sin VP); la suma de VP no pasa del tamaño
de la mesa; aviso de mesa repetida; confirmación antes de guardar; tabla 70% rendimiento + 30%
participación; corregir y borrar solo el organizador; cerrar la temporada."""
import copy
import herramientas as H

TITULO = 'Ligas de partidas libres (en línea)'

INICIO, FIN = '2026-10-01', '2026-12-31'


def semilla(mesas=None, inscrito=False, cerrada=False):
    s = copy.deepcopy(H.seed_base())
    s.setdefault('organizadores', {})['ana'] = True
    s['eventos']['libre-a'] = {
        'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'La Jyhad Eterna', 'creada': 1, 'formato': 'libre',
        'modalidad': 'en-linea', 'zona': 'Europe/Madrid', 'plataforma': 'Lackey', 'hazanasModo': 'no',
        'inicio': INICIO, 'fin': FIN, 'organizadorNombre': 'Ana',
        'ayudantes': {'beto': {'nombre': 'Beto', 'desde': 1}},
        'jugadores': {'p1': {'nick': 'Ana J'}, 'p2': {'nick': 'Beto J'}, 'p3': {'nick': 'Carla'}, 'p4': {'nick': 'Toni'}}}
    if mesas:
        s['eventos']['libre-a']['mesas'] = mesas
    if cerrada:
        s['eventos']['libre-a']['temporada'] = 'cerrada'
    if inscrito:
        s['inscripciones'] = {'libre-a': {'uid-nuevo-123': {'nick': 'Toni', 'nombre': 'Pepe Nuevo', 'creada': 1, 'estado': 'aceptada', 'jid': 'p4'}}}
    return s


def ejemplo():
    """El ejemplo del documento: media de la liga 1 VP. Cada mesa con un jugador de la liga e invitados."""
    ms = {}
    n = [0]

    def add(j, vp):
        n[0] += 1
        ms['m%02d' % n[0]] = {'fecha': '2026-10-%02d' % (1 + n[0] % 20), 'mesa': 5, 'jugadores': {j: vp}, 'invitados': 'X, Y, Z, W', 'por': 'ana', 'creada': n[0]}
    add('p1', 3); add('p1', 3)                 # Ana J: 2 partidas, 6 VP
    for _ in range(8): add('p2', 1.5)          # Beto J: 8 partidas, 12 VP
    add('p3', 5)                               # Carla: 1 partida, 5 VP
    for _ in range(12): add('p4', 0)           # Toni: 12 partidas en 0 → media de la liga = 23 / 23 = 1
    return ms


def store(pg, ruta):
    return pg.evaluate("(r) => r.split('/').reduce((n, k) => n == null ? null : (n[k] === undefined ? null : n[k]), window.__store())", ruta)


def filas(pg):
    return pg.evaluate("() => [...document.querySelectorAll('[data-fila]')].map(f => [...f.children].map(c => c.innerText.trim()))")


def marcar(pg, jid, vp):
    """Marca a un jugador de la liga en la mesa y elige sus VP."""
    if not pg.is_checked(f'[data-en-mesa="{jid}"]'):
        pg.check(f'[data-en-mesa="{jid}"]'); pg.wait_for_timeout(120)
    pg.select_option(f'[data-vp-de="{jid}"]', str(vp)); pg.wait_for_timeout(120)


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
    t2 = pg.evaluate("""() => { const ev = { tipo:'liga', formato:'libre', jugadores:{a:{nick:'A'},b:{nick:'B'},c:{nick:'C'}}, mesas:{
        x1:{fecha:'2026-10-01',mesa:4,jugadores:{a:2,b:2}}, x2:{fecha:'2026-10-02',mesa:4,jugadores:{b:0,c:0}} } };
        return [tablaLibre(ev).map(f => f.nick + f.partidas), partidasLiga(ev).length]; }""")
    g.caso('una mesa con 2 jugadores de la liga cuenta una partida para cada uno', t2 == [['A1', 'B2', 'C1'], 4], t2)
    t3 = pg.evaluate("""() => { const ev = { tipo:'liga', formato:'libre', jugadores:{a:{nick:'A'}}, mesas:{ x1:{fecha:'2026-10-01',mesa:4,jugadores:{a:0}} } };
        const f = tablaLibre(ev)[0]; return [f.rendimiento, isFinite(f.total)]; }""")
    g.caso('si nadie tiene VP (media 0), no hay división entre cero: rendimiento 100', t3 == [100, True], t3)
    g.caso('invitados: «Pedro, Lucía y Toño» son 3', pg.evaluate("() => invitadosDe('Pedro, Lucía y Toño').length") == 3)
    ctx.close()

    # ---------------- Portada
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/'); err += e
    t = pg.inner_text('a[href="#/liga/libre-a"]')
    g.caso('portada: «Partidas libres · en juego», 23 mesas y líder con puntos', 'PARTIDAS LIBRES · EN JUEGO' in t.upper() and '23 mesas' in t and 'Líder: Carla · 142.5 pts' in t, t)
    g.caso('portada: dice «🌐 En línea · Lackey»', 'En línea · Lackey' in t, t)
    ctx.close()

    # ---------------- Página pública: tabla y mesas
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/liga/libre-a'); err += e
    nav_t = pg.inner_text('nav')
    g.caso('pestañas públicas: Tabla y Mesas (sin Calendario ni Hazañas)', 'Tabla' in nav_t and 'Mesas' in nav_t and 'Calendario' not in nav_t and 'Hazañas' not in nav_t, nav_t)
    body = H.texto(pg)
    g.caso('cabecera: un jugador de la mesa la reporta completa', 'la reporta completa' in body)
    g.caso('tabla: «Clasificación provisional», media 1 VP y 23 mesas', 'CLASIFICACIÓN PROVISIONAL' in body.upper() and 'Media de la liga: 1 VP' in body and '23 mesas' in body, body[:500])
    f = filas(pg)
    g.caso('tabla: Carla 1.º con 1 partida, 5 VP, 200, 8.3, 142.5 y PROVISIONAL', f and f[0][0] == '1' and 'Carla' in f[0][1] and 'PROVISIONAL' in f[0][1] and f[0][2:] == ['1', '5', '200', '8.3', '142.5'], f[:1])
    g.caso('tabla: Beto J sin marca de provisional', any('Beto J' in x[1] and 'PROVISIONAL' not in x[1] for x in f), f)
    pg.click('[data-como-se-calcula] summary'); pg.wait_for_timeout(100)
    t = pg.inner_text('[data-como-se-calcula]')
    g.caso('«¿Cómo se calcula?» explica 70/30, relleno de 3 partidas, 12 partidas y que cada mesa cuenta para todos', '70%' in t and '30%' in t and '3 partidas' in t and '12 partidas' in t and 'cada jugador de la liga' in t, t[:300])
    href = pg.get_attribute('a[href*="wa.me"]', 'href') or ''
    g.caso('WhatsApp: «clasificación provisional» y «Carla · 142.5 pts»', 'provisional' in href and 'Carla%20%C2%B7%20142.5%20pts' in href, href[:300])
    hojas = pg.evaluate("() => hojasExcel(eventos['libre-a']).map(h => [h[0], h[1].length])")
    g.caso('Excel: hojas Clasificación (4 jugadores) y Mesas (23 renglones)', hojas == [['Clasificación', 5], ['Mesas', 24]], hojas)
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    pg.click('nav >> text=Mesas'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('pestaña Mesas pública: lista sin formulario ni botones de corregir', pg.locator('[data-mesa]').count() == 23 and not pg.locator('[data-reportar]').count() and 'Corregir' not in t, t[:300])
    g.caso('cada mesa muestra jugadores con VP, invitados y la suma', 'Carla 5 VP · X, Y, Z, W (invitados)' in t and '5 de 5 VP' in t, t[:600])
    g.caso('sin sesión: invita a entrar e inscribirse para reportar', 'inscríbete para reportar' in t)
    ctx.close()

    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a'); err += e
    g.caso('sin mesas: «Todavía no hay mesas reportadas»', 'Todavía no hay mesas reportadas' in H.texto(pg))
    ctx.close()

    # ---------------- Jugador inscrito reporta la mesa completa
    ctx, pg, e = H.abrir(nav, semilla(inscrito=True), '#/liga/libre-a', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(200)
    t = pg.inner_text('[data-inscripcion]') if pg.locator('[data-inscripcion]').count() else ''
    g.caso('jugador inscrito: «Estás inscrito como «Toni»» con botón «🎲 Reportar mesa»', 'Estás inscrito como «Toni»' in t and 'Reportar mesa' in t, t)
    pg.click('[data-inscripcion] >> text=Reportar mesa'); pg.wait_for_timeout(250)
    t = pg.inner_text('[data-reportar]')
    g.caso('formulario: explica que una sola persona reporta la mesa completa', 'Una sola persona reporta la mesa completa' in t, t)
    g.caso('él mismo ya está marcado en la mesa y no se puede quitar', pg.is_checked('[data-en-mesa="p4"]') and pg.is_disabled('[data-en-mesa="p4"]') and 'Toni (tú)' in t)
    g.caso('VP de 0 a 5 en mesa de 5', pg.evaluate("() => [...document.querySelectorAll('[data-vp-de=\"p4\"] option')].map(o=>o.value).filter(Boolean).join(',')") == '0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5')
    pg.fill('#rpFecha', '2026-10-20'); pg.dispatch_event('#rpFecha', 'change')
    marcar(pg, 'p4', 1); marcar(pg, 'p1', 3); marcar(pg, 'p2', 3)
    pg.fill('#rpInvitados', 'X, Y'); pg.dispatch_event('#rpInvitados', 'change'); pg.wait_for_timeout(150)
    c = pg.inner_text('[data-cuentas]')
    g.caso('cuenta en vivo: suma 7 de 5 y lugares 5 de 5', 'Suma de VP: 7 de 5' in c and 'Lugares: 5 de 5' in c and '3 de la liga + 2 invitados' in c, c)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(100)
    g.caso('EL CASO DE LA PRUEBA: suma de 7 VP en mesa de 5 no deja guardar', 'no puede pasar de 5' in pg.inner_text('#rpError'), pg.inner_text('#rpError'))
    marcar(pg, 'p2', 1)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(200)
    t = pg.inner_text('[data-reportar]')
    g.caso('confirmación: fecha, mesa, cada jugador con sus VP e invitados', 'Revisa antes de guardar' in t and '20 oct 2026' in t and 'mesa de 5' in t and 'Ana J' in t and 'Beto J' in t and 'Toni' in t and 'Invitados: X, Y' in t, t)
    g.caso('confirmación: avisa que después no podrá cambiarla', pg.is_visible('[data-aviso-sin-cambios]'))
    g.caso('sin mesas parecidas: no avisa de repetida', not pg.locator('[data-aviso-repetida]').count())
    g.caso('todavía no se guarda nada antes de confirmar', store(pg, 'eventos/libre-a/mesas') is None)
    pg.click('text=Volver a editar'); pg.wait_for_timeout(150)
    g.caso('«Volver a editar» conserva lo capturado', pg.input_value('[data-vp-de="p1"]') == '3' and pg.input_value('#rpInvitados') == 'X, Y')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    ms = store(pg, 'eventos/libre-a/mesas') or {}
    m = next(iter(ms.values()), {})
    g.caso('se guarda UNA mesa con los 3 jugadores y sus VP, invitados, por y creada',
           len(ms) == 1 and m.get('fecha') == '2026-10-20' and m.get('mesa') == 5 and m.get('jugadores') == {'p4': 1, 'p1': 3, 'p2': 1}
           and m.get('invitados') == 'X, Y' and m.get('por') == 'uid-nuevo-123' and isinstance(m.get('creada'), int), ms)
    tb = pg.evaluate("() => tablaLibre(eventos['libre-a']).map(f => f.nick + ':' + f.partidas + ':' + f.vp).sort()")
    g.caso('la mesa cuenta como partida para los 3 jugadores de la liga', tb == ['Ana J:1:3', 'Beto J:1:1', 'Toni:1:1'], tb)
    t = H.texto(pg)
    g.caso('aparece en la lista sin botones de corregir para el jugador', pg.locator('[data-mesa]').count() == 1 and 'Corregir' not in t, t[:300])
    # Otra mesa el mismo día con 2 de los mismos: avisa de repetida, con los jugadores de la mesa
    pg.fill('#rpFecha', '2026-10-20'); pg.dispatch_event('#rpFecha', 'change')
    marcar(pg, 'p4', 2); marcar(pg, 'p1', 0)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(200)
    t = pg.inner_text('[data-aviso-repetida]') if pg.locator('[data-aviso-repetida]').count() else ''
    g.caso('mismo día y 2 jugadores en común: avisa «¿Es una mesa repetida?» con los jugadores de esa mesa', '¿Es una mesa repetida?' in t and 'Ana J 3 VP' in t and 'Beto J 1 VP' in t and 'Toni 1 VP' in t and 'X, Y (invitados)' in t, t)
    g.caso('el aviso deja guardar («Es otra mesa: guardar»)', pg.is_visible('text=Es otra mesa: guardar'))
    pg.click('text=Es otra mesa: guardar'); pg.wait_for_timeout(300)
    g.caso('si es otra mesa, se guarda', len(store(pg, 'eventos/libre-a/mesas') or {}) == 2)
    ctx.close()

    # Solo un jugador en común: no avisa; validaciones de fecha y lugares
    ctx, pg, e = H.abrir(nav, semilla({'m1': {'fecha': '2026-10-20', 'mesa': 4, 'jugadores': {'p4': 2, 'p3': 1}, 'por': 'x', 'creada': 1}}, inscrito=True), '#/liga/libre-a/partidas', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(200)
    pg.fill('#rpFecha', '2026-10-20'); pg.dispatch_event('#rpFecha', 'change')
    marcar(pg, 'p4', 1); marcar(pg, 'p1', 1)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    g.caso('mismo día pero solo 1 jugador en común: no avisa de repetida', pg.is_visible('text=Revisa antes de guardar') and not pg.locator('[data-aviso-repetida]').count())
    pg.click('text=Volver a editar'); pg.wait_for_timeout(150)
    pg.check('input[name="rpMesa"][value="4"]'); pg.wait_for_timeout(150)
    marcar(pg, 'p4', 1); marcar(pg, 'p1', 1)
    pg.fill('#rpInvitados', 'A, B, C'); pg.dispatch_event('#rpInvitados', 'change'); pg.wait_for_timeout(150)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(100)
    g.caso('más personas que lugares (2 + 3 invitados en mesa de 4): no deja seguir', 'Hay 5 personas' in pg.inner_text('#rpError'), pg.inner_text('#rpError'))
    pg.fill('#rpInvitados', 'A, B'); pg.dispatch_event('#rpInvitados', 'change'); pg.wait_for_timeout(100)
    pg.fill('#rpFecha', '2026-09-20'); pg.dispatch_event('#rpFecha', 'change')
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(100)
    g.caso('fecha antes del inicio: no deja seguir', 'antes del inicio' in pg.inner_text('#rpError'), pg.inner_text('#rpError'))
    pg.fill('#rpFecha', '2026-10-21'); pg.dispatch_event('#rpFecha', 'change')
    pg.check('[data-en-mesa="p3"]'); pg.wait_for_timeout(120)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(100)
    g.caso('falta elegir VP de un jugador: dice de quién', 'Elige los VP de Carla' in pg.inner_text('#rpError'), pg.inner_text('#rpError'))
    msg = pg.evaluate("() => problemaMesa(eventos['libre-a'], { fecha:'2026-10-21', mesa:5, jugadores:{p1:'1'}, invitados:'' }, 'p4')")
    g.caso('un jugador no puede reportar una mesa en la que no jugó', 'en las que jugaste' in msg, msg)
    ctx.close()

    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a/partidas', usuario=H.DORA); err += e
    pg.wait_for_timeout(200)
    g.caso('cuenta no inscrita: no ve el formulario de reportar', not pg.locator('[data-reportar]').count())
    ctx.close()

    # ---------------- Organizador: reporta sin haber jugado, corrige, borra, cierra temporada
    m1 = {'m1': {'fecha': '2026-10-05', 'mesa': 5, 'jugadores': {'p3': 3, 'p1': 1}, 'invitados': 'X', 'por': 'x', 'creada': 5}}
    ctx, pg, e = H.abrir(nav, semilla(m1), '#/liga/libre-a/partidas', usuario=H.ANA); err += e
    nav_t = pg.inner_text('nav')
    g.caso('organizador: pestañas Tabla, Mesas, Jugadores, Equipo y Ajustes', all(x in nav_t for x in ['Tabla', 'Mesas', 'Jugadores', 'Equipo', 'Ajustes']), nav_t)
    g.caso('organizador: nadie viene marcado (puede reportar mesas que no jugó)', not pg.locator('[data-en-mesa]:checked').count())
    pg.fill('#rpFecha', '2026-10-15'); pg.dispatch_event('#rpFecha', 'change')
    marcar(pg, 'p2', 4); marcar(pg, 'p4', 0)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    t = pg.inner_text('[data-reportar]')
    g.caso('organizador: la confirmación dice que después puede corregirla', 'puedes corregirla o borrarla' in t and not pg.locator('[data-aviso-sin-cambios]').count(), t)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    ms = store(pg, 'eventos/libre-a/mesas') or {}
    g.caso('se guarda la mesa reportada por el organizador', len(ms) == 2 and any(m.get('jugadores') == {'p2': 4, 'p4': 0} and m.get('por') == 'ana' for m in ms.values()), ms)
    pg.click('[data-mesa="m1"] >> text=Corregir'); pg.wait_for_timeout(200)
    t = pg.inner_text('[data-reportar]')
    g.caso('corregir: abre la mesa con sus datos', 'Corregir mesa' in t and pg.input_value('[data-vp-de="p3"]') == '3' and pg.input_value('#rpInvitados') == 'X', t[:200])
    marcar(pg, 'p3', 2); marcar(pg, 'p2', 1)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    m = store(pg, 'eventos/libre-a/mesas/m1') or {}
    g.caso('corregir: cambia VP y jugadores, conserva quién la reportó y cuándo', m.get('jugadores') == {'p3': 2, 'p1': 1, 'p2': 1} and m.get('por') == 'x' and m.get('creada') == 5 and len(store(pg, 'eventos/libre-a/mesas')) == 2, m)
    pg.locator('[data-mesa="m1"] button', has_text='Borrar').click()
    pg.locator('[data-mesa="m1"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    g.caso('borrar (dos toques) quita la mesa', store(pg, 'eventos/libre-a/mesas/m1') is None)
    pg.click('nav >> text=Jugadores'); pg.wait_for_timeout(150)
    pg.locator('[data-jugador="Beto J"] button', has_text='Quitar').click()
    pg.locator('[data-jugador="Beto J"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(200)
    g.caso('no se puede quitar a un jugador que aparece en una mesa', store(pg, 'eventos/libre-a/jugadores/p2') is not None and 'aparece en alguna mesa' in H.texto(pg))
    pg.click('nav >> text=Ajustes'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('Ajustes: «Liga de partidas libres (no se puede cambiar)», sin hazañas', 'partidas libres (no se puede cambiar)' in t and not pg.locator('input[name="ajHazanas"]').count(), t[:600])
    g.caso('Ajustes: «Presencial» deshabilitado (solo en línea)', pg.is_disabled('input[name="ajModalidad"][value="presencial"]') and pg.is_checked('input[name="ajModalidad"][value="en-linea"]'))
    pg.fill('#ajInicio', '2026-12-01'); pg.click('#formAjustes button:has-text("Guardar cambios")'); pg.wait_for_timeout(200)
    g.caso('Ajustes: no deja mover el inicio si deja mesas fuera', 'fuera de esas fechas' in pg.inner_text('#ajError') and store(pg, 'eventos/libre-a/inicio') == INICIO, pg.inner_text('#ajError'))
    pg.fill('#ajInicio', INICIO); pg.fill('#ajNombre', 'La Jyhad Eterna T1'); pg.click('#formAjustes button:has-text("Guardar cambios")'); pg.wait_for_timeout(200)
    ev = store(pg, 'eventos/libre-a') or {}
    g.caso('Ajustes: guardar no cambia formato, modalidad ni hazañas', ev.get('nombre') == 'La Jyhad Eterna T1' and ev.get('formato') == 'libre' and ev.get('modalidad') == 'en-linea' and ev.get('hazanasModo') == 'no', {k: ev.get(k) for k in ['nombre', 'formato', 'modalidad', 'hazanasModo']})
    pg.locator('[data-temporada] button', has_text='Cerrar temporada').click()
    pg.locator('[data-temporada] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(250)
    g.caso('Cerrar temporada (dos toques) guarda temporada: «cerrada»', store(pg, 'eventos/libre-a/temporada') == 'cerrada')
    pg.click('nav >> text=Tabla'); pg.wait_for_timeout(150)
    g.caso('tabla: «Clasificación definitiva · temporada cerrada»', 'CLASIFICACIÓN DEFINITIVA' in H.texto(pg).upper())
    pg.click('nav >> text=Mesas'); pg.wait_for_timeout(150)
    g.caso('temporada cerrada: ya no hay formulario de reportar', not pg.locator('[data-reportar]').count() and 'ya no se reportan mesas' in H.texto(pg))
    pg.click('nav >> text=Ajustes'); pg.wait_for_timeout(150)
    pg.locator('[data-temporada] button', has_text='Reabrir temporada').click()
    pg.locator('[data-temporada] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(250)
    g.caso('Reabrir temporada borra el campo', store(pg, 'eventos/libre-a/temporada') is None)
    ctx.close()

    # ---------------- Ayudante: reporta mesas que no jugó, no corrige ni borra
    ctx, pg, e = H.abrir(nav, semilla(m1), '#/liga/libre-a/partidas', usuario=H.BETO); err += e
    g.caso('ayudante: ve el formulario para reportar', pg.locator('[data-reportar]').count() == 1)
    g.caso('ayudante: no ve Corregir ni Borrar', not pg.locator('[data-mesa] button').count())
    pg.fill('#rpFecha', '2026-10-16'); pg.dispatch_event('#rpFecha', 'change')
    marcar(pg, 'p1', 2)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    g.caso('ayudante: la confirmación avisa que no habrá cambios', pg.is_visible('[data-aviso-sin-cambios]'))
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    ms = store(pg, 'eventos/libre-a/mesas') or {}
    g.caso('ayudante: se guarda la mesa', any(m.get('jugadores') == {'p1': 2} and m.get('por') == 'beto' for m in ms.values()), ms)
    ctx.close()
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a/equipo', usuario=H.ANA); err += e
    t = H.texto(pg)
    g.caso('Equipo (partidas libres): el ayudante reporta mesas aunque no las haya jugado y no corrige', 'reportar mesas aunque no las haya jugado' in t and 'corregir ni borrar mesas' in t, t[-500:])
    ctx.close()
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/liga-a/equipo', usuario=H.ANA); err += e
    t = H.texto(pg)
    g.caso('Equipo (liga por jornadas): el ayudante sigue igual que antes', 'pasar lista, sortear mesas' in t and 'reportar mesas' not in t, t[-400:])
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

    # ---------------- Guía y Mis eventos
    ctx, pg, e = H.abrir(nav, semilla(), '#/ayuda'); err += e
    t = H.texto(pg)
    g.caso('guía: «¿Qué es una liga de partidas libres?» explica la mesa completa', '¿Qué es una liga de partidas libres?' in t and 'la reporta completa' in t and '70%' in t)
    g.caso('guía: el ayudante reporta mesas en partidas libres', 'reportar mesas aunque no las haya jugado' in t)
    ctx.close()
    ctx, pg, e = H.abrir(nav, semilla(ejemplo()), '#/mis-eventos', usuario=H.ANA); err += e
    g.caso('Mis eventos: «Partidas libres · 23 mesas»', 'Partidas libres · 23 mesas' in H.texto(pg))
    ctx.close()

    g.caso('sin errores de JavaScript', not err, err[:3])
