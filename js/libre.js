// =====================================================================
// js/libre.js — LIGAS DE «PARTIDAS LIBRES» (26 oct 2026, solo en línea)
// · No hay jornadas: cada quien juega cuando puede.
// · Un jugador que estuvo en la mesa la reporta COMPLETA (una sola persona):
//   fecha, tamaño (4 o 5), los jugadores de la liga con sus VP y los
//   invitados solo por nombre (sin VP). La mesa cuenta como partida para todos
//   los jugadores de la liga que aparecen en ella.
// · El organizador y sus ayudantes pueden reportar mesas aunque no las jugaran
//   (por ejemplo, con jugadores ficticios para una demostración).
// · La suma de VP de la mesa no puede pasar de su tamaño, ni los lugares
//   (jugadores + invitados) del tamaño de la mesa.
// · Si parece repetida (mismo día y al menos 2 jugadores de la liga en común),
//   avisa con los jugadores de esa mesa, pero deja guardar.
// · Antes de guardar se confirman los datos; después solo el organizador
//   corrige o borra.
// · Tabla: 70% rendimiento ajustado + 30% participación (cálculo en calculo.js).
// · El organizador cierra la temporada: ya no se reportan mesas y la
//   clasificación queda como definitiva.
// Datos: eventos/{id}/formato = 'libre' · eventos/{id}/temporada = 'cerrada'
//        eventos/{id}/mesas/{mid} = { fecha, mesa, jugadores: { jid: vp }, invitados?, por, creada }
// =====================================================================

// Jugador de la liga de quien mira (si se inscribió con Google y ya lo aceptaron)
function miJugadorLibre(id, ev) {
  const mia = usuario ? miInscripcion[id] : null;
  return (mia && mia.estado === 'aceptada' && mia.jid && ev.jugadores && ev.jugadores[mia.jid]) ? mia.jid : null;
}
function puedeReportar(id, ev) { return !temporadaCerrada(ev) && (puedeCapturar(ev) || !!miJugadorLibre(id, ev)); }
function nickDe(ev, jid) { return ((ev.jugadores || {})[jid] || {}).nick || '(jugador borrado)'; }
function vpOpciones(mesa) { return VP_OPCIONES.filter(v => v <= mesa); }

// Días en los que se puede reportar: dentro de la temporada y no en el futuro
function rangoReporte(ev) {
  const hoy = hoyISO();
  const max = ev.fin && ev.fin < hoy ? ev.fin : hoy;
  return { min: ev.inicio || '', max };
}

// «a 3 VP · b 1 VP · c 0 VP · X, Y (invitados)»
function textoMesa(ev, jugadores, invitados) {
  const ls = jugadores.map(x => nickDe(ev, x.jid) + ' ' + num1(x.vp) + ' VP');
  const inv = invitadosDe(invitados);
  return ls.concat(inv.length ? [inv.join(', ') + ' (invitados)'] : []).join(' · ');
}

