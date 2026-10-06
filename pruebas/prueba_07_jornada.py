"""Día de jornada, completo y hecho por el AYUDANTE (el caso más restringido por las reglas)."""
import herramientas as H

TITULO = 'Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar'

J = "window.__store().eventos['liga-a'].jornadas.j3"


def correr(nav, g):
    seed = H.seed_base()
    ev = seed['eventos']['liga-a']
    ev['jugadores'] = {f'p{i}': {'nick': n} for i, n in enumerate(['Lasombra', 'Toni', 'Mau', 'Fer', 'Iván', 'Sara', 'Eva', 'Jordi', 'Pau', 'Luis', 'Ana'], 1)}
    ev['jornadas']['j3'] = {'numero': 3, 'fecha': '2026-11-07', 'estado': 'pendiente'}
    ctx, pg, err = H.abrir(nav, seed, '#/liga/liga-a/jornada/j3', usuario=H.BETO)
    t = H.texto(pg)
    g.caso('jornada pendiente: dice que no ha empezado y ofrece «Empezar jornada»', 'todavía no empieza' in t and 'Empezar jornada' in t, t[:500])
    pg.click('text=Empezar jornada'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(250)
    g.caso('Beto (ayudante) la empieza: queda «En curso»', pg.evaluate(J + '.estado') == 'abierta' and 'En curso' in H.texto(pg), pg.evaluate('window.__denegadas'))

    # a) Pase de lista: 9 presentes + 1 nuevo = 10 → 2 mesas de 5
    for n in ['Lasombra', 'Toni', 'Mau', 'Fer', 'Iván', 'Sara', 'Eva', 'Jordi', 'Pau']:
        pg.click(f'button[aria-pressed] >> text="{n}"'); pg.wait_for_timeout(60)
    pg.wait_for_timeout(150)
    g.caso('pase de lista: 9 presentes', len(pg.evaluate(J + '.presentes') or {}) == 9, pg.evaluate(J + '.presentes'))
    pg.fill('input[placeholder^="+ jugador nuevo"]', 'Nocturna'); pg.press('input[placeholder^="+ jugador nuevo"]', 'Enter'); pg.wait_for_timeout(300)
    g.caso('«+ jugador nuevo» lo agrega a la liga y lo deja presente (10)', len(pg.evaluate(J + '.presentes') or {}) == 10 and 'Nocturna' in H.texto(pg), pg.evaluate('window.__denegadas'))
    g.caso('dice «10 presentes → 2 mesas de 5»', '10 presentes → 2 mesas de 5' in H.texto(pg), H.texto(pg)[-700:])

    # b) Sortear
    pg.click('text=Sortear mesas de la ronda 1'); pg.wait_for_timeout(250)
    mesas = pg.evaluate(J + '.rondas.r1.mesas') or {}
    g.caso('sorteo: 2 mesas de 5 con asientos 1 a 5', sorted(len(m) for m in mesas.values()) == [5, 5] and all(sorted(x['asiento'] for x in m.values()) == [1, 2, 3, 4, 5] for m in mesas.values()), mesas)
    g.caso('nadie quedó en dos mesas', len({k for m in mesas.values() for k in m}) == 10)

    # Mover un jugador de la mesa 1 a una mesa nueva y regresarlo
    m1 = sorted(mesas['m1'].items(), key=lambda kv: kv[1]['asiento'])
    quien = m1[1][0]
    pg.locator('select[aria-label="Mover"]').nth(1).select_option('nueva'); pg.wait_for_timeout(250)
    ms = pg.evaluate(J + '.rondas.r1.mesas')
    g.caso('mover a «una mesa nueva»: queda solo en la mesa 3 y la mesa 1 se reacomoda (asientos 1–4)',
           quien in ms.get('m3', {}) and quien not in ms['m1'] and sorted(x['asiento'] for x in ms['m1'].values()) == [1, 2, 3, 4], ms)
    sel = pg.locator('[data-mesa=\"1-3\"]').locator('select[aria-label="Mover"]')
    sel.select_option('m1'); pg.wait_for_timeout(250)
    ms = pg.evaluate(J + '.rondas.r1.mesas')
    g.caso('regresarlo a la mesa 1: vuelve como asiento 5 y la mesa 3 desaparece', ms['m1'].get(quien, {}).get('asiento') == 5 and 'm3' not in ms, ms)

    # c) VP: mesa 1 → 3,1,1,0,0 (GW al de 3); mesa 2 → 2,2,1,0,0 (empate: sin GW)
    def vps(mesa_n, valores):
        caja = pg.locator(f'[data-mesa="1-{mesa_n}"]')
        sels = caja.locator('select[aria-label^="VP de"]')
        for i, v in enumerate(valores):
            sels.nth(i).select_option(str(v)); pg.wait_for_timeout(80)
    vps(1, [3, 1, 1, 0, 0]); vps(2, [2, 2, 1, 0, 0]); pg.wait_for_timeout(200)
    r = pg.evaluate(f"rondasOrdenadas({J})[0].mesas.map(m => m.jugadores.map(x => x.vp))")
    g.caso('VP guardados en las dos mesas', r == [[3, 1, 1, 0, 0], [2, 2, 1, 0, 0]], r)
    t = H.texto(pg)
    g.caso('la mesa 1 marca GW al de 3 VP', pg.locator('[data-mesa=\"1-1\"]').locator('text=GW').count() == 1)
    g.caso('la mesa 2 dice «Sin GW» por empate', 'Sin GW en esta mesa' in pg.locator('[data-mesa=\"1-2\"]').inner_text())
    g.caso('con VP capturados ya no se puede volver a sortear la ronda', 'Volver a sortear' not in t)

    # Aviso de suma imposible (no bloquea)
    caja = pg.locator('[data-mesa=\"1-1\"]')
    caja.locator('select[aria-label^="VP de"]').nth(4).select_option('3'); pg.wait_for_timeout(200)
    g.caso('si la suma de VP pasa de 5, avisa', 'La suma de VP (8) es mayor' in H.texto(pg))
    caja.locator('select[aria-label^="VP de"]').nth(4).select_option('0'); pg.wait_for_timeout(200)

    # Ronda 2 y cerrar
    g.caso('aparece «+ Sortear ronda 2»', '+ Sortear ronda 2' in H.texto(pg))
    pg.click('text=+ Sortear ronda 2'); pg.wait_for_timeout(250)
    g.caso('ronda 2 sorteada', len(pg.evaluate(J + '.rondas.r2.mesas') or {}) == 2)
    t = pg.inner_text('#app')
    g.caso('cerrar está bloqueado mientras falten VP (lo dice)', 'faltan los VP de 5 jugadores' in t and pg.is_disabled('button:has-text("Cerrar jornada")'), t[-400:])
    pg.locator('[data-ronda="2"]').locator('text=Borrar ronda').click()
    pg.locator('[data-ronda="2"]').locator('text=¿Seguro? Toca otra vez').click(); pg.wait_for_timeout(250)
    g.caso('«Borrar ronda» quita la ronda 2 (sin VP)', not pg.evaluate(J + '.rondas.r2'))

    # d) Hazaña
    pg.select_option('#hzJugador', label='Toni'); pg.click('button:text-is("Dar")'); pg.wait_for_timeout(250)
    hz = list((pg.evaluate(J + '.hazanas') or {}).values())
    g.caso('hazaña otorgada a Toni', len(hz) == 1 and hz[0]['hazana'] == 'h1' and hz[0]['jugador'] == 'p2', hz)

    # e) Cerrar
    g.caso('todo capturado: «Cerrar jornada» habilitado', not pg.is_disabled('button:has-text("Cerrar jornada")'))
    pg.click('button:has-text("Cerrar jornada")'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(300)
    g.caso('Beto la cierra: queda «Jugada»', pg.evaluate(J + '.estado') == 'cerrada' and 'Jugada' in H.texto(pg))
    g.caso('cerrada: ya no hay selectores de VP para Beto', pg.locator('select[aria-label^="VP de"]').count() == 0)
    g.caso('Beto (ayudante) NO ve «Reabrir jornada»', 'Reabrir' not in H.texto(pg))
    g.caso('las reglas aceptaron todo lo de Beto', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    if H.HAY_REGLAS:
        r = pg.evaluate("guardar('liga-a', {'jornadas/j3/rondas/r1/mesas/m1/p1/vp': 5})")
        g.caso('REGLAS: con la jornada cerrada, Beto ya no puede cambiar VP a mano', r is False)
        r = pg.evaluate("guardar('liga-a', {'jornadas/j3/estado': 'abierta'})")
        g.caso('REGLAS: Beto no puede reabrirla a mano', r is False)
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    store = pg.evaluate('window.__store()')
    ctx.close()

    # La tabla pública ya cuenta la jornada 3
    ctx, pg, e2 = H.abrir(nav, store, '#/liga/liga-a')
    lider = pg.evaluate("tablaLiga(eventos['liga-a'])[0]")
    g.caso('la tabla pública ya cuenta la jornada (el líder tiene 1 GW y 3 VP)', lider['gw'] == 1 and lider['vp'] == 3, lider)
    pg.goto(pg.url.split('#')[0] + '#/liga/liga-a/jornada/j3'); pg.wait_for_timeout(150)
    t = H.texto(pg)
    g.caso('el público ve las mesas de la jornada con VP y GW, sin controles', 'Mesa 1' in t and '3 VP' in t and 'GW' in t and pg.locator('select').count() == 0, t[:600])
    g.caso('el público ve la hazaña del día', 'Sangrado más cuantioso' in t and 'Toni' in t)
    ctx.close()

    # El organizador sí puede reabrir
    ctx, pg, e3 = H.abrir(nav, store, '#/liga/liga-a/jornada/j3', usuario=H.ANA)
    pg.click('text=Reabrir jornada para corregir'); pg.click('text=¿Seguro? Toca otra vez'); pg.wait_for_timeout(250)
    g.caso('Ana (organizadora) reabre la jornada', pg.evaluate(J + '.estado') == 'abierta' and pg.locator('select[aria-label^="VP de"]').count() == 10, pg.evaluate('window.__denegadas'))
    ctx.close()

    # Pocos presentes y sobrantes
    seed2 = H.seed_base(); ev2 = seed2['eventos']['liga-a']
    ev2['jugadores'] = {f'p{i}': {'nick': f'J{i}'} for i in range(1, 8)}
    ev2['jornadas']['j3'] = {'numero': 3, 'fecha': '2026-11-07', 'estado': 'abierta', 'presentes': {f'p{i}': True for i in range(1, 8)}}
    ctx, pg, e4 = H.abrir(nav, seed2, '#/liga/liga-a/jornada/j3', usuario=H.ANA)
    g.caso('7 presentes: avisa «1 mesa de 5 · 2 sin mesa» (como el sorteo de Elysium)', '1 mesa de 5 · 2 sin mesa' in pg.inner_text('#app'), pg.inner_text('#app')[-400:])
    pg.click('text=Sortear mesas de la ronda 1'); pg.wait_for_timeout(250)
    g.caso('los que sobran salen en «Sin mesa (2)» para acomodarlos', 'Sin mesa (2)' in pg.inner_text('#app'))
    pg.locator('[data-sinmesa] select[aria-label="Mover"]').first.select_option('nueva'); pg.wait_for_timeout(200)
    pg.locator('[data-sinmesa] select[aria-label="Mover"]').first.select_option('m2'); pg.wait_for_timeout(200)
    pg.locator('[data-mesa="1-1"] select[aria-label="Mover"]').first.select_option('m2'); pg.wait_for_timeout(200)
    ms = pg.evaluate(J + '.rondas.r1.mesas')
    g.caso('se acomodan a mano en una mesa de 4 y otra de 3', sorted(len(m) for m in ms.values()) == [3, 4] and 'Sin mesa' not in pg.inner_text('#app'), ms)
    g.caso('asientos sin huecos en las dos mesas', all(sorted(x['asiento'] for x in m.values()) == list(range(1, len(m) + 1)) for m in ms.values()), ms)
    g.caso('las reglas aceptaron todo', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    ctx.close()
    todos = err + e2 + e3 + e4
    g.caso('las páginas abrieron sin errores', not todos, todos)
