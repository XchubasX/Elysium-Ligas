"""Historial de cambios (27 oct 2026): cada cambio queda anotado (quién, cuándo, qué, antes y después);
solo el superusuario lo ve en #/historial; filtros por liga, persona y texto."""
import copy
import herramientas as H

TITULO = 'Historial de cambios (solo superusuario)'


def semilla():
    s = copy.deepcopy(H.seed_base())
    s['admins'] = {'superusuario-prueba': True}
    s['organizadores'] = {'ana': True, 'carla': True, 'superusuario-prueba': True}
    s['solicitudes'] = {'uid-nuevo-123': {'nombre': 'Pepe', 'ciudad': 'Guadalajara', 'creada': 1}}
    s['eventos'] = {
        'libre-a': {'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'La Jyhad Eterna', 'creada': 1, 'formato': 'libre', 'modalidad': 'en-linea',
                    'zona': 'America/Mexico_City', 'hazanasModo': 'no', 'inicio': '2026-10-01', 'fin': '2026-12-31', 'organizadorNombre': 'Ana',
                    'ayudantes': {'beto': {'nombre': 'Beto', 'desde': 1}},
                    'jugadores': {'p1': {'nick': 'Ana J'}, 'p2': {'nick': 'Beto J'}, 'p3': {'nick': 'Carla'}},
                    'mesas': {'m1': {'fecha': '2026-10-05', 'mesa': 5, 'jugadores': {'p1': 3, 'p2': 1}, 'invitados': 'X', 'por': 'ana', 'creada': 5}}},
        'torneo-t': {'ownerUid': 'ana', 'tipo': 'torneo', 'nombre': 'Torneo T', 'creada': 1, 'pais': 'México', 'ciudad': 'CDMX', 'fecha': '2026-10-20',
                     'rondasPlan': 2, 'conFinal': False, 'hazanasModo': 'no', 'organizadorNombre': 'Ana',
                     'jugadores': {'t1': {'nick': 'Lasombra'}, 't2': {'nick': 'Toni'}, 't3': {'nick': 'Mau'}, 't4': {'nick': 'Fer'}},
                     'jornadas': {'j1': {'numero': 1, 'fecha': '2026-10-20', 'estado': 'abierta',
                                         'rondas': {'r1': {'mesas': {'m1': {'t1': {'asiento': 1, 'vp': 2}, 't2': {'asiento': 2}, 't3': {'asiento': 3}, 't4': {'asiento': 4}}}}}}}}}
    s['auditoria'] = {'aviejo000001': {'uid': 'carla', 'nombre': 'Carla Ruiz', 'cuando': 1760000000000, 'texto': 'Creó la liga «Otra»', 'evento': 'otra-borrada'}}
    return s


def store(pg, ruta):
    return pg.evaluate("(r) => r.split('/').reduce((n, k) => n == null ? null : (n[k] === undefined ? null : n[k]), window.__store())", ruta)


def nuevas(pg, antes):
    a = store(pg, 'auditoria') or {}
    return [dict(v, id=k) for k, v in a.items() if k not in antes]