// ---------------- Pestaña Tabla
function seccionTablaLibre(id, ev) {
  const t = tablaLibre(ev); const M = mediaLiga(ev); const cerrada = temporadaCerrada(ev);
  if (!t.length) return '<p class="text-zinc-400 text-sm py-6 text-center">Todavía no hay mesas reportadas. La tabla aparece con la primera.</p>' + bloqueComoSeCalcula(ev, M);
  const cols = '24px 1fr 30px 36px 44px 40px 48px';
  const nm = mesasLiga(ev).length;
  let h = '<p data-estado-tabla class="text-[13px] font-extrabold uppercase ' + (cerrada ? 'text-emerald-300' : 'text-amber-300') + '">' +
    (cerrada ? 'Clasificación definitiva · temporada cerrada' : 'Clasificación provisional · temporada en juego') + '</p>' +
    '<p class="text-xs text-zinc-400 -mt-2">Media de la liga: <b class="text-zinc-200">' + num2(M) + ' VP</b> por partida · ' + nm + (nm === 1 ? ' mesa' : ' mesas') + '</p>';
  h += '<div class="bg-zinc-800 rounded-xl overflow-hidden text-[13px]" role="table" aria-label="Clasificación">' +
    '<div class="grid gap-1.5 px-2.5 py-2 text-[11px] font-semibold text-zinc-400 border-b border-zinc-700" style="grid-template-columns:' + cols + '" role="row">' +
    '<span>#</span><span>Jugador</span><span class="text-right" title="Partidas jugadas">PJ</span><span class="text-right">VP</span>' +
    '<span class="text-right" title="Rendimiento ajustado (70%)">Rend.</span><span class="text-right" title="Participación (30%)">Part.</span><span class="text-right">Total</span></div>';
  t.forEach((f, i) => {
    h += '<div data-fila="' + esc(f.nick) + '" class="grid gap-1.5 px-2.5 py-2 border-b border-zinc-700/50 ' + (i === 0 ? 'bg-wine-900/30' : '') + '" style="grid-template-columns:' + cols + '" role="row">' +
      '<span class="font-extrabold text-wine-300">' + (i + 1) + '</span>' +
      '<span class="min-w-0"><span class="block truncate">' + esc(f.nick) + '</span>' + (f.provisional ? '<span class="block text-[10px] font-bold text-amber-300">PROVISIONAL</span>' : '') + '</span>' +
      '<span class="text-right">' + f.partidas + '</span><span class="text-right">' + num1(f.vp) + '</span>' +
      '<span class="text-right">' + num1(f.rendimiento) + '</span><span class="text-right">' + num1(f.participacion) + '</span>' +
      '<span class="text-right font-bold">' + num1(f.total) + '</span></div>';
  });
  h += '</div><p class="text-xs text-zinc-500">PROVISIONAL = menos de ' + LIBRE_MIN + ' partidas. ' +
    (cerrada ? '' : 'Mientras la temporada sigue, la media de la liga cambia con cada mesa y los puntos de todos se mueven un poco.') + '</p>';
  h += bloqueComoSeCalcula(ev, M);
  h += '<div class="flex gap-2 flex-wrap"><a href="' + esc(enlaceWhatsApp(textoCompartirTabla(id, ev))) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600 flex-1">Compartir por WhatsApp</a>' +
    '<button type="button" onclick="descargarExcel(\'' + esc(id) + '\')" class="' + BTN2 + ' flex-1">Descargar Excel</button></div>';
  return h;
}

function bloqueComoSeCalcula(ev, M) {
  return '<details data-como-se-calcula class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm"><summary class="font-semibold cursor-pointer">¿Cómo se calcula?</summary>' +
    '<div class="space-y-2 pt-2 text-zinc-300">' +
    '<p><b>Total = 70% rendimiento + 30% participación.</b> Cada mesa reportada cuenta como una partida para cada jugador de la liga que estuvo en ella.</p>' +
    '<p><b>Rendimiento (Rend.):</b> tu promedio de VP por partida, «rellenado» con ' + LIBRE_RELLENO + ' partidas imaginarias con la media de la liga, para que pocas partidas no den resultados extremos. Se compara contra la media: 100 = jugador promedio.</p>' +
    '<p class="text-xs font-mono bg-zinc-900 rounded px-2 py-1.5">Ajustada = (VP + ' + LIBRE_RELLENO + ' × media) ÷ (partidas + ' + LIBRE_RELLENO + ')<br>Rend. = 100 × ajustada ÷ media</p>' +
    '<p><b>Participación (Part.):</b> ' + LIBRE_META + ' partidas = 100 puntos (con tope). Ejemplo: 3 partidas = 25, 6 = 50, 9 = 75.</p>' +
    '<p><b>Desempates:</b> mayor rendimiento, luego más VP en total, luego mejor promedio de VP por partida, luego más partidas.</p>' +
    '<p class="text-xs text-zinc-400">Media de la liga ahora: ' + num2(M) + ' VP por partida. Solo cuentan los jugadores de la liga; los invitados no tienen VP ni aparecen en la tabla.</p></div></details>';
}

