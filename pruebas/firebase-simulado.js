// =====================================================================
// Firebase SIMULADO (en memoria) para probar Ligas sin red.
// Si las pruebas cargan las reglas (window.__REGLAS__ + window.__SIMULAR__),
// cada lectura y escritura pasa por ellas, igual que en Firebase.
// Controles: window.__SEED__, __store(), __writes, __setUser(u), __NEXT_USER__,
//            __denegadas (escrituras rechazadas por las reglas)
// =====================================================================
(function () {
  const TS = { '.sv': 'timestamp' };
  let store = window.__SEED__ || {};
  let clock = Date.now();
  const listeners = [];
  window.__writes = []; window.__denegadas = [];
  function split(p) { return (p || '').split('/').filter(Boolean); }
  function getAt(p) { let n = store; for (const k of split(p)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : n; }
  function clone(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  function resolve(v) {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return ++clock;
      const o = {}; for (const k of Object.keys(v)) { const r = resolve(v[k]); if (r !== null && r !== undefined) o[k] = r; } return o;
    }
    return v;
  }
  function setAt(p, v) {
    const ks = split(p); if (!ks.length) { store = v || {}; return; }
    let n = store; for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] !== 'object') n[ks[i]] = {}; n = n[ks[i]]; }
    const last = ks[ks.length - 1];
    if (v === null || v === undefined || (typeof v === 'object' && !Object.keys(v).length)) delete n[last]; else n[last] = v;
    // Como Firebase: un nodo que se queda sin hijos deja de existir
    for (let i = ks.length - 1; i > 0; i--) {
      const padre = getAt(ks.slice(0, i).join('/'));
      if (padre && typeof padre === 'object' && !Object.keys(padre).length) setAt(ks.slice(0, i).join('/'), null); else break;
    }
  }
  function uidActual() { return authObj.currentUser ? authObj.currentUser.uid : null; }
  function permitido(op) {
    if (!window.__REGLAS__ || !window.__SIMULAR__) return { permitido: true };
    return window.__SIMULAR__(window.__REGLAS__, store, Object.assign({ uid: uidActual(), now: clock + 1 }, op));
  }
  function notify() { listeners.forEach(l => { if (permitido({ tipo: 'leer', ruta: l.path }).permitido) l.cb(snap(l.path)); }); }
  function snap(path) { const v = clone(getAt(path)); return { val: () => v, exists: () => v !== null, key: split(path).pop() }; }
  function ref(path = '') {
    return {
      key: split(path).pop() || null,
      child: (c) => ref(split(path).concat(split(c)).join('/')),
      get: () => { const r = permitido({ tipo: 'leer', ruta: '/' + path }); return r.permitido ? Promise.resolve(snap(path)) : Promise.reject(new Error('PERMISSION_DENIED')); },
      on: (ev, cb, err) => {
        const r = permitido({ tipo: 'leer', ruta: '/' + path });
        if (!r.permitido) { setTimeout(() => err && err(new Error('PERMISSION_DENIED')), 0); return; }
        listeners.push({ path, cb }); setTimeout(() => cb(snap(path)), 0);
      },
      update: (obj) => apply(Object.fromEntries(Object.entries(obj).map(([k, v]) => [split(path).concat(split(k)).join('/'), v]))),
      set: (v) => apply({ [path]: v }),
      remove: () => apply({ [path]: null })
    };
  }
  function apply(updates) {
    const resueltos = Object.fromEntries(Object.entries(updates).map(([p, v]) => [p, resolve(v)]));
    window.__writes.push(clone(resueltos));
    const r = permitido({ tipo: 'actualizar', ruta: '/', valores: resueltos });
    if (!r.permitido) { window.__denegadas.push({ cambios: clone(resueltos), motivo: r.motivo }); return Promise.reject(new Error('PERMISSION_DENIED: ' + r.motivo)); }
    Object.entries(resueltos).forEach(([p, v]) => setAt(p, v));
    setTimeout(notify, 0);
    return Promise.resolve();
  }
  const authListeners = [];
  const authObj = {
    currentUser: null,
    onAuthStateChanged: (cb) => { authListeners.push(cb); setTimeout(() => cb(authObj.currentUser), 0); },
    signInWithPopup: () => { authObj.currentUser = window.__NEXT_USER__ || { uid: 'ana', displayName: 'Ana López' }; authListeners.forEach(cb => cb(authObj.currentUser)); return Promise.resolve({ user: authObj.currentUser }); },
    signOut: () => { authObj.currentUser = null; authListeners.forEach(cb => cb(null)); return Promise.resolve(); }
  };
  window.__setUser = (u) => { authObj.currentUser = u; authListeners.forEach(cb => cb(u)); };
  window.__store = () => store;
  function GoogleAuthProvider() { this.setCustomParameters = () => {}; }
  const authFn = () => authObj; authFn.GoogleAuthProvider = GoogleAuthProvider;
  const dbFn = () => ({ ref });
  dbFn.ServerValue = { TIMESTAMP: TS };
  window.firebase = {
    initializeApp: () => {},
    appCheck: () => ({ activate: () => { if (!document.body) throw new TypeError("Cannot read properties of null (reading 'appendChild')"); window.__appCheckActive = true; } }),
    database: dbFn,
    auth: authFn
  };
  window.firebase.appCheck.ReCaptchaEnterpriseProvider = function () {};
})();
