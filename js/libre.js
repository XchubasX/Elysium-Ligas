// =====================================================================
// js/libre.js — LIGAS DE «PARTIDAS LIBRES» (26 oct 2026, solo en línea)
// · No hay jornadas: cada quien juega cuando puede y reporta su partida.
// · Reporta el propio jugador (inscrito y aceptado con Google) o el equipo
//   (organizador y ayudantes) por cualquier jugador, incluidos ficticios.
// · Antes de guardar se confirman los datos: una partida guardada ya no la
//   cambia quien la reportó; solo el organizador la corrige o la borra.
// · Tabla: 70% rendimiento ajustado + 30% participación (cálculo en calculo.js).
// · El organizador cierra la temporada: ya no se reportan partidas y la
//   clasificación queda como definitiva.
// Datos: eventos/{id}/formato = 'libre' · eventos/{id}/temporada = 'cerrada'
//        eventos/{id}/partidas/{pid} = { jugador, fecha, vp, mesa, rivales?, invitados?, por, creada }
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

// ---------------- Pestaña Tabla
function seccionTablaLibre(id, ev) {
  const t = tablaLibre(ev); const M = mediaLiga(ev); const cerrada = temporadaCerrada(ev);
  if (!t.length) return '<p class="text-zinc-400 text-sm py-6 text-center">Todavía no hay partidas reportadas. La tabla aparece con la primera.</p>' + bloqueComoSeCalcula(ev, M);
  const cols = '24px 1fr 30px 36px 44px 40px 48px';
  let h = '<p data-estado-tabla class="text-[13px] font-extrabold uppercase ' + (cerrada ? 'text-emerald-300' : 'text-amber-300') + '">' +
    (cerrada ? 'Clasificación definitiva · temporada cerrada' : 'Clasificación provisional · temporada en juego') + '</p>' +
    '<p class="text-xs text-zinc-400 -mt-2">Media de la liga: <b class="text-zinc-200">' + num2(M) + ' VP</b> por partida · ' + partidasLiga(ev).length + ' partidas</p>';
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
    (cerrada ? '' : 'Mientras la temporada sigue, la media de la liga cambia con cada partida y los puntos de todos se mueven un poco.') + '</p>';
  h += bloqueComoSeCalcula(ev, M);
  h += '<div class="flex gap-2 flex-wrap"><a href="' + esc(enlaceWhatsApp(textoCompartirTabla(id, ev))) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600 flex-1">Compartir por WhatsApp</a>' +
    '<button type="button" onclick="descargarExcel(\'' + esc(id) + '\')" class="' + BTN2 + ' flex-1">Descargar Excel</button></div>';
  return h;
}

function bloqueComoSeCalcula(ev, M) {
  return '<details data-como-se-calcula class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm"><summary class="font-semibold cursor-pointer">¿Cómo se calcula?</summary>' +
    '<div class="space-y-2 pt-2 text-zinc-300">' +
    '<p><b>Total = 70% rendimiento + 30% participación.</b></p>' +
    '<p><b>Rendimiento (Rend.):</b> tu promedio de VP por partida, «rellenado» con ' + LIBRE_RELLENO + ' partidas imaginarias con la media de la liga, para que pocas partidas no den resultados extremos. Se compara contra la media: 100 = jugador promedio.</p>' +
    '<p class="text-xs font-mono bg-zinc-900 rounded px-2 py-1.5">Ajustada = (VP + ' + LIBRE_RELLENO + ' × media) ÷ (partidas + ' + LIBRE_RELLENO + ')<br>Rend. = 100 × ajustada ÷ media</p>' +
    '<p><b>Participación (Part.):</b> ' + LIBRE_META + ' partidas = 100 puntos (con tope). Ejemplo: 3 partidas = 25, 6 = 50, 9 = 75.</p>' +
    '<p><b>Desempates:</b> mayor rendimiento, luego más VP en total, luego mejor promedio de VP por partida, luego más partidas.</p>' +
    '<p class="text-xs text-zinc-400">Media de la liga ahora: ' + num2(M) + ' VP por partida. Solo cuentan las partidas reportadas por jugadores de la liga; los invitados no aparecen en la tabla.</p></div></details>';
}