// ---------------- Pestaña Mesas: reportar y lista
function seccionPartidas(id, ev) {
  let h = '';
  const admin = puedeAdministrar(ev);
  const corrigiendo = admin && ui.reporte && ui.reporte.liga === id && ui.reporte.editando;
  if (corrigiendo) h += bloqueReportar(id, ev);
  else if (temporadaCerrada(ev)) h += '<p class="text-sm text-emerald-300 font-semibold">La temporada está cerrada: ya no se reportan mesas.</p>';
  else if (puedeReportar(id, ev)) h += bloqueReportar(id, ev);
  else if (!usuario) h += '<p class="text-xs text-zinc-400">¿Juegas en esta liga? Entra con Google e inscríbete para reportar tus mesas.</p>';
  const ms = mesasLiga(ev);
  h += '<div class="flex justify-between items-center"><h3 class="font-bold">Mesas reportadas</h3><span class="text-xs text-zinc-400">' + ms.length + '</span></div>';
  if (!ms.length) return h + '<p class="text-zinc-400 text-sm py-4 text-center">Todavía no hay mesas.</p>';
  h += '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">' + ms.map(m => {
    const suma = m.jugadores.reduce((s, x) => s + x.vp, 0);
    return '<div data-mesa="' + esc(m.id) + '" class="py-2 space-y-1"><div class="flex justify-between gap-2"><span><b>' + esc(fechaCorta(m.fecha)) + '</b> · mesa de ' + esc(m.mesa) + '</span>' +
      '<span class="text-xs text-zinc-400 whitespace-nowrap">' + num1(suma) + ' de ' + esc(m.mesa) + ' VP</span></div>' +
      '<p class="text-zinc-300">' + esc(textoMesa(ev, m.jugadores, m.invitados)) + '</p>' +
      (admin ? '<div class="flex gap-1.5"><button type="button" onclick="corregirMesa(\'' + esc(m.id) + '\')" class="' + BTN_CH + '">Corregir</button>' +
        '<button type="button" onclick="dosToques(this,()=>borrarMesa(\'' + esc(m.id) + '\'))" class="' + BTN_PELIGRO + '">Borrar</button></div>' : '') + '</div>';
  }).join('') + '</div>';
  if (admin) h += '<p class="text-xs text-zinc-500">Solo tú (el organizador) puedes corregir o borrar una mesa guardada.</p>';
  return h;
}

// Borrador del reporte (vive en ui.reporte para que no se pierda si la página se redibuja)
// jugadores = { jid: vp | '' } (los de la liga que estuvieron en la mesa)
function borradorReporte(id, ev) {
  const propio = miJugadorLibre(id, ev); const r = rangoReporte(ev);
  if (!ui.reporte || ui.reporte.liga !== id) {
    ui.reporte = { liga: id, fecha: r.max >= r.min ? r.max : '', mesa: 5, jugadores: {}, invitados: '', revisar: false, editando: null };
  }
  const b = ui.reporte;
  // El jugador (sin ser del equipo) siempre está en la mesa que reporta
  if (!b.editando && !puedeCapturar(ev) && propio && !(propio in b.jugadores)) b.jugadores[propio] = '';
  return b;
}