def correr(nav, g):
    err = []

    # ---------------- El organizador corrige una mesa: queda anotado con antes y después
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a/partidas', usuario=H.ANA); err += e
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.click('[data-mesa="m1"] >> text=Corregir'); pg.wait_for_timeout(200)
    pg.select_option('[data-vp-de="p1"]', '2'); pg.wait_for_timeout(120)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    a = n[0] if n else {}
    g.caso('corregir mesa: una anotación nueva', len(n) == 1, n)
    g.caso('anotación: cuenta, nombre de Google, fecha y liga', a.get('uid') == 'ana' and a.get('nombre') == 'Ana López' and isinstance(a.get('cuando'), int) and a.get('evento') == 'libre-a', a)
    g.caso('anotación: «Corrigió la mesa del lun 5 oct: Ana J 2 VP · Beto J 1 VP · X (invitados)»', 'Corrigió la mesa del lun 5 oct: Ana J 2 VP · Beto J 1 VP · X (invitados)' in a.get('texto', ''), a.get('texto'))
    g.caso('detalle con el antes y el después, con nicks', 'Ana J: 3, Beto J: 1' in a.get('detalle', '') and 'Ana J: 2, Beto J: 1' in a.get('detalle', ''), a.get('detalle'))
    g.caso('la liga apunta a la anotación (reg)', store(pg, 'eventos/libre-a/reg') == a.get('id'))
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.locator('[data-mesa="m1"] button', has_text='Borrar').click()
    pg.locator('[data-mesa="m1"] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('borrar mesa: anota qué tenía la mesa', len(n) == 1 and 'Borró la mesa del lun 5 oct: Ana J 2 VP' in n[0].get('texto', ''), n)
    g.caso('el organizador NO ve «Historial de cambios» en Mis eventos', (pg.goto(pg.url.split('#')[0] + '#/mis-eventos') or True) and pg.wait_for_timeout(200) is None and not pg.locator('[data-enlace-historial]').count())
    pg.goto(pg.url.split('#')[0] + '#/historial'); pg.wait_for_timeout(200)
    g.caso('organizador en #/historial: «solo para el superusuario» y sin datos', 'solo para el superusuario' in H.texto(pg) and 'Corrigió' not in H.texto(pg))
    ctx.close()

    # ---------------- VP en un torneo (ayudante no; organizador)
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/torneo-t/mesas', usuario=H.ANA); err += e
    antes = set((store(pg, 'auditoria') or {}).keys())
    ok = pg.evaluate("() => ponerVP('j1','r1','m1','t2','1.5')"); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('VP en torneo: «VP de Toni: — → 1.5»', len(n) == 1 and 'VP de Toni: — → 1.5' in n[0].get('texto', '') and store(pg, 'eventos/torneo-t/jornadas/j1/rondas/r1/mesas/m1/t2/vp') == 1.5, n)
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.evaluate("() => ponerVP('j1','r1','m1','t1','3')"); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('cambiar VP: «VP de Lasombra: 2 → 3» con el detalle', len(n) == 1 and 'VP de Lasombra: 2 → 3' in n[0].get('texto', '') and 'ronda 1 · mesa 1 · Lasombra · VP: 2 → 3' in n[0].get('detalle', ''), n)
    ctx.close()

    # ---------------- Jugador agregado, solicitud aprobada, transferencia
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/libre-a/jugadores', usuario=H.ANA); err += e
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.fill('#nuevoNick', 'Lalo'); pg.click('text=Agregar'); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('agregar jugador: «Lalo agregado · La Jyhad Eterna»', len(n) == 1 and 'Lalo agregado' in n[0].get('texto', ''), n)
    ctx.close()

    ctx, pg, e = H.abrir(nav, semilla(), '#/organizadores', usuario=H.ADMIN); err += e
    pg.wait_for_timeout(200)
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.click('[data-solicitud-de="Pepe"] >> text=Aprobar'); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('aprobar solicitud: «Aprobó a Pepe como organizador», sin liga', len(n) == 1 and n[0].get('texto') == 'Aprobó a Pepe como organizador' and 'evento' not in n[0], n)
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.locator('[data-evento-org="torneo-t"] button', has_text='Transferir').click(); pg.wait_for_timeout(150)
    pg.select_option('#orgDestino', 'carla'); pg.click('[data-transferir="torneo-t"] button:has-text("Transferir")'); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('transferir: anota a quién y de quién, con el dueño antes y después', len(n) == 1 and 'Transfirió a' in n[0].get('texto', '') and 'dueño: ana → carla' in n[0].get('detalle', ''), n)

    # ---------------- Página «Historial de cambios» (superusuario)
    pg.goto(pg.url.split('#')[0] + '#/mis-eventos'); pg.wait_for_timeout(200)
    g.caso('superusuario: «📜 Historial de cambios» en Mis eventos', pg.locator('[data-enlace-historial]').count() == 1)
    pg.click('[data-enlace-historial]'); pg.wait_for_timeout(300)
    t = H.texto(pg)
    g.caso('dice que solo tú lo ves y que nadie lo puede editar ni borrar', 'Solo tú lo ves' in t and 'Nadie puede editarlo ni borrarlo' in t)
    regs = pg.locator('[data-registro]').count()
    g.caso('lista los 3 cambios (2 nuevos + 1 anterior)', regs == 3, regs)
    primero = pg.inner_text('[data-registro] >> nth=0')
    g.caso('el más nuevo primero, con fecha y hora, nombre e identificador', 'Transfirió' in primero and 'Fede Admin' in primero and ':' in primero, primero)
    g.caso('un evento borrado se muestra como «(borrado)»', 'otra-borrada (borrado)' in t)
    pg.locator('[data-registro] >> nth=0').locator('summary').click(); pg.wait_for_timeout(100)
    g.caso('«Detalle» se abre con el antes y el después', 'dueño: ana → carla' in pg.inner_text('[data-registro] >> nth=0'))
    pg.select_option('#histPersona', 'carla'); pg.wait_for_timeout(150)
    g.caso('filtro por persona: solo lo de Carla', pg.locator('[data-registro]').count() == 1 and 'Carla Ruiz' in pg.inner_text('#listaHistorial'))
    pg.select_option('#histPersona', ''); pg.select_option('#histEvento', '__ninguno'); pg.wait_for_timeout(150)
    g.caso('filtro «Sin liga»: la aprobación', pg.locator('[data-registro]').count() == 1 and 'Aprobó a Pepe' in pg.inner_text('#listaHistorial'))
    pg.select_option('#histEvento', ''); pg.fill('#histTexto', 'transfir'); pg.dispatch_event('#histTexto', 'input'); pg.wait_for_timeout(150)
    g.caso('buscar texto: «transfir»', pg.locator('[data-registro]').count() == 1)
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # ---------------- Jugador inscrito reporta: queda anotado con su cuenta
    s = semilla(); s['inscripciones'] = {'libre-a': {'uid-nuevo-123': {'nick': 'Carla', 'nombre': 'Pepe Nuevo', 'creada': 1, 'estado': 'aceptada', 'jid': 'p3'}}}
    ctx, pg, e = H.abrir(nav, s, '#/liga/libre-a/partidas', usuario=H.NUEVO); err += e
    pg.wait_for_timeout(250)
    antes = set((store(pg, 'auditoria') or {}).keys())
    pg.fill('#rpFecha', '2026-10-20'); pg.dispatch_event('#rpFecha', 'change')
    pg.select_option('[data-vp-de="p3"]', '2'); pg.wait_for_timeout(120)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    pg.click('text=Confirmar y guardar'); pg.wait_for_timeout(300)
    n = nuevas(pg, antes)
    g.caso('detalle de una mesa nueva legible (sin «.sv»)', n and '.sv' not in n[0].get('detalle', '') and 'creada: ahora' in n[0].get('detalle', ''), n)
    g.caso('jugador reporta: «Reportó la mesa del mar 20 oct: Carla 2 VP» a su nombre', len(n) == 1 and n[0].get('uid') == 'uid-nuevo-123' and 'Reportó la mesa del mar 20 oct: Carla 2 VP' in n[0].get('texto', ''), n)
    ctx.close()

    g.caso('sin errores de JavaScript', not err, err[:3])
