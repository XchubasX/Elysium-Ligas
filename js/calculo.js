// =====================================================================
// js/calculo.js — CÁLCULOS DE LA LIGA (sin pantalla; se prueban aparte)
// GW: lo gana quien tenga más VP en su mesa, solo si es el único con ese
// máximo y tiene al menos 2 VP (misma regla que la liga de CDMX).
// La tabla solo cuenta jornadas CERRADAS.
// =====================================================================
const GW_MIN_VP = 2;

function lista(obj) { return Object.keys(obj || {}).map(k => Object.assign({ id: k }, obj[k])); }

function jornadasOrdenadas(ev) {
  return lista(ev && ev.jornadas).sort((a, b) => (a.numero || 0) - (b.numero || 0));
}

// mesa = { jugadorId: { asiento, vp } } → { jugadorId: { vp, gw } }
function resultadosMesa(mesa) {
  const filas = Object.keys(mesa || {}).map(jid => ({ jid, vp: Number((mesa[jid] || {}).vp) || 0 }));
  const max = filas.reduce((m, f) => Math.max(m, f.vp), -1);
  const conMax = filas.filter(f => f.vp === max).length;
  const out = {};
  filas.forEach(f => { out[f.jid] = { vp: f.vp, gw: (max >= GW_MIN_VP && f.vp === max && conMax === 1) ? 1 : 0 }; });
  return out;
}

// Suma de una jornada: { jugadorId: { vp, gw, mesas } }
function sumaJornada(j) {
  const t = {};
  Object.values((j && j.rondas) || {}).forEach(r => {
    Object.values((r && r.mesas) || {}).forEach(mesa => {
      const res = resultadosMesa(mesa);
      Object.keys(res).forEach(jid => {
        t[jid] = t[jid] || { vp: 0, gw: 0, mesas: 0 };
        t[jid].vp += res[jid].vp; t[jid].gw += res[jid].gw; t[jid].mesas += 1;
      });
    });
  });
  return t;
}

// Tabla general: [{ jid, nick, gw, vp, hazanas, jornadas }]
function tablaLiga(ev) {
  const jugadores = (ev && ev.jugadores) || {};
  const t = {};
  const fila = (jid) => (t[jid] = t[jid] || { jid, nick: (jugadores[jid] || {}).nick || '(jugador borrado)', gw: 0, vp: 0, hazanas: 0, jornadas: 0 });
  jornadasOrdenadas(ev).filter(j => j.estado === 'cerrada').forEach(j => {
    const s = sumaJornada(j);
    Object.keys(s).forEach(jid => { const f = fila(jid); f.gw += s[jid].gw; f.vp += s[jid].vp; f.jornadas += 1; });
    Object.values(j.hazanas || {}).forEach(h => { if (h && h.jugador) fila(h.jugador).hazanas += 1; });
  });
  const desempate = ev && ev.hazanasModo === 'desempate';
  return Object.values(t).sort((a, b) =>
    (b.gw - a.gw) || (b.vp - a.vp) || (desempate ? b.hazanas - a.hazanas : 0) || a.nick.localeCompare(b.nick, 'es'));
}

// Hazañas otorgadas en jornadas cerradas: [{ numero, fecha, nombre, nick }]
function hazanasLiga(ev) {
  const cat = (ev && ev.hazanasCatalogo) || {}; const jug = (ev && ev.jugadores) || {};
  const out = [];
  jornadasOrdenadas(ev).filter(j => j.estado === 'cerrada' || esTorneo(ev)).forEach(j => {
    Object.values(j.hazanas || {}).forEach(h => {
      out.push({ numero: j.numero, fecha: j.fecha, nombre: (cat[h.hazana] || {}).nombre || 'Hazaña', nick: (jug[h.jugador] || {}).nick || '(jugador borrado)' });
    });
  });
  return out;
}

// Próxima jornada (no cerrada ni cancelada), la de fecha más cercana
function proximaJornada(ev) {
  return jornadasOrdenadas(ev).filter(j => j.estado !== 'cerrada' && j.estado !== 'cancelada')
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || a.numero - b.numero)[0] || null;
}

function contarJornadas(ev) {
  const js = jornadasOrdenadas(ev).filter(j => j.estado !== 'cancelada');
  return { total: js.length, jugadas: js.filter(j => j.estado === 'cerrada').length };
}

