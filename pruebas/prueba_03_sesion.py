"""Entrar con Google, roles y «Mis eventos»."""
import herramientas as H

TITULO = 'Sesión, roles y Mis eventos'


def correr(nav, g):
    seed = H.seed_base()
    ctx, pg, errores = H.abrir(nav, seed)
    pg.evaluate("window.__NEXT_USER__ = {uid:'ana', displayName:'Ana López'}")
    pg.click('#barraSesion >> text=Entrar con Google'); pg.wait_for_timeout(200)
    b = pg.inner_text('#barraSesion')
    g.caso('al entrar, el encabezado muestra «Ana» y «Organizador»', 'Ana' in b and 'Organizador' in b, b)
    pg.click('text=Mis eventos'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('Mis eventos de Ana: Liga A (suya) y botón «+ Nueva liga»', 'Liga A' in t and '+ Nueva liga' in t, t[:500])
    g.caso('Ana no ve Liga B ni Liga D (no son suyas)', 'Liga B' not in t.split('Mis eventos', 1)[1] and 'Liga D' not in t.split('Mis eventos', 1)[1])
    g.caso('a un organizador no se le ofrece «Quiero organizar»', not pg.is_visible('#formSolicitud'))
    pg.goto(pg.url.split('#')[0] + '#/liga/liga-a'); pg.wait_for_timeout(120)
    g.caso('en su liga, Ana ve la pastilla «Organizas tú»', 'Organizas tú' in H.texto(pg))
    pg.click('#barraSesion >> text=Salir'); pg.wait_for_timeout(150)
    g.caso('«Salir» regresa el botón «Entrar con Google»', 'Entrar con Google' in pg.inner_text('#barraSesion'))
    ctx.close()

    ctx, pg, e2 = H.abrir(nav, seed, '#/mis-eventos', usuario=H.BETO)
    t = H.texto(pg)
    g.caso('Beto (ayudante de Liga A) la ve en Mis eventos con la etiqueta AYUDANTE', 'Liga A' in t and 'AYUDANTE' in t, t[:500])
    g.caso('Beto no tiene botón «+ Nueva liga»', '+ Nueva liga' not in t)
    pg.goto(pg.url.split('#')[0] + '#/liga/liga-a'); pg.wait_for_timeout(120)
    g.caso('en Liga A, Beto ve la pastilla «Ayudante»', 'Ayudante' in H.texto(pg))
    ctx.close()

    ctx, pg, e3 = H.abrir(nav, seed, '#/mis-eventos', usuario=H.NUEVO)
    t = H.texto(pg)
    g.caso('cuenta nueva: «Todavía no organizas ni ayudas»', 'Todavía no organizas' in t, t[:400])
    g.caso('cuenta nueva: se le ofrece el formulario «¿Quieres organizar…?»', pg.is_visible('#formSolicitud'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    ctx, pg, e4 = H.abrir(nav, seed, '#/liga/liga-d', usuario=H.DORA)
    g.caso('Dora (dueña pero SIN permiso de organizadora) no ve «Organizas tú»', 'Organizas tú' not in H.texto(pg))
    ctx.close()

    ctx, pg, e5 = H.abrir(nav, seed, '#/liga/liga-b', usuario=H.ADMIN)
    g.caso('el superusuario ve «Superusuario» en cualquier liga', 'Superusuario' in H.texto(pg))
    ctx.close()

    ctx, pg, e6 = H.abrir(nav, seed, '#/mis-eventos')
    g.caso('sin sesión, Mis eventos pide entrar con Google', 'Entra con Google para ver tus eventos' in H.texto(pg))
    ctx.close()
    todos = errores + e2 + e3 + e4 + e5 + e6
    g.caso('las páginas abrieron sin errores', not todos, todos)
