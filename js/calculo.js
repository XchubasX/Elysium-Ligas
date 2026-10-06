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
  jornadasOrdenadas(ev).filter(j => j.estado === 'cerrada').forEach(j => {
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