function estadoJornada(j) {
  if (j.estado === 'cancelada') return { texto: 'Cancelada', clase: 'text-zinc-500 line-through' };
  if (j.estado === 'cerrada') return { texto: 'Jugada', clase: 'text-emerald-300' };
  if (j.estado === 'abierta') return { texto: 'En curso', clase: 'text-amber-300' };
  return { texto: 'Pendiente', clase: 'text-zinc-400' };
}

// ---------------- Mesas: mismo reparto que el sorteo de Elysium
// Mesas de 5 y 4 (las más posibles de 5). Lo que no alcanza queda "sin mesa"
// para que el organizador decida (moverlos a mano a una mesa o a una nueva).
function tamanosMesas(n) {
  for (let fuera = 0; fuera <= n; fuera++) {
    const resto = n - fuera;
    if (resto === 0) return { tamanos: [], fuera };
    for (let cincos = Math.floor(resto / 5); cincos >= 0; cincos--) {
      const r = resto - cincos * 5;
      if (r % 4 === 0) return { tamanos: Array(cincos).fill(5).concat(Array(r / 4).fill(4)), fuera };
    }
  }
  return { tamanos: [], fuera: n };
}
function barajar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// jids → { mesas: { m1: { jid: { asiento } } }, sinMesa: [jid] }
function sortearMesas(jids) {
  const orden = barajar(jids); const { tamanos } = tamanosMesas(orden.length);
  const mesas = {}; let k = 0;
  tamanos.forEach((t, i) => { const m = {}; for (let s = 1; s <= t; s++) m[orden[k++]] = { asiento: s }; mesas['m' + (i + 1)] = m; });
  return { mesas, sinMesa: orden.slice(k) };
}

// Rondas y mesas ordenadas: [{ id, n, mesas: [{ id, n, jugadores: [{ jid, asiento, vp }] }] }]
function rondasOrdenadas(j) {
  const num = (s) => parseInt(String(s).slice(1), 10) || 0;
  return Object.keys((j && j.rondas) || {}).sort((a, b) => num(a) - num(b)).map((rid, i) => {
    const r = j.rondas[rid] || {};
    const mesas = Object.keys(r.mesas || {}).sort((a, b) => num(a) - num(b)).map((mid, k) => ({
      id: mid, n: k + 1,
      jugadores: Object.keys(r.mesas[mid] || {}).map(jid => ({ jid, asiento: (r.mesas[mid][jid] || {}).asiento || 0, vp: (r.mesas[mid][jid] || {}).vp }))
        .sort((a, b) => a.asiento - b.asiento)
    }));
    return { id: rid, n: i + 1, mesas };
  });
}
function siguienteId(obj, letra) {
  const max = Object.keys(obj || {}).reduce((m, k) => Math.max(m, parseInt(String(k).slice(1), 10) || 0), 0);
  return letra + (max + 1);
}
// ¿En qué mesa de esta ronda está el jugador? → id de mesa o null
function mesaDe(ronda, jid) {
  const ms = (ronda && ronda.mesas) || {};
  return Object.keys(ms).find(m => ms[m] && ms[m][jid]) || null;
}
// Problemas que impiden cerrar la jornada (lista de textos; vacía = se puede cerrar)
function faltasParaCerrar(j) {
  const rs = rondasOrdenadas(j); const out = [];
  if (!rs.some(r => r.mesas.length)) out.push('Todavía no hay mesas.');
  rs.forEach(r => r.mesas.forEach(m => {
    const sin = m.jugadores.filter(x => typeof x.vp !== 'number').length;
    if (sin) out.push('Ronda ' + r.n + ', mesa ' + m.n + ': faltan los VP de ' + sin + (sin === 1 ? ' jugador.' : ' jugadores.'));
  }));
  return out;
}
// Avisos que no impiden cerrar (la suma de VP de una mesa no puede pasar del número de jugadores)
function avisosMesa(m) {
  const suma = m.jugadores.reduce((s, x) => s + (typeof x.vp === 'number' ? x.vp : 0), 0);
  return suma > m.jugadores.length ? 'La suma de VP (' + suma + ') es mayor que el número de jugadores (' + m.jugadores.length + ').' : '';
}
// ¿El jugador ya aparece en alguna jornada? (entonces no se puede quitar de la lista)
function jugadorUsado(ev, jid) {
  return lista(ev && ev.jornadas).some(j => (j.presentes && j.presentes[jid]) ||
    Object.values(j.rondas || {}).some(r => mesaDe(r, jid)) ||
    Object.values(j.hazanas || {}).some(h => h && h.jugador === jid));
}
function hazanaUsada(ev, hid) {
  return lista(ev && ev.jornadas).some(j => Object.values(j.hazanas || {}).some(h => h && h.hazana === hid));
}
function jugadoresOrdenados(ev) {
  return lista(ev && ev.jugadores).sort((a, b) => String(a.nick).localeCompare(String(b.nick), 'es', { sensitivity: 'base' }));
}