// ---------------- Pestaña Partidas: reportar y lista
function seccionPartidas(id, ev) {
  let h = '';
  if (temporadaCerrada(ev)) h += '<p class="text-sm text-emerald-300 font-semibold">La temporada está cerrada: ya no se reportan partidas.</p>';
  else if (puedeReportar(id, ev)) h += bloqueReportar(id, ev);
  else if (!usuario && !temporadaCerrada(ev)) h += '<p class="text-xs text-zinc-400">¿Juegas en esta liga? Entra con Google e inscríbete para reportar tus partidas.</p>';
  const ps = partidasLiga(ev); const admin = puedeAdministrar(ev);
  h += '<div class="flex justify-between items-center"><h3 class="font-bold">Partidas reportadas</h3><span class="text-xs text-zinc-400">' + ps.length + '</span></div>';
  if (!ps.length) return h + '<p class="text-zinc-400 text-sm py-4 text-center">Todavía no hay partidas.</p>';
  h += '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">' + ps.map(p => {
    if (admin && ui.editarPartida === p.id) return formCorregir(id, ev, p);
    const rivales = Object.keys(p.rivales || {}).map(r => nickDe(ev, r));
    const contra = rivales.concat(p.invitados ? [p.invitados + ' (invitados)'] : []);
    return '<div data-partida="' + esc(p.id) + '" class="py-2 space-y-1"><div class="flex justify-between gap-2"><span><b>' + esc(nickDe(ev, p.jugador)) + '</b> · ' + esc(fechaCorta(p.fecha)) + '</span>' +
      '<span class="font-bold text-wine-200 whitespace-nowrap">' + num1(p.vp) + ' VP</span></div>' +
      '<p class="text-xs text-zinc-400">Mesa de ' + esc(p.mesa) + (contra.length ? ' · contra ' + esc(contra.join(', ')) : '') + '</p>' +
      (admin ? '<div class="flex gap-1.5"><button type="button" onclick="ui.editarPartida=\'' + esc(p.id) + '\';dibujar(\'ruta\')" class="' + BTN_CH + '">Corregir</button>' +
        '<button type="button" onclick="dosToques(this,()=>borrarPartida(\'' + esc(p.id) + '\'))" class="' + BTN_PELIGRO + '">Borrar</button></div>' : '') + '</div>';
  }).join('') + '</div>';
  if (admin) h += '<p class="text-xs text-zinc-500">Solo tú (el organizador) puedes corregir o borrar una partida guardada.</p>';
  return h;
}

// Borrador del reporte (vive en ui.reporte para que no se pierda si la página se redibuja)
function borradorReporte(id, ev) {
  const propio = miJugadorLibre(id, ev); const r = rangoReporte(ev);
  if (!ui.reporte || ui.reporte.liga !== id) {
    ui.reporte = { liga: id, jugador: puedeCapturar(ev) ? '' : (propio || ''), fecha: r.max >= r.min ? r.max : '', mesa: 5, vp: '', rivales: {}, invitados: '', revisar: false };
  }
  if (!puedeCapturar(ev)) ui.reporte.jugador = propio || '';
  return ui.reporte;
}

