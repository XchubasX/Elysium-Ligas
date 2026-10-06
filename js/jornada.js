// =====================================================================
// js/jornada.js — DÍA DE JORNADA  (#/liga/{id}/jornada/{jornada})
// Público: ve las mesas y resultados (en curso o jugada).
// Equipo (organizador y ayudantes), en este orden:
//   a) pase de lista · b) mesas por ronda · c) VP (GW automático) · d) hazañas · e) cerrar
// =====================================================================
const VP_OPCIONES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function vistaJornada(id, jid) {
  if (!datosCargados) return errorDatos ? problemaConexion() : cargando();
  const ev = eventos[id]; const j = ev && ev.jornadas && ev.jornadas[jid];
  if (!ev || !j) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Esta jornada no existe.</p><a href="#/liga/' + esc(id) + '/calendario" class="' + BTN2 + '">Ir al calendario</a></div>';
  j.id = jid;
  const equipo = puedeCapturar(ev); const admin = puedeAdministrar(ev);
  const editable = j.estado === 'abierta' && equipo;
  const e = estadoJornada(j);
  let h = '<a href="#/liga/' + esc(id) + '/calendario" class="text-sm text-zinc-400 hover:text-zinc-200">← ' + esc(ev.nombre) + ' · Calendario</a>' +
    '<div class="flex justify-between items-start gap-2"><div><h2 class="text-xl font-extrabold text-wine-300">Jornada ' + esc(j.numero) + '</h2>' +
    '<p class="text-[13px] text-zinc-400">' + esc(fechaCorta(j.fecha)) + (j.hora ? ' · ' + esc(j.hora) : '') + '</p></div>' +
    '<span class="' + PILL + ' border border-zinc-700 ' + e.clase + '">' + e.texto + '</span></div>';

  if (j.estado === 'cancelada') return h + '<p class="text-zinc-400 text-sm py-6 text-center">Esta jornada se canceló.</p>';

  if (j.estado !== 'abierta' && j.estado !== 'cerrada') {
    h += '<p class="text-zinc-400 text-sm py-4 text-center">Esta jornada todavía no empieza.</p>';
    if (equipo) h += '<button type="button" onclick="dosToques(this,()=>cambiarEstadoJornada(\'' + esc(jid) + '\',\'abierta\'))" class="' + BTN + ' w-full">Empezar jornada (pase de lista y mesas)</button>' +
      '<p class="text-xs text-zinc-500 text-center">Mientras está en curso, el organizador y sus ayudantes capturan; el público ve las mesas en vivo.</p>';
    return h;
  }

  if (editable) h += bloquePaseDeLista(id, ev, j);
  h += bloqueRondas(id, ev, j, editable);
  if (ev.hazanasModo !== 'no') h += bloqueHazanas(id, ev, j, editable);

  if (editable) {
    const faltas = faltasParaCerrar(j);
    h += '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2 text-sm"><p class="font-bold">e) Cerrar jornada</p>' +
      (faltas.length ? '<ul class="text-amber-300 text-xs list-disc pl-4">' + faltas.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : '<p class="text-zinc-300">Todo capturado. Al cerrar, la tabla general se actualiza para todos.</p>') +
      '<button type="button" ' + (faltas.length ? 'disabled ' : '') + 'onclick="dosToques(this,()=>cambiarEstadoJornada(\'' + esc(jid) + '\',\'cerrada\'))" class="' + BTN + ' w-full disabled:opacity-40">Cerrar jornada</button></div>';
  }
  if (j.estado === 'cerrada' && admin) {
    h += '<button type="button" onclick="dosToques(this,()=>cambiarEstadoJornada(\'' + esc(jid) + '\',\'abierta\'))" class="' + BTN2 + ' w-full">Reabrir jornada para corregir</button>' +
      '<p class="text-xs text-zinc-500 text-center">Mientras esté reabierta, sus resultados no cuentan en la tabla.</p>';
  }
  return h;
}

