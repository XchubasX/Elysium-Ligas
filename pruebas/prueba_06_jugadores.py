"""Lista de jugadores de la liga: agregar, nick repetido, renombrar, quitar y copiar de otra liga."""
import herramientas as H

TITULO = 'Jugadores de la liga'


def nicks(pg, liga='liga-a'):
    return sorted(p['nick'] for p in (pg.evaluate(f"window.__store().eventos['{liga}'].jugadores") or {}).values())


def correr(nav, g):
    seed = H.seed_base()
    seed['organizadores']['beto'] = True
    seed['eventos']['liga-e'] = {'ownerUid': 'beto', 'tipo': 'liga', 'nombre': 'Liga de Beto', 'creada': 1,
                                 'jugadores': {'q1': {'nick': 'toni'}, 'q2': {'nick': 'Nocturna'}, 'q3': {'nick': 'Mireia'}}}
    seed['eventos']['liga-a']['jornadas']['j2']['presentes'] = {'p1': True}
    ctx, pg, err = H.abrir(nav, seed, '#/liga/liga-a/jugadores', usuario=H.BETO)
    g.caso('Beto (ayudante) entra a la pestaña Jugadores', pg.is_visible('#nuevoNick'))
    pg.fill('#nuevoNick', 'Carlos'); pg.press('#nuevoNick', 'Enter'); pg.wait_for_timeout(250)
    g.caso('agrega «Carlos»', nicks(pg) == ['Carlos', 'Lasombra', 'Toni'], nicks(pg))
    g.caso('la casilla queda vacía para el siguiente', pg.input_value('#nuevoNick') == '')
    pg.fill('#nuevoNick', 'lasombra'); pg.press('#nuevoNick', 'Enter'); pg.wait_for_timeout(200)
    g.caso('nick repetido (aunque cambien mayúsculas) → aviso y no se agrega', 'Ya hay un jugador con ese nick' in H.texto(pg) and len(nicks(pg)) == 3)

    fila = pg.locator('[data-jugador=\"Carlos\"]')
    fila.locator('text=Cambiar nick').click(); pg.wait_for_timeout(100)
    pg.fill('#editNick', 'Carlitos'); pg.click('form >> text=Guardar'); pg.wait_for_timeout(250)
    g.caso('cambiar nick: Carlos → Carlitos', 'Carlitos' in nicks(pg) and 'Carlos' not in nicks(pg), nicks(pg))

    fila = pg.locator('[data-jugador=\"Lasombra\"]')
    fila.locator('button', has_text='Quitar').click(); fila.locator('button', has_text='¿Seguro?').click(); pg.wait_for_timeout(200)
    g.caso('no deja quitar a quien ya jugó (Lasombra)', 'Lasombra' in nicks(pg) and 'Ya jugó en alguna jornada' in H.texto(pg))
    fila = pg.locator('[data-jugador=\"Carlitos\"]')
    fila.locator('button', has_text='Quitar').click(); fila.locator('button', has_text='¿Seguro?').click(); pg.wait_for_timeout(250)
    g.caso('sí deja quitar a quien no ha jugado (Carlitos)', 'Carlitos' not in nicks(pg), nicks(pg))

    g.caso('ofrece copiar jugadores de «Liga de Beto»', pg.is_visible('#copiarDe') and 'Liga de Beto' in pg.inner_text('#copiarDe'))
    pg.select_option('#copiarDe', 'liga-e'); pg.click('#btnCopiar'); pg.wait_for_timeout(250)
    g.caso('copia solo los que faltan (Nocturna y Mireia; «toni» ya estaba)', nicks(pg) == ['Lasombra', 'Mireia', 'Nocturna', 'Toni'], nicks(pg))
    g.caso('aviso «Se copiaron 2 jugadores»', 'Se copiaron 2 jugadores' in H.texto(pg))
    g.caso('las reglas aceptaron todo', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    if H.HAY_REGLAS:
        r = pg.evaluate("guardar('liga-b', {'jugadores/zz': {nick:'Intruso'}})")
        g.caso('REGLAS: Beto no puede anotar jugadores en la Liga B (no es su equipo)', r is False)
    ctx.close()

    ctx, pg, e2 = H.abrir(nav, seed, '#/liga/liga-a/jugadores')
    g.caso('el público no ve la pestaña Jugadores (le muestra la Tabla)', not pg.is_visible('#nuevoNick') and 'Jugadores' not in pg.inner_text('nav'))
    ctx.close()
    todos = err + e2
    g.caso('las páginas abrieron sin errores', not todos, todos)