function bloqueReportar(id, ev) {
  const r = rangoReporte(ev);
  const caja = (cuerpo) => '<div data-reportar class="bg-zinc-800 border border-wine-600/60 rounded-xl p-4 space-y-3 text-sm">' + cuerpo + '</div>';
  if (ev.inicio && r.max < ev.inicio) return caja('<p class="font-bold">🎲 Reportar partida</p><p class="text-zinc-300">La temporada empieza el ' + esc(fechaLarga(ev.inicio)) + '. Desde ese día se pueden reportar partidas.</p>');
  const b = borradorReporte(id, ev); const equipo = puedeCapturar(ev);
  if (b.revisar) return caja(resumenReporte(id, ev, b));
  const jugadores = jugadoresOrdenados(ev);
  let h = '<p class="font-bold">🎲 Reportar partida</p>';
  if (equipo) {
    h += '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Jugador</span><select id="rpJugador" onchange="leerReporte(true)" class="' + INP + '">' +
      '<option value="">Elige…</option>' + jugadores.map(p => '<option value="' + esc(p.id) + '"' + (p.id === b.jugador ? ' selected' : '') + '>' + esc(p.nick) + '</option>').join('') + '</select>' +
      '<span class="block text-xs text-zinc-500">Como equipo puedes reportar por cualquier jugador de la liga.</span></label>';
  } else {
    h += '<p class="text-zinc-300">Jugador: <b>' + esc(nickDe(ev, b.jugador)) + '</b></p>';
  }
  h += '<div class="grid grid-cols-2 gap-2"><label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Fecha</span>' +
    '<input id="rpFecha" type="date" min="' + esc(r.min) + '" max="' + esc(r.max) + '" value="' + esc(b.fecha) + '" onchange="leerReporte()" class="' + INP + '"></label>' +
    '<fieldset class="space-y-1"><legend class="text-xs font-semibold text-zinc-400">Mesa de</legend><div class="flex gap-2">' + [4, 5].map(n =>
      '<label class="flex-1 flex gap-1.5 items-center justify-center border border-zinc-700 rounded-lg px-2 py-2 cursor-pointer has-[:checked]:border-wine-500 has-[:checked]:bg-wine-900/40"><input type="radio" name="rpMesa" value="' + n + '"' + (b.mesa === n ? ' checked' : '') + ' onchange="leerReporte(true)" class="accent-wine-500"> ' + n + '</label>').join('') + '</div></fieldset></div>';
  h += '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">VP que obtuvo</span><select id="rpVp" onchange="leerReporte()" class="' + INP + '">' +
    '<option value="">Elige…</option>' + vpOpciones(b.mesa).map(v => '<option value="' + v + '"' + (String(v) === String(b.vp) ? ' selected' : '') + '>' + v + ' VP</option>').join('') + '</select></label>';
  const otros = jugadores.filter(p => p.id !== b.jugador);
  h += '<fieldset class="space-y-1"><legend class="text-xs font-semibold text-zinc-400">¿Contra quién jugó? (jugadores de la liga)</legend>' +
    (otros.length ? '<div class="flex flex-wrap gap-1.5">' + otros.map(p => '<label class="flex gap-1.5 items-center text-xs border border-zinc-700 rounded-full px-2.5 py-1 cursor-pointer has-[:checked]:border-wine-500 has-[:checked]:bg-wine-900/40">' +
      '<input type="checkbox" data-rival="' + esc(p.id) + '"' + (b.rivales[p.id] ? ' checked' : '') + ' onchange="leerReporte()" class="accent-wine-500"> ' + esc(p.nick) + '</label>').join('') + '</div>' : '<p class="text-xs text-zinc-500">No hay más jugadores en la liga.</p>') + '</fieldset>' +
    '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Invitados (opcional)</span><input id="rpInvitados" maxlength="200" value="' + esc(b.invitados) + '" oninput="leerReporte()" class="' + INP + '" placeholder="ej. Pedro, Lucía"></label>' +
    '<p id="rpError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<button type="button" onclick="revisarReporte()" class="' + BTN + ' w-full">Revisar y guardar</button>';
  return caja(h);
}

// Lee el formulario al borrador. redibujar = cambió algo que cambia el formulario (jugador o mesa)
function leerReporte(redibujar) {
  const b = ui.reporte; if (!b) return;
  if ($('rpJugador')) b.jugador = $('rpJugador').value;
  if ($('rpFecha')) b.fecha = $('rpFecha').value;
  const m = document.querySelector('input[name="rpMesa"]:checked'); if (m) b.mesa = Number(m.value);
  if ($('rpVp')) b.vp = $('rpVp').value;
  if (b.vp !== '' && Number(b.vp) > b.mesa) b.vp = '';
  b.rivales = {}; document.querySelectorAll('[data-rival]').forEach(c => { if (c.checked && c.dataset.rival !== b.jugador) b.rivales[c.dataset.rival] = true; });
  if ($('rpInvitados')) b.invitados = $('rpInvitados').value;
  if (redibujar) dibujar('ruta');
}

