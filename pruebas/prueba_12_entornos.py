"""Pruebas nunca manda a producción: el enlace a las mesas apunta al Elysium del mismo entorno."""
import herramientas as H

TITULO = 'Enlaces del sitio de pruebas y detalles de diseño'


def correr(nav, g):
    ctx, pg, err = H.abrir(nav, H.seed_base())
    href = pg.get_attribute('#enlaceMesas', 'href')
    g.caso('en pruebas, «las mesas» lleva a uat.eternalschedule.com', href == 'https://uat.eternalschedule.com', href)
    g.caso('y dice «uat.eternalschedule.com»', pg.inner_text('#enlaceMesas') == 'uat.eternalschedule.com')
    malos = pg.evaluate("[...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => /^https:\\/\\/(www\\.)?eternalschedule\\.com/.test(h))")
    g.caso('no queda ningún enlace a producción en la página', not malos, malos)
    g.caso('la página abrió sin errores', not err, err)
    ctx.close()
    correr_iconos(nav, g)


def correr_iconos(nav, g):
    ctx, pg, err = H.abrir(nav, H.seed_base(), '#/crear/torneo', usuario=H.ANA)
    esquemas = pg.evaluate("[...document.querySelectorAll('input[type=date],input[type=time]')].map(i => getComputedStyle(i).colorScheme)")
    g.caso('fechas y horas usan el esquema oscuro (ícono de calendario/reloj claro y visible)', esquemas and all(e == 'dark' for e in esquemas), esquemas)
    ctx.close()
