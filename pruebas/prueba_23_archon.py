"""Revisión de Archon (27 oct 2026): mesas cuyos VP no cuadran no dan GW ni TP hasta corregirlas o
que el organizador las confirme con un motivo; TP como desempate en ligas; empates exactos comparten
lugar; finalistas 2 a 5 como «2»; partidas libres con suma redondeada."""
import copy
import herramientas as H

TITULO = 'Revisión de Archon: mesas que no cuadran, TP y lugares'


def semilla(vps_m2=(2, 1.5, 0.5, 0.5, 0.5), validadas=None):
    s = copy.deepcopy(H.seed_base())
    s['organizadores'] = {'ana': True}
    jug = {f'p{i}': {'nick': n} for i, n in enumerate(['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer', 'Gabi', 'Hugo', 'Iván', 'Juan'], 1)}
    m1 = {f'p{i}': {'asiento': i, 'vp': v} for i, v in zip(range(1, 6), (3, 1, 1, 0, 0))}
    m2 = {f'p{i}': {'asiento': i - 5, 'vp': v} for i, v in zip(range(6, 11), vps_m2)}
    j = {'numero': 1, 'fecha': '2026-10-20', 'estado': 'abierta', 'presentes': {k: True for k in jug}, 'rondas': {'r1': {'mesas': {'m1': m1, 'm2': m2}}}}
    if validadas:
        j['validadas'] = validadas
    s['eventos'] = {'torneo-a': {'ownerUid': 'ana', 'tipo': 'torneo', 'nombre': 'Torneo A', 'creada': 1, 'pais': 'México', 'ciudad': 'CDMX',
                                 'fecha': '2026-10-20', 'rondasPlan': 1, 'conFinal': False, 'hazanasModo': 'no', 'organizadorNombre': 'Ana',
                                 'ayudantes': {'beto': {'nombre': 'Beto', 'desde': 1}}, 'jugadores': jug, 'jornadas': {'j1': j}}}
    return s


def store(pg, ruta):
    return pg.evaluate("(r) => r.split('/').reduce((n, k) => n == null ? null : (n[k] === undefined ? null : n[k]), window.__store())", ruta)


