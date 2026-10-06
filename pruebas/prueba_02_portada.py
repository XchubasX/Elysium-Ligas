"""Portada pública y página de una liga, sin entrar con Google."""
import copy
import herramientas as H

TITULO = 'Portada y página pública de la liga'


def correr(nav, g):
    seed = H.con_resultados(H.seed_base())
    seed['eventos']['liga-b']['archivada'] = True
    seed['eventos']['liga-a']['jornadas']['j3'] = {'numero': 3, 'fecha': '2026-11-07', 'fechaAnterior': '2026-10-31', 'estado': 'pendiente'}
    ctx, pg, errores = H.abrir(nav, seed)
    t = H.texto(pg)
    g.caso('se ve la franja de «sitio de pruebas»', pg.is_visible('#franjaPruebas'))
    g.caso('se ven las ligas activas (Liga A y Liga D)', 'Liga A' in t and 'Liga D' in t, t[:300])
    g.caso('la liga archivada NO sale en la portada', 'Liga B' not in t)
    g.caso('la tarjeta dice la próxima jornada (sáb 10 oct)', 'sáb 10 oct'.upper() in t.upper(), t[:400])
    g.caso('la tarjeta muestra «Jornada 2 de 3» (una jugada)', 'Jornada 2 de 3' in t, t[:500])
    g.caso('la tarjeta muestra el líder: Lasombra · 1 GW · 3 VP', 'Lasombra · 1 GW · 3 VP' in t, t[:600])
    g.caso('hay botón «Entrar con Google»', pg.is_visible('text=Entrar con Google'))
    g.caso('el pie trae el aviso legal (Paradox · Dark Pack)', 'Paradox Interactive' in t and 'worldofdarkness.com' in t, t[-400:])

    pg.click('text=Ver ligas archivadas'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('«Ver ligas archivadas» muestra Liga B', 'Liga B' in t and 'Ligas archivadas' in t)

    pg.goto(pg.url.split('#')[0] + '#/'); pg.wait_for_timeout(150)
    pg.click('text=Liga A'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('al tocar la tarjeta abre la liga en la pestaña Tabla', '#/liga/liga-a' in pg.url and 'Tabla general' not in t and 'Lasombra' in t, pg.url)
    filas = pg.locator('[role=row]').all_inner_texts()
    g.caso('la tabla: 1° Lasombra con 1 GW y 3 VP', len(filas) > 1 and 'Lasombra' in filas[1] and '1' in filas[1] and '3' in filas[1], filas)
    g.caso('la jornada abierta no cuenta (Iván con 5 VP no aparece arriba)', 'Iván' not in filas[1] if len(filas) > 1 else False, filas)
    g.caso('la columna de hazañas muestra 1 para Toni', any('Toni' in f and f.strip().endswith('1') for f in filas), filas)
    g.caso('no hay pastilla de rol (no entraste)', 'Organizas tú' not in t and 'Ayudante' not in t)

    pg.click('nav >> text=Calendario'); pg.wait_for_timeout(120)
    t = H.texto(pg)
    g.caso('calendario: jornada 1 «En curso», jornada 2 «Jugada · 5 jugadores»', 'En curso' in t and 'Jugada · 5 jugadores' in t, t[-400:])
    g.caso('calendario: la jornada 3 avisa la fecha anterior (antes sáb 31 oct)', 'antes sáb 31 oct' in t, t[-400:])
    pg.click('nav >> text=Hazañas'); pg.wait_for_timeout(120)
    t = H.texto(pg)
    g.caso('hazañas: «Sangrado más cuantioso — Toni» en J2', 'Sangrado más cuantioso — Toni' in t and 'J2' in t, t[-300:])
    pg.click('nav >> text=Reglas'); pg.wait_for_timeout(120)
    t = H.texto(pg)
    g.caso('reglas: explica GW con mínimo 2 VP y que las hazañas no suman', 'al menos 2' in t and 'no suman puntos' in t, t[-400:])
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))

    pg.goto(pg.url.split('#')[0] + '#/liga/no-existe'); pg.wait_for_timeout(120)
    g.caso('una liga que no existe muestra aviso y botón para volver', 'no existe' in H.texto(pg))

    s2 = copy.deepcopy(seed); s2['eventos']['liga-a']['hazanasModo'] = 'no'
    ctx2, pg2, err2 = H.abrir(nav, s2, '#/liga/liga-a')
    nav_t = pg2.inner_text('nav')
    g.caso('liga «sin hazañas»: no hay pestaña Hazañas ni columna 🏅', 'Hazañas' not in nav_t and '🏅' not in H.texto(pg2), nav_t)
    ctx2.close()

    ctx3, pg3, err3 = H.abrir(nav, {'eventos': {}})
    g.caso('sin ligas: mensaje «Todavía no hay ligas»', 'Todavía no hay ligas' in H.texto(pg3))
    ctx3.close()
    g.caso('las páginas abrieron sin errores', not errores and not err2 and not err3, errores + err2 + err3)
    ctx.close()
