"""Eventos En línea (24 oct 2026): sin país ni ciudad, plataforma opcional, zona horaria
del organizador y horarios convertidos a la hora de quien mira."""
import copy
import herramientas as H

TITULO = 'Eventos En línea: modalidad, plataforma y hora de cada quien'

MADRID = 'Europe/Madrid'


def error(pg, campo='#crError'):
    return pg.inner_text(campo) if pg.is_visible(campo) else ''


def semilla():
    s = copy.deepcopy(H.seed_base())
    s.setdefault('eventos', {})
    s['eventos']['liga-a'].update({'pais': 'México', 'ciudad': 'Ciudad de México', 'inicio': '2026-10-01', 'fin': '2026-12-31'})
    s['eventos']['torneo-online'] = {
        'ownerUid': 'ana', 'tipo': 'torneo', 'nombre': 'Torneo Online', 'creada': 1, 'modalidad': 'en-linea',
        'zona': 'America/Mexico_City', 'plataforma': 'Discord', 'fecha': '2026-11-07', 'hora': '20:00',
        'rondasPlan': 3, 'conFinal': True, 'jornadas': {'j1': {'numero': 1, 'fecha': '2026-11-07', 'hora': '20:00', 'estado': 'pendiente'}}}
    s['eventos']['liga-online'] = {
        'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'Liga Online', 'creada': 1, 'modalidad': 'en-linea',
        'zona': 'America/Mexico_City', 'inicio': '2026-10-01', 'fin': '2026-12-31',
        'jornadas': {'j1': {'numero': 1, 'fecha': '2026-11-14', 'hora': '19:30', 'estado': 'pendiente'}}}
    return s