// =====================================================================
// TORNEOS DE UN DÍA (todo vive en la jornada j1 del evento)
// Clasificación como VEKN: GW, luego VP, luego TP (no se muestra; solo desempata).
// TP por lugar en la mesa: 60·48·36·24·12; en mesa de 4: 60·48·24·12; empates promediados.
// =====================================================================
function esTorneo(ev) { return !!ev && ev.tipo === 'torneo'; }
function diaTorneo(ev) { const j = (ev && ev.jornadas && ev.jornadas.j1) || null; if (j) j.id = 'j1'; return j; }

function tpMesa(mesa) {
  const filas = Object.keys(mesa || {}).map(jid => ({ jid, vp: Number((mesa[jid] || {}).vp) || 0 })).sort((a, b) => b.vp - a.vp);
  const escala = filas.length === 4 ? [60, 48, 24, 12] : [60, 48, 36, 24, 12].slice(0, filas.length);
  const out = {}; let i = 0;
  while (i < filas.length) {
    let k = i; while (k + 1 < filas.length && filas[k + 1].vp === filas[i].vp) k++;
    const prom = escala.slice(i, k + 1).reduce((s, x) => s + x, 0) / (k - i + 1);
    for (let t = i; t <= k; t++) out[filas[t].jid] = prom;
    i = k + 1;
  }
  return out;
}

// Clasificación de las rondas: [{ jid, nick, gw, vp, tp, hazanas, rondas }]
function clasificacionTorneo(ev) {
  const j = diaTorneo(ev); const jug = (ev && ev.jugadores) || {}; const t = {};
  const fila = (jid) => (t[jid] = t[jid] || { jid, nick: (jug[jid] || {}).nick || '(jugador borrado)', gw: 0, vp: 0, tp: 0, hazanas: 0, rondas: 0 });
  Object.values((j && j.rondas) || {}).forEach(r => Object.values((r && r.mesas) || {}).forEach(mesa => {
    const res = resultadosMesa(mesa); const tp = tpMesa(mesa);
    Object.keys(mesa).forEach(jid => { const f = fila(jid); f.vp += res[jid].vp; f.gw += res[jid].gw; f.tp += tp[jid]; f.rondas += 1; });
  }));
  Object.values((j && j.hazanas) || {}).forEach(h => { if (h && h.jugador) fila(h.jugador).hazanas += 1; });
  const desempate = ev && ev.hazanasModo === 'desempate';
  return Object.values(t).sort((a, b) => (b.gw - a.gw) || (b.vp - a.vp) || (b.tp - a.tp) || (desempate ? b.hazanas - a.hazanas : 0) || a.nick.localeCompare(b.nick, 'es'));
}
function mismoPuesto(a, b) { return a && b && a.gw === b.gw && a.vp === b.vp && a.tp === b.tp; }

// Los 5 de la final. Si hay empate exacto (GW, VP y TP) en el corte, se sortea entre los empatados.
// → { lugares: { jid: 1..5 }, sorteados: [nicks] }
function elegirFinalistas(ev) {
  const c = clasificacionTorneo(ev); if (c.length < 5) return null;
  const corte = c[4];
  const arriba = c.filter((f, i) => i < 5 && !mismoPuesto(f, corte));
  const empatados = c.filter(f => mismoPuesto(f, corte));
  const entran = arriba.concat(barajar(empatados).slice(0, 5 - arriba.length));
  const orden = c.filter(f => entran.includes(f));
  const lugares = {}; orden.forEach((f, i) => { lugares[f.jid] = i + 1; });
  return { lugares, sorteados: empatados.length > 5 - arriba.length ? empatados.map(f => f.nick) : [] };
}