// Problema con el borrador ('' = todo bien)
function problemaReporte(ev, b) {
  const r = rangoReporte(ev);
  if (!b.jugador || !(ev.jugadores || {})[b.jugador]) return 'Elige el jugador.';
  if (!fechaValida(b.fecha)) return 'Elige la fecha de la partida.';
  if (r.min && b.fecha < r.min) return 'La fecha queda antes del inicio de la temporada (' + fechaCorta(r.min) + ').';
  if (ev.fin && b.fecha > ev.fin) return 'La fecha queda después del fin de la temporada (' + fechaCorta(ev.fin) + ').';
  if (b.fecha > hoyISO()) return 'La fecha no puede ser en el futuro.';
  if (b.mesa !== 4 && b.mesa !== 5) return 'Elige si la mesa fue de 4 o de 5.';
  if (b.vp === '' || !vpValido(Number(b.vp), b.mesa)) return 'Elige los VP (de 0 a ' + b.mesa + ').';
  if (Object.keys(b.rivales).length > b.mesa - 1) return 'En una mesa de ' + b.mesa + ' solo hay ' + (b.mesa - 1) + ' rivales.';
  return '';
}

function revisarReporte() {
  leerReporte(); const ev = ligaActual(); const b = ui.reporte; if (!ev || !b) return;
  const p = problemaReporte(ev, b);
  if (p) return errorForm('rpError', p);
  b.revisar = true; dibujar('ruta'); window.scrollTo(0, 0);
}

function resumenReporte(id, ev, b) {
  const rivales = Object.keys(b.rivales).map(r => nickDe(ev, r));
  const contra = rivales.concat(b.invitados.trim() ? [b.invitados.trim() + ' (invitados)'] : []);
  const propia = !puedeAdministrar(ev);
  return '<p class="font-bold">Revisa antes de guardar</p>' +
    '<div data-resumen class="bg-zinc-900 rounded-lg p-3 space-y-1"><p>Jugador: <b>' + esc(nickDe(ev, b.jugador)) + '</b></p><p>Fecha: <b>' + esc(fechaLarga(b.fecha)) + '</b></p>' +
    '<p>Mesa de <b>' + b.mesa + '</b> · <b>' + num1(Number(b.vp)) + ' VP</b></p>' + (contra.length ? '<p>Contra: ' + esc(contra.join(', ')) + '</p>' : '') + '</div>' +
    (propia ? '<p data-aviso-sin-cambios class="text-amber-300 font-semibold">⚠️ Una vez guardada, no podrás cambiar esta partida. Solo el organizador puede corregirla o borrarla.</p>'
      : '<p class="text-zinc-400 text-xs">Como organizador, después puedes corregirla o borrarla.</p>') +
    '<div class="flex gap-2"><button type="button" onclick="guardarReporte()" class="' + BTN + ' flex-1">Confirmar y guardar</button>' +
    '<button type="button" onclick="ui.reporte.revisar=false;dibujar(\'ruta\')" class="' + BTN2 + ' flex-1">Volver a editar</button></div>';
}

function datosPartida(b) {
  const d = { jugador: b.jugador, fecha: b.fecha, vp: Number(b.vp), mesa: b.mesa };
  const rivales = {}; Object.keys(b.rivales).forEach(r => { if (r !== b.jugador) rivales[r] = true; });
  if (Object.keys(rivales).length) d.rivales = rivales;
  const inv = String(b.invitados || '').trim().slice(0, 200); if (inv) d.invitados = inv;
  return d;
}

async function guardarReporte() {
  const id = idLigaActual(); const ev = ligaActual(); const b = ui.reporte; if (!ev || !b) return;
  const p = problemaReporte(ev, b);
  if (p) { b.revisar = false; dibujar('ruta'); return aviso(p, 'error'); }
  const d = Object.assign(datosPartida(b), { por: usuario.uid, creada: firebase.database.ServerValue.TIMESTAMP });
  if (await guardar(id, { ['partidas/' + nuevoId('g')]: d }, 'Partida guardada: ' + nickDe(ev, b.jugador) + ' · ' + num1(d.vp) + ' VP')) {
    ui.reporte = null; dibujar('ruta');
  }
}

