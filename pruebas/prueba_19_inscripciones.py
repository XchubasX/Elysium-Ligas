"""Inscripciones (24 oct 2026): el jugador se inscribe solo con Google y el organizador
acepta; nick repetido (¿es el mismo?), aceptar todas, rechazar; pegar una lista."""
import copy
import herramientas as H

TITULO = 'Inscripciones con Google y pegar lista de jugadores'


def semilla(abiertas=False, pendientes=None):
    s = copy.deepcopy(H.seed_base())
    ev = s['eventos']['liga-a']
    ev.update({'pais': 'México', 'ciudad': 'Ciudad de México'})
    ev['jugadores'] = {'p1': {'nick': 'Toni'}}
    if abiertas:
        ev['inscripciones'] = 'abiertas'
    if pendientes:
        s['inscripciones'] = {'liga-a': pendientes}
    return s


PEND = {
    'uid-nuevo-123': {'nick': 'Toni', 'nombre': 'Pepe Nuevo', 'creada': 1, 'estado': 'pendiente'},
    'u2': {'nick': 'Lalo', 'nombre': 'Eduardo Ruiz', 'creada': 2, 'estado': 'pendiente'},
    'u3': {'nick': 'Mau', 'nombre': 'Mauricio Gil', 'creada': 3, 'estado': 'pendiente'},
}


def store(pg, ruta):
    return pg.evaluate("(r) => r.split('/').reduce((n, k) => n == null ? null : (n[k] === undefined ? null : n[k]), window.__store())", ruta)