function bloqueReportar(id, ev) {
  const r = rangoReporte(ev);
  const caja = (cuerpo) => '<div data-reportar class="bg-zinc-800 border border-wine-600/60 rounded-xl p-4 space-y-3 text-sm">' + cuerpo + '</div>';
  const b = borradorReporte(id, ev);
  if (!b.editando && ev.inicio && r.max < ev.inicio) return caja('<p class="font-bold">🎲 Reportar mesa</p><p class="text-zinc-300">La temporada empieza el ' + esc(fechaLarga(ev.inicio)) + '. Desde ese día se pueden reportar mesas.</p>');
  if (b.revisar) return caja(resumenReporte(id, ev, b));
  const propio = puedeCapturar(ev) ? null : miJugadorLibre(id, ev);
  const jugadores = jugadoresOrdenados(ev);
  let h = '<p class="font-bold">' + (b.editando ? 'Corregir mesa' : '🎲 Reportar mesa') + '</p>' +
    (b.editando ? '' : '<p class="text-xs text-zinc-400">Una sola persona reporta la mesa completa: los demás jugadores de la liga que estuvieron ya no la reportan.</p>');
  h += '<div class="grid grid-cols-2 gap-2"><label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Fecha</span>' +
    '<input id="rpFecha" type="date" min="' + esc(r.min) + '" max="' + esc(b.editando ? (ev.fin || '') : r.max) + '" value="' + esc(b.fecha) + '" onchange="leerReporte()" class="' + INP + '"></label>' +
    '<fieldset class="space-y-1"><legend class="text-xs font-semibold text-zinc-400">Mesa de</legend><div class="flex gap-2">' + [4, 5].map(n =>
      '<label class="flex-1 flex gap-1.5 items-center justify-center border border-zinc-700 rounded-lg px-2 py-2 cursor-pointer has-[:checked]:border-wine-500 has-[:checked]:bg-wine-900/40"><input type="radio" name="rpMesa" value="' + n + '"' + (b.mesa === n ? ' checked' : '') + ' onchange="leerReporte(true)" class="accent-wine-500"> ' + n + '</label>').join('') + '</div></fieldset></div>';
  h += '<fieldset class="space-y-1.5"><legend class="text-xs font-semibold text-zinc-400 mb-1">Jugadores de la liga en la mesa y sus VP</legend>' +
    '<div class="space-y-1.5">' + jugadores.map(p => {
      const en = p.id in b.jugadores; const fijo = p.id === propio;
      return '<div data-jugador-mesa="' + esc(p.nick) + '" class="flex items-center justify-between gap-2 border ' + (en ? 'border-wine-600/70 bg-wine-900/20' : 'border-zinc-700') + ' rounded-lg px-2.5 py-1.5">' +
        '<label class="flex items-center gap-2 min-w-0 cursor-pointer"><input type="checkbox" data-en-mesa="' + esc(p.id) + '"' + (en ? ' checked' : '') + (fijo ? ' disabled' : '') + ' onchange="leerReporte(true)" class="accent-wine-500"> <span class="truncate">' + esc(p.nick) + (fijo ? ' (tú)' : '') + '</span></label>' +
        (en ? '<select data-vp-de="' + esc(p.id) + '" onchange="leerReporte(true)" class="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white" aria-label="VP de ' + esc(p.nick) + '"><option value="">VP…</option>' +
          vpOpciones(b.mesa).map(v => '<option value="' + v + '"' + (String(v) === String(b.jugadores[p.id]) ? ' selected' : '') + '>' + v + ' VP</option>').join('') + '</select>' : '') + '</div>';
    }).join('') + '</div></fieldset>' +
    '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Invitados (solo nombres, sin VP)</span><input id="rpInvitados" maxlength="200" value="' + esc(b.invitados) + '" oninput="leerReporte()" onchange="leerReporte(true)" class="' + INP + '" placeholder="ej. Pedro, Lucía"></label>';
  const c = cuentasMesa(b);
  h += '<p data-cuentas class="text-xs ' + (c.suma > b.mesa || c.lugares > b.mesa ? 'text-red-300 font-semibold' : 'text-zinc-400') + '">Suma de VP: <b>' + num1(c.suma) + ' de ' + b.mesa + '</b> · Lugares: <b>' + c.lugares + ' de ' + b.mesa + '</b> (' + c.jugadores + ' de la liga' + (c.invitados ? ' + ' + c.invitados + (c.invitados === 1 ? ' invitado' : ' invitados') : '') + ')</p>' +
    '<p id="rpError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<div class="flex gap-2"><button type="button" onclick="revisarReporte()" class="' + BTN + ' flex-1">Revisar y guardar</button>' +
    (b.editando ? '<button type="button" onclick="ui.reporte=null;dibujar(\'ruta\')" class="' + BTN2 + '">Cancelar</button>' : '') + '</div>';
  return caja(h);
}

