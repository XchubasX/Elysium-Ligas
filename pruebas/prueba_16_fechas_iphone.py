"""Campos de fecha y hora en iPhone: pista «Elegir fecha/hora» con ícono cuando están vacíos (Safari no dibuja nada)."""
import herramientas as H

TITULO = 'Fecha y hora en iPhone: pista visible en campos vacíos'
UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'


def correr(nav, g):
    seed = H.seed_base()
    ctx, pg, err = H.abrir(nav, seed, '#/crear/torneo', usuario=H.ANA, user_agent=UA_IPHONE)
    pg.wait_for_timeout(200)
    pista = lambda i: pg.locator('#' + i).locator('xpath=..').locator('[data-pista-fecha]')
    texto = lambda i: pista(i).locator('[data-texto]')
    g.caso('iPhone: «Fecha» vacía muestra «Elegir fecha» y el ícono de calendario',
           pista('crFecha').count() == 1 and texto('crFecha').inner_text() == 'Elegir fecha' and texto('crFecha').is_visible() and pista('crFecha').locator('svg').count() == 1)
    g.caso('iPhone: «Hora» vacía muestra «Elegir hora» y el ícono de reloj',
           pista('crHora').count() == 1 and texto('crHora').inner_text() == 'Elegir hora' and texto('crHora').is_visible())
    pg.fill('#crFecha', '2026-10-24'); pg.dispatch_event('#crFecha', 'change'); pg.wait_for_timeout(50)
    g.caso('al elegir la fecha, la pista se oculta y queda solo el ícono', not texto('crFecha').is_visible() and pista('crFecha').locator('svg').is_visible())
    g.caso('la hora sigue con su pista mientras esté vacía', texto('crHora').is_visible())
    g.caso('la pista no estorba al tocar: el toque llega al campo', pista('crFecha').evaluate('e => getComputedStyle(e).pointerEvents') == 'none')
    g.caso('la pista no se lee dos veces con lector de pantalla', pista('crFecha').get_attribute('aria-hidden') == 'true')
    g.caso('el formulario sigue enviando el valor elegido', pg.input_value('#crFecha') == '2026-10-24')
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    # Al volver a dibujar (cambio de pantalla) no se duplica
    pg.evaluate("dibujar('ruta')"); pg.wait_for_timeout(100)
    g.caso('al redibujar no se duplica la pista', pg.locator('[data-pista-fecha]').count() == 2, pg.locator('[data-pista-fecha]').count())
    ctx.close()

    # Portada (filtro por fecha) también en iPhone
    ctx, pg, e2 = H.abrir(nav, seed, '#/', user_agent=UA_IPHONE)
    g.caso('portada en iPhone: el filtro de fecha también muestra «Elegir fecha»', pg.locator('#filtroFecha').locator('xpath=..').locator('[data-pista-fecha]').count() == 1)
    ctx.close()

    # Computadora: nada cambia
    ctx, pg, e3 = H.abrir(nav, seed, '#/crear/torneo', usuario=H.ANA)
    g.caso('computadora: sin pista (el navegador ya muestra su ícono y dd/mm/aaaa)', pg.locator('[data-pista-fecha]').count() == 0)
    ctx.close()
    todos = err + e2 + e3
    g.caso('sin errores de JavaScript', not todos, todos)