// ---------------- a) Pase de lista
function bloquePaseDeLista(id, ev, j) {
  const pres = j.presentes || {}; const js = jugadoresOrdenados(ev);
  const n = js.filter(p => pres[p.id]).length;
  let h = '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2 text-sm"><p class="font-bold">a) Pase de lista · ' + n + (n === 1 ? ' presente' : ' presentes') + '</p>' +
    '<div class="flex flex-wrap gap-1.5">' + js.map(p => '<button type="button" onclick="marcarPresente(\'' + esc(j.id) + '\',\'' + esc(p.id) + '\',' + (pres[p.id] ? 'false' : 'true') + ')" aria-pressed="' + (pres[p.id] ? 'true' : 'false') + '" class="px-2.5 py-1.5 rounded-full text-[13px] border ' +
      (pres[p.id] ? 'bg-wine-700 border-wine-500 text-white font-semibold' : 'border-zinc-600 text-zinc-300') + '">' + (pres[p.id] ? '✓ ' : '') + esc(p.nick) + '</button>').join('') + '</div>' +
    '<form class="flex gap-2" onsubmit="agregarJugador(event,\'' + esc(j.id) + '\')"><input maxlength="30" placeholder="+ jugador nuevo (queda presente)" class="' + INP + '" autocomplete="off"><button class="' + BTN2 + '">Agregar</button></form></div>';
  return h;
}

function marcarPresente(jid, pid, si) {
  const ev = ligaActual(); const j = ev.jornadas[jid];
  if (!si) {
    const r = rondasOrdenadas(j).find(r => r.mesas.some(m => m.jugadores.some(x => x.jid === pid)));
    if (r) return aviso('Está sentado en una mesa de la ronda ' + r.n + '. Sácalo de la mesa primero.', 'error');
  }
  return guardar(idLigaActual(), { ['jornadas/' + jid + '/presentes/' + pid]: si ? true : null });
}