def correr(nav, g):
    err = []

    # ---------------- El organizador abre las inscripciones
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/liga-a/jugadores', usuario=H.ANA); err += e
    t = pg.inner_text('[data-inscripciones]')
    g.caso('Jugadores: tarjeta «📝 Inscripciones» CERRADAS con «Abrir inscripciones»', 'CERRADAS' in t and 'Abrir inscripciones' in t, t)
    pg.click('text=Abrir inscripciones'); pg.wait_for_timeout(250)
    g.caso('al abrirlas se guarda inscripciones: «abiertas»', store(pg, 'eventos/liga-a/inscripciones') == 'abiertas', pg.evaluate('window.__denegadas'))
    t = pg.inner_text('[data-inscripciones]')
    g.caso('abiertas: botones «Compartir por WhatsApp» y «Copiar enlace»', 'ABIERTAS' in t and 'Compartir por WhatsApp' in t and 'Copiar enlace' in t, t)
    href = pg.get_attribute('[data-inscripciones] a[href*="wa.me"]', 'href') or ''
    g.caso('el mensaje de WhatsApp trae el enlace de la liga', 'Inscr' in href and 'liga%2Fliga-a' in href, href[:200])
    g.caso('Jugadores: hay «Pegar varios nombres»', pg.is_visible('text=Pegar varios nombres'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # Portada
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True), '#/'); err += e
    g.caso('portada: la tarjeta dice «📝 Inscripciones abiertas»', '📝 Inscripciones abiertas' in pg.inner_text('a[href="#/liga/liga-a"]'))
    ctx.close()

    # ---------------- El jugador se inscribe
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True), '#/liga/liga-a'); err += e
    t = pg.inner_text('[data-inscripcion]') if pg.locator('[data-inscripcion]').count() else ''
    g.caso('sin sesión: «📝 Inscripciones abiertas» con botón «Inscribirme»', 'Inscripciones abiertas' in t and 'Inscribirme' in t, t)
    pg.evaluate('(u) => { window.__NEXT_USER__ = u; }', H.NUEVO)
    pg.click('[data-inscripcion] >> text=Inscribirme'); pg.wait_for_timeout(300)
    g.caso('al tocar «Inscribirme» entra con Google y sale el campo de nick', pg.is_visible('#insNick'))
    g.caso('el nick viene sugerido con su primer nombre («Pepe»)', pg.input_value('#insNick') == 'Pepe', pg.input_value('#insNick'))
    pg.fill('#insNick', 'Toni'); pg.click('#formInscripcion button'); pg.wait_for_timeout(300)
    ins = store(pg, 'inscripciones/liga-a/uid-nuevo-123') or {}
    g.caso('se guarda su inscripción pendiente con nick y nombre de Google, sin correo', ins.get('nick') == 'Toni' and ins.get('nombre') == 'Pepe Nuevo' and ins.get('estado') == 'pendiente' and '@' not in str(ins), ins)
    t = pg.inner_text('[data-inscripcion]')
    g.caso('cambia a «✓ Inscripción enviada como «Toni»»', 'Inscripción enviada como «Toni»' in t, t)
    g.caso('la página pública no muestra el nombre de Google', 'Pepe Nuevo' not in pg.inner_text('#app'))
    g.caso('recuerda el nick para la próxima liga', pg.evaluate("localStorage.getItem('ligas_mi_nick')") == 'Toni')
    # En vivo: el organizador la acepta (unida a Toni, p1)
    pg.evaluate("db.ref().update({'inscripciones/liga-a/uid-nuevo-123/estado': 'aceptada', 'inscripciones/liga-a/uid-nuevo-123/jid': 'p1'})"); pg.wait_for_timeout(300)
    t = pg.inner_text('[data-inscripcion]') if pg.locator('[data-inscripcion]').count() else ''
    g.caso('en vivo: al aceptarlo dice «✅ Estás inscrito como «Toni»»', 'Estás inscrito como «Toni»' in t, t)
    g.caso('en vivo: le avisa «¡Ya te aceptaron en la liga!»', 'Ya te aceptaron' in pg.inner_text('body'))
    ctx.close()

    # Cancelar una inscripción pendiente
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True, pendientes={'uid-nuevo-123': dict(PEND['uid-nuevo-123'])}), '#/liga/liga-a', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(150)
    b = pg.locator('[data-inscripcion] button', has_text='Cancelar inscripción'); b.click()
    pg.locator('[data-inscripcion] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    g.caso('puede cancelar su inscripción pendiente (dos toques)', store(pg, 'inscripciones/liga-a/uid-nuevo-123') is None and pg.is_visible('#insNick'))
    ctx.close()

    # Lo aceptaron y luego lo quitaron de la liga: puede volver a inscribirse
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True, pendientes={'uid-nuevo-123': {'nick': 'Viejo', 'nombre': 'Pepe Nuevo', 'creada': 1, 'estado': 'aceptada', 'jid': 'p-borrado'}}), '#/liga/liga-a', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(150)
    g.caso('aceptado pero ya no está en la liga: vuelve a salir el formulario', pg.is_visible('#insNick'))
    pg.fill('#insNick', 'Pepe'); pg.click('#formInscripcion button'); pg.wait_for_timeout(300)
    ins = store(pg, 'inscripciones/liga-a/uid-nuevo-123') or {}
    g.caso('y se reemplaza por una inscripción nueva pendiente', ins.get('nick') == 'Pepe' and ins.get('estado') == 'pendiente' and 'jid' not in ins, ins)
    ctx.close()

    # Cerradas: nadie ve el formulario
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/liga-a', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(150)
    g.caso('inscripciones cerradas: no sale nada para inscribirse', pg.locator('[data-inscripcion]').count() == 0)
    ctx.close()

    # ---------------- El organizador acepta
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True, pendientes=copy.deepcopy(PEND)), '#/liga/liga-a/jugadores', usuario=H.ANA); err += e
    pg.wait_for_timeout(150)
    t = pg.inner_text('[data-inscripciones]')
    g.caso('el equipo ve «Por aceptar» con nick y nombre de Google («Lalo · Eduardo Ruiz»)', 'Por aceptar' in t and 'Lalo' in t and 'Eduardo Ruiz' in t, t)
    g.caso('nick repetido: pregunta «¿Es la misma persona?» para Toni', 'Ya hay un jugador «Toni»' in pg.inner_text('[data-inscrito="Toni"]'))
    pg.click('text=Aceptar todas las que no tienen nick repetido'); pg.wait_for_timeout(300)
    js = store(pg, 'eventos/liga-a/jugadores') or {}
    nicks = sorted(v['nick'] for v in js.values())
    g.caso('«Aceptar todas»: entran Lalo y Mau como jugadores', nicks == ['Lalo', 'Mau', 'Toni'], nicks)
    i2 = store(pg, 'inscripciones/liga-a/u2') or {}
    g.caso('sus inscripciones quedan «aceptada» con su jugador', i2.get('estado') == 'aceptada' and i2.get('jid') in js, i2)
    g.caso('«Aceptar todas» deja pendiente al del nick repetido', (store(pg, 'inscripciones/liga-a/uid-nuevo-123') or {}).get('estado') == 'pendiente')
    pg.click('[data-inscrito="Toni"] >> text=Sí, es el mismo'); pg.wait_for_timeout(300)
    i1 = store(pg, 'inscripciones/liga-a/uid-nuevo-123') or {}
    js = store(pg, 'eventos/liga-a/jugadores') or {}
    g.caso('«Sí, es el mismo»: se une al Toni que ya estaba (no se duplica)', i1.get('estado') == 'aceptada' and i1.get('jid') == 'p1' and len(js) == 3, (i1, js))
    g.caso('ya no quedan pendientes', 'Por aceptar' not in pg.inner_text('[data-inscripciones]'))
    ctx.close()

    # «No, es otra persona» y Rechazar
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True, pendientes={'uid-nuevo-123': dict(PEND['uid-nuevo-123']), 'u2': dict(PEND['u2'])}), '#/liga/liga-a/jugadores', usuario=H.ANA); err += e
    pg.wait_for_timeout(150)
    pg.click('[data-inscrito="Toni"] >> text=No, es otra persona'); pg.wait_for_timeout(100)
    g.caso('«No, es otra persona»: propone otro nick («Toni 2»)', pg.input_value('#otroNick') == 'Toni 2')
    pg.fill('#otroNick', 'Toni Pepe'); pg.click('[data-inscrito="Toni"] >> button:has-text("Aceptar")'); pg.wait_for_timeout(300)
    js = store(pg, 'eventos/liga-a/jugadores') or {}
    i1 = store(pg, 'inscripciones/liga-a/uid-nuevo-123') or {}
    g.caso('se acepta como jugador nuevo «Toni Pepe»', i1.get('estado') == 'aceptada' and (js.get(i1.get('jid')) or {}).get('nick') == 'Toni Pepe', (i1, js))
    b = pg.locator('[data-inscrito="Lalo"] button', has_text='Rechazar'); b.click()
    pg.locator('[data-inscrito="Lalo"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    g.caso('«Rechazar» (dos toques) borra la inscripción', store(pg, 'inscripciones/liga-a/u2') is None)
    # Cerrar inscripciones
    pg.locator('[data-inscripciones] button', has_text='Cerrar inscripciones').click()
    pg.locator('[data-inscripciones] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(250)
    g.caso('«Cerrar inscripciones» (dos toques) borra el campo', store(pg, 'eventos/liga-a/inscripciones') is None)
    ctx.close()

    # Ayudante: ve y acepta, pero no abre ni cierra
    ctx, pg, e = H.abrir(nav, semilla(abiertas=True, pendientes={'u3': dict(PEND['u3'])}), '#/liga/liga-a/jugadores', usuario=H.BETO); err += e
    pg.wait_for_timeout(150)
    t = pg.inner_text('[data-inscripciones]')
    g.caso('ayudante: ve las pendientes, sin botón de abrir/cerrar', 'Mau' in t and 'Solo el organizador' in t and 'Cerrar inscripciones' not in t, t)
    pg.click('[data-inscrito="Mau"] >> button:has-text("Aceptar")'); pg.wait_for_timeout(300)
    g.caso('ayudante: puede aceptar', (store(pg, 'inscripciones/liga-a/u3') or {}).get('estado') == 'aceptada')
    ctx.close()

    # ---------------- Pegar lista
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/liga-a/jugadores', usuario=H.ANA); err += e
    pg.click('text=Pegar varios nombres')
    pg.fill('#listaNicks', '1. Lasombra\n2) Fer\n- Iván\n• toni\n\n   \nFer\n')
    pg.click('text=Agregar todos'); pg.wait_for_timeout(300)
    nicks = sorted(v['nick'] for v in (store(pg, 'eventos/liga-a/jugadores') or {}).values())
    g.caso('pegar lista: quita números y viñetas, salta vacíos y repetidos', nicks == ['Fer', 'Iván', 'Lasombra', 'Toni'], nicks)
    g.caso('pegar lista: avisa «Se agregaron 3 jugadores (2 ya estaban)»', 'Se agregaron 3 jugadores (2 ya estaban)' in pg.inner_text('body'))
    ctx.close()

    # ---------------- Guía «Cómo funciona»
    ctx, pg, e = H.abrir(nav, semilla(), '#/ayuda'); err += e
    t = pg.inner_text('#app')
    g.caso('guía: paso «Inscribe a los jugadores» con el enlace', 'Inscribe a los jugadores' in t and 'Abre inscripciones' in t, t[:400])
    g.caso('guía: «¿Los jugadores necesitan cuenta?» explica lo de Google', 'Para inscribirse solos con el enlace, sí' in t)
    g.caso('guía: nueva pregunta «¿Se puede hacer una liga en línea?»', '¿Se puede hacer una liga en línea?' in t)
    ctx.close()

    g.caso('sin errores de JavaScript', not err, err)
