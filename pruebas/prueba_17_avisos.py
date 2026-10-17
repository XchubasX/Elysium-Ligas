"""Aviso al celular del administrador cuando alguien pide ser organizador (17 oct 2026).

Parte 1: lo que decide el servidor (avisos-servidor.js y worker.js), corrido con Node.
Parte 2: la tarjeta «🔔 Avisos de solicitudes» en el navegador, con avisos simulados.
"""
import json
import shutil
import subprocess
import herramientas as H

TITULO = 'Avisos al celular de solicitudes para organizar'

# Avisos del navegador simulados: permiso, service worker y Firebase Messaging
SIMULAR_AVISOS = """<script>
window.__permiso = 'granted'; window.__tokenAparato = 'token-aparato-1'; window.__fetches = [];
window.Notification = function () {}; Notification.permission = 'default';
Notification.requestPermission = () => { Notification.permission = window.__permiso; return Promise.resolve(window.__permiso); };
window.PushManager = function () {};
Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register: () => Promise.resolve({}), addEventListener: () => {} } });
window.firebase.messaging = () => ({ getToken: () => Promise.resolve(window.__tokenAparato), deleteToken: () => Promise.resolve(true), onMessage: () => {} });
window.fetch = (u, o) => { window.__fetches.push([u, o && o.headers]); return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('{}') }); };
</script>"""

NODE = r"""
const m = await import(process.argv[2]);
const w = await import(process.argv[3]);
const r = {};
// 1) Solicitudes nuevas
const sol = { u1: { nombre: 'Pepe', ciudad: 'Guadalajara', mensaje: 'Liga mensual', creada: 100 }, u2: { nombre: 'Lalo', creada: 200 } };
let p = m.planear(sol, {});
r.dos_nuevas = p.nuevas.map(s => s.uid).join(',') === 'u1,u2' && p.estado.u1 === 100 && p.estado.u2 === 200;
// 2) Ya avisadas: nada nuevo
p = m.planear(sol, { u1: 100, u2: 200 });
r.ya_avisadas = p.nuevas.length === 0 && Object.keys(p.estado).length === 0;
// 3) Aprobada / rechazada: se olvida
p = m.planear({ u2: sol.u2 }, { u1: 100, u2: 200 });
r.se_olvida = p.nuevas.length === 0 && p.estado.u1 === null && !('u2' in p.estado);
// 4) Rechazada y vuelta a mandar (otra fecha): avisa otra vez
p = m.planear({ u1: { nombre: 'Pepe', creada: 300 } }, { u1: 100 });
r.reenviada = p.nuevas.length === 1 && p.estado.u1 === 300;
// 5) Textos
let t = m.mensaje([{ nombre: 'Pepe', ciudad: 'Guadalajara', mensaje: 'Liga mensual', creada: 1 }]);
r.texto_una = t.titulo === '🔔 Nueva solicitud de organizador' && t.texto.includes('Pepe · Guadalajara') && t.texto.includes('«Liga mensual»');
t = m.mensaje(['A', 'B', 'C', 'D', 'E'].map((n, i) => ({ nombre: n, ciudad: '', mensaje: '', creada: i })));
r.texto_varias = t.titulo === '🔔 5 solicitudes de organizador' && t.texto.startsWith('A, B, C y 2 más');
t = m.mensaje([{ nombre: 'A', ciudad: '', mensaje: '', creada: 1 }, { nombre: 'B', ciudad: '', mensaje: '', creada: 2 }]);
r.texto_dos = t.texto.startsWith('A y B');
// 6) Solo a administradores vigentes, solo aparatos con código
const ap = m.aparatosAdmin({ adm: { d1: { token: 'x' }, d2: {} }, exadm: { d3: { token: 'y' } } }, { adm: true });
r.solo_admins = JSON.stringify(ap) === JSON.stringify([['avisosAdmin/adm/d1', 'x']]);
// 7) Una vuelta completa con red simulada
async function vueltaSimulada(base, envios) {
  const escritos = []; const mandados = [];
  globalThis.crypto.subtle.importKey = async () => ({}); globalThis.crypto.subtle.sign = async () => new Uint8Array([1]);
  globalThis.fetch = async (url, o) => {
    if (url.startsWith('https://oauth2')) return { json: async () => ({ access_token: 't' }) };
    if (url.startsWith('https://fcm')) { const b = JSON.parse(o.body).message; mandados.push(b); return envios(b); }
    const ruta = url.split('.com/')[1].split('.json')[0];
    if (o.method === 'PATCH') { escritos.push(JSON.parse(o.body)); return { ok: true, json: async () => ({}) }; }
    const v = ruta.split('/').filter(Boolean).reduce((n, k) => (n == null ? null : n[k] === undefined ? null : n[k]), base);
    return { ok: true, json: async () => v };
  };
  const env = { FIREBASE_CUENTA_SERVICIO: JSON.stringify({ private_key: '-----BEGIN-----QUJD-----END-----', client_email: 'a@b', project_id: 'elysium-ligas-uat' }),
    FIREBASE_DB_URL: 'https://x.firebaseio.com', SITIO: 'https://uat-ligas.eternalschedule.com' };
  const res = await m.vuelta(env);
  return { res, escritos, mandados };
}
const base = { solicitudes: sol, admins: { adm: true }, avisosAdmin: { adm: { d1: { token: 'bueno' }, d2: { token: 'viejo' } } } };
let v = await vueltaSimulada(base, b => b.token === 'viejo' ? { ok: false, status: 404, text: async () => 'UNREGISTERED' } : { ok: true });
r.vuelta_un_solo_aviso_por_aparato = v.mandados.length === 2 && v.mandados[0].notification.title === '🔔 2 solicitudes de organizador';
r.vuelta_enlace_mis_eventos = v.mandados[0].webpush.fcm_options.link === 'https://uat-ligas.eternalschedule.com/#/mis-eventos';
r.vuelta_marca_antes_de_mandar = JSON.stringify(v.escritos[0]) === JSON.stringify({ 'avisosEnviados/solicitudes/u1': 100, 'avisosEnviados/solicitudes/u2': 200 });
r.vuelta_borra_aparato_viejo = JSON.stringify(v.escritos[1]) === JSON.stringify({ 'avisosAdmin/adm/d2': null });
// 8) Sin aparatos activados: no se marcan (llegan al activar)
v = await vueltaSimulada({ solicitudes: sol, admins: { adm: true } }, () => ({ ok: true }));
r.sin_aparatos_no_marca = v.mandados.length === 0 && v.escritos.length === 0;
// 9) La siguiente vuelta ya no repite
v = await vueltaSimulada(Object.assign({}, base, { avisosEnviados: { solicitudes: { u1: 100, u2: 200 } } }), () => ({ ok: true }));
r.no_repite = v.mandados.length === 0;
// 10) worker: «Entrar con Google» del iPhone se reenvía a Firebase, lo demás no
r.worker_auth = w.destinoAuth('https://ligas.eternalschedule.com/__/auth/handler?x=1', 'elysium-ligas.firebaseapp.com') === 'https://elysium-ligas.firebaseapp.com/__/auth/handler?x=1'
  && w.destinoAuth('https://ligas.eternalschedule.com/#/mis-eventos', 'h') === null;
console.log(JSON.stringify(r));
"""

