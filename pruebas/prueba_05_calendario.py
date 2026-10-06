"""Calendario del organizador: agregar, cambiar fecha (con aviso por WhatsApp), cancelar y reactivar."""
import herramientas as H

TITULO = 'Calendario de jornadas (organizador)'


def correr(nav, g):
    seed = H.seed_base()
    seed['eventos']['liga-a']['jornadas']['j3'] = {'numero': 3, 'fecha': '2026-11-07', 'estado': 'pendiente'}
    ctx, pg, err = H.abrir(nav, seed, '#/liga/liga-a/calendario', usuario=H.ANA)
    nav_t = pg.inner_text('nav')
    g.caso('Ana ve las pestañas extra «Jugadores» y «Ajustes»', 'Jugadores' in nav_t and 'Ajustes' in nav_t, nav_t)
    g.caso('hay botón «+ Agregar jornada»', pg.is_visible('text=+ Agregar jornada'))
    pg.click('text=+ Agregar jornada'); pg.wait_for_timeout(100)
    g.caso('el formulario propone «Jornada 4»', 'Jornada 4' in H.texto(pg))
    pg.fill('#jnFecha', '2026-11-21'); pg.fill('#jnHora', '17:00')
    pg.click('form >> text=Agregar'); pg.wait_for_timeout(250)
    j4 = pg.evaluate("window.__store().eventos['liga-a'].jornadas.j4")
    g.caso('se guardó la jornada 4 (sáb 21 nov, 17:00, pendiente)', j4 == {'numero': 4, 'fecha': '2026-11-21', 'hora': '17:00', 'estado': 'pendiente'}, (j4, pg.evaluate('window.__denegadas')))
    g.caso('aparece en el calendario: «Jornada 4 · sáb 21 nov · 17:00»', 'Jornada 4 · sáb 21 nov · 17:00' in H.texto(pg), H.texto(pg)[-600:])

    # Cambiar fecha de la jornada 3
    fila = pg.locator('[data-jornada=\"3\"]')
    fila.locator('text=Cambiar fecha').click(); pg.wait_for_timeout(100)
    pg.fill('#jfFecha', '2026-11-14')
    pg.click('form >> text=Guardar'); pg.wait_for_timeout(250)
    j3 = pg.evaluate("window.__store().eventos['liga-a'].jornadas.j3")
    g.caso('cambiar fecha guarda la nueva y recuerda la anterior', j3.get('fecha') == '2026-11-14' and j3.get('fechaAnterior') == '2026-11-07', j3)
    t = H.texto(pg)
    g.caso('el calendario marca «antes sáb 7 nov»', 'antes sáb 7 nov' in t, t[-600:])
    g.caso('sale el aviso para avisar al grupo, con el mensaje ya escrito', 'Avisar por WhatsApp' in t and 'pasa del sáb 7 nov al sáb 14 nov' in t, t[:800])
    href = pg.get_attribute('text=Avisar por WhatsApp', 'href')
    g.caso('el botón abre WhatsApp con el mensaje', href.startswith('https://wa.me/?text=') and 'jornada%203' in href, href)

    # Cancelar con dos toques y reactivar
    fila = pg.locator('[data-jornada=\"4\"]')
    b = fila.locator('button', has_text='Cancelar')
    b.click(); pg.wait_for_timeout(80)
    g.caso('el primer toque en «Cancelar» solo pide confirmar', pg.evaluate("window.__store().eventos['liga-a'].jornadas.j4.estado") == 'pendiente' and '¿Seguro?' in fila.inner_text())
    fila.locator('button', has_text='¿Seguro?').click(); pg.wait_for_timeout(250)
    g.caso('el segundo toque cancela la jornada', pg.evaluate("window.__store().eventos['liga-a'].jornadas.j4.estado") == 'cancelada')
    pg.locator('[data-jornada=\"4\"]').locator('text=Reactivar').click(); pg.wait_for_timeout(250)
    g.caso('«Reactivar» la regresa a pendiente', pg.evaluate("window.__store().eventos['liga-a'].jornadas.j4.estado") == 'pendiente')
    g.caso('las reglas aceptaron todo', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    pg.goto(pg.url.split('#')[0] + '#/'); pg.wait_for_timeout(150)
    ctx.close()

    # Ayudante: no cambia fechas
    ctx, pg, e2 = H.abrir(nav, seed, '#/liga/liga-a/calendario', usuario=H.BETO)
    t = H.texto(pg); nav_t = pg.inner_text('nav')
    g.caso('Beto (ayudante) ve «Jugadores» pero no «Ajustes»', 'Jugadores' in nav_t and 'Ajustes' not in nav_t, nav_t)
    g.caso('Beto no ve «Cambiar fecha», «Cancelar» ni «+ Agregar jornada»', 'Cambiar fecha' not in t and '+ Agregar jornada' not in t)
    g.caso('Beto sí ve «Abrir día ›» en las jornadas', 'Abrir día ›' in t)
    if H.HAY_REGLAS:
        r = pg.evaluate("guardar('liga-a', {'jornadas/j3/fecha':'2026-12-01'}).then(ok=>ok)")
        g.caso('REGLAS: si Beto intenta cambiar una fecha a mano, la base lo bloquea', r is False and pg.evaluate("window.__store().eventos['liga-a'].jornadas.j3.fecha") == '2026-11-07', r)
    ctx.close()

    # Público: puede abrir jornadas jugadas o en curso, no las pendientes
    ctx, pg, e3 = H.abrir(nav, seed, '#/liga/liga-a/calendario')
    g.caso('público: la jornada 2 (jugada) se puede abrir', pg.locator('a', has_text='Jornada 2').count() == 1)
    g.caso('público: la jornada 3 (pendiente) no es enlace', pg.locator('a', has_text='Jornada 3').count() == 0)
    ctx.close()
    todos = err + e2 + e3
    g.caso('las páginas abrieron sin errores', not todos, todos)
