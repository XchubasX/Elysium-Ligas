// =====================================================================
// js/comunidad.js — DARSE A CONOCER
// · Etiqueta "100% casual · no sancionados por VEKN"
// · Solicitud para ser organizador (cuenta sin permiso) y aprobación (superusuario)
// · Guía corta "Cómo funciona"  (#/ayuda)
// =====================================================================
function etiquetaCasual() {
  return '<span data-casual class="inline-block text-[11px] font-extrabold text-amber-300 border border-amber-700 rounded-full px-2 py-0.5 tracking-wide">100% CASUAL · NO SANCIONADOS POR VEKN</span>';
}

// ---------------- Cuenta sin permiso: pedir ser organizador
function bloqueSolicitud() {
  const inp = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500';
  if (miSolicitud) {
    const f = new Date(miSolicitud.creada || Date.now()).toISOString().slice(0, 10);
    return '<div data-solicitud class="bg-zinc-800 border border-emerald-700/60 rounded-xl p-4 space-y-2 text-sm"><p class="font-bold text-emerald-300">✓ Solicitud enviada</p>' +
      '<p class="text-zinc-300">Enviada el ' + esc(fechaCorta(f)) + '. Cuando te aprueben, aquí aparecerán «+ Nueva liga» y «+ Nuevo torneo».</p>' +
      '<button type="button" onclick="dosToques(this,()=>cancelarSolicitud())" class="text-xs text-zinc-400 underline">Cancelar solicitud</button></div>';
  }
  return '<form id="formSolicitud" data-solicitud class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3 text-sm" onsubmit="enviarSolicitud(event)">' +
    '<p class="font-bold">¿Quieres organizar una liga o un torneo?</p><p class="text-zinc-300">Manda tu solicitud. El administrador la revisa y te da permiso.</p>' +
    '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Tu nombre o nick</span><input id="solNombre" maxlength="40" value="' + esc(nombreUsuario()) + '" class="' + inp + '"></label>' +
    '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Ciudad</span><input id="solCiudad" maxlength="60" class="' + inp + '" placeholder="ej. Guadalajara"></label>' +
    '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">¿Qué quieres organizar? (opcional)</span><input id="solMensaje" maxlength="200" class="' + inp + '" placeholder="ej. Liga mensual en Tienda X"></label>' +
    '<p id="solError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<button class="' + BTN + ' w-full">Enviar solicitud</button>' +
    '<p class="text-xs text-zinc-500">No se guarda tu correo. Solo el administrador ve tu solicitud.</p></form>';
}

async function enviarSolicitud(e) {
  e.preventDefault();
  const nombre = $('solNombre').value.trim(), ciudad = $('solCiudad').value.trim(), mensaje = $('solMensaje').value.trim();
  if (!nombre) { const p = $('solError'); p.textContent = 'Escribe tu nombre o nick.'; p.classList.remove('hidden'); return; }
  const datos = { nombre, creada: firebase.database.ServerValue.TIMESTAMP };
  if (ciudad) datos.ciudad = ciudad; if (mensaje) datos.mensaje = mensaje;
  try {
    await db.ref('solicitudes/' + usuario.uid).set(datos);
    miSolicitud = { nombre, ciudad, mensaje, creada: Date.now() };
    aviso('Solicitud enviada'); dibujar('ruta');
  } catch (err) { aviso('No se pudo enviar la solicitud. Intenta de nuevo.', 'error'); }
}
async function cancelarSolicitud() {
  try { await db.ref('solicitudes/' + usuario.uid).remove(); miSolicitud = null; aviso('Solicitud cancelada'); dibujar('ruta'); }
  catch (e) { aviso('No se pudo cancelar.', 'error'); }
}