function cuentasMesa(b) {
  const vps = Object.values(b.jugadores);
  const invitados = invitadosDe(b.invitados).length;
  return { suma: vps.reduce((s, v) => s + (v === '' ? 0 : Number(v)), 0), jugadores: vps.length, invitados, lugares: vps.length + invitados };
}

// Lee el formulario al borrador. redibujar = cambió algo que cambia el formulario
function leerReporte(redibujar) {
  const b = ui.reporte; if (!b) return;
  if ($('rpFecha')) b.fecha = $('rpFecha').value;
  const m = document.querySelector('input[name="rpMesa"]:checked'); if (m) b.mesa = Number(m.value);
  const nuevos = {};
  document.querySelectorAll('[data-en-mesa]').forEach(c => {
    if (!c.checked) return;
    const sel = document.querySelector('[data-vp-de="' + c.dataset.enMesa + '"]');
    let v = sel ? sel.value : (c.dataset.enMesa in b.jugadores ? b.jugadores[c.dataset.enMesa] : '');
    if (v !== '' && Number(v) > b.mesa) v = '';
    nuevos[c.dataset.enMesa] = v;
  });
  if (document.querySelectorAll('[data-en-mesa]').length) b.jugadores = nuevos;
  if ($('rpInvitados')) b.invitados = $('rpInvitados').value;
  if (redibujar) dibujar('ruta');
  else { const p = document.querySelector('[data-cuentas]'); if (p) { const c = cuentasMesa(b); p.querySelectorAll('b')[0].textContent = num1(c.suma) + ' de ' + b.mesa; } }
}

// Problema con el borrador ('' = todo bien). propio = jugador que debe estar en la mesa (o null)
function problemaMesa(ev, b, propio) {
  const r = rangoReporte(ev);
  if (!fechaValida(b.fecha)) return 'Elige la fecha de la mesa.';
  if (r.min && b.fecha < r.min) return 'La fecha queda antes del inicio de la temporada (' + fechaCorta(r.min) + ').';
  if (ev.fin && b.fecha > ev.fin) return 'La fecha queda después del fin de la temporada (' + fechaCorta(ev.fin) + ').';
  if (b.fecha > hoyISO()) return 'La fecha no puede ser en el futuro.';
  if (b.mesa !== 4 && b.mesa !== 5) return 'Elige si la mesa fue de 4 o de 5.';
  const ids = Object.keys(b.jugadores);
  if (!ids.length) return 'Marca a los jugadores de la liga que estuvieron en la mesa.';
  if (ids.some(j => !(ev.jugadores || {})[j])) return 'Hay un jugador que ya no está en la liga.';
  if (propio && !ids.includes(propio)) return 'Solo puedes reportar mesas en las que jugaste.';
  const sinVp = ids.filter(j => b.jugadores[j] === '' || !vpValido(Number(b.jugadores[j]), b.mesa));
  if (sinVp.length) return 'Elige los VP de ' + sinVp.map(j => nickDe(ev, j)).join(', ') + '.';
  const c = cuentasMesa(b);
  if (c.suma > b.mesa) return 'La suma de VP (' + num1(c.suma) + ') no puede pasar de ' + b.mesa + ' en una mesa de ' + b.mesa + '.';
  if (c.lugares > b.mesa) return 'Hay ' + c.lugares + ' personas (jugadores e invitados) en una mesa de ' + b.mesa + '.';
  return '';
}

