// =====================================================================
// js/arranque.js — LO ÚNICO QUE SE EJECUTA AL ABRIR LA PÁGINA (va al final)
// =====================================================================
function dibujar(motivo) {
  const r = rutaActual();
  // En el formulario no se redibuja por cambios de datos (se perdería lo escrito)
  if (r.vista === 'crear' && motivo === 'datos' && $('formCrear')) return;
  $('barraSesion').innerHTML = barraSesion();
  let html;
  if (r.vista === 'liga' && r.id) html = vistaLiga(r.id, r.pestana);
  else if (r.vista === 'archivadas') html = vistaPortada(true);
  else if (r.vista === 'mis-eventos') html = vistaMisEventos();
  else if (r.vista === 'crear') html = vistaCrear();
  else html = vistaPortada(false);
  $('app').innerHTML = html;
  const f = $('formCrear'); if (f) f.addEventListener('submit', enviarCrear);
}

if (!window.LIGAS_CONFIG) {
  $('app').innerHTML = '<p class="text-center text-zinc-300 py-10">Este sitio todavía no está abierto. Mientras tanto, las mesas están en <a class="text-wine-300 underline" href="https://eternalschedule.com">eternalschedule.com</a>.</p>';
} else {
  if (window.LIGAS_CONFIG.esPruebas) $('franjaPruebas').classList.remove('hidden');
  iniciarFirebase();
  window.addEventListener('hashchange', () => { dibujar('ruta'); window.scrollTo(0, 0); });
  escucharSesion(dibujar);
  escucharEventos(dibujar);
  dibujar('inicio');
}