// ---------------- b) y c) Rondas, mesas y VP
function bloqueRondas(id, ev, j, editable) {
  const rs = rondasOrdenadas(j); const nick = (pid) => ((ev.jugadores || {})[pid] || {}).nick || '(jugador borrado)';
  const pres = Object.keys(j.presentes || {}).filter(pid => (ev.jugadores || {})[pid]);
  let h = '';
  if (!rs.length) {
    if (!editable) return h + '<p class="text-zinc-400 text-sm py-4 text-center">Todavía no hay mesas.</p>';
    return h + '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2 text-sm"><p class="font-bold">b) Mesas · ronda 1</p>' +
      '<p class="text-zinc-300">' + pres.length + ' presentes → ' + textoReparto(pres.length) + '</p>' +
      '<button type="button" ' + (pres.length < 4 ? 'disabled ' : '') + 'onclick="sortearRonda(\'' + esc(j.id) + '\',\'r1\')" class="' + BTN + ' w-full disabled:opacity-40">Sortear mesas de la ronda 1</button></div>';
  }
  rs.forEach(r => {
    const conVP = r.mesas.some(m => m.jugadores.some(x => typeof x.vp === 'number'));
    h += '<div data-ronda="' + r.n + '" class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-3 text-sm"><div class="flex justify-between items-center gap-2"><p class="font-bold">Ronda ' + r.n + '</p>' +
      (editable && !conVP ? '<span class="flex gap-1.5"><button type="button" onclick="dosToques(this,()=>sortearRonda(\'' + esc(j.id) + '\',\'' + esc(r.id) + '\'))" class="' + BTN_CH + '">Volver a sortear</button>' +
        '<button type="button" onclick="dosToques(this,()=>borrarRonda(\'' + esc(j.id) + '\',\'' + esc(r.id) + '\'))" class="' + BTN_PELIGRO + '">Borrar ronda</button></span>' : '') + '</div>';
    r.mesas.forEach(m => {
      const res = resultadosMesa(Object.fromEntries(m.jugadores.map(x => [x.jid, { vp: x.vp }])));
      const todos = m.jugadores.every(x => typeof x.vp === 'number');
      const ganador = todos ? m.jugadores.find(x => res[x.jid].gw) : null;
      const alerta = avisosMesa(m);
      h += '<div data-mesa="' + r.n + '-' + m.n + '" class="border border-zinc-700 rounded-lg p-2.5 space-y-1.5"><p class="text-xs font-semibold text-zinc-400">Mesa ' + m.n + ' (' + m.jugadores.length + ')</p>';
      m.jugadores.forEach(x => {
        const gw = todos && res[x.jid].gw;
        h += '<div class="flex items-center gap-2"><span class="w-5 text-zinc-500 text-xs">' + x.asiento + '</span><span class="flex-1 truncate' + (gw ? ' font-bold text-wine-200' : '') + '">' + esc(nick(x.jid)) + (gw ? ' <span class="text-[11px] text-emerald-300">GW</span>' : '') + '</span>';
        if (editable) {
          h += '<select aria-label="VP de ' + esc(nick(x.jid)) + '" onchange="ponerVP(\'' + esc(j.id) + '\',\'' + esc(r.id) + '\',\'' + esc(m.id) + '\',\'' + esc(x.jid) + '\',this.value)" class="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-sm w-[64px]">' +
            '<option value="">VP</option>' + VP_OPCIONES.map(v => '<option value="' + v + '"' + (x.vp === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>';
          if (!conVP) h += selectorMover(j.id, r, m.id, x.jid);
        } else {
          h += '<span class="w-10 text-right">' + (typeof x.vp === 'number' ? x.vp + ' VP' : '—') + '</span>';
        }
        h += '</div>';
      });
      if (todos && !ganador) h += '<p class="text-xs text-zinc-500">Sin GW en esta mesa (empate en el primer lugar o menos de 2 VP).</p>';
      if (alerta) h += '<p class="text-xs text-amber-300">' + esc(alerta) + '</p>';
      h += '</div>';
    });
    // Presentes que quedaron sin mesa en esta ronda
    const sentados = new Set(r.mesas.flatMap(m => m.jugadores.map(x => x.jid)));
    const sin = editable ? pres.filter(pid => !sentados.has(pid)) : [];
    if (sin.length) {
      h += '<div data-sinmesa class="border border-dashed border-amber-700/70 rounded-lg p-2.5 space-y-1.5"><p class="text-xs font-semibold text-amber-300">Sin mesa (' + sin.length + ')' + (conVP ? '' : ': muévelos a una mesa o a una nueva') + '</p>' +
        sin.map(pid => '<div class="flex items-center gap-2"><span class="flex-1 truncate">' + esc(nick(pid)) + '</span>' + (conVP ? '' : selectorMover(j.id, r, null, pid)) + '</div>').join('') + '</div>';
    }
    h += '</div>';
  });
  if (editable) {
    const ult = rs[rs.length - 1];
    const listo = ult && ult.mesas.length && ult.mesas.every(m => m.jugadores.every(x => typeof x.vp === 'number'));
    if (listo) h += '<button type="button" onclick="sortearRonda(\'' + esc(j.id) + '\',\'' + esc(siguienteId(j.rondas, 'r')) + '\')" class="' + BTN2 + ' w-full">+ Sortear ronda ' + (rs.length + 1) + ' (' + pres.length + ' presentes)</button>';
  }
  return h;
}

function textoReparto(n) {
  if (n < 4) return 'faltan presentes (mínimo 4).';
  const { tamanos, fuera } = tamanosMesas(n);
  const c5 = tamanos.filter(t => t === 5).length, c4 = tamanos.filter(t => t === 4).length;
  const partes = []; if (c5) partes.push(c5 + (c5 === 1 ? ' mesa de 5' : ' mesas de 5')); if (c4) partes.push(c4 + (c4 === 1 ? ' mesa de 4' : ' mesas de 4'));
  return partes.join(' y ') + (fuera ? ' · ' + fuera + ' sin mesa (tú decides dónde van)' : '') + ', asientos al azar.';
}

function selectorMover(jid, r, desde, pid) {
  let ops = '<option value="">Mover…</option>';
  r.mesas.forEach(m => { if (m.id !== desde) ops += '<option value="' + esc(m.id) + '"' + (m.jugadores.length >= 5 ? ' disabled' : '') + '>a Mesa ' + m.n + (m.jugadores.length >= 5 ? ' (llena)' : '') + '</option>'; });
  ops += '<option value="nueva">a una mesa nueva</option>';
  if (desde) ops += '<option value="fuera">sacar de la mesa</option>';
  return '<select aria-label="Mover" onchange="moverJugador(\'' + esc(jid) + '\',\'' + esc(r.id) + '\',' + (desde ? '\'' + esc(desde) + '\'' : 'null') + ',\'' + esc(pid) + '\',this.value)" class="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-xs w-[78px]">' + ops + '</select>';
}

function sortearRonda(jid, rid) {
  const ev = ligaActual(); const j = ev.jornadas[jid];
  const pres = Object.keys(j.presentes || {}).filter(pid => (ev.jugadores || {})[pid]);
  if (pres.length < 4) return aviso('Se necesitan al menos 4 presentes.', 'error');
  const { mesas, sinMesa } = sortearMesas(pres);
  return guardar(idLigaActual(), { ['jornadas/' + jid + '/rondas/' + rid]: { mesas } },
    sinMesa.length ? 'Mesas sorteadas · ' + sinMesa.length + ' sin mesa' : 'Mesas sorteadas');
}
function borrarRonda(jid, rid) { return guardar(idLigaActual(), { ['jornadas/' + jid + '/rondas/' + rid]: null }, 'Ronda borrada'); }

function moverJugador(jid, rid, desde, pid, destino) {
  if (!destino) return;
  const ev = ligaActual(); const r = ev.jornadas[jid].rondas[rid]; const base = 'jornadas/' + jid + '/rondas/' + rid + '/mesas/';
  const cambios = {};
  if (desde) {
    const mesa = r.mesas[desde]; const quitado = mesa[pid].asiento;
    cambios[base + desde + '/' + pid] = null;
    Object.keys(mesa).forEach(o => { if (o !== pid && mesa[o].asiento > quitado) cambios[base + desde + '/' + o + '/asiento'] = mesa[o].asiento - 1; });
  }
  if (destino !== 'fuera') {
    const mid = destino === 'nueva' ? siguienteId(r.mesas, 'm') : destino;
    const n = Object.keys((r.mesas || {})[mid] || {}).length;
    if (n >= 5) { aviso('Esa mesa ya tiene 5.', 'error'); dibujar('ruta'); return; }
    cambios[base + mid + '/' + pid] = { asiento: n + 1 };
  }
  return guardar(idLigaActual(), cambios);
}

function ponerVP(jid, rid, mid, pid, valor) {
  const v = valor === '' ? null : Number(valor);
  return guardar(idLigaActual(), { ['jornadas/' + jid + '/rondas/' + rid + '/mesas/' + mid + '/' + pid + '/vp']: v });
}

// ---------------- d) Hazañas del día
function bloqueHazanas(id, ev, j, editable) {
  const cat = lista(ev.hazanasCatalogo); const nick = (pid) => ((ev.jugadores || {})[pid] || {}).nick || '(jugador borrado)';
  const dadas = lista(j.hazanas);
  if (!editable && !dadas.length) return '';
  let h = '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2 text-sm"><p class="font-bold">' + (editable ? 'd) ' : '') + 'Hazañas del día</p>';
  h += dadas.length ? dadas.map(x => '<div class="flex justify-between items-center gap-2"><span>🏅 <b>' + esc((ev.hazanasCatalogo && ev.hazanasCatalogo[x.hazana] || {}).nombre || 'Hazaña') + '</b> — ' + esc(nick(x.jugador)) + '</span>' +
    (editable ? '<button type="button" onclick="quitarHazanaDia(\'' + esc(j.id) + '\',\'' + esc(x.id) + '\')" class="' + BTN_CH + '">Quitar</button>' : '') + '</div>').join('')
    : '<p class="text-zinc-400">Ninguna todavía.</p>';
  if (editable) {
    if (!cat.length) h += '<p class="text-xs text-zinc-500">No hay hazañas en la lista. El organizador las agrega en la pestaña Ajustes.</p>';
    else {
      const pres = Object.keys(j.presentes || {}).filter(pid => (ev.jugadores || {})[pid]);
      const candidatos = (pres.length ? pres : Object.keys(ev.jugadores || {})).map(pid => ({ id: pid, nick: nick(pid) })).sort((a, b) => a.nick.localeCompare(b.nick, 'es'));
      h += '<div class="grid grid-cols-[1fr_1fr_auto] gap-2"><select id="hzHazana" class="' + INP + '">' + cat.map(c => '<option value="' + esc(c.id) + '">' + esc(c.nombre) + '</option>').join('') + '</select>' +
        '<select id="hzJugador" class="' + INP + '">' + candidatos.map(c => '<option value="' + esc(c.id) + '">' + esc(c.nick) + '</option>').join('') + '</select>' +
        '<button type="button" onclick="darHazana(\'' + esc(j.id) + '\')" class="' + BTN2 + '">Dar</button></div>';
    }
  }
  return h + '</div>';
}
function darHazana(jid) {
  const hz = $('hzHazana').value, pid = $('hzJugador').value; if (!hz || !pid) return;
  return guardar(idLigaActual(), { ['jornadas/' + jid + '/hazanas/' + nuevoId('x')]: { hazana: hz, jugador: pid } }, 'Hazaña otorgada');
}
function quitarHazanaDia(jid, k) { return guardar(idLigaActual(), { ['jornadas/' + jid + '/hazanas/' + k]: null }, 'Hazaña quitada'); }