// ---------------- Superusuario: solicitudes pendientes
function bloqueSolicitudesAdmin() {
  const ids = Object.keys(solicitudes || {}).sort((a, b) => (solicitudes[a].creada || 0) - (solicitudes[b].creada || 0));
  if (!ids.length) return '';
  return '<div data-solicitudes class="bg-zinc-800 border border-wine-600/60 rounded-xl p-4 space-y-3 text-sm">' +
    '<div class="flex justify-between items-center"><p class="font-bold">Solicitudes para organizar</p><span class="' + PILL + ' bg-wine-600 text-white">' + ids.length + '</span></div>' +
    ids.map(uid => {
      const s = solicitudes[uid]; const f = new Date(s.creada || Date.now()).toISOString().slice(0, 10);
      return '<div data-solicitud-de="' + esc(s.nombre) + '" class="border-t border-zinc-700 pt-2 space-y-2"><p><b>' + esc(s.nombre) + '</b>' + (s.ciudad ? ' · ' + esc(s.ciudad) : '') +
        '<br><span class="text-zinc-400">' + (s.mensaje ? '«' + esc(s.mensaje) + '» · ' : 'sin mensaje · ') + esc(fechaCorta(f)) + '</span></p>' +
        '<div class="flex gap-2"><button type="button" onclick="aprobarSolicitud(\'' + esc(uid) + '\')" class="' + BTN + ' flex-1 !py-1.5">Aprobar</button>' +
        '<button type="button" onclick="dosToques(this,()=>rechazarSolicitud(\'' + esc(uid) + '\'))" class="' + BTN2 + ' flex-1 !py-1.5">Rechazar</button></div></div>';
    }).join('') + '<p class="text-xs text-zinc-500">Rechazar borra la solicitud; la persona puede volver a mandarla.</p></div>';
}
async function aprobarSolicitud(uid) {
  const n = (solicitudes[uid] || {}).nombre || '';
  try { await db.ref().update({ ['organizadores/' + uid]: true, ['solicitudes/' + uid]: null }); aviso(n + ' ya puede organizar'); }
  catch (e) { aviso('No se pudo aprobar. Revisa que las reglas estén actualizadas.', 'error'); }
}
async function rechazarSolicitud(uid) {
  try { await db.ref('solicitudes/' + uid).remove(); aviso('Solicitud rechazada'); }
  catch (e) { aviso('No se pudo rechazar.', 'error'); }
}
function solicitudesPendientes() { return soyAdmin ? Object.keys(solicitudes || {}).length : 0; }

// ---------------- Guía "Cómo funciona"
function vistaAyuda() {
  const pasos = [
    ['Pide permiso de organizador', 'Entra con Google → «Mis eventos» → «Quiero organizar».'],
    ['Crea tu liga o torneo', 'Liga: temporada con jornadas. Torneo: un día, 2 o 3 rondas y final opcional.'],
    ['Anota a los jugadores', 'Con su nick. Puedes copiarlos de otra liga tuya.'],
    ['El día del evento', 'Pase de lista → sortear mesas → capturar VP. El GW se calcula solo.'],
    ['Comparte', 'Tabla por WhatsApp y Excel para todos. Invita ayudantes para capturar contigo.']];
  const faq = [
    ['¿Cuenta para el ranking de VEKN?', 'No. Son ligas y torneos 100% casuales, no sancionados por VEKN: para juego casual o eventos fuera del calendario oficial.'],
    ['¿Los jugadores necesitan cuenta?', 'No. Solo el organizador y sus ayudantes entran con Google.'],
    ['¿Qué puede hacer un ayudante?', 'Anotar jugadores, pasar lista, sortear mesas y capturar resultados. No cambia fechas ni ajustes.'],
    ['Me equivoqué en un resultado', 'El organizador puede reabrir la jornada o el torneo y corregir.']];
  return '<a href="#/" class="text-sm text-zinc-400 hover:text-zinc-200">← Ligas y torneos</a>' +
    '<div class="bg-zinc-800 border border-wine-600/50 rounded-2xl p-4 space-y-3 text-sm"><h2 class="text-lg font-extrabold text-wine-300">Cómo funciona</h2>' + etiquetaCasual() +
    pasos.map(([t, d], i) => '<div class="flex gap-3"><span class="w-6 h-6 rounded-full bg-wine-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">' + (i + 1) + '</span><span><b>' + t + '</b><br><span class="text-zinc-400">' + d + '</span></span></div>').join('') +
    '<p class="font-bold border-t border-zinc-700 pt-3">Preguntas frecuentes</p>' +
    faq.map(([q, a]) => '<p><b>' + q + '</b><br><span class="text-zinc-400">' + a + '</span></p>').join('') + '</div>' +
    (usuario && (soyOrganizador || soyAdmin) ? '' : '<a href="#/mis-eventos" class="' + BTN + ' w-full">Quiero organizar</a>');
}
