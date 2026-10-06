// =====================================================================
// js/torneo.js — TORNEOS DE UN DÍA
// Pestaña Clasificación (pública) y pestaña Mesas: el día del torneo.
// El torneo usa la jornada j1 del evento: pase de lista, rondas (2 o 3) y,
// si el organizador la activó, la final de 5 (elige asiento primero el 5º).
// =====================================================================

// ---------------- Clasificación
function filaTabla(cols, i, celdas, resaltar, corte) {
  return '<div class="grid gap-2 px-3 py-2 ' + (corte ? 'border-b-2 border-dashed border-amber-700' : 'border-b border-zinc-700/50') + ' ' + (resaltar ? 'bg-wine-900/30' : '') + '" style="grid-template-columns:' + cols + '" role="row">' +
    '<span class="font-extrabold text-wine-300">' + i + '</span>' + celdas + '</div>';
}

function seccionClasificacion(id, ev) {
  const e = etapaTorneo(ev).etapa; const conHaz = ev.hazanasModo !== 'no';
  if (e === 'pendiente' || e === 'cancelado') return '<p class="text-zinc-400 text-sm py-6 text-center">' + (e === 'cancelado' ? 'Este torneo se canceló.' : 'El torneo todavía no empieza.') + '</p>';
  const terminado = e === 'terminado';
  const lista = (terminado || e === 'final') ? resultadoTorneo(ev) : clasificacionTorneo(ev);
  if (!lista.length) return '<p class="text-zinc-400 text-sm py-6 text-center">Todavía no hay resultados.</p>';
  const conFinal = !!(diaTorneo(ev) || {}).final;
  let h = '';
  if (terminado) {
    const c = lista[0];
    h += '<div class="bg-zinc-800 border border-wine-600/50 rounded-2xl p-4 text-center space-y-1"><p class="text-xs font-extrabold text-amber-300">🏆 CAMPEÓN</p>' +
      '<p class="text-2xl font-extrabold text-wine-300">' + esc(c.nick) + '</p>' + (typeof c.finalVp === 'number' ? '<p class="text-sm text-zinc-400">' + c.finalVp + ' VP en la final</p>' : '') + '</div>';
  } else {
    const et = etapaTorneo(ev);
    h += '<p class="text-[13px] font-extrabold text-amber-300 uppercase">En curso · ' + (et.etapa === 'final' ? 'final' : 'ronda ' + et.ronda + ' de ' + (ev.rondasPlan || 3)) + '</p>';
  }
  const cols = '28px 1fr ' + (conFinal ? '56px ' : '') + '36px 44px' + (conHaz ? ' 36px' : '');
  h += '<div class="bg-zinc-800 rounded-xl overflow-hidden text-sm" role="table" aria-label="Clasificación">' +
    '<div class="grid gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-400 border-b border-zinc-700" style="grid-template-columns:' + cols + '" role="row"><span>#</span><span>Jugador</span>' +
    (conFinal ? '<span class="text-right">Final</span>' : '') + '<span class="text-right">GW</span><span class="text-right">VP</span>' + (conHaz ? '<span class="text-right">🏅</span>' : '') + '</div>';
  const nFinal = conFinal ? finalistas(ev).length : (ev.conFinal ? 5 : 0);
  lista.forEach((f, i) => {
    h += filaTabla(cols, i + 1, '<span class="truncate">' + esc(f.nick) + '</span>' +
      (conFinal ? '<span class="text-right font-bold">' + (typeof f.finalVp === 'number' ? f.finalVp + ' VP' : '—') + '</span>' : '') +
      '<span class="text-right' + (conFinal ? '' : ' font-bold') + '">' + f.gw + '</span><span class="text-right">' + f.vp + '</span>' +
      (conHaz ? '<span class="text-right text-amber-300">' + (f.hazanas || '') + '</span>' : ''), i === 0, nFinal && i + 1 === nFinal && lista.length > nFinal);
  });
  h += '</div>';
  h += '<div class="flex gap-2 flex-wrap"><a href="' + esc(enlaceWhatsApp(textoCompartirTabla(id, ev))) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600 flex-1">Compartir por WhatsApp</a>' +
    '<button type="button" onclick="descargarExcel(\'' + esc(id) + '\')" class="' + BTN2 + ' flex-1">Descargar Excel</button></div>';
  return h;
}

