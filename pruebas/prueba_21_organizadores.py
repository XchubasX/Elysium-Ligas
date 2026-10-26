"""Organizadores (26 oct 2026, solo superusuario): lista, cambiar nombre, quitar permiso,
transferir ligas y torneos, ligas sin organizador activo; aprobar guarda nombre, ciudad y fecha."""
import copy
import herramientas as H

TITULO = 'Organizadores: lista, quitar permiso y transferir (superusuario)'


def semilla():
    s = copy.deepcopy(H.seed_base())
    s['admins'] = {'superusuario-prueba': True}
    s['organizadores'] = {'ana': True, 'carla': True, 'superusuario-prueba': True}
    s['organizadoresInfo'] = {'carla': {'nombre': 'Carla Ruiz', 'ciudad': 'Puebla', 'desde': 1760000000000}}
    s['solicitudes'] = {'uid-nuevo-123': {'nombre': 'Pepe', 'ciudad': 'Guadalajara', 'mensaje': 'Liga mensual', 'creada': 1}}
    s['eventos'] = {
        'liga-a': {'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'Liga A', 'creada': 1, 'organizadorNombre': 'Ana López',
                   'pais': 'México', 'ciudad': 'CDMX', 'ayudantes': {'carla': {'nombre': 'Carla', 'desde': 1}, 'beto': {'nombre': 'Beto', 'desde': 1}}},
        'torneo-c': {'ownerUid': 'carla', 'tipo': 'torneo', 'nombre': 'Torneo C', 'creada': 1, 'organizadorNombre': 'Carla', 'fecha': '2026-12-05',
                     'pais': 'México', 'ciudad': 'Puebla'},
        'liga-vieja': {'ownerUid': 'ex-organizador', 'tipo': 'liga', 'nombre': 'Liga Vieja', 'creada': 1, 'organizadorNombre': 'Ex', 'pais': 'México', 'ciudad': 'CDMX'}}
    return s


def store(pg, ruta):
    return pg.evaluate("(r) => r.split('/').reduce((n, k) => n == null ? null : (n[k] === undefined ? null : n[k]), window.__store())", ruta)