NOMBRES = {
    'dos_nuevas': 'servidor: detecta las solicitudes nuevas',
    'ya_avisadas': 'servidor: una solicitud ya avisada no se vuelve a avisar',
    'se_olvida': 'servidor: al aprobarla o rechazarla se olvida',
    'reenviada': 'servidor: si la rechazan y la vuelve a mandar, avisa otra vez',
    'texto_una': 'texto: «Nueva solicitud de organizador · nombre · ciudad · mensaje»',
    'texto_varias': 'texto: varias juntas en un solo aviso («A, B, C y 2 más»)',
    'texto_dos': 'texto: dos solicitudes («A y B»)',
    'solo_admins': 'solo a administradores vigentes y aparatos activados',
    'vuelta_un_solo_aviso_por_aparato': 'vuelta completa: un aviso por aparato con todas las nuevas',
    'vuelta_enlace_mis_eventos': 'vuelta completa: el aviso abre «Mis eventos» del mismo sitio',
    'vuelta_marca_antes_de_mandar': 'vuelta completa: guarda lo avisado antes de mandar (no repite si falla)',
    'vuelta_borra_aparato_viejo': 'vuelta completa: borra aparatos que ya no reciben avisos',
    'sin_aparatos_no_marca': 'sin aparatos activados no marca nada (te llegan al activarlos)',
    'no_repite': 'la siguiente vuelta (5 min después) no repite',
    'worker_auth': 'worker: «Entrar con Google» desde el ícono se reenvía a Firebase',
}