// ---------------- Mesas: el día del torneo
function seccionMesasTorneo(id, ev) {
  const j = diaTorneo(ev);
  if (!j) return '<p class="text-zinc-400 text-sm py-6 text-center">Este torneo no tiene día configurado.</p>';
  const equipo = puedeCapturar(ev); const admin = puedeAdministrar(ev);
  const e = etapaTorneo(ev).etapa;
  if (e === 'cancelado') return '<p class="text-zinc-400 text-sm py-6 text-center">Este torneo se canceló.</p>' +
    (admin ? '<button type="button" onclick="cambiarEstadoJornada(\'j1\',\'pendiente\')" class="' + BTN2 + ' w-full">Reactivar torneo</button>' : '');
  if (e === 'pendiente') {
    let h = '<p class="text-zinc-400 text-sm py-4 text-center">El torneo todavía no empieza.</p>';
    if (equipo) h += '<button type="button" onclick="dosToques(this,()=>cambiarEstadoJornada(\'j1\',\'abierta\'))" class="' + BTN + ' w-full">Empezar torneo (pase de lista y mesas)</button>';
    if (admin) h += '<button type="button" onclick="dosToques(this,()=>cambiarEstadoJornada(\'j1\',\'cancelada\'))" class="' + BTN_PELIGRO + ' self-center">Cancelar torneo</button>';
    return h;
  }
  const editable = j.estado === 'abierta' && equipo;
  const hayFinal = !!j.final;
  let h = '';
  if (editable && !hayFinal && !rondasOrdenadas(j).some(r => r.mesas.some(m => m.jugadores.some(x => typeof x.vp === 'number')))) h += bloquePaseDeLista(id, ev, j);
  else if (editable && !hayFinal) h += '<details class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm"><summary class="font-bold cursor-pointer">a) Pase de lista · ' + Object.keys(j.presentes || {}).length + ' presentes</summary><div class="pt-2">' + bloquePaseDeLista(id, ev, j) + '</div></details>';
  if (hayFinal) h += bloqueFinal(id, ev, j, editable);
  h += bloqueRondas(id, ev, j, editable && !hayFinal);
  if (ev.hazanasModo !== 'no') h += bloqueHazanas(id, ev, j, editable);
  if (editable) h += bloqueCierreTorneo(id, ev, j);
  if (j.estado === 'cerrada' && admin) h += '<button type="button" onclick="dosToques(this,()=>cambiarEstadoJornada(\'j1\',\'abierta\'))" class="' + BTN2 + ' w-full">Reabrir torneo para corregir</button>';
  return h;
}

// Rondas terminadas: todas las planeadas, con todos los VP
function rondasCompletas(ev, j) {
  const rs = rondasOrdenadas(j);
  return rs.length >= (ev.rondasPlan || 3) && rs.every(r => r.mesas.length && r.mesas.every(m => m.jugadores.every(x => typeof x.vp === 'number')));
}

function bloqueCierreTorneo(id, ev, j) {
  const listas = rondasCompletas(ev, j);
  if (ev.conFinal && !j.final) {
    if (!listas) return '';
    const n = clasificacionTorneo(ev).length;
    return '<div class="bg-zinc-800 border border-wine-600/50 rounded-xl p-3 space-y-2 text-sm"><p class="font-bold">Rondas terminadas</p>' +
      (n < 5 ? '<p class="text-amber-300 text-xs">Se necesitan al menos 5 jugadores para la final.</p>' : '') +
      '<button type="button" ' + (n < 5 ? 'disabled ' : '') + 'onclick="dosToques(this,()=>pasarAFinal())" class="' + BTN + ' w-full disabled:opacity-40">Pasar a la final (top 5)</button></div>';
  }
  const faltan = ev.conFinal ? finalistas(ev).some(f => !f.asiento || typeof f.vp !== 'number') : !listas;
  if (faltan && !ev.conFinal) return '';
  return '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2 text-sm">' +
    (faltan ? '<p class="text-xs text-amber-300">Faltan asientos o VP de la final.</p>' : '<p class="text-zinc-300">Todo capturado.</p>') +
    '<button type="button" ' + (faltan ? 'disabled ' : '') + 'onclick="dosToques(this,()=>cambiarEstadoJornada(\'j1\',\'cerrada\'))" class="' + BTN + ' w-full disabled:opacity-40">Terminar torneo</button></div>';
}

async function pasarAFinal() {
  const ev = ligaActual(); const r = elegirFinalistas(ev);
  if (!r) return aviso('Se necesitan al menos 5 jugadores para la final.', 'error');
  const datos = {}; Object.keys(r.lugares).forEach(jid => { datos[jid] = { lugar: r.lugares[jid] }; });
  if (await guardar(idLigaActual(), { 'jornadas/j1/final': datos }, 'Final lista') && r.sorteados.length) {
    aviso('Empate exacto por el 5º lugar entre ' + r.sorteados.join(', ') + ': se sorteó.');
  }
}

