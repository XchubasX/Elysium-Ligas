"""Cálculos de la liga: GW, VP, orden de la tabla y hazañas (sin pantalla)."""
import herramientas as H

TITULO = 'Cálculos: GW, VP y orden de la tabla'


def correr(nav, g):
    ctx, pg, errores = H.abrir(nav, H.seed_base())
    ev = lambda js: pg.evaluate(js)
    r = ev("resultadosMesa({a:{vp:3},b:{vp:1},c:{vp:1},d:{vp:0}})")
    g.caso('3 VP único máximo → gana GW', r['a']['gw'] == 1 and r['b']['gw'] == 0, r)
    r = ev("resultadosMesa({a:{vp:2},b:{vp:2},c:{vp:1}})")
    g.caso('empate en el máximo (2 y 2) → nadie gana GW', r['a']['gw'] == 0 and r['b']['gw'] == 0, r)
    r = ev("resultadosMesa({a:{vp:1.5},b:{vp:1},c:{vp:1},d:{vp:1.5-1.5}})")
    g.caso('máximo de 1.5 VP (menos de 2) → nadie gana GW', all(x['gw'] == 0 for x in r.values()), r)
    r = ev("resultadosMesa({a:{vp:2},b:{vp:1.5},c:{vp:1.5}})")
    g.caso('exactamente 2 VP y único → gana GW', r['a']['gw'] == 1, r)
    r = ev("resultadosMesa({a:{vp:2.5},b:{vp:2.5}})")
    g.caso('medios VP: empate 2.5 y 2.5 → nadie gana GW', r['a']['gw'] == 0 and r['b']['gw'] == 0, r)

    t = ev("""tablaLiga({jugadores:{p1:{nick:'Ana'},p2:{nick:'Beto'},p3:{nick:'Caro'}},jornadas:{
      j1:{numero:1,estado:'cerrada',rondas:{r1:{mesas:{m1:{p1:{vp:3},p2:{vp:1},p3:{vp:0}}}}}},
      j2:{numero:2,estado:'cerrada',rondas:{r1:{mesas:{m1:{p2:{vp:4},p3:{vp:1}}}},r2:{mesas:{m1:{p3:{vp:2},p1:{vp:1}}}}}},
      j3:{numero:3,estado:'abierta',rondas:{r1:{mesas:{m1:{p3:{vp:5}}}}}}}})""")
    g.caso('suma de dos jornadas cerradas, varias rondas',
           [(f['nick'], f['gw'], f['vp']) for f in t] == [('Beto', 1, 5), ('Caro', 1, 3), ('Ana', 1, 4)] or
           [(f['nick'], f['gw'], f['vp']) for f in t] == [('Beto', 1, 5), ('Ana', 1, 4), ('Caro', 1, 3)], t)
    g.caso('a igualdad de GW, ordena por VP (Beto 5, Ana 4, Caro 3)', [f['nick'] for f in t] == ['Beto', 'Ana', 'Caro'], [f['nick'] for f in t])
    g.caso('la jornada abierta NO cuenta (Caro no suma sus 5 VP)', next(f for f in t if f['nick'] == 'Caro')['vp'] == 3, t)

    base = """{hazanasModo:'%s',jugadores:{p1:{nick:'Zeta'},p2:{nick:'Alfa'}},jornadas:{j1:{numero:1,estado:'cerrada',
      rondas:{r1:{mesas:{m1:{p1:{vp:1},p2:{vp:1}}}}},hazanas:{x:{hazana:'h',jugador:'p1'}}}}}"""
    t1 = ev('tablaLiga(' + base % 'mencion' + ')')
    t2 = ev('tablaLiga(' + base % 'desempate' + ')')
    g.caso('hazañas como mención: NO desempatan (orden alfabético: Alfa, Zeta)', [f['nick'] for f in t1] == ['Alfa', 'Zeta'], t1)
    g.caso('hazañas como desempate: Zeta pasa arriba por su hazaña', [f['nick'] for f in t2] == ['Zeta', 'Alfa'], t2)
    g.caso('las hazañas nunca suman VP ni GW', all(f['vp'] == 1 and f['gw'] == 0 for f in t2), t2)

    p = ev("""proximaJornada({jornadas:{a:{numero:1,fecha:'2026-10-10',estado:'cerrada'},b:{numero:2,fecha:'2026-10-24',estado:'cancelada'},
      c:{numero:3,fecha:'2026-11-07'},d:{numero:4,fecha:'2026-10-31',estado:'pendiente'}}})""")
    g.caso('próxima jornada: la más cercana sin contar cerradas ni canceladas', p and p['numero'] == 4, p)
    c = ev("contarJornadas({jornadas:{a:{estado:'cerrada'},b:{estado:'cancelada'},c:{},d:{estado:'abierta'}}})")
    g.caso('conteo «Jornada X de Y» ignora canceladas', c == {'total': 3, 'jugadas': 1}, c)
    g.caso('la página abrió sin errores', not errores, errores)
    ctx.close()