def correr(nav, g):
    seed = semilla()
    err = []

    # ---------------- Crear una liga en línea
    ctx, pg, e = H.abrir(nav, seed, '#/crear', usuario=H.ANA, timezone_id='America/Santiago'); err += e
    g.caso('crear: hay selector «Presencial / En línea», con Presencial marcado', pg.is_checked('input[name=crModalidad][value=presencial]') and pg.is_visible('text=🌐 En línea'))
    g.caso('crear: en Presencial se ven país y ciudad', pg.is_visible('#crPais') and pg.is_visible('#crCiudad') and not pg.is_visible('#crPlataforma'))
    pg.check('input[name=crModalidad][value=en-linea]'); pg.wait_for_timeout(50)
    g.caso('crear: al elegir En línea desaparecen país y ciudad', not pg.is_visible('#crPais') and not pg.is_visible('#crCiudad'))
    g.caso('crear: en En línea sale «Plataforma (opcional)» y no hay selector de zona', pg.is_visible('#crPlataforma') and pg.locator('select[id$=Zona]').count() == 0)
    zi = pg.inner_text('[data-zona-info]') if pg.is_visible('[data-zona-info]') else ''
    g.caso('crear: dice la zona detectada «Santiago de Chile (detectada de tu aparato)»', 'Santiago de Chile' in zi and 'detectada de tu aparato' in zi, zi)
    pg.fill('#crNombre', 'Liga Virtual Uno'); pg.dispatch_event('#crNombre', 'input')
    # la ciudad se queda vacía: en línea no la pide
    pg.fill('#crPlataforma', 'Discord + Tabletop Simulator')
    pg.fill('#crInicio', '2026-11-01'); pg.fill('#crFin', '2026-12-20')
    g.caso('crear: sin desborde horizontal a 390 px', H.sin_desborde(pg))
    pg.click('text=Crear liga'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-virtual-uno']") or {}
    g.caso('se crea sin país ni ciudad, con modalidad, plataforma y zona', ev.get('modalidad') == 'en-linea' and ev.get('plataforma') == 'Discord + Tabletop Simulator' and ev.get('zona') == 'America/Santiago' and 'pais' not in ev and 'ciudad' not in ev, (ev, error(pg)))
    t = pg.inner_text('#app')
    g.caso('su página dice «🌐 En línea · Discord + Tabletop Simulator»', '🌐 En línea · Discord + Tabletop Simulator' in t, t[:200])
    ctx.close()

    # Plataforma vacía: no se guarda el campo
    ctx, pg, e = H.abrir(nav, seed, '#/crear/torneo', usuario=H.ANA); err += e
    pg.check('input[name=crModalidad][value=en-linea]')
    pg.fill('#crNombre', 'Torneo Rapido'); pg.dispatch_event('#crNombre', 'input')
    pg.fill('#crFecha', '2026-11-21'); pg.fill('#crHora', '18:00')
    pg.click('text=Crear torneo'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['torneo-rapido']") or {}
    g.caso('torneo en línea sin plataforma: se crea sin ese campo', ev.get('modalidad') == 'en-linea' and 'plataforma' not in ev and ev.get('hora') == '18:00', ev)
    ctx.close()

    # Presencial sigue pidiendo país y ciudad
    ctx, pg, e = H.abrir(nav, seed, '#/crear', usuario=H.ANA); err += e
    pg.fill('#crNombre', 'Liga Presencial'); pg.dispatch_event('#crNombre', 'input')
    pg.fill('#crInicio', '2026-11-01'); pg.fill('#crFin', '2026-12-20')
    pg.click('text=Crear liga'); pg.wait_for_timeout(150)
    g.caso('presencial sin ciudad → «Elige el país y escribe la ciudad.»', 'escribe la ciudad' in error(pg), error(pg))
    pg.fill('#crCiudad', 'Monterrey'); pg.click('text=Crear liga'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-presencial']") or {}
    g.caso('presencial: se guarda igual que antes (país y ciudad, sin modalidad)', ev.get('pais') == 'México' and ev.get('ciudad') == 'Monterrey' and 'modalidad' not in ev and 'zona' not in ev, ev)
    ctx.close()

    # ---------------- Hora de cada quien
    ctx, pg, e = H.abrir(nav, seed, '#/'); err += e
    t = pg.inner_text('#listaEventos')
    g.caso('portada en CDMX (misma zona): «sáb 7 nov · 20:00» sin «(tu hora)»', 'sáb 7 nov · 20:00' in t and '(tu hora)' not in t, t[:400])
    g.caso('portada: la tarjeta dice «🌐 En línea · Discord»', '🌐 En línea · Discord' in t)
    pg.goto(pg.url.split('#')[0] + '#/liga/torneo-online'); pg.wait_for_timeout(150)
    g.caso('en CDMX no sale la nota de zona horaria', pg.locator('[data-nota-zona]').count() == 0)
    ctx.close()

    ctx, pg, e = H.abrir(nav, seed, '#/', timezone_id=MADRID); err += e
    t = pg.inner_text('#listaEventos')
    g.caso('portada en Madrid: el torneo sale a «dom 8 nov · 03:00 (tu hora)»', 'dom 8 nov · 03:00 (tu hora)' in t, t[:400])
    g.caso('portada en Madrid: próxima jornada de la liga «dom 15 nov · 02:30 (tu hora)»', 'dom 15 nov · 02:30 (tu hora)' in t, t[:400])
    t2 = [x for x in t.split('\n') if 'Liga A' in x]
    g.caso('portada en Madrid: la liga presencial no cambia', '(tu hora)' not in pg.inner_text('a[href="#/liga/liga-a"]'))
    pg.goto(pg.url.split('#')[0] + '#/liga/torneo-online'); pg.wait_for_timeout(150)
    nota = pg.inner_text('[data-nota-zona]') if pg.locator('[data-nota-zona]').count() else ''
    g.caso('página del torneo en Madrid: nota «Los horarios se muestran en tu hora… hora de Ciudad de México»', 'Ciudad de México' in nota, nota)
    pg.goto(pg.url.split('#')[0] + '#/liga/liga-online/calendario'); pg.wait_for_timeout(150)
    g.caso('calendario en Madrid: «Jornada 1 · dom 15 nov · 02:30 (tu hora)»', 'dom 15 nov · 02:30 (tu hora)' in pg.inner_text('#app'))
    ctx.close()

    ctx, pg, e = H.abrir(nav, seed, '#/', timezone_id='America/Santiago'); err += e
    g.caso('portada en Santiago de Chile: «sáb 7 nov · 23:00 (tu hora)»', 'sáb 7 nov · 23:00 (tu hora)' in pg.inner_text('#listaEventos'))
    ctx.close()

    # El equipo ve y captura la hora en la zona del organizador
    ctx, pg, e = H.abrir(nav, seed, '#/liga/liga-online/calendario', usuario=H.ANA, timezone_id=MADRID); err += e
    t = pg.inner_text('#app')
    g.caso('calendario del equipo: hora original «(hora de Ciudad de México)» aunque estés en Madrid', 'sáb 14 nov · 19:30 (hora de Ciudad de México)' in t, t[:500])
    pg.click('text=+ Agregar jornada'); pg.wait_for_timeout(100)
    g.caso('al agregar jornada, el campo dice «Hora (opcional) · hora de Ciudad de México»', 'Hora (opcional) · hora de Ciudad de México' in pg.content())
    ctx.close()

    # ---------------- Filtro de la portada
    ctx, pg, e = H.abrir(nav, seed, '#/'); err += e
    opciones = pg.eval_on_selector_all('#filtroPais option', 'os => os.map(o => o.textContent)')
    g.caso('filtro de país: incluye «🌐 En línea»', '🌐 En línea' in opciones, opciones)
    pg.select_option('#filtroPais', '__en-linea'); pg.wait_for_timeout(150)
    t = pg.inner_text('#listaEventos')
    g.caso('filtro «🌐 En línea»: solo los eventos en línea', 'Torneo Online' in t and 'Liga Online' in t and 'Liga A' not in t, t[:300])
    g.caso('filtro «🌐 En línea»: la ciudad queda desactivada', pg.is_disabled('#filtroCiudad'))
    pg.select_option('#filtroPais', 'México'); pg.wait_for_timeout(150)
    t = pg.inner_text('#listaEventos')
    g.caso('filtro «México»: no incluye los eventos en línea', 'Liga A' in t and 'Torneo Online' not in t, t[:300])
    ctx.close()

    # ---------------- Ajustes: cambiar de modalidad
    ctx, pg, e = H.abrir(nav, seed, '#/liga/liga-online/ajustes', usuario=H.ANA, timezone_id=MADRID); err += e
    g.caso('ajustes de una liga en línea: En línea marcado, sin país ni ciudad', pg.is_checked('input[name=ajModalidad][value=en-linea]') and not pg.is_visible('#ajPais') and 'Ciudad de México (la de la liga)' in pg.inner_text('[data-zona-info]'))
    g.caso('ajustes: no sale el aviso «Este evento no tiene país»', 'no tiene país' not in pg.inner_text('#app'))
    pg.fill('#ajPlataforma', 'Lackey'); pg.click('text=Guardar cambios'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-online']")
    g.caso('ajustes: se puede poner o cambiar la plataforma', ev.get('plataforma') == 'Lackey', ev)
    g.caso('ajustes desde Madrid: la liga conserva su zona (Ciudad de México)', ev.get('zona') == 'America/Mexico_City', ev)
    pg.check('input[name=ajModalidad][value=presencial]')
    pg.click('text=Guardar cambios'); pg.wait_for_timeout(150)
    g.caso('pasar a Presencial sin ciudad → pide país y ciudad', 'escribe la ciudad' in error(pg, '#ajError'), error(pg, '#ajError'))
    pg.select_option('#ajPais', 'Chile'); pg.fill('#ajCiudad', 'Valparaíso')
    pg.click('text=Guardar cambios'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-online']")
    g.caso('pasar a Presencial: guarda país y ciudad y borra modalidad, zona y plataforma', ev.get('pais') == 'Chile' and ev.get('ciudad') == 'Valparaíso' and not any(k in ev for k in ('modalidad', 'zona', 'plataforma')), ev)
    ctx.close()

    ctx, pg, e = H.abrir(nav, seed, '#/liga/liga-a/ajustes', usuario=H.ANA, timezone_id=MADRID); err += e
    pg.check('input[name=ajModalidad][value=en-linea]')
    pg.click('text=Guardar cambios'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-a']")
    g.caso('pasar a En línea: borra país y ciudad y guarda la zona del aparato (Madrid)', ev.get('modalidad') == 'en-linea' and ev.get('zona') == 'Europe/Madrid' and 'pais' not in ev and 'ciudad' not in ev and 'plataforma' not in ev, ev)
    ctx.close()

    # Aviso de cambio de fecha (WhatsApp) con la zona
    ctx, pg, e = H.abrir(nav, seed, '#/liga/liga-online/calendario', usuario=H.ANA); err += e
    pg.evaluate("ui.editarJornada = 'j1'; dibujar('ruta')"); pg.wait_for_timeout(100)
    if pg.locator('#jfFecha').count():
        pg.fill('#jfFecha', '2026-11-21'); pg.locator('#jfFecha').evaluate('e => e.form && e.form.requestSubmit()'); pg.wait_for_timeout(300)
        txt = pg.evaluate('ui.avisoCambio && ui.avisoCambio.texto') or ''
        g.caso('aviso de cambio de fecha: «a las 19:30 (hora de Ciudad de México)»', 'a las 19:30 (hora de Ciudad de México)' in txt, txt)
    else:
        g.caso('aviso de cambio de fecha: se abre la edición de la jornada', False, 'no apareció #jfFecha')
    ctx.close()

    g.caso('sin errores de JavaScript', not err, err)
