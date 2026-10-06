"""País y ciudad obligatorios: crear, sugerencias sin duplicados, filtros de la portada y eventos viejos sin país."""
import herramientas as H

TITULO = 'País y ciudad obligatorios'


def correr(nav, g):
    seed = H.seed_base()
    seed['eventos']['liga-b']['pais'] = 'Chile'; seed['eventos']['liga-b']['ciudad'] = 'Santiago'
    seed['eventos']['liga-vieja'] = {'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'Liga vieja', 'creada': 1, 'inicio': '2026-10-01', 'fin': '2026-12-20'}

    # --- Crear: obligatorios, sugerencias y normalización
    ctx, pg, err = H.abrir(nav, seed, '#/crear', usuario=H.ANA)
    g.caso('el país viene en México y hay lista México, Chile, España, Otro',
           pg.input_value('#crPais') == 'México' and pg.eval_on_selector_all('#crPais option', 'os => os.map(o => o.value)') == ['México', 'Chile', 'España', 'Otro'])
    sug = pg.eval_on_selector_all('#ciudadesCr option', 'os => os.map(o => o.value)')
    g.caso('sugiere las ciudades que ya existen en México («Ciudad de México»)', sug == ['Ciudad de México'], sug)
    pg.select_option('#crPais', 'Chile'); pg.wait_for_timeout(80)
    sug = pg.eval_on_selector_all('#ciudadesCr option', 'os => os.map(o => o.value)')
    g.caso('al cambiar a Chile sugiere «Santiago»', sug == ['Santiago'], sug)
    pg.select_option('#crPais', 'México')
    pg.fill('#crNombre', 'Liga Norte'); pg.dispatch_event('#crNombre', 'input'); pg.fill('#crInicio', '2026-10-17'); pg.fill('#crFin', '2026-12-19')
    pg.click('text=Crear liga'); pg.wait_for_timeout(120)
    g.caso('sin ciudad → «Elige el país y escribe la ciudad.»', 'Elige el país y escribe la ciudad' in pg.inner_text('#crError'))
    pg.fill('#crCiudad', 'ciudad de mexico'); pg.click('text=Crear liga'); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.__store().eventos['liga-norte']")
    g.caso('«ciudad de mexico» se guarda como la ya existente «Ciudad de México», con país México', ev and ev['ciudad'] == 'Ciudad de México' and ev['pais'] == 'México', (ev, pg.evaluate('window.__denegadas')))
    store = pg.evaluate('window.__store()')
    ctx.close()

    # --- Portada: filtros país / ciudad; tarjeta sin país
    ctx, pg, e2 = H.abrir(nav, store)
    paises = pg.eval_on_selector_all('#filtroPais option', 'os => os.map(o => o.value)')
    g.caso('filtro País: solo los que tienen eventos (Chile, México)', paises == ['', 'Chile', 'México'], paises)
    g.caso('la tarjeta dice «Ciudad de México, México»', 'Ciudad de México, México' in pg.inner_text('#listaEventos'))
    g.caso('el evento viejo sin país dice «Sin país»', 'Sin país' in pg.locator('a', has_text='Liga vieja').inner_text())
    pg.select_option('#filtroPais', 'Chile'); pg.wait_for_timeout(150)
    t = pg.inner_text('#listaEventos')
    g.caso('País = Chile: solo Liga B', 'Liga B' in t and 'Liga A' not in t and 'Liga Norte' not in t, t)
    ciudades = pg.eval_on_selector_all('#filtroCiudad option', 'os => os.map(o => o.value)')
    g.caso('con Chile, Ciudad solo ofrece Santiago', ciudades == ['', 'Santiago'], ciudades)
    pg.select_option('#filtroPais', 'México'); pg.wait_for_timeout(150)
    pg.select_option('#filtroCiudad', 'Ciudad de México'); pg.wait_for_timeout(100)
    t = pg.inner_text('#listaEventos')
    g.caso('México + Ciudad de México: Liga A, D y Liga Norte; no Liga B', 'Liga A' in t and 'Liga Norte' in t and 'Liga B' not in t, t)
    pg.fill('#filtroTexto', 'norte'); pg.wait_for_timeout(100)
    g.caso('la búsqueda ahora es por nombre: «norte» → Liga Norte', 'Liga Norte' in pg.inner_text('#listaEventos') and 'Liga A' not in pg.inner_text('#listaEventos'))
    pg.click('#limpiarFiltros'); pg.wait_for_timeout(120)
    g.caso('«Limpiar» quita país, ciudad y búsqueda', pg.input_value('#filtroPais') == '' and pg.input_value('#filtroTexto') == '' and 'Liga B' in pg.inner_text('#listaEventos'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # --- Ajustes del evento viejo: obliga a completar
    ctx, pg, e3 = H.abrir(nav, store, '#/liga/liga-vieja/ajustes', usuario=H.ANA)
    g.caso('Ajustes avisa «Este evento no tiene país»', 'no tiene país' in pg.inner_text('#formAjustes'))
    pg.click('text=Guardar cambios'); pg.wait_for_timeout(120)
    g.caso('no deja guardar sin país', 'Elige el país' in pg.inner_text('#ajError'))
    pg.select_option('#ajPais', 'España'); pg.fill('#ajCiudad', 'Madrid'); pg.click('text=Guardar cambios'); pg.wait_for_timeout(250)
    ev = pg.evaluate("window.__store().eventos['liga-vieja']")
    g.caso('con país y ciudad sí se guarda (España, Madrid)', ev.get('pais') == 'España' and ev.get('ciudad') == 'Madrid', (ev, pg.evaluate('window.__denegadas')))
    if H.HAY_REGLAS:
        r = pg.evaluate("guardar('liga-a', {pais: 'Narnia'})")
        g.caso('REGLAS: un país fuera de la lista se rechaza', r is False)
    ctx.close()
    todos = err + e2 + e3
    g.caso('las páginas abrieron sin errores', not todos, todos)