// ---------------- Corregir y borrar (solo el organizador)
function formCorregir(id, ev, p) {
  const r = rangoReporte(ev);
  const otros = jugadoresOrdenados(ev).filter(x => x.id !== p.jugador);
  return '<form data-corregir="' + esc(p.id) + '" class="py-2 space-y-2" onsubmit="guardarCorreccion(event,\'' + esc(p.id) + '\')"><p><b>' + esc(nickDe(ev, p.jugador)) + '</b> · corregir partida</p>' +
    '<div class="grid grid-cols-3 gap-2"><label class="space-y-1 col-span-1"><span class="text-xs text-zinc-400">Fecha</span><input id="cpFecha" type="date" min="' + esc(r.min) + '" max="' + esc(ev.fin || '') + '" value="' + esc(p.fecha) + '" class="' + INP + '"></label>' +
    '<label class="space-y-1"><span class="text-xs text-zinc-400">Mesa de</span><select id="cpMesa" class="' + INP + '">' + [4, 5].map(n => '<option' + (p.mesa === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
    '<label class="space-y-1"><span class="text-xs text-zinc-400">VP</span><select id="cpVp" class="' + INP + '">' + VP_OPCIONES.map(v => '<option value="' + v + '"' + (v === p.vp ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label></div>' +
    (otros.length ? '<div class="flex flex-wrap gap-1.5">' + otros.map(x => '<label class="flex gap-1.5 items-center text-xs border border-zinc-700 rounded-full px-2.5 py-1"><input type="checkbox" data-cp-rival="' + esc(x.id) + '"' + ((p.rivales || {})[x.id] ? ' checked' : '') + ' class="accent-wine-500"> ' + esc(x.nick) + '</label>').join('') + '</div>' : '') +
    '<input id="cpInvitados" maxlength="200" value="' + esc(p.invitados || '') + '" placeholder="Invitados (opcional)" class="' + INP + '">' +
    '<p id="cpError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<div class="flex gap-2"><button class="' + BTN + '">Guardar corrección</button><button type="button" onclick="ui.editarPartida=null;dibujar(\'ruta\')" class="' + BTN2 + '">Cancelar</button></div></form>';
}

async function guardarCorreccion(e, pid) {
  e.preventDefault();
  const id = idLigaActual(); const ev = ligaActual(); const p = ev && ev.partidas && ev.partidas[pid]; if (!p) return;
  const rivales = {}; document.querySelectorAll('[data-cp-rival]').forEach(c => { if (c.checked) rivales[c.dataset.cpRival] = true; });
  const b = { jugador: p.jugador, fecha: $('cpFecha').value, mesa: Number($('cpMesa').value), vp: $('cpVp').value, rivales, invitados: $('cpInvitados').value };
  const prob = problemaReporte(ev, b);
  if (prob) return errorForm('cpError', prob);
  const d = Object.assign(datosPartida(b), { por: p.por, creada: p.creada });
  if (await guardar(id, { ['partidas/' + pid]: d }, 'Partida corregida')) { ui.editarPartida = null; dibujar('ruta'); }
}

function borrarPartida(pid) { return guardar(idLigaActual(), { ['partidas/' + pid]: null }, 'Partida borrada'); }

// ---------------- Temporada (Ajustes del organizador)
function bloqueTemporada(id, ev) {
  const cerrada = temporadaCerrada(ev);
  return '<div data-temporada class="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-2 text-sm"><h3 class="font-bold">Temporada</h3>' +
    (cerrada
      ? '<p class="text-zinc-300">Está cerrada: ya no se reportan partidas y la clasificación es la definitiva.</p><button type="button" onclick="dosToques(this,()=>cambiarTemporada(false))" class="' + BTN2 + '">Reabrir temporada</button>'
      : '<p class="text-zinc-300">Al terminar, ciérrala: ya no se podrán reportar partidas y la clasificación queda como definitiva (con la media final de la liga).</p><button type="button" onclick="dosToques(this,()=>cambiarTemporada(true))" class="' + BTN + '">Cerrar temporada</button>') + '</div>';
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
  const ps = [['Fecha', 'Jugador', 'Mesa de', 'VP', 'Contra (liga)', 'Invitados']];
  partidasLiga(ev).forEach(p => ps.push([p.fecha, nickDe(ev, p.jugador), p.mesa, p.vp, Object.keys(p.rivales || {}).map(r => nickDe(ev, r)).join(', '), p.invitados || '']));
  return [['Clasificación', tabla], ['Partidas', ps]];
}