def correr(nav, g):
    err = []
    # ---------------- Mesa que no cuadra: 2 · 1.5 · 0.5 · 0.5 · 0.5 (redondeando: 2+2+1+1+1 = 7 en mesa de 5)
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/torneo-a/mesas', usuario=H.ANA); err += e
    t = pg.inner_text('[data-no-cuadra="r1-m2"]') if pg.locator('[data-no-cuadra="r1-m2"]').count() else ''
    g.caso('mesa 2: «⚠️ Los VP no cuadran: … suman 7, y la mesa tiene 5 jugadores»', 'no cuadran' in t and 'suman 7' in t and '5 jugadores' in t, t)
    g.caso('la mesa 1 (3·1·1·0·0) cuadra: sin aviso y con GW', not pg.locator('[data-no-cuadra="r1-m1"]').count() and 'GW' in pg.inner_text('[data-mesa="1-1"]'))
    g.caso('la mesa 2 no da GW a Fer (2 VP, único máximo)', pg.locator('[data-mesa="1-2"] span.text-emerald-300').count() == 0)
    c = pg.evaluate("() => clasificacionTorneo(eventos['torneo-a']).map(f => [f.nick, f.gw, f.vp, f.tp])")
    fer = next(x for x in c if x[0] == 'Fer')
    g.caso('clasificación: Fer con 0 GW y 0 TP, pero sus 2 VP sí cuentan', fer == ['Fer', 0, 2, 0], fer)
    t = H.texto(pg)
    g.caso('«Terminar torneo» bloqueado: dice qué mesa no cuadra', 'Los VP no cuadran en: Ronda 1, mesa 2' in t and pg.is_disabled('button:has-text("Terminar torneo")'), t[-400:])
    # Confirmar con motivo
    pg.fill('[data-no-cuadra="r1-m2"] [data-motivo]', 'Hugo abandonó en el turno 3')
    pg.click('[data-no-cuadra="r1-m2"] button:has-text("Confirmar mesa")'); pg.wait_for_timeout(300)
    v = store(pg, 'eventos/torneo-a/jornadas/j1/validadas/r1-m2') or {}
    g.caso('confirmar: guarda el motivo y los VP de ese momento', v.get('motivo') == 'Hugo abandonó en el turno 3' and 'p6:2' in v.get('firma', ''), v)
    t = pg.inner_text('[data-confirmada="r1-m2"]') if pg.locator('[data-confirmada="r1-m2"]').count() else ''
    g.caso('la mesa dice «✔ Confirmada aunque no cuadra: Hugo abandonó…»', 'Confirmada aunque no cuadra' in t and 'Hugo abandonó' in t, t)
    c = pg.evaluate("() => clasificacionTorneo(eventos['torneo-a']).map(f => [f.nick, f.gw, f.tp])")
    g.caso('confirmada: Fer recupera su GW y su TP de 60', next(x for x in c if x[0] == 'Fer') == ['Fer', 1, 60], c)
    g.caso('ya se puede terminar el torneo', not pg.is_disabled('button:has-text("Terminar torneo")'))
    a = [x for x in (store(pg, 'auditoria') or {}).values() if 'Confirmó' in x.get('texto', '')]
    g.caso('queda en el historial: «Confirmó ronda 1, mesa 2 aunque no cuadra: Hugo abandonó…»', a and 'ronda 1, mesa 2' in a[0]['texto'] and 'Hugo abandonó' in a[0]['texto'], a)
    # Si cambian los VP, la confirmación ya no vale
    pg.evaluate("() => ponerVP('j1','r1','m2','p7','1')"); pg.wait_for_timeout(300)
    g.caso('si cambian los VP después, hay que volver a confirmar', pg.locator('[data-no-cuadra="r1-m2"]').count() == 1)
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # Ayudante: ve el aviso pero no puede confirmar
    ctx, pg, e = H.abrir(nav, semilla(), '#/liga/torneo-a/mesas', usuario=H.BETO); err += e
    g.caso('ayudante: ve el aviso, sin botón de confirmar', pg.locator('[data-no-cuadra="r1-m2"]').count() == 1 and not pg.locator('[data-no-cuadra="r1-m2"] [data-motivo]').count())
    ctx.close()

    # Corregir los VP hace que cuadre sola: 2 · 1 · 1 · 1 · 0
    ctx, pg, e = H.abrir(nav, semilla((2, 1, 1, 1, 0)), '#/liga/torneo-a/mesas', usuario=H.ANA); err += e
    g.caso('VP corregidos (2·1·1·1·0): sin aviso y Fer con GW', not pg.locator('[data-no-cuadra]').count() and pg.locator('[data-mesa="1-2"] span.text-emerald-300').count() == 1)
    ctx.close()

    # ---------------- Cálculo puro: mesas de 3, TP en ligas, lugares compartidos
    ctx, pg, e = H.abrir(nav, semilla(), '#/'); err += e
    r = pg.evaluate("() => revisarMesa({a:{vp:2},b:{vp:1},c:{vp:0}})")
    g.caso('mesa de 3 jugadores: no da GW ni TP («las mesas son de 4 o de 5»)', r['estado'] == 'no-cuadra' and 'de 4 o de 5' in r['problema'], r)
    r = pg.evaluate("() => [revisarMesa({a:{vp:1}, b:{}}).estado, revisarMesa({a:{vp:2},b:{vp:1},c:{vp:1},d:{vp:0}}).estado, revisarMesa({a:{vp:1.5},b:{vp:1},c:{vp:1},d:{vp:1},e:{vp:0.5}}).estado]")
    g.caso('incompleta / 2·1·1·0 cuadra / 1.5·1·1·1·0.5 no cuadra', r == ['incompleta', 'ok', 'no-cuadra'], r)
    t = pg.evaluate("""() => { const ev = {jugadores:{a:{nick:'A'},b:{nick:'B'},c:{nick:'C'},d:{nick:'D'},e:{nick:'E'}}, hazanasModo:'no', jornadas:{
        j1:{numero:1,estado:'cerrada',rondas:{r1:{mesas:{m1:{a:{vp:1},b:{vp:1},c:{vp:1},d:{vp:1},e:{vp:1}}}}}},
        j2:{numero:2,estado:'cerrada',rondas:{r1:{mesas:{m1:{a:{vp:1},b:{vp:0},c:{vp:1},d:{vp:2},e:{vp:1}}}}}}}};
        const t = tablaLiga(ev); return [t.map(f => f.nick + ':' + f.gw + ':' + f.vp + ':' + f.tp), lugaresLiga(ev, t)]; }""")
    g.caso('liga: D primero (1 GW); A, C y E empatados exactos (2 VP, 72 TP)', t[0][0] == 'D:1:3:96' and sorted(t[0][1:4]) == ['A:0:2:72', 'C:0:2:72', 'E:0:2:72'], t)
    t2 = pg.evaluate("""() => { const ev = {jugadores:{x:{nick:'X'},y:{nick:'Y'},a:{nick:'A1'},b:{nick:'B1'},c:{nick:'C1'},d:{nick:'D1'},e:{nick:'E1'},f:{nick:'F1'},g:{nick:'G1'}}, hazanasModo:'no', jornadas:{
        j1:{numero:1,estado:'cerrada',rondas:{r1:{mesas:{m1:{a:{vp:3},x:{vp:1},b:{vp:0},c:{vp:0}}, m2:{d:{vp:2},y:{vp:1},e:{vp:1},f:{vp:1},g:{vp:0}}}}}}}};
        return tablaLiga(ev).filter(f => f.nick === 'X' || f.nick === 'Y').map(f => f.nick + ':' + f.gw + ':' + f.vp + ':' + f.tp); }""")
    g.caso('liga: X e Y con 0 GW y 1 VP; X va arriba por TP (48 contra 36)', t2 == ['X:0:1:48', 'Y:0:1:36'], t2)
    g.caso('liga: empates exactos comparten lugar', t[1] == [1, 2, 2, 2, 5], t)
    ctx.close()

    # Tabla de liga en pantalla: columna TP, nota de orden y lugares compartidos
    s = copy.deepcopy(H.seed_base())
    s['eventos'] = {'liga-z': {'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'Liga Z', 'creada': 1, 'pais': 'México', 'ciudad': 'CDMX', 'hazanasModo': 'no',
                               'inicio': '2026-10-01', 'fin': '2026-12-31', 'jugadores': {k: {'nick': k.upper()} for k in 'abcde'},
                               'jornadas': {'j1': {'numero': 1, 'fecha': '2026-10-10', 'estado': 'cerrada', 'rondas': {'r1': {'mesas': {'m1': {k: {'asiento': i + 1, 'vp': 1} for i, k in enumerate('abcde')}}}}}}}}
    ctx, pg, e = H.abrir(nav, s, '#/liga/liga-z'); err += e
    t = H.texto(pg)
    lug = pg.evaluate("() => [...document.querySelectorAll('[data-fila-liga]')].map(f => f.children[0].innerText)")
    g.caso('tabla de liga: columna TP y explica el orden (GW, VP y TP)', 'TP' in t and 'Orden: GW, luego VP y luego TP' in t, t[:600])
    g.caso('tabla de liga: 5 empatados exactos, todos en el lugar 1', lug == ['1'] * 5, lug)
    g.caso('sin desborde horizontal a 390 px (tabla con TP)', H.sin_desborde(pg))
    ctx.close()

    # ---------------- Final: el ganador 1.º y los demás finalistas «2»
    s = semilla((2, 1, 1, 1, 0))
    ev = s['eventos']['torneo-a']; ev['conFinal'] = True
    ev['jornadas']['j1']['final'] = {'p1': {'lugar': 1, 'vp': 2}, 'p6': {'lugar': 2, 'vp': 2}, 'p2': {'lugar': 3, 'vp': 1}, 'p7': {'lugar': 4, 'vp': 0}, 'p3': {'lugar': 5, 'vp': 0}}
    ev['jornadas']['j1']['estado'] = 'cerrada'
    ctx, pg, e = H.abrir(nav, s, '#/liga/torneo-a'); err += e
    lug = pg.evaluate("() => { const l = resultadoTorneo(eventos['torneo-a']); return lugaresTorneo(eventos['torneo-a'], l).map((x, i) => x + ':' + l[i].nick); }")
    g.caso('final: Ana gana (empate a 2 VP, mejor clasificada) y los otros 4 finalistas son «2»', lug[:5] == ['1:Ana', '2:Fer', '2:Beto', '2:Gabi', '2:Caro'], lug)
    g.caso('los que no llegaron a la final van del 6 en adelante, con empates (Hugo e Iván empataron con Gabi en el corte)', lug[5:] == ['6:Hugo', '6:Iván', '8:Dani', '8:Eli', '10:Juan'], lug)
    pantalla = pg.evaluate("() => [...document.querySelectorAll('[role=row]')].slice(1, 6).map(f => f.children[0].innerText)")
    g.caso('en pantalla: 1, 2, 2, 2, 2', pantalla == ['1', '2', '2', '2', '2'], pantalla)
    ctx.close()
    # Final que no cuadra: aviso y no se puede terminar
    s = semilla((2, 1, 1, 1, 0))
    ev = s['eventos']['torneo-a']; ev['conFinal'] = True
    ev['jornadas']['j1']['final'] = {'p1': {'lugar': 1, 'vp': 2}, 'p6': {'lugar': 2, 'vp': 2}, 'p2': {'lugar': 3, 'vp': 2}, 'p7': {'lugar': 4, 'vp': 0}, 'p3': {'lugar': 5, 'vp': 0}}
    ctx, pg, e = H.abrir(nav, s, '#/liga/torneo-a/mesas', usuario=H.ANA); err += e
    g.caso('final que no cuadra (2·2·2·0·0): aviso y «Terminar torneo» bloqueado', pg.locator('[data-no-cuadra="final"]').count() == 1 and pg.is_disabled('button:has-text("Terminar torneo")'))
    ctx.close()

    # ---------------- Partidas libres: mesa completa sin invitados debe cuadrar exacto
    s = copy.deepcopy(H.seed_base())
    s['eventos'] = {'libre-a': {'ownerUid': 'ana', 'tipo': 'liga', 'nombre': 'Libre', 'creada': 1, 'formato': 'libre', 'modalidad': 'en-linea', 'zona': 'America/Mexico_City',
                                'hazanasModo': 'no', 'inicio': '2026-10-01', 'fin': '2026-12-31', 'jugadores': {k: {'nick': k.upper()} for k in 'abcde'}}}
    ctx, pg, e = H.abrir(nav, s, '#/liga/libre-a/partidas', usuario=H.ANA); err += e
    p = lambda b: pg.evaluate("(b) => problemaMesa(eventos['libre-a'], b, null)", b)
    b4 = {'fecha': '2026-10-20', 'mesa': 4, 'jugadores': {'a': '1.5', 'b': '1', 'c': '1', 'd': '0.5'}, 'invitados': ''}
    g.caso('libre: 4 de la liga sin invitados, 1.5·1·1·0.5 (redondeando 5) → no cuadra', 'no cuadran' in p(b4) and 'suman 5' in p(b4), p(b4))
    b4['jugadores'] = {'a': '2', 'b': '1', 'c': '1', 'd': '0'}
    g.caso('libre: 2·1·1·0 en mesa de 4 → cuadra', p(b4) == '', p(b4))
    b5 = {'fecha': '2026-10-20', 'mesa': 5, 'jugadores': {'a': '2.5', 'b': '1.5', 'c': '0.5'}, 'invitados': 'X, Y'}
    g.caso('libre con invitados: 2.5·1.5·0.5 (redondeando 6) en mesa de 5 → se pasa', 'más que los 5 lugares' in p(b5), p(b5))
    b5['jugadores'] = {'a': '2', 'b': '0.5', 'c': '0.5'}
    g.caso('libre con invitados: 2·0.5·0.5 (redondeando 4) → se acepta (los invitados completan)', p(b5) == '', p(b5))
    ctx.close()
    # Mesas ya guardadas que no cuadran (como la liga de prueba del 26 oct): aviso para el equipo, siguen contando
    s['eventos']['libre-a']['mesas'] = {
        'm1': {'fecha': '2026-10-26', 'mesa': 5, 'jugadores': {'a': 3, 'b': 1, 'c': 1, 'd': 0}, 'invitados': 'Lalo', 'por': 'ana', 'creada': 1},
        'm4': {'fecha': '2026-10-26', 'mesa': 5, 'jugadores': {'a': 3, 'b': 1, 'c': 0, 'd': 0, 'e': 0}, 'por': 'ana', 'creada': 4},
        'm6': {'fecha': '2026-10-26', 'mesa': 5, 'jugadores': {'a': 1, 'b': 1, 'c': 1, 'd': 0, 'e': 0}, 'por': 'ana', 'creada': 6}}
    ctx, pg, e = H.abrir(nav, s, '#/liga/libre-a/partidas', usuario=H.ANA); err += e
    t = pg.inner_text('[data-hay-no-cuadran]') if pg.locator('[data-hay-no-cuadran]').count() else ''
    g.caso('libre: «⚠️ Hay 2 mesas cuyos VP no cuadran… siguen contando»', 'Hay 2 mesas' in t and 'siguen contando' in t, t)
    g.caso('libre: cada mesa que no cuadra lo dice (redondeando 4 y 3)', pg.locator('[data-mesa-no-cuadra]').count() == 2 and 'suman 4' in pg.inner_text('[data-mesa="m4"]') and 'suman 3' in pg.inner_text('[data-mesa="m6"]'))
    g.caso('libre: la mesa con invitado (Lalo) no se marca', not pg.locator('[data-mesa="m1"] [data-mesa-no-cuadra]').count())
    g.caso('libre: siguen contando en la tabla (A con 3 partidas)', pg.evaluate("() => tablaLibre(eventos['libre-a']).find(f => f.nick === 'A').partidas") == 3)
    pg.click('[data-mesa="m6"] >> text=Corregir'); pg.wait_for_timeout(200)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    g.caso('libre: al corregirla, no deja guardar hasta que cuadre', 'no cuadran' in pg.inner_text('#rpError'), pg.inner_text('#rpError'))
    pg.select_option('[data-vp-de="d"]', '1'); pg.wait_for_timeout(100); pg.select_option('[data-vp-de="e"]', '1'); pg.wait_for_timeout(100)
    pg.click('text=Revisar y guardar'); pg.wait_for_timeout(150)
    pg.click('[data-reportar] button:has-text("guardar") >> nth=0'); pg.wait_for_timeout(300)
    g.caso('libre: corregida (1·1·1·1·1), ya no se marca', store(pg, 'eventos/libre-a/mesas/m6/jugadores') == {'a': 1, 'b': 1, 'c': 1, 'd': 1, 'e': 1} and 'Hay 1 mesa' in H.texto(pg))
    ctx.close()
    ctx, pg, e = H.abrir(nav, s, '#/liga/libre-a/partidas'); err += e
    g.caso('libre: el público no ve los avisos', not pg.locator('[data-mesa-no-cuadra], [data-hay-no-cuadran]').count())
    ctx.close()

    ctx, pg, e = H.abrir(nav, semilla(), '#/ayuda'); err += e
    t = H.texto(pg)
    g.caso('guía: «¿Cómo se calculan GW, VP y TP?» y «¿Por qué dice que los VP de una mesa no cuadran?»', '¿Cómo se calculan GW, VP y TP?' in t and 'no cuadran?' in t)
    ctx.close()
    g.caso('sin errores de JavaScript', not err, err[:3])
