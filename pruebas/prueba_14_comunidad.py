"""Darse a conocer: etiqueta 100% casual, solicitud para organizar, aprobación del superusuario y guía."""
import herramientas as H

TITULO = 'Solicitudes para organizar, guía y aviso «100% casual»'


def correr(nav, g):
    seed = H.seed_base()
    # --- Etiqueta en portada y en cada evento
    ctx, pg, err = H.abrir(nav, seed)
    g.caso('portada: etiqueta «100% CASUAL · NO SANCIONADOS POR VEKN»', '100% CASUAL · NO SANCIONADOS POR VEKN' in pg.inner_text('#app'))
    g.caso('portada: enlace «¿Quieres organizar? Cómo funciona»', pg.is_visible('text=¿Quieres organizar? Cómo funciona'))
    g.caso('pie: dice que son 100% casuales y no sancionados por VEKN', 'no sancionados por VEKN' in pg.inner_text('footer'))
    pg.goto(pg.url.split('#')[0] + '#/liga/liga-a'); pg.wait_for_timeout(150)
    g.caso('página de la liga: también trae la etiqueta', pg.locator('[data-casual]').count() == 1)
    pg.goto(pg.url.split('#')[0] + '#/ayuda'); pg.wait_for_timeout(150)
    t = pg.inner_text('#app')
    g.caso('guía «Cómo funciona»: 5 pasos y preguntas frecuentes', 'Cómo funciona' in t and 'Pide permiso de organizador' in t and 'Comparte' in t and '¿Cuenta para el ranking de VEKN?' in t, t[:300])
    g.caso('la guía invita a «Quiero organizar» a quien no organiza', pg.is_visible('text=Quiero organizar'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # --- Cuenta nueva manda solicitud
    ctx, pg, e2 = H.abrir(nav, seed, '#/mis-eventos', usuario=H.NUEVO)
    g.caso('el formulario trae su primer nombre', pg.input_value('#solNombre') == 'Pepe')
    pg.fill('#solCiudad', 'Guadalajara'); pg.fill('#solMensaje', 'Liga mensual en Tienda X')
    pg.click('text=Enviar solicitud'); pg.wait_for_timeout(250)
    sol = pg.evaluate("window.__store().solicitudes && window.__store().solicitudes['uid-nuevo-123']")
    g.caso('se guarda su solicitud (nombre, ciudad, mensaje y fecha), sin correo', sol and sol['nombre'] == 'Pepe' and sol['ciudad'] == 'Guadalajara' and sol['mensaje'] == 'Liga mensual en Tienda X' and isinstance(sol['creada'], (int, float)) and '@' not in str(sol), (sol, pg.evaluate('window.__denegadas')))
    g.caso('cambia a «✓ Solicitud enviada»', 'Solicitud enviada' in pg.inner_text('#app'))
    if H.HAY_REGLAS:
        r = pg.evaluate("db.ref('organizadores/uid-nuevo-123').set(true).then(()=>'ok').catch(()=>'bloqueada')")
        g.caso('REGLAS: no se puede aprobar a sí mismo', r == 'bloqueada', r)
        r = pg.evaluate("db.ref('solicitudes').get().then(()=>'ok').catch(()=>'bloqueada')")
        g.caso('REGLAS: no puede ver las solicitudes de otros', r == 'bloqueada', r)
    store = pg.evaluate('window.__store()')
    ctx.close()

    # Vuelve a entrar: sigue viendo «enviada» y puede cancelarla
    ctx, pg, e3 = H.abrir(nav, store, '#/mis-eventos', usuario=H.NUEVO)
    g.caso('al volver, sigue diciendo «Solicitud enviada»', 'Solicitud enviada' in pg.inner_text('#app'))
    ctx.close()

    # --- Superusuario la ve y aprueba
    ctx, pg, e4 = H.abrir(nav, store, '#/', usuario=H.ADMIN)
    g.caso('el superusuario ve un contador «1» junto a «Mis eventos»', pg.locator('#barraSesion [data-pendientes]').inner_text() == '1')
    pg.click('#barraSesion >> text=Mis eventos'); pg.wait_for_timeout(200)
    t = pg.inner_text('[data-solicitudes]')
    g.caso('«Solicitudes para organizar»: Pepe · Guadalajara con su mensaje', 'Pepe' in t and 'Guadalajara' in t and 'Liga mensual en Tienda X' in t, t)
    pg.click('[data-solicitudes] >> text=Aprobar'); pg.wait_for_timeout(300)
    s = pg.evaluate('window.__store()')
    g.caso('Aprobar: queda como organizador y se borra la solicitud', s['organizadores'].get('uid-nuevo-123') is True and not (s.get('solicitudes') or {}).get('uid-nuevo-123'), pg.evaluate('window.__denegadas'))
    g.caso('ya no hay solicitudes pendientes (desaparece el bloque y el contador)', not pg.is_visible('[data-solicitudes]') and pg.locator('[data-pendientes]').count() == 0)
    g.caso('las reglas aceptaron todo', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    store2 = pg.evaluate('window.__store()')
    ctx.close()

    ctx, pg, e5 = H.abrir(nav, store2, '#/mis-eventos', usuario=H.NUEVO)
    t = pg.inner_text('#app')
    g.caso('Pepe ya ve «+ Nueva liga» y «+ Nuevo torneo», sin formulario', '+ Nueva liga' in t and '+ Nuevo torneo' in t and not pg.is_visible('#formSolicitud'))
    ctx.close()

    # --- Rechazar
    seed3 = H.seed_base(); seed3['solicitudes'] = {'dora': {'nombre': 'Dora', 'creada': 1}}
    ctx, pg, e6 = H.abrir(nav, seed3, '#/mis-eventos', usuario=H.ADMIN)
    pg.click('[data-solicitudes] >> text=Rechazar'); pg.click('[data-solicitudes] >> text=¿Seguro?'); pg.wait_for_timeout(300)
    s = pg.evaluate('window.__store()')
    g.caso('Rechazar: borra la solicitud y NO da permiso', not (s.get('solicitudes') or {}).get('dora') and not s['organizadores'].get('dora'))
    ctx.close()
    todos = err + e2 + e3 + e4 + e5 + e6
    g.caso('las páginas abrieron sin errores', not todos, todos)