// Mesas del mismo día con al menos 2 jugadores de la liga en común
function mesasParecidas(ev, b) {
  const ids = Object.keys(b.jugadores);
  return mesasLiga(ev).filter(m => m.id !== b.editando && m.fecha === b.fecha && m.jugadores.filter(x => ids.includes(x.jid)).length >= 2);
}

function revisarReporte() {
  leerReporte(); const id = idLigaActual(); const ev = ligaActual(); const b = ui.reporte; if (!ev || !b) return;
  const p = problemaMesa(ev, b, puedeCapturar(ev) ? null : miJugadorLibre(id, ev));
  if (p) return errorForm('rpError', p);
  b.revisar = true; dibujar('ruta'); window.scrollTo(0, 0);
}

function resumenReporte(id, ev, b) {
  const jugadores = Object.keys(b.jugadores).map(j => ({ jid: j, vp: Number(b.jugadores[j]) })).sort((x, y) => y.vp - x.vp);
  const parecidas = mesasParecidas(ev, b);
  const fijo = !puedeAdministrar(ev);
  return '<p class="font-bold">Revisa antes de guardar</p>' +
    '<div data-resumen class="bg-zinc-900 rounded-lg p-3 space-y-1"><p><b>' + esc(fechaLarga(b.fecha)) + '</b> · mesa de <b>' + b.mesa + '</b></p>' +
    jugadores.map(x => '<p class="flex justify-between"><span>' + esc(nickDe(ev, x.jid)) + '</span><b>' + num1(x.vp) + ' VP</b></p>').join('') +
    (invitadosDe(b.invitados).length ? '<p class="text-zinc-400">Invitados: ' + esc(invitadosDe(b.invitados).join(', ')) + '</p>' : '') + '</div>' +
    (parecidas.length ? '<div data-aviso-repetida class="bg-amber-950/40 border border-amber-700/60 rounded-lg p-3 space-y-1"><p class="text-amber-200 font-semibold">⚠️ ¿Es una mesa repetida?</p>' +
      parecidas.map(m => '<p class="text-zinc-300">Ya hay una mesa del ' + esc(fechaCorta(m.fecha)) + ' con ' + esc(textoMesa(ev, m.jugadores, m.invitados)) + '.</p>').join('') +
      '<p class="text-xs text-zinc-400">Si es la misma, no la guardes otra vez. Si es otra mesa distinta, puedes guardarla.</p></div>' : '') +
    (fijo ? '<p data-aviso-sin-cambios class="text-amber-300 font-semibold">⚠️ Una vez guardada, no podrás cambiar esta mesa. Solo el organizador puede corregirla o borrarla.</p>'
      : '<p class="text-zinc-400 text-xs">Como organizador, después puedes corregirla o borrarla.</p>') +
    '<div class="flex gap-2"><button type="button" onclick="guardarReporte()" class="' + BTN + ' flex-1">' + (parecidas.length ? 'Es otra mesa: guardar' : 'Confirmar y guardar') + '</button>' +
    '<button type="button" onclick="ui.reporte.revisar=false;dibujar(\'ruta\')" class="' + BTN2 + ' flex-1">Volver a editar</button></div>';
}

function datosMesa(b) {
  const d = { fecha: b.fecha, mesa: b.mesa, jugadores: {} };
  Object.keys(b.jugadores).forEach(j => { d.jugadores[j] = Number(b.jugadores[j]); });
  const inv = invitadosDe(b.invitados).join(', ').slice(0, 200); if (inv) d.invitados = inv;
  return d;
}

