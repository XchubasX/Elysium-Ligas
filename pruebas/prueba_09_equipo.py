"""Ayudantes por invitación: invitar, cancelar, aceptar (un solo uso), quitar y dejar de ayudar."""
import herramientas as H

TITULO = 'Equipo: ayudantes por invitación'
INV = "(window.__store().invitaciones || {})['liga-a'] || {}"


def correr(nav, g):
    seed = H.seed_base()
    seed['invitaciones'] = {}
    ctx, pg, err = H.abrir(nav, seed, '#/liga/liga-a/equipo', usuario=H.ANA)
    t = pg.inner_text('#app')
    g.caso('Ana ve la pestaña Equipo con sus ayudantes Beto y Carla', 'Equipo' in pg.inner_text('nav') and 'Beto' in t and 'Carla' in t, t[:400])
    g.caso('explica qué puede y qué no puede un ayudante', 'Un ayudante puede' in t and 'No puede' in t)
    pg.click('text=+ Invitar ayudante'); pg.wait_for_timeout(300)
    inv = pg.evaluate(INV)
    codigos = list(inv)
    g.caso('crea una invitación con código largo y caducidad de 7 días', len(codigos) == 1 and len(codigos[0]) == 32 and 6.9 < (inv[codigos[0]]['expira'] - inv[codigos[0]]['creada']) / 86400000 < 7.1, inv)
    enlace = pg.inner_text('#enlaceInvitacion')
    g.caso('muestra el enlace con su código', enlace.endswith('#/invitacion/liga-a/' + codigos[0]), enlace)
    href = pg.get_attribute('text=Enviar por WhatsApp', 'href')
    g.caso('«Enviar por WhatsApp» lleva el mensaje con el enlace', href.startswith('https://wa.me/?text=') and codigos[0] in href)
    g.caso('aparece en «Invitaciones sin usar» (caduca en 7 días)', 'Caduca en 7 días' in pg.inner_text('#app'))
    pg.locator('[data-invitacion] button', has_text='Cancelar').click(); pg.locator('[data-invitacion] button', has_text='¿Seguro?').click(); pg.wait_for_timeout(300)
    g.caso('«Cancelar» borra la invitación', pg.evaluate(INV) == {}, pg.evaluate(INV))
    pg.click('text=+ Invitar ayudante'); pg.wait_for_timeout(300)
    codigo = list(pg.evaluate(INV))[0]
    g.caso('las reglas aceptaron todo lo de Ana', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    store = pg.evaluate('window.__store()')
    ctx.close()

    # La persona invitada (cuenta nueva) abre el enlace
    ctx, pg, e2 = H.abrir(nav, store, '#/invitacion/liga-a/' + codigo)
    t = pg.inner_text('#app')
    g.caso('sin sesión: dice quién invita a qué liga y pide entrar con Google', 'Liga A' in t and 'te invita a ser ayudante' in t and 'Entrar con Google para aceptar' in t, t)
    g.caso('aclara que no se guarda el correo', 'tu correo no' in t)
    pg.evaluate("window.__NEXT_USER__ = {uid:'uid-nuevo-123', displayName:'Pepe Nuevo'}")
    pg.click('text=Entrar con Google para aceptar'); pg.wait_for_timeout(250)
    g.caso('al entrar ofrece «Aceptar y ser ayudante»', pg.is_visible('text=Aceptar y ser ayudante'))
    pg.click('text=Aceptar y ser ayudante'); pg.wait_for_timeout(300)
    s = pg.evaluate('window.__store()')
    ay = s['eventos']['liga-a']['ayudantes'].get('uid-nuevo-123')
    g.caso('queda como ayudante con su primer nombre (Pepe)', ay and ay['nombre'] == 'Pepe', (ay, pg.evaluate('window.__denegadas')))
    g.caso('la invitación se borró (un solo uso)', not (s.get('invitaciones', {}).get('liga-a') or {}).get(codigo))
    g.caso('dice «¡Listo! Ya eres ayudante»', 'Ya eres ayudante' in pg.inner_text('#app'))
    pg.goto(pg.url.split('#')[0] + '#/mis-eventos'); pg.wait_for_timeout(150)
    g.caso('en «Mis eventos» le aparece Liga A como AYUDANTE', 'Liga A' in pg.inner_text('#app') and 'AYUDANTE' in pg.inner_text('#app'))
    g.caso('las reglas aceptaron la aceptación', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    store = s
    ctx.close()

    # Alguien más intenta usar el mismo enlace
    ctx, pg, e3 = H.abrir(nav, store, '#/invitacion/liga-a/' + codigo, usuario=H.DORA)
    pg.click('text=Aceptar y ser ayudante'); pg.wait_for_timeout(300)
    g.caso('el mismo enlace ya no sirve para otra persona', 'ya se usó, caducó o fue cancelado' in pg.inner_text('#app') and 'dora' not in pg.evaluate("window.__store().eventos['liga-a'].ayudantes"))
    ctx.close()

    # Invitación de la liga A usada en la liga B; e invitación caducada
    s2 = H.seed_base()
    s2['invitaciones']['liga-a']['caducada-prueba-000000001'] = {'creada': 1, 'expira': 2}
    ctx, pg, e4 = H.abrir(nav, s2, '#/invitacion/liga-b/prueba-invitacion-ligaA-0001', usuario=H.DORA)
    pg.click('text=Aceptar y ser ayudante'); pg.wait_for_timeout(300)
    g.caso('una invitación de la Liga A no sirve en la Liga B', 'ya se usó' in pg.inner_text('#app') and 'dora' not in (pg.evaluate("window.__store().eventos['liga-b'].ayudantes") or {}))
    pg.goto(pg.url.split('#')[0] + '#/invitacion/liga-a/caducada-prueba-000000001'); pg.wait_for_timeout(150)
    pg.click('text=Aceptar y ser ayudante'); pg.wait_for_timeout(300)
    g.caso('una invitación caducada no sirve', 'ya se usó' in pg.inner_text('#app'))
    ctx.close()

    # Abierto desde WhatsApp (navegador dentro de la app)
    ctx, pg, e5 = H.abrir(nav, s2, '#/invitacion/liga-a/prueba-invitacion-ligaA-0001', user_agent='Mozilla/5.0 (iPhone) WhatsApp/2.24')
    t = pg.inner_text('#app')
    g.caso('desde WhatsApp: pide abrirlo en Chrome o Safari y ofrece copiar el enlace', 'Abre este enlace en Chrome o Safari' in t and 'Copiar enlace' in t and 'Entrar con Google' not in t, t)
    ctx.close()

    # El dueño quita a un ayudante; un ayudante se retira solo
    ctx, pg, e6 = H.abrir(nav, store, '#/liga/liga-a/equipo', usuario=H.ANA)
    pg.locator('[data-ayudante="Pepe"] button').click(); pg.locator('[data-ayudante="Pepe"] button', has_text='¿Seguro?').click(); pg.wait_for_timeout(300)
    g.caso('Ana quita a Pepe del equipo', 'uid-nuevo-123' not in pg.evaluate("window.__store().eventos['liga-a'].ayudantes"))
    ctx.close()
    ctx, pg, e7 = H.abrir(nav, store, '#/liga/liga-a/jugadores', usuario=H.BETO)
    g.caso('Beto no ve las pestañas Equipo ni Ajustes', 'Equipo' not in pg.inner_text('nav') and 'Ajustes' not in pg.inner_text('nav'))
    pg.click('text=Dejar de ser ayudante de esta liga'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(300)
    g.caso('Beto puede dejar de ser ayudante por su cuenta', 'beto' not in pg.evaluate("window.__store().eventos['liga-a'].ayudantes") and pg.url.endswith('#/mis-eventos'))
    if H.HAY_REGLAS:
        r = pg.evaluate("db.ref('invitaciones/liga-a/hecha-por-beto-0000000001').set({creada: firebase.database.ServerValue.TIMESTAMP, expira: Date.now()+86400000}).then(()=>'ok').catch(()=>'bloqueada')")
        g.caso('REGLAS: alguien que no es el dueño no puede crear invitaciones', r == 'bloqueada', r)
        r = pg.evaluate("guardar('liga-a', {'ayudantes/beto': {nombre:'Beto', desde: 1}})")
        g.caso('REGLAS: nadie se puede volver ayudante sin invitación', r is False)
    ctx.close()
    todos = err + e2 + e3 + e4 + e5 + e6 + e7
    g.caso('las páginas abrieron sin errores', not todos, todos)