def correr(nav, g):
    err = []

    # Solo el superusuario
    ctx, pg, e = H.abrir(nav, semilla(), '#/mis-eventos', usuario=H.ANA); err += e
    g.caso('organizador normal: no ve «Organizadores» en Mis eventos', not pg.locator('[data-enlace-organizadores]').count())
    pg.goto(pg.url.split('#')[0] + '#/organizadores'); pg.wait_for_timeout(200)
    g.caso('organizador normal: #/organizadores dice que es solo para el superusuario', 'solo para el superusuario' in H.texto(pg))
    ctx.close()

    ctx, pg, e = H.abrir(nav, semilla(), '#/mis-eventos', usuario=H.ADMIN); err += e
    pg.wait_for_timeout(200)
    t = pg.inner_text('[data-enlace-organizadores]') if pg.locator('[data-enlace-organizadores]').count() else ''
    g.caso('superusuario: «👥 Organizadores (3)» en Mis eventos', 'Organizadores' in t and '(3)' in t, t)
    pg.click('[data-enlace-organizadores]'); pg.wait_for_timeout(250)
    t = H.texto(pg)
    g.caso('la página muestra también las solicitudes pendientes', 'Solicitudes para organizar' in t and 'Pepe' in t)
    nombres = pg.evaluate("() => [...document.querySelectorAll('[data-organizador]')].map(x => x.dataset.organizador)")
    g.caso('lista ordenada: nombre guardado (Carla Ruiz), el de sus ligas (Ana López) y el del superusuario', nombres == ['Ana López', 'Carla Ruiz', 'Sin nombre'], nombres)
    tc = pg.inner_text('[data-organizador="Carla Ruiz"]')
    g.caso('Carla: ciudad, desde cuándo, 1 evento y su torneo con «Transferir»', 'Puebla' in tc and 'desde' in tc and '1 evento' in tc and 'Torneo C' in tc and 'TORNEO' in tc and 'Transferir' in tc, tc)
    g.caso('el superusuario no tiene botón para quitarse el permiso a sí mismo', not pg.locator('[data-organizador="Sin nombre"] button', has_text='Quitar permiso').count())
    ts = pg.inner_text('[data-sin-organizador]') if pg.locator('[data-sin-organizador]').count() else ''
    g.caso('«Ligas y torneos sin organizador activo»: Liga Vieja', 'Liga Vieja' in ts and 'Liga A' not in ts, ts)
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))

    # Cambiar nombre
    pg.locator('[data-organizador="Ana López"] button', has_text='Nombre').click(); pg.wait_for_timeout(150)
    pg.fill('#orgNombre', 'Ana L.'); pg.click('text=Guardar'); pg.wait_for_timeout(250)
    g.caso('cambiar nombre: se guarda en organizadoresInfo', store(pg, 'organizadoresInfo/ana/nombre') == 'Ana L.')
    g.caso('cambiar nombre: no toca la página pública de sus ligas', store(pg, 'eventos/liga-a/organizadorNombre') == 'Ana López')

    # Transferir Liga A de Ana a Carla (Carla era ayudante)
    pg.locator('[data-evento-org="liga-a"] button', has_text='Transferir').click(); pg.wait_for_timeout(150)
    opciones = pg.evaluate("() => [...document.querySelectorAll('#orgDestino option')].map(o => o.textContent)")
    g.caso('transferir: solo ofrece a otros organizadores (no al dueño actual)', 'Ana L.' not in opciones and 'Carla Ruiz' in opciones, opciones)
    pg.select_option('#orgDestino', 'carla'); pg.click('[data-transferir="liga-a"] button:has-text("Transferir")'); pg.wait_for_timeout(300)
    ev = store(pg, 'eventos/liga-a') or {}
    g.caso('transferir: cambia el dueño y el nombre del organizador', ev.get('ownerUid') == 'carla' and ev.get('organizadorNombre') == 'Carla Ruiz', {k: ev.get(k) for k in ['ownerUid', 'organizadorNombre']})
    g.caso('transferir: los ayudantes se quedan (Beto), y el nuevo dueño deja de ser ayudante', (ev.get('ayudantes') or {}).get('beto') and 'carla' not in (ev.get('ayudantes') or {}), ev.get('ayudantes'))
    g.caso('la lista se actualiza: Carla ahora con 2 eventos', '2 eventos' in pg.inner_text('[data-organizador="Carla Ruiz"]'))

    # Transferir una liga sin organizador
    pg.locator('[data-evento-org="liga-vieja"] button', has_text='Transferir').click(); pg.wait_for_timeout(150)
    pg.select_option('#orgDestino', 'ana'); pg.click('[data-transferir="liga-vieja"] button:has-text("Transferir")'); pg.wait_for_timeout(300)
    g.caso('Liga Vieja pasa a Ana y desaparece de «sin organizador»', store(pg, 'eventos/liga-vieja/ownerUid') == 'ana' and not pg.locator('[data-sin-organizador]').count())

    # Quitar permiso a Carla
    pg.locator('[data-organizador="Carla Ruiz"] button', has_text='Quitar permiso').click()
    pg.locator('[data-organizador="Carla Ruiz"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    g.caso('quitar permiso: se borra de organizadores y organizadoresInfo', store(pg, 'organizadores/carla') is None and store(pg, 'organizadoresInfo/carla') is None)
    g.caso('sus ligas y torneos se quedan como están (mismo dueño)', store(pg, 'eventos/torneo-c/ownerUid') == 'carla' and store(pg, 'eventos/liga-a/ownerUid') == 'carla')
    ts = pg.inner_text('[data-sin-organizador]') if pg.locator('[data-sin-organizador]').count() else ''
    g.caso('ahora salen en «sin organizador activo»', 'Torneo C' in ts and 'Liga A' in ts, ts)

    # Aprobar una solicitud guarda nombre, ciudad y fecha
    pg.click('[data-solicitud-de="Pepe"] >> text=Aprobar'); pg.wait_for_timeout(300)
    info = store(pg, 'organizadoresInfo/uid-nuevo-123') or {}
    g.caso('aprobar: guarda nombre, ciudad y fecha en organizadoresInfo', store(pg, 'organizadores/uid-nuevo-123') is True and info.get('nombre') == 'Pepe' and info.get('ciudad') == 'Guadalajara' and isinstance(info.get('desde'), int), info)
    g.caso('Pepe aparece en la lista', pg.locator('[data-organizador="Pepe"]').count() == 1)
    ctx.close()

    g.caso('sin errores de JavaScript', not err, err[:3])
