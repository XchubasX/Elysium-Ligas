// =====================================================================
// js/arranque.js — LO ÚNICO QUE SE EJECUTA AL ABRIR LA PÁGINA (va al final)
// =====================================================================
let redibujoPendiente = false;
function dibujar(motivo) {
  const r = rutaActual();
  if (motivo === 'datos') {
    // En los formularios largos no se redibuja por cambios de datos (se perdería lo escrito)
    if ((r.vista === 'crear' && $('formCrear')) || ($('formAjustes') && $('formAjustes').dataset.sucio)) return;
    // Si alguien está escribiendo en una casilla, se espera a que termine
    const a = document.activeElement;
    if (a && $('app').contains(a) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.value) { redibujoPendiente = true; return; }
  }
  redibujoPendiente = false;
  $('barraSesion').innerHTML = barraSesion();
  let html;
  if (r.vista === 'ayuda') html = vistaAyuda();
  else if (r.vista === 'invitacion') html = vistaInvitacion(r.id, r.pestana === 'tabla' ? null : r.pestana);
  else if (r.vista === 'liga' && r.id && r.pestana === 'jornada' && r.sub) html = vistaJornada(r.id, r.sub);
  else if (r.vista === 'liga' && r.id) html = vistaLiga(r.id, r.pestana);
  else if (r.vista === 'archivadas') html = vistaPortada(true);
  else if (r.vista === 'mis-eventos') html = vistaMisEventos();
  else if (r.vista === 'crear') html = vistaCrear(r.id);
  else html = vistaPortada(false);
  $('app').innerHTML = html;
  const f = $('formCrear'); if (f) f.addEventListener('submit', enviarCrear);
}

// El enlace a las mesas apunta al Elysium del mismo entorno (pruebas → uat.eternalschedule.com)
const MESAS = window.ELYSIUM_MESAS || 'eternalschedule.com';
if ($('enlaceMesas')) { $('enlaceMesas').href = 'https://' + MESAS; $('enlaceMesas').textContent = MESAS; }

if (!window.LIGAS_CONFIG) {
  $('app').innerHTML = '<p class="text-center text-zinc-300 py-10">Este sitio todavía no está abierto. Mientras tanto, las mesas están en <a class="text-wine-300 underline" href="https://' + MESAS + '">' + MESAS + '</a>.</p>';
} else {
  if (window.LIGAS_CONFIG.esPruebas) $('franjaPruebas').classList.remove('hidden');
  iniciarFirebase();
  window.addEventListener('hashchange', () => { ui.editarJornada = null; ui.agregarJornada = false; ui.editarJugador = null; resultadoInvitacion = null; if (!/equipo/.test(location.hash)) ultimaInvitacion = null; dibujar('ruta'); window.scrollTo(0, 0); });
  $('app').addEventListener('focusout', () => setTimeout(() => { if (redibujoPendiente && !($('app').contains(document.activeElement) && document.activeElement.value)) dibujar('ruta'); }, 0));
  escucharSesion(dibujar);
  escucharEventos(dibujar);
  dibujar('inicio');
}
