"""Crear una liga: validaciones y permisos (con las reglas de la base aplicadas)."""
import herramientas as H

TITULO = 'Crear liga'


def llenar(pg, nombre='Liga CDMX Temporada 1', inicio='2026-10-17', fin='2026-12-19', enlace=None):
    pg.fill('#crNombre', nombre); pg.dispatch_event('#crNombre', 'input')
    if enlace is not None:
        pg.fill('#crEnlace', enlace); pg.dispatch_event('#crEnlace', 'input')
    pg.fill('#crCiudad', 'Ciudad de México')
    pg.fill('#crInicio', inicio); pg.fill('#crFin', fin)


def error(pg):
    return pg.inner_text('#crError') if pg.is_visible('#crError') else ''


def correr(nav, g):
    seed = H.seed_base()
    ctx, pg, errores = H.abrir(nav, seed, '#/crear', usuario=H.ANA)
    g.caso('Ana (organizadora) ve el formulario «Nueva liga»', pg.is_visible('#formCrear'))
    g.caso('el nombre del organizador viene lleno con «Ana»', pg.input_value('#crOrganizador') == 'Ana')
    llenar(pg)
    g.caso('el enlace se sugiere solo: liga-cdmx-temporada-1', pg.input_value('#crEnlace') == 'liga-cdmx-temporada-1', pg.input_value('#crEnlace'))

    pg.fill('#crNombre', ''); pg.click('text=Crear liga'); pg.wait_for_timeout(100)
    g.caso('sin nombre → «Escribe el nombre de la liga.»', 'Escribe el nombre' in error(pg), error(pg))
    llenar(pg, enlace='a!')
    pg.click('text=Crear liga'); pg.wait_for_timeout(100)
    g.caso('enlace inválido → aviso de minúsculas, números o guiones', 'minúsculas' in error(pg), error(pg))
    llenar(pg, enlace='liga-a')
    pg.click('text=Crear liga'); pg.wait_for_timeout(100)
    g.caso('enlace ya usado (liga-a) → «Ese enlace ya lo usa otra liga»', 'ya lo usa' in error(pg), error(pg))
    llenar(pg, enlace='liga-nueva', inicio='2026-12-19', fin='2026-10-17')
    pg.click('text=Crear liga'); pg.wait_for_timeout(100)
    g.caso('fin antes del inicio → aviso', 'anterior al inicio' in error(pg), error(pg))

    pg.check('input[name=crHazanas][value=desempate]')
    pg.fill('#crReglas', 'Formato V5. Se juega en la tienda.')
    llenar(pg, enlace='liga-nueva')
    n = len(pg.evaluate('window.__writes'))
    pg.click('text=Crear liga'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-nueva']")
    g.caso('se crea la liga y abre su página', ev is not None and '#/liga/liga-nueva' in pg.url, (pg.url, pg.evaluate('window.__denegadas')))
    g.caso('se guardó con dueña Ana, tipo liga y fecha de creación', ev and ev.get('ownerUid') == 'ana' and ev.get('tipo') == 'liga' and isinstance(ev.get('creada'), (int, float)), ev)
    g.caso('se guardaron fechas, ciudad, hazañas=desempate y reglas', ev and ev.get('inicio') == '2026-10-17' and ev.get('fin') == '2026-12-19' and ev.get('hazanasModo') == 'desempate' and ev.get('reglasTexto', '').startswith('Formato V5'), ev)
    g.caso('fue UNA sola escritura y las reglas la aceptaron', len(pg.evaluate('window.__writes')) == n + 1 and not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    g.caso('aparece el aviso «¡Liga creada!»', '¡Liga creada!' in H.texto(pg))
    pg.goto(pg.url.split('#')[0] + '#/'); pg.wait_for_timeout(150)
    g.caso('la nueva liga aparece en la portada', 'Liga CDMX Temporada 1' in H.texto(pg))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # Cuenta sin permiso: la pantalla no deja, y si alguien lo intenta a mano, las reglas lo bloquean
    ctx, pg, e2 = H.abrir(nav, seed, '#/crear', usuario=H.NUEVO)
    g.caso('cuenta sin permiso: no hay formulario, dice que falta permiso de organizador', not pg.is_visible('#formCrear') and 'permiso de organizador' in H.texto(pg))
    if H.HAY_REGLAS:
        r = pg.evaluate("crearLiga('liga-pirata', {nombre:'Pirata', hazanasModo:'mencion'}).then(()=>'ok').catch(e=>'bloqueada')")
        g.caso('REGLAS: si una cuenta sin permiso intenta crear a mano, la base la bloquea', r == 'bloqueada' and not pg.evaluate("window.__store().eventos['liga-pirata']"), r)
        pg.evaluate("window.__setUser({uid:'carla', displayName:'Carla'})"); pg.wait_for_timeout(150)
        r = pg.evaluate("firebase.database().ref('eventos/liga-a/nombre').set('Robada').then(()=>'ok').catch(e=>'bloqueada')")
        g.caso('REGLAS: otra organizadora (Carla) no puede cambiar la liga de Ana', r == 'bloqueada', r)
        r = pg.evaluate("crearLiga('liga-a', {nombre:'Encima', hazanasModo:'mencion'}).then(()=>'ok').catch(e=>'bloqueada')")
        g.caso('REGLAS: nadie puede crear encima de una liga existente', r == 'bloqueada', r)
        r = pg.evaluate("firebase.database().ref('admins/carla').set(true).then(()=>'ok').catch(e=>'bloqueada')")
        g.caso('REGLAS: nadie se puede hacer superusuario desde la página', r == 'bloqueada', r)
        r = pg.evaluate("firebase.database().ref('admins').get().then(()=>'ok').catch(e=>'bloqueada')")
        g.caso('REGLAS: nadie puede leer la lista de superusuarios', r == 'bloqueada', r)
    ctx.close()

    ctx, pg, e3 = H.abrir(nav, seed, '#/crear', usuario=H.ANA)
    llenar(pg, enlace='liga-dos')
    pg.evaluate("window.__store().organizadores = {}")  # le quitan el permiso mientras llenaba
    pg.click('text=Crear liga'); pg.wait_for_timeout(300)
    if H.HAY_REGLAS:
        g.caso('si la base rechaza (le quitaron el permiso), se ve un aviso claro y no se crea', 'No se pudo crear' in error(pg) and not pg.evaluate("window.__store().eventos['liga-dos']"), error(pg))
    ctx.close()
    todos = errores + e2 + e3
    g.caso('las páginas abrieron sin errores', not todos, todos)
