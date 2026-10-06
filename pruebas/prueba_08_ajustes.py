"""Ajustes de la liga: editar datos, hazañas, archivar y borrar (superusuario)."""
import herramientas as H

TITULO = 'Ajustes, hazañas, archivar y borrar'
EV = "window.__store().eventos['liga-a']"


def correr(nav, g):
    seed = H.seed_base()
    seed['eventos']['liga-a']['jornadas']['j2']['hazanas'] = {'x1': {'hazana': 'h1', 'jugador': 'p2'}}
    ctx, pg, err = H.abrir(nav, seed, '#/liga/liga-a/ajustes', usuario=H.ANA)
    g.caso('Ana ve el formulario con los datos actuales', pg.input_value('#ajNombre') == 'Liga A' and pg.input_value('#ajInicio') == '2026-10-01')
    pg.fill('#ajNombre', 'Liga A · Temporada 1'); pg.fill('#ajFin', '2027-01-16'); pg.check('input[name=ajHazanas][value=desempate]')
    pg.fill('#ajReglas', 'Se juega en la tienda.')
    pg.click('text=Guardar cambios'); pg.wait_for_timeout(250)
    ev = pg.evaluate(EV)
    g.caso('se guardan nombre, fin, hazañas y reglas', ev['nombre'] == 'Liga A · Temporada 1' and ev['fin'] == '2027-01-16' and ev['hazanasModo'] == 'desempate' and ev['reglasTexto'] == 'Se juega en la tienda.', ev)
    pg.fill('#ajFin', '2026-09-01'); pg.click('text=Guardar cambios'); pg.wait_for_timeout(150)
    g.caso('fin antes del inicio → aviso y no se guarda', 'anterior al inicio' in pg.inner_text('#ajError') and pg.evaluate(EV + '.fin') == '2027-01-16')
    pg.fill('#ajFin', ''); pg.click('text=Guardar cambios'); pg.wait_for_timeout(150)
    g.caso('no deja borrar las fechas de la temporada', 'no se pueden dejar vacías' in pg.inner_text('#ajError'))

    pg.goto(pg.url.split('#')[0] + '#/liga/liga-a/ajustes'); pg.wait_for_timeout(150)
    pg.fill('#nuevaHazana', 'Mazo más original'); pg.press('#nuevaHazana', 'Enter'); pg.wait_for_timeout(250)
    cat = sorted(x['nombre'] for x in pg.evaluate(EV + '.hazanasCatalogo').values())
    g.caso('agrega la hazaña «Mazo más original»', cat == ['Mazo más original', 'Sangrado más cuantioso'], cat)
    fila = pg.locator('[data-hazana=\"Sangrado más cuantioso\"]')
    fila.locator('button', has_text='Quitar').click(); fila.locator('button', has_text='¿Seguro?').click(); pg.wait_for_timeout(200)
    g.caso('no deja quitar una hazaña ya otorgada', 'ya se otorgó' in H.texto(pg) and 'h1' in pg.evaluate(EV + '.hazanasCatalogo'))
    fila = pg.locator('[data-hazana=\"Mazo más original\"]')
    fila.locator('button', has_text='Quitar').click(); fila.locator('button', has_text='¿Seguro?').click(); pg.wait_for_timeout(250)
    g.caso('sí quita una que no se ha otorgado', len(pg.evaluate(EV + '.hazanasCatalogo')) == 1)

    pg.click('text=Archivar liga'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(250)
    g.caso('archivar: la liga queda archivada', pg.evaluate(EV + '.archivada') is True)
    g.caso('Ana no ve «Borrar definitivamente» (solo superusuario)', 'Borrar definitivamente' not in H.texto(pg))
    pg.click('text=Desarchivar'); pg.wait_for_timeout(250)
    g.caso('desarchivar la regresa', pg.evaluate(EV + '.archivada') is False)
    g.caso('las reglas aceptaron todo', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    ctx, pg, e2 = H.abrir(nav, seed, '#/liga/liga-a/ajustes', usuario=H.BETO)
    g.caso('Beto (ayudante) no puede entrar a Ajustes (le muestra la Tabla)', not pg.is_visible('#formAjustes'))
    if H.HAY_REGLAS:
        r = pg.evaluate("guardar('liga-a', {archivada: true})")
        g.caso('REGLAS: Beto no puede archivar a mano', r is False)
    ctx.close()

    seed['invitaciones']['liga-b'] = {'prueba-invitacion-ligaB-0001': {'creada': 1, 'expira': 4102444800000}}
    ctx, pg, e3 = H.abrir(nav, seed, '#/liga/liga-b/ajustes', usuario=H.ADMIN)
    g.caso('el superusuario ve «Borrar definitivamente» en cualquier liga', pg.is_visible('button:has-text("Borrar definitivamente")'))
    pg.click('button:has-text("Borrar definitivamente")'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(300)
    g.caso('borra la liga y regresa a la portada', pg.evaluate("window.__store().eventos['liga-b']") is None and pg.url.endswith('#/'), pg.evaluate('window.__denegadas'))
    g.caso('también borra sus invitaciones pendientes', not pg.evaluate("window.__store().invitaciones['liga-b']"), pg.evaluate("window.__store().invitaciones"))
    g.caso('la Liga A no se tocó', pg.evaluate("!!window.__store().eventos['liga-a'] && !!window.__store().invitaciones['liga-a']"))
    ctx.close()
    todos = err + e2 + e3
    g.caso('las páginas abrieron sin errores', not todos, todos)