async function guardarReporte() {
  const id = idLigaActual(); const ev = ligaActual(); const b = ui.reporte; if (!ev || !b) return;
  const p = problemaMesa(ev, b, puedeCapturar(ev) ? null : miJugadorLibre(id, ev));
  if (p) { b.revisar = false; dibujar('ruta'); return aviso(p, 'error'); }
  const previa = b.editando && ev.mesas && ev.mesas[b.editando];
  const d = Object.assign(datosMesa(b), previa ? { por: previa.por, creada: previa.creada } : { por: usuario.uid, creada: firebase.database.ServerValue.TIMESTAMP });
  const mid = b.editando || nuevoId('m');
  if (await guardar(id, { ['mesas/' + mid]: d }, b.editando ? 'Mesa corregida' : 'Mesa guardada')) { ui.reporte = null; dibujar('ruta'); }
}

// ---------------- Corregir y borrar (solo el organizador)
function corregirMesa(mid) {
  const id = idLigaActual(); const ev = ligaActual(); const m = ev && ev.mesas && ev.mesas[mid]; if (!m) return;
  const jugadores = {}; Object.keys(m.jugadores || {}).forEach(j => { jugadores[j] = String(m.jugadores[j]); });
  ui.reporte = { liga: id, fecha: m.fecha, mesa: m.mesa, jugadores, invitados: m.invitados || '', revisar: false, editando: mid };
  dibujar('ruta'); window.scrollTo(0, 0);
}
function borrarMesa(mid) { return guardar(idLigaActual(), { ['mesas/' + mid]: null }, 'Mesa borrada'); }

// ---------------- Temporada (Ajustes del organizador)
function bloqueTemporada(id, ev) {
  const cerrada = temporadaCerrada(ev);
  return '<div data-temporada class="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-2 text-sm"><h3 class="font-bold">Temporada</h3>' +
    (cerrada
      ? '<p class="text-zinc-300">Está cerrada: ya no se reportan mesas y la clasificación es la definitiva.</p><button type="button" onclick="dosToques(this,()=>cambiarTemporada(false))" class="' + BTN2 + '">Reabrir temporada</button>'
      : '<p class="text-zinc-300">Al terminar, ciérrala: ya no se podrán reportar mesas y la clasificación queda como definitiva (con la media final de la liga).</p><button type="button" onclick="dosToques(this,()=>cambiarTemporada(true))" class="' + BTN + '">Cerrar temporada</button>') + '</div>';
}
async function cambiarTemporada(cerrar) {
  if (await guardar(idLigaActual(), { temporada: cerrar ? 'cerrada' : null }, cerrar ? 'Temporada cerrada: la clasificación es definitiva' : 'Temporada reabierta')) dibujar('ruta');
}

// ---------------- Compartir y Excel
function textoCompartirLibre(id, ev) {
  const t = tablaLibre(ev);
  return '🏆 ' + ev.nombre + (temporadaCerrada(ev) ? ' · clasificación final' : ' · clasificación provisional') + '\n' +
    t.slice(0, 5).map((f, i) => (i + 1) + '. ' + f.nick + ' · ' + num1(f.total) + ' pts · ' + f.partidas + (f.partidas === 1 ? ' partida' : ' partidas') + (f.provisional ? ' (provisional)' : '')).join('\n') +
    '\nVer todo: ' + location.origin + location.pathname + '#/liga/' + id;
}
function hojasExcelLibre(ev) {
  const tabla = [['#', 'Jugador', 'Partidas', 'VP', 'Media VP', 'Rendimiento', 'Participación', 'Total', 'Provisional']];
  tablaLibre(ev).forEach((f, i) => tabla.push([i + 1, f.nick, f.partidas, f.vp, Number(num2(f.media)), Number(num1(f.rendimiento)), Number(num1(f.participacion)), Number(num1(f.total)), f.provisional ? 'Sí' : '']));
  const ms = [['Fecha', 'Mesa', 'Mesa de', 'Jugador', 'VP', 'Invitados']];
  mesasLiga(ev).slice().reverse().forEach((m, i) => m.jugadores.forEach(x => ms.push([m.fecha, i + 1, m.mesa, nickDe(ev, x.jid), x.vp, m.invitados || ''])));
  return [['Clasificación', tabla], ['Mesas', ms]];
}