// ---------------- Final: asientos (elige primero el 5º) y VP
function bloqueFinal(id, ev, j, editable) {
  const fs = finalistas(ev);
  const pendientes = fs.filter(f => !f.asiento).sort((a, b) => b.lugar - a.lugar);
  const turno = pendientes[0];
  const ocupado = {}; fs.forEach(f => { if (f.asiento) ocupado[f.asiento] = f; });
  let h = '<div data-final class="bg-zinc-800 border border-wine-600/50 rounded-xl p-3 space-y-3 text-sm"><p class="font-bold">Final</p>';
  if (turno) {
    h += editable ? '<p>Le toca elegir asiento: <b class="text-wine-300">' + esc(turno.nick) + ' (' + turno.lugar + 'º)</b></p>' : '<p class="text-zinc-400">Eligiendo asientos…</p>';
    h += '<div class="grid grid-cols-5 gap-1.5 text-center text-xs">' + [1, 2, 3, 4, 5].map(a => {
      const f = ocupado[a];
      const cls = 'rounded-lg py-2 px-1 border ' + (f ? 'border-wine-600 bg-wine-900/40' : 'border-zinc-700');
      const dentro = '<b>' + a + '</b><br>' + (f ? esc(f.nick) : '<span class="text-zinc-500">libre</span>');
      return (editable && !f) ? '<button type="button" data-asiento="' + a + '" onclick="elegirAsiento(\'' + esc(turno.jid) + '\',' + a + ')" class="' + cls + ' hover:border-wine-500">' + dentro + '</button>' : '<div class="' + cls + '">' + dentro + '</div>';
    }).join('') + '</div>';
    h += '<p class="text-xs text-zinc-400">Orden: ' + fs.slice().sort((a, b) => b.lugar - a.lugar).map(f => esc(f.nick) + ' (' + f.lugar + 'º)' + (f.asiento ? ' ✓' : '')).join(' → ') + '</p>';
    if (editable) {
      const ult = fs.filter(f => f.asiento).sort((a, b) => a.lugar - b.lugar)[0];
      h += '<div class="flex gap-2">' + (ult ? '<button type="button" onclick="quitarAsiento(\'' + esc(ult.jid) + '\')" class="' + BTN_CH + '">Deshacer</button>' : '') +
        (!fs.some(f => f.asiento) ? '<button type="button" onclick="dosToques(this,()=>deshacerFinal())" class="' + BTN_PELIGRO + '">Regresar a las rondas</button>' : '') + '</div>';
    }
  } else {
    const porAsiento = fs.slice().sort((a, b) => a.asiento - b.asiento);
    const todos = fs.every(f => typeof f.vp === 'number');
    const res = todos ? resultadoTorneo(ev)[0] : null;
    porAsiento.forEach(f => {
      const gana = res && res.jid === f.jid;
      h += '<div class="flex items-center gap-2"><span class="w-5 text-zinc-500 text-xs">' + f.asiento + '</span><span class="flex-1 truncate' + (gana ? ' font-bold text-wine-200' : '') + '">' + esc(f.nick) + ' <span class="text-[11px] text-zinc-500">' + f.lugar + 'º</span>' + (gana ? ' 🏆' : '') + '</span>';
      if (editable) h += '<select aria-label="VP final de ' + esc(f.nick) + '" onchange="ponerVPFinal(\'' + esc(f.jid) + '\',this.value)" class="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-sm w-[64px]"><option value="">VP</option>' +
        VP_OPCIONES.map(v => '<option value="' + v + '"' + (f.vp === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>';
      else h += '<span class="w-12 text-right">' + (typeof f.vp === 'number' ? f.vp + ' VP' : '—') + '</span>';
      h += '</div>';
    });
    const suma = fs.reduce((s, f) => s + (typeof f.vp === 'number' ? f.vp : 0), 0);
    if (suma > fs.length) h += '<p class="text-xs text-amber-300">La suma de VP (' + suma + ') es mayor que el número de jugadores (' + fs.length + ').</p>';
    if (editable && !fs.some(f => typeof f.vp === 'number')) {
      const ult = fs.slice().sort((a, b) => a.lugar - b.lugar)[0];
      h += '<button type="button" onclick="quitarAsiento(\'' + esc(ult.jid) + '\')" class="' + BTN_CH + ' self-start">Deshacer último asiento</button>';
    }
  }
  return h + '</div>';
}
function elegirAsiento(jid, asiento) { return guardar(idLigaActual(), { ['jornadas/j1/final/' + jid + '/asiento']: asiento }); }
function quitarAsiento(jid) { return guardar(idLigaActual(), { ['jornadas/j1/final/' + jid + '/asiento']: null }); }
function deshacerFinal() { return guardar(idLigaActual(), { 'jornadas/j1/final': null }, 'Final deshecha'); }
function ponerVPFinal(jid, valor) { return guardar(idLigaActual(), { ['jornadas/j1/final/' + jid + '/vp']: valor === '' ? null : Number(valor) }); }
