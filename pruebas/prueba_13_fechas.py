"""Fechas de la liga: jornadas dentro de la temporada, en orden y sin repetir día; temporada obligatoria."""
import herramientas as H

TITULO = 'Fechas de la liga: validaciones'
J = "window.__store().eventos['liga-a'].jornadas"


def seed():
    s = H.seed_base()
    # Liga A: temporada 1 oct – 20 dic; J1 10 oct (abierta), J2 24 oct (cerrada), J3 7 nov (pendiente)
    s['eventos']['liga-a']['jornadas']['j3'] = {'numero': 3, 'fecha': '2026-11-07', 'estado': 'pendiente'}
    return s


def agregar(pg, fecha):
    pg.click('text=+ Agregar jornada'); pg.wait_for_timeout(80)
    pg.fill('#jnFecha', fecha); pg.click('form >> text=Agregar'); pg.wait_for_timeout(200)
    return pg.inner_text('#jnError') if pg.is_visible('#jnError') else ''


def correr(nav, g):
    ctx, pg, err = H.abrir(nav, seed(), '#/liga/liga-a/calendario', usuario=H.ANA)
    e = agregar(pg, '2026-12-26')
    g.caso('jornada nueva después del fin de la temporada → bloqueada', 'después del fin de la temporada (dom 20 dic)' in e and 'j4' not in pg.evaluate(J), e)
    pg.fill('#jnFecha', '2026-09-26'); pg.click('form >> text=Agregar'); pg.wait_for_timeout(200)
    e = pg.inner_text('#jnError')
    g.caso('jornada nueva antes del inicio de la temporada → bloqueada', 'antes del inicio de la temporada' in e, e)
    pg.fill('#jnFecha', '2026-10-31'); pg.click('form >> text=Agregar'); pg.wait_for_timeout(200)
    e = pg.inner_text('#jnError')
    g.caso('jornada nueva antes de la última jornada → «Debe ser después de la jornada 3»', 'Debe ser después de la jornada 3 (sáb 7 nov)' in e, e)
    pg.fill('#jnFecha', '2026-11-07'); pg.click('form >> text=Agregar'); pg.wait_for_timeout(200)
    e = pg.inner_text('#jnError')
    g.caso('jornada nueva el mismo día que otra → «Ese día ya está la jornada 3»', 'Ese día ya está la jornada 3' in e, e)
    pg.fill('#jnFecha', '2026-11-21'); pg.click('form >> text=Agregar'); pg.wait_for_timeout(250)
    g.caso('fecha válida (21 nov) → se agrega la jornada 4', (pg.evaluate(J).get('j4') or {}).get('fecha') == '2026-11-21')

    fila = pg.locator('[data-jornada="3"]')
    fila.locator('text=Cambiar fecha').click(); pg.wait_for_timeout(80)
    pg.fill('#jfFecha', '2026-11-28'); pg.click('form >> text=Guardar'); pg.wait_for_timeout(200)
    e = pg.inner_text('#jfError')
    g.caso('cambiar J3 a después de J4 → «Debe ser antes de la jornada 4»', 'Debe ser antes de la jornada 4' in e and pg.evaluate(J + ".j3.fecha") == '2026-11-07', e)
    pg.fill('#jfFecha', '2026-10-17'); pg.click('form >> text=Guardar'); pg.wait_for_timeout(200)
    e = pg.inner_text('#jfError')
    g.caso('cambiar J3 a antes de J2 → «Debe ser después de la jornada 2»', 'Debe ser después de la jornada 2' in e, e)
    pg.fill('#jfFecha', '2026-11-14'); pg.click('form >> text=Guardar'); pg.wait_for_timeout(250)
    g.caso('cambiar J3 entre J2 y J4 (14 nov) → sí se guarda', pg.evaluate(J + ".j3.fecha") == '2026-11-14')

    # Cancelada no cuenta: cancelar J4 deja agregar el 21 nov otra vez; reactivar J4 ya no cabe
    pg.locator('[data-jornada="4"] button', has_text='Cancelar').click(); pg.locator('[data-jornada="4"] button', has_text='¿Seguro?').click(); pg.wait_for_timeout(250)
    agregar(pg, '2026-11-21')
    g.caso('una jornada cancelada no estorba: se agrega la J5 el 21 nov', (pg.evaluate(J).get('j5') or {}).get('fecha') == '2026-11-21', pg.evaluate(J))
    pg.locator('[data-jornada="4"] >> text=Reactivar').click(); pg.wait_for_timeout(200)
    g.caso('reactivar la J4 (choca con el 21 nov de la J5) → bloqueado con aviso', pg.evaluate(J + ".j4.estado") == 'cancelada' and 'No se puede reactivar' in H.texto(pg))
    g.caso('las reglas aceptaron todo', not pg.evaluate('window.__denegadas'), pg.evaluate('window.__denegadas'))
    ctx.close()

    # Ajustes: acortar la temporada con jornadas fuera
    ctx, pg, e2 = H.abrir(nav, seed(), '#/liga/liga-a/ajustes', usuario=H.ANA)
    pg.fill('#ajFin', '2026-11-01'); pg.click('text=Guardar cambios'); pg.wait_for_timeout(150)
    e = pg.inner_text('#ajError')
    g.caso('acortar la temporada dejando la J3 fuera → bloqueado y lo dice', 'La jornada 3 (sáb 7 nov) queda fuera de la temporada' in e and pg.evaluate("window.__store().eventos['liga-a'].fin") == '2026-12-20', e)
    pg.fill('#ajInicio', '2026-10-15'); pg.fill('#ajFin', '2026-12-20'); pg.click('text=Guardar cambios'); pg.wait_for_timeout(150)
    e = pg.inner_text('#ajError')
    g.caso('mover el inicio después de la J1 → bloqueado', 'La jornada 1' in e, e)
    ctx.close()

    # Crear liga: inicio y fin obligatorios
    ctx, pg, e3 = H.abrir(nav, H.seed_base(), '#/crear', usuario=H.ANA)
    pg.fill('#crNombre', 'Liga sin fechas'); pg.dispatch_event('#crNombre', 'input')
    pg.click('text=Crear liga'); pg.wait_for_timeout(150)
    g.caso('crear liga sin fechas → «Las fechas de inicio y fin son obligatorias.»', 'obligatorias' in pg.inner_text('#crError') and not pg.evaluate("window.__store().eventos['liga-sin-fechas']"))
    ctx.close()
    todos = err + e2 + e3
    g.caso('las páginas abrieron sin errores', not todos, todos)