// Finalistas ordenados por lugar: [{ jid, nick, lugar, asiento, vp }]
function finalistas(ev) {
  const j = diaTorneo(ev); const jug = (ev && ev.jugadores) || {};
  return Object.keys((j && j.final) || {}).map(jid => Object.assign({ jid, nick: (jug[jid] || {}).nick || '(jugador borrado)' }, j.final[jid])).sort((a, b) => a.lugar - b.lugar);
}

// Resultado final del torneo: [{ jid, nick, gw, vp, finalVp|null, puesto }]
// Final: más VP en la final; si empatan, el mejor clasificado. Después, la clasificación de las rondas.
function resultadoTorneo(ev) {
  const c = clasificacionTorneo(ev); const fin = finalistas(ev);
  const enFinal = new Set(fin.map(f => f.jid));
  const primero = fin.slice().sort((a, b) => ((b.vp || 0) - (a.vp || 0)) || (a.lugar - b.lugar)).map(f => Object.assign({}, c.find(x => x.jid === f.jid) || { jid: f.jid, nick: f.nick, gw: 0, vp: 0 }, { finalVp: typeof f.vp === 'number' ? f.vp : null }));
  return primero.concat(c.filter(f => !enFinal.has(f.jid)).map(f => Object.assign({}, f, { finalVp: null })));
}

// Estado del torneo para mostrar: pendiente | ronda | final | terminado
function etapaTorneo(ev) {
  const j = diaTorneo(ev); if (!j || j.estado === 'pendiente' || !j.estado) return { etapa: 'pendiente' };
  if (j.estado === 'cancelada') return { etapa: 'cancelado' };
  if (j.estado === 'cerrada') return { etapa: 'terminado' };
  if (j.final) return { etapa: 'final' };
  return { etapa: 'ronda', ronda: Math.max(1, rondasOrdenadas(j).length) };
}
function textoRondas(ev) { return (ev.rondasPlan || 3) + ' rondas' + (ev.conFinal ? ' + final' : ''); }

// ---------------- Fechas de las jornadas de una liga
// La fecha debe caer dentro de la temporada y entre la jornada anterior y la siguiente
// (sin contar canceladas). Así el número de jornada siempre sigue el orden de las fechas.
// jid = la jornada que se cambia (null si es nueva). Devuelve '' si está bien, o el problema.
function problemaFechaJornada(ev, fecha, jid) {
  if (!fechaValida(fecha)) return 'Elige la fecha de la jornada.';
  if (ev.inicio && fecha < ev.inicio) return 'La fecha queda antes del inicio de la temporada (' + fechaCorta(ev.inicio) + ').';
  if (ev.fin && fecha > ev.fin) return 'La fecha queda después del fin de la temporada (' + fechaCorta(ev.fin) + ').';
  const js = jornadasOrdenadas(ev).filter(j => j.estado !== 'cancelada' && j.id !== jid);
  const propia = jid && ev.jornadas && ev.jornadas[jid];
  const numero = propia ? propia.numero : Infinity;
  const mismoDia = js.find(j => j.fecha === fecha);
  if (mismoDia) return 'Ese día ya está la jornada ' + mismoDia.numero + '.';
  const antes = js.filter(j => j.numero < numero).pop();
  const despues = js.find(j => j.numero > numero);
  if (antes && fecha <= antes.fecha) return 'Debe ser después de la jornada ' + antes.numero + ' (' + fechaCorta(antes.fecha) + ').';
  if (despues && fecha >= despues.fecha) return 'Debe ser antes de la jornada ' + despues.numero + ' (' + fechaCorta(despues.fecha) + ').';
  return '';
}
// Jornadas (no canceladas) que quedarían fuera de una temporada nueva
function jornadasFuera(ev, inicio, fin) {
  return jornadasOrdenadas(ev).filter(j => j.estado !== 'cancelada' && ((inicio && j.fecha < inicio) || (fin && j.fecha > fin)));
}