def correr(nav, g):
    # ---------------- Parte 1: servidor
    node = shutil.which('node')
    if not node:
        g.caso('servidor: Node disponible para probar', False, 'no se encontró node')
    else:
        # Copias .mjs para que Node las lea como módulos
        srv = H.TMP / 'avisos-servidor.mjs'; srv.write_text((H.REPO / 'avisos-servidor.js').read_text(encoding='utf-8'), encoding='utf-8')
        wk = H.TMP / 'worker.mjs'; wk.write_text((H.REPO / 'worker.js').read_text(encoding='utf-8').replace("'./avisos-servidor.js'", "'./avisos-servidor.mjs'"), encoding='utf-8')
        prog = H.TMP / 'prueba-avisos.mjs'; prog.write_text(NODE, encoding='utf-8')
        out = subprocess.run([node, str(prog), srv.as_uri(), wk.as_uri()], capture_output=True, text=True, timeout=60)
        try:
            res = json.loads(out.stdout.strip().splitlines()[-1])
        except Exception:
            res = {}
            g.caso('servidor: el programa de prueba corrió', False, (out.stderr or out.stdout)[-300:])
        for k, nombre in NOMBRES.items():
            g.caso(nombre, res.get(k) is True, res.get(k))

    # ---------------- Parte 2: navegador
    seed = H.seed_base()
    # Persona sin permiso: no ve la tarjeta
    ctx, pg, e1 = H.abrir(nav, seed, '#/mis-eventos', usuario=H.NUEVO)
    g.caso('quien no es administrador no ve la tarjeta de avisos', pg.locator('[data-avisos-admin]').count() == 0)
    ctx.close()
    # Organizadora: tampoco
    ctx, pg, e2 = H.abrir(nav, seed, '#/mis-eventos', usuario=H.ANA)
    g.caso('una organizadora tampoco la ve', pg.locator('[data-avisos-admin]').count() == 0)
    ctx.close()

    # Administrador, sin clave configurada
    ctx = H.nuevo_contexto(nav); pg = ctx.new_page(); e3 = []
    pg.on('pageerror', lambda e: e3.append(str(e)))
    pg.goto(H.url(H.armar_pagina(seed=seed, nombre='p_avisos.html', extra_head=SIMULAR_AVISOS), '#/mis-eventos'))
    pg.evaluate('(u) => window.__setUser(u)', H.ADMIN); pg.wait_for_timeout(300)
    g.caso('administrador: sin la clave de avisos dice «todavía no están configurados»', 'todavía no están configurados' in pg.inner_text('[data-avisos-admin]'))
    # Con clave: activar
    pg.evaluate("LIGAS_CONFIG.vapidKey = 'clave-de-prueba'; dibujar('ruta')"); pg.wait_for_timeout(100)
    g.caso('administrador: ve «Activar avisos en este aparato»', pg.is_visible('text=Activar avisos en este aparato'))
    pg.click('text=Activar avisos en este aparato'); pg.wait_for_timeout(300)
    st = pg.evaluate('window.__store().avisosAdmin || {}')
    ap = list((st.get(H.ADMIN['uid']) or {}).values())
    g.caso('al activar se guarda el código del aparato (sin correo)', len(ap) == 1 and ap[0].get('token') == 'token-aparato-1' and ap[0].get('tipo') == 'pc' and '@' not in json.dumps(ap), (st, pg.evaluate('window.__denegadas')))
    g.caso('la tarjeta cambia a «ACTIVADOS AQUÍ» con «Mandarme un aviso de prueba»', 'ACTIVADOS AQUÍ' in pg.inner_text('[data-avisos-admin]') and pg.is_visible('text=Mandarme un aviso de prueba'))
    if H.HAY_REGLAS:
        r = pg.evaluate("db.ref('avisosAdmin/ana/x').set({token:'t'}).then(()=>'ok').catch(()=>'bloqueada')")
        g.caso('REGLAS: nadie escribe aparatos en nombre de otro', r == 'bloqueada', r)
    # Al volver a abrir, recuerda que este aparato ya tiene avisos
    pg.evaluate("window.__setUser(null)"); pg.wait_for_timeout(150)
    pg.evaluate("(u) => window.__setUser(Object.assign({ getIdToken: () => Promise.resolve('sesion-admin') }, u))", H.ADMIN); pg.wait_for_timeout(300)
    g.caso('al volver a entrar, recuerda que este aparato ya tiene avisos', 'ACTIVADOS AQUÍ' in pg.inner_text('[data-avisos-admin]'))
    # Prueba
    pg.click('text=Mandarme un aviso de prueba'); pg.wait_for_timeout(200)
    f = pg.evaluate('window.__fetches')
    g.caso('«Mandarme un aviso de prueba» llama a /api/aviso-prueba con la sesión', any(x[0] == '/api/aviso-prueba' for x in f), f)
    # Desactivar (dos toques)
    b = pg.locator('[data-avisos-admin] button', has_text='Desactivar'); b.click(); pg.wait_for_timeout(50)
    pg.locator('[data-avisos-admin] button', has_text='Toca otra vez').click(); pg.wait_for_timeout(300)
    st = pg.evaluate('window.__store().avisosAdmin || {}')
    g.caso('al desactivar se borra el aparato y vuelve «DESACTIVADOS AQUÍ»', not st.get(H.ADMIN['uid']) and 'DESACTIVADOS AQUÍ' in pg.inner_text('[data-avisos-admin]'), st)
    # Permiso negado
    pg.evaluate("window.__permiso = 'denied'; Notification.permission = 'default'")
    pg.click('text=Activar avisos en este aparato'); pg.wait_for_timeout(200)
    g.caso('si no da permiso, explica cómo darlo', pg.is_visible('#avisosNoDisponible'))
    g.caso('sin desborde horizontal a 390 px', H.sin_desborde(pg))
    ctx.close()

    # Al salir con avisos activos, se quitan de este aparato
    ctx = H.nuevo_contexto(nav); pg = ctx.new_page(); e4 = []
    pg.on('pageerror', lambda e: e4.append(str(e)))
    pg.goto(H.url(H.armar_pagina(seed=seed, nombre='p_avisos2.html', extra_head=SIMULAR_AVISOS), '#/mis-eventos'))
    pg.evaluate('(u) => window.__setUser(u)', H.ADMIN); pg.wait_for_timeout(300)
    pg.evaluate("LIGAS_CONFIG.vapidKey = 'clave-de-prueba'; dibujar('ruta')")
    pg.click('text=Activar avisos en este aparato'); pg.wait_for_timeout(300)
    pg.click('#barraSesion >> text=Salir'); pg.wait_for_timeout(300)
    st = pg.evaluate('window.__store().avisosAdmin || {}')
    g.caso('al «Salir» se quitan los avisos de esta cuenta en este aparato', not st.get(H.ADMIN['uid']), st)
    ctx.close()

    # iPhone en Safari (sin instalar): guía para agregar a la pantalla de inicio
    ctx = H.nuevo_contexto(nav, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
    pg = ctx.new_page(); e5 = []
    pg.on('pageerror', lambda e: e5.append(str(e)))
    pg.goto(H.url(H.armar_pagina(seed=seed, nombre='p_avisos3.html', extra_head=SIMULAR_AVISOS), '#/mis-eventos'))
    pg.evaluate('(u) => window.__setUser(u)', H.ADMIN); pg.wait_for_timeout(300)
    pg.evaluate("LIGAS_CONFIG.vapidKey = 'clave-de-prueba'; dibujar('ruta')")
    g.caso('iPhone en Safari: avisa que primero hay que agregar Ligas a la pantalla de inicio', 'pantalla de inicio' in pg.inner_text('[data-avisos-admin]'))
    pg.click('text=Activar avisos en este aparato'); pg.wait_for_timeout(200)
    t = pg.inner_text('#avisosGuiaIPhone') if pg.is_visible('#avisosGuiaIPhone') else ''
    g.caso('iPhone en Safari: al tocar «Activar» sale la guía de 4 pasos', 'Agregar a pantalla de inicio' in t and 'Abre Ligas desde el ícono' in t, t[:200])
    g.caso('iPhone en Safari: no se guarda nada todavía', not pg.evaluate('window.__store().avisosAdmin'))
    ctx.close()

    # Página: manifiesto para instalarla
    html = (H.REPO / 'index.html').read_text(encoding='utf-8')
    man = json.loads((H.REPO / 'manifest.webmanifest').read_text(encoding='utf-8'))
    g.caso('la página se puede instalar (manifiesto «Ligas», pantalla completa)', 'rel="manifest"' in html and man.get('short_name') == 'Ligas' and man.get('display') == 'standalone')
    pub = (H.REPO / 'cloudflare-publicar.sh').read_text(encoding='utf-8')
    g.caso('el código del servidor no se publica como parte del sitio', 'worker.js' in pub and 'avisos-servidor.js' in pub)

    g.caso('sin errores de JavaScript', not (e1 + e2 + e3 + e4 + e5), e1 + e2 + e3 + e4 + e5)
