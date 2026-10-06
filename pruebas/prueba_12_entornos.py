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
    correr_config(g)


def correr_iconos(nav, g):
    ctx, pg, err = H.abrir(nav, H.seed_base(), '#/crear/torneo', usuario=H.ANA)
    esquemas = pg.evaluate("[...document.querySelectorAll('input[type=date],input[type=time]')].map(i => getComputedStyle(i).colorScheme)")
    g.caso('fechas y horas usan el esquema oscuro (ícono de calendario/reloj claro y visible)', esquemas and all(e == 'dark' for e in esquemas), esquemas)
    ctx.close()


def correr_config(g):
    """Cada dirección usa SU base: producción solo en ligas.eternalschedule.com y su workers.dev."""
    import subprocess, json
    js = (H.REPO / 'config.js').read_text(encoding='utf-8')
    def probar(host):
        code = 'var window={location:{hostname:%s}};%s;console.log(JSON.stringify({p:window.LIGAS_CONFIG&&window.LIGAS_CONFIG.firebase.projectId,m:window.ELYSIUM_MESAS,e:window.LIGAS_CONFIG&&window.LIGAS_CONFIG.esPruebas}))' % (json.dumps(host), js)
        return json.loads(subprocess.run(['node', '-e', code], capture_output=True, text=True).stdout)
    for host, proyecto, mesas, pruebas in [('ligas.eternalschedule.com', 'elysium-ligas', 'eternalschedule.com', False),
                                           ('elysium-ligas.chubas.workers.dev', 'elysium-ligas', 'eternalschedule.com', False),
                                           ('uat-ligas.eternalschedule.com', 'elysium-ligas-uat', 'uat.eternalschedule.com', True),
                                           ('elysium-ligas-uat.chubas.workers.dev', 'elysium-ligas-uat', 'uat.eternalschedule.com', True),
                                           ('localhost', 'elysium-ligas-uat', 'uat.eternalschedule.com', True)]:
        r = probar(host)
        g.caso(f'{host} → base «{proyecto}», mesas en {mesas}' + (' y franja de pruebas' if pruebas else ' sin franja de pruebas'),
               r == {'p': proyecto, 'm': mesas, 'e': pruebas}, r)
