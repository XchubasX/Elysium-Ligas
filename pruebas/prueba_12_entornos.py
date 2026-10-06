"""Pruebas nunca manda a producción: el enlace a las mesas apunta al Elysium del mismo entorno."""
import herramientas as H

TITULO = 'Enlaces del sitio de pruebas'


def correr(nav, g):
    ctx, pg, err = H.abrir(nav, H.seed_base())
    href = pg.get_attribute('#enlaceMesas', 'href')
    g.caso('en pruebas, «las mesas» lleva a uat.eternalschedule.com', href == 'https://uat.eternalschedule.com', href)
    g.caso('y dice «uat.eternalschedule.com»', pg.inner_text('#enlaceMesas') == 'uat.eternalschedule.com')
    malos = pg.evaluate("[...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => /^https:\\/\\/(www\\.)?eternalschedule\\.com/.test(h))")
    g.caso('no queda ningún enlace a producción en la página', not malos, malos)
    g.caso('la página abrió sin errores', not err, err)
    ctx.close()
