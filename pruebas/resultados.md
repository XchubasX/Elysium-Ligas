# Resultados de las pruebas

**❌ 12 FALLA(S)** — 419 de 431 casos pasaron.

- Fecha: 27/10/2026 13:55 (hora de Ciudad de México)
- Versión probada: `9bbe1d0` + cambios aún sin guardar
- Duración: 102 s
- Grupos corridos: todos
- Cómo se prueba: navegador automatizado con Firebase simulado (no toca datos reales). **Sin reglas** (no se encontró la carpeta de reglas). No sustituye la revisión en el sitio de pruebas: estilos y servicios de Google reales solo se ven ahí.

## Qué falló

| Grupo | Caso | Detalle |
|---|---|---|
| Portada y página pública de la liga | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Calendario de jornadas (organizador) | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Jugadores de la liga | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Ajustes, hazañas, archivar y borrar | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Equipo: ayudantes por invitación | Ana ve la pestaña Equipo con sus ayudantes Beto y Carla | ← Ligas y torneos Liga A Organizas tú  Sin país  100% CASUAL · NO SANCIONADOS POR VEKN TablaCalendarioHazañasJugadoresEquipoAjustes OrganizadorORGANIZADOR Beto AYUDANTEQuitar + Invitar ayudante  Un ayudante puede: anotar jugadores, pasar lista, sortear mesas, capturar VP y hazañas, empezar y cerrar jornadas.  No puede: cambiar fechas, reglas ni ajustes, reabrir jornadas cerradas, ni invitar a otro |
| Equipo: ayudantes por invitación | el mismo enlace ya no sirve para otra persona |  |
| Equipo: ayudantes por invitación | el grupo terminó sin caerse | KeyError: 'invitaciones' |
| Compartir por WhatsApp y descargar Excel | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Torneos de un día | fecha 5 dic: el torneo de ese día y las ligas que se juegan esas fechas (A, B, D) | sáb 5 dic · 15:30TORNEO Torneo de Invierno Monterrey, México · sáb 5 dic · 15:30 · 2 rondas + final |
| Fechas de la liga: validaciones | el grupo terminó sin caerse | KeyError: 'jornadas' |
| País y ciudad obligatorios | el grupo terminó sin caerse | KeyError: 'liga-b' |

## Resumen por grupo

| # | Grupo | Casos | Resultado |
|---|---|---|---|
| 1 | Cálculos: GW, VP y orden de la tabla | 14 | ✅ |
| 2 | Portada y página pública de la liga | 1 | ❌ 1 falla(s) |
| 3 | Sesión, roles y Mis eventos | 16 | ✅ |
| 4 | Crear liga | 16 | ✅ |
| 5 | Calendario de jornadas (organizador) | 1 | ❌ 1 falla(s) |
| 6 | Jugadores de la liga | 1 | ❌ 1 falla(s) |
| 7 | Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar | 1 | ❌ 1 falla(s) |
| 8 | Ajustes, hazañas, archivar y borrar | 1 | ❌ 1 falla(s) |
| 9 | Equipo: ayudantes por invitación | 18 | ❌ 3 falla(s) |
| 10 | Compartir por WhatsApp y descargar Excel | 1 | ❌ 1 falla(s) |
| 11 | Torneos de un día | 41 | ❌ 1 falla(s) |
| 12 | Enlaces del sitio de pruebas y detalles de diseño | 10 | ✅ |
| 13 | Fechas de la liga: validaciones | 1 | ❌ 1 falla(s) |
| 14 | Solicitudes para organizar, guía y aviso «100% casual» | 22 | ✅ |
| 15 | País y ciudad obligatorios | 1 | ❌ 1 falla(s) |
| 16 | Fecha y hora en iPhone: pista visible en campos vacíos | 16 | ✅ |
| 17 | Avisos al celular de solicitudes para organizar | 33 | ✅ |
| 18 | Eventos En línea: modalidad, plataforma y hora de cada quien | 35 | ✅ |
| 19 | Inscripciones con Google y pegar lista de jugadores | 39 | ✅ |
| 20 | Ligas de partidas libres (en línea) | 79 | ✅ |
| 21 | Organizadores: lista, quitar permiso y transferir (superusuario) | 26 | ✅ |
| 22 | Historial de cambios (solo superusuario) | 26 | ✅ |
| 23 | Revisión de Archon: mesas que no cuadran, TP y lugares | 32 | ✅ |

## Todos los casos

### 1. Cálculos: GW, VP y orden de la tabla

| # | Caso | Resultado |
|---|---|---|
| 1 | 3 VP único máximo → gana GW | ✅ |
| 2 | empate en el máximo (2 y 2) → nadie gana GW | ✅ |
| 3 | máximo de 1.5 VP (menos de 2) → nadie gana GW | ✅ |
| 4 | exactamente 2 VP y único → gana GW | ✅ |
| 5 | medios VP: empate 2.5 y 2.5 → nadie gana GW | ✅ |
| 6 | suma de dos jornadas cerradas, varias rondas | ✅ |
| 7 | a igualdad de GW, ordena por VP (Beto 5, Ana 4, Caro 3) | ✅ |
| 8 | la jornada abierta NO cuenta (Caro no suma sus 5 VP) | ✅ |
| 9 | hazañas como mención: NO desempatan (orden alfabético: Alfa, Zeta) | ✅ |
| 10 | hazañas como desempate: Zeta pasa arriba por su hazaña | ✅ |
| 11 | las hazañas nunca suman VP ni GW | ✅ |
| 12 | próxima jornada: la más cercana sin contar cerradas ni canceladas | ✅ |
| 13 | conteo «Jornada X de Y» ignora canceladas | ✅ |
| 14 | la página abrió sin errores | ✅ |

### 2. Portada y página pública de la liga

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 3. Sesión, roles y Mis eventos

| # | Caso | Resultado |
|---|---|---|
| 1 | al entrar, el encabezado muestra «Ana» y «Organizador» | ✅ |
| 2 | Mis eventos de Ana: Liga A (suya) y botón «+ Nueva liga» | ✅ |
| 3 | Ana no ve Liga B ni Liga D (no son suyas) | ✅ |
| 4 | a un organizador no se le ofrece «Quiero organizar» | ✅ |
| 5 | en su liga, Ana ve la pastilla «Organizas tú» | ✅ |
| 6 | «Salir» regresa el botón «Entrar con Google» | ✅ |
| 7 | Beto (ayudante de Liga A) la ve en Mis eventos con la etiqueta AYUDANTE | ✅ |
| 8 | Beto no tiene botón «+ Nueva liga» | ✅ |
| 9 | en Liga A, Beto ve la pastilla «Ayudante» | ✅ |
| 10 | cuenta nueva: «Todavía no organizas ni ayudas» | ✅ |
| 11 | cuenta nueva: se le ofrece el formulario «¿Quieres organizar…?» | ✅ |
| 12 | sin desborde horizontal a 390 px | ✅ |
| 13 | Dora (dueña pero SIN permiso de organizadora) no ve «Organizas tú» | ✅ |
| 14 | el superusuario ve «Superusuario» en cualquier liga | ✅ |
| 15 | sin sesión, Mis eventos pide entrar con Google | ✅ |
| 16 | las páginas abrieron sin errores | ✅ |

### 4. Crear liga

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana (organizadora) ve el formulario «Nueva liga» | ✅ |
| 2 | el nombre del organizador viene lleno con «Ana» | ✅ |
| 3 | el enlace se sugiere solo: liga-cdmx-temporada-1 | ✅ |
| 4 | sin nombre → «Escribe el nombre de la liga.» | ✅ |
| 5 | enlace inválido → aviso de minúsculas, números o guiones | ✅ |
| 6 | enlace ya usado (liga-a) → «Ese enlace ya lo usa otra liga» | ✅ |
| 7 | fin antes del inicio → aviso | ✅ |
| 8 | se crea la liga y abre su página | ✅ |
| 9 | se guardó con dueña Ana, tipo liga y fecha de creación | ✅ |
| 10 | se guardaron fechas, ciudad, hazañas=desempate y reglas | ✅ |
| 11 | fue UNA sola escritura y las reglas la aceptaron | ✅ |
| 12 | aparece el aviso «¡Liga creada!» | ✅ |
| 13 | la nueva liga aparece en la portada | ✅ |
| 14 | sin desborde horizontal a 390 px | ✅ |
| 15 | cuenta sin permiso: no hay formulario, dice que falta permiso de organizador | ✅ |
| 16 | las páginas abrieron sin errores | ✅ |

### 5. Calendario de jornadas (organizador)

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 6. Jugadores de la liga

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 7. Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 8. Ajustes, hazañas, archivar y borrar

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 9. Equipo: ayudantes por invitación

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana ve la pestaña Equipo con sus ayudantes Beto y Carla | ❌ ← Ligas y torneos Liga A Organizas tú  Sin país  100% CASUAL · NO SANCIONADOS POR VEKN TablaCalendarioHazañasJugadoresEquipoAjustes OrganizadorORGANIZADOR Beto AYUDANTEQuitar + Invitar ayudante  Un ayudante puede: anotar jugadores, pasar lista, sortear mesas, capturar VP y hazañas, empezar y cerrar jornadas.  No puede: cambiar fechas, reglas ni ajustes, reabrir jornadas cerradas, ni invitar a otro |
| 2 | explica qué puede y qué no puede un ayudante | ✅ |
| 3 | crea una invitación con código largo y caducidad de 7 días | ✅ |
| 4 | muestra el enlace con su código | ✅ |
| 5 | «Enviar por WhatsApp» lleva el mensaje con el enlace | ✅ |
| 6 | aparece en «Invitaciones sin usar» (caduca en 7 días) | ✅ |
| 7 | «Cancelar» borra la invitación | ✅ |
| 8 | las reglas aceptaron todo lo de Ana | ✅ |
| 9 | sin sesión: dice quién invita a qué liga y pide entrar con Google | ✅ |
| 10 | aclara que no se guarda el correo | ✅ |
| 11 | al entrar ofrece «Aceptar y ser ayudante» | ✅ |
| 12 | queda como ayudante con su primer nombre (Pepe) | ✅ |
| 13 | la invitación se borró (un solo uso) | ✅ |
| 14 | dice «¡Listo! Ya eres ayudante» | ✅ |
| 15 | en «Mis eventos» le aparece Liga A como AYUDANTE | ✅ |
| 16 | las reglas aceptaron la aceptación | ✅ |
| 17 | el mismo enlace ya no sirve para otra persona | ❌  |
| 18 | el grupo terminó sin caerse | ❌ KeyError: 'invitaciones' |

### 10. Compartir por WhatsApp y descargar Excel

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 11. Torneos de un día

| # | Caso | Resultado |
|---|---|---|
| 1 | TP mesa de 5 con empates promediados: 60 · 42 · 42 · 18 · 18 | ✅ |
| 2 | TP mesa de 4: 60 · 36 · 36 · 12 (sin el 36 del tercer lugar) | ✅ |
| 3 | empate en GW y VP: desempata el TP (B quedó 1º en su mesa y va arriba de A) | ✅ |
| 4 | «Mis eventos» tiene «+ Nueva liga» y «+ Nuevo torneo» | ✅ |
| 5 | el formulario de torneo pide fecha, hora, rondas y final | ✅ |
| 6 | solo se puede elegir 2 o 3 rondas | ✅ |
| 7 | sin fecha → «Elige la fecha del torneo.» | ✅ |
| 8 | se crea como torneo: fecha, hora, 2 rondas, con final y su día j1 pendiente | ✅ |
| 9 | abre la página del torneo con pestañas Clasificación y Mesas | ✅ |
| 10 | muestra «2 rondas + final» | ✅ |
| 11 | la tarjeta del torneo trae la etiqueta TORNEO y «2 rondas + final» | ✅ |
| 12 | filtro «Torneos»: solo el torneo | ✅ |
| 13 | filtro «Ligas»: sin el torneo | ✅ |
| 14 | filtro de ciudad «Monterrey» deja solo el torneo de esa ciudad | ✅ |
| 15 | sin coincidencias: «Ningún evento coincide» | ✅ |
| 16 | fecha 5 dic: el torneo de ese día y las ligas que se juegan esas fechas (A, B, D) | ❌ sáb 5 dic · 15:30TORNEO Torneo de Invierno Monterrey, México · sáb 5 dic · 15:30 · 2 rondas + final |
| 17 | fecha sin eventos: «Ningún evento coincide» | ✅ |
| 18 | sin desborde horizontal a 390 px | ✅ |
| 19 | Beto empieza el torneo | ✅ |
| 20 | pase de lista: 10 presentes | ✅ |
| 21 | con 2 rondas planeadas no ofrece una tercera | ✅ |
| 22 | aparece «Pasar a la final (top 5)» | ✅ |
| 23 | la final tiene a los 5 primeros de la clasificación, con su lugar | ✅ |
| 24 | las rondas quedan cerradas a cambios (sin selectores de VP de rondas) | ✅ |
| 25 | la final NO tiene selección de asientos ni orden de elección | ✅ |
| 26 | la final lista a los 5 por su lugar (1º a 5º) | ✅ |
| 27 | aparecen de una vez los 5 selectores de VP de la final | ✅ |
| 28 | Beto termina el torneo | ✅ |
| 29 | las reglas aceptaron todo lo de Beto | ✅ |
| 30 | Clasificación pública: «🏆 CAMPEÓN» con quien tuvo más VP en la final (2 VP) | ✅ |
| 31 | la tabla trae la columna «Final» y 10 jugadores | ✅ |
| 32 | no muestra TP ni explicaciones de puntos | ✅ |
| 33 | el público ve la final y las 2 rondas sin controles | ✅ |
| 34 | Excel del torneo: hojas Clasificación, Mesas y Hazañas | ✅ |
| 35 | Excel: 20 filas de rondas + 5 de la final | ✅ |
| 36 | WhatsApp: «campeón: Iván» | ✅ |
| 37 | sin final: tras la ronda 1 no se puede terminar todavía | ✅ |
| 38 | sin final: tras la última ronda aparece «Terminar torneo» (sin «Pasar a la final») | ✅ |
| 39 | cambiar la fecha del torneo también cambia la de su día | ✅ |
| 40 | sin desborde horizontal a 390 px | ✅ |
| 41 | las páginas abrieron sin errores | ✅ |

### 12. Enlaces del sitio de pruebas y detalles de diseño

| # | Caso | Resultado |
|---|---|---|
| 1 | en pruebas, «las mesas» lleva a uat.eternalschedule.com | ✅ |
| 2 | y dice «uat.eternalschedule.com» | ✅ |
| 3 | no queda ningún enlace a producción en la página | ✅ |
| 4 | la página abrió sin errores | ✅ |
| 5 | fechas y horas usan el esquema oscuro (ícono de calendario/reloj claro y visible) | ✅ |
| 6 | ligas.eternalschedule.com → base «elysium-ligas», mesas en eternalschedule.com sin franja de pruebas | ✅ |
| 7 | elysium-ligas.chubas.workers.dev → base «elysium-ligas», mesas en eternalschedule.com sin franja de pruebas | ✅ |
| 8 | uat-ligas.eternalschedule.com → base «elysium-ligas-uat», mesas en uat.eternalschedule.com y franja de pruebas | ✅ |
| 9 | elysium-ligas-uat.chubas.workers.dev → base «elysium-ligas-uat», mesas en uat.eternalschedule.com y franja de pruebas | ✅ |
| 10 | localhost → base «elysium-ligas-uat», mesas en uat.eternalschedule.com y franja de pruebas | ✅ |

### 13. Fechas de la liga: validaciones

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 14. Solicitudes para organizar, guía y aviso «100% casual»

| # | Caso | Resultado |
|---|---|---|
| 1 | portada: etiqueta «100% CASUAL · NO SANCIONADOS POR VEKN» | ✅ |
| 2 | portada: enlace «¿Quieres organizar? Cómo funciona» | ✅ |
| 3 | pie: dice que son 100% casuales y no sancionados por VEKN | ✅ |
| 4 | página de la liga: también trae la etiqueta | ✅ |
| 5 | guía «Cómo funciona»: 5 pasos y preguntas frecuentes | ✅ |
| 6 | la guía invita a «Quiero organizar» a quien no organiza | ✅ |
| 7 | sin desborde horizontal a 390 px | ✅ |
| 8 | el formulario trae su primer nombre | ✅ |
| 9 | se guarda su solicitud (nombre, ciudad, mensaje y fecha), sin correo | ✅ |
| 10 | cambia a «✓ Solicitud enviada» | ✅ |
| 11 | en vivo: al aprobarlo, sin recargar le salen «+ Nueva liga» y «+ Nuevo torneo» | ✅ |
| 12 | en vivo: le avisa «¡Ya te aprobaron!» | ✅ |
| 13 | en vivo: si la rechazan, vuelve a salir el formulario (sin botones de crear) | ✅ |
| 14 | al volver, sigue diciendo «Solicitud enviada» | ✅ |
| 15 | el superusuario ve un contador «1» junto a «Mis eventos» | ✅ |
| 16 | «Solicitudes para organizar»: Pepe · Guadalajara con su mensaje | ✅ |
| 17 | Aprobar: queda como organizador y se borra la solicitud | ✅ |
| 18 | ya no hay solicitudes pendientes (desaparece el bloque y el contador) | ✅ |
| 19 | las reglas aceptaron todo | ✅ |
| 20 | Pepe ya ve «+ Nueva liga» y «+ Nuevo torneo», sin formulario | ✅ |
| 21 | Rechazar: borra la solicitud y NO da permiso | ✅ |
| 22 | las páginas abrieron sin errores | ✅ |

### 15. País y ciudad obligatorios

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'liga-b' |

### 16. Fecha y hora en iPhone: pista visible en campos vacíos

| # | Caso | Resultado |
|---|---|---|
| 1 | iPhone: «Fecha» vacía muestra «Elegir fecha» y el ícono de calendario | ✅ |
| 2 | iPhone: «Hora» vacía muestra «Elegir hora» y el ícono de reloj | ✅ |
| 3 | al elegir la fecha, la pista se oculta y queda solo el ícono | ✅ |
| 4 | la hora sigue con su pista mientras esté vacía | ✅ |
| 5 | la pista no estorba al tocar: el toque llega al campo | ✅ |
| 6 | la pista no se lee dos veces con lector de pantalla | ✅ |
| 7 | el formulario sigue enviando el valor elegido | ✅ |
| 8 | sin desborde horizontal a 390 px | ✅ |
| 9 | al redibujar no se duplica la pista | ✅ |
| 10 | agregar jornada en iPhone: «Fecha» y «Hora» caben dentro de la tarjeta | ✅ |
| 11 | agregar jornada en iPhone: los dos campos miden lo mismo | ✅ |
| 12 | agregar jornada en iPhone: con la pista «Elegir fecha» y «Elegir hora» | ✅ |
| 13 | portada en iPhone: el filtro de fecha también muestra «Elegir fecha» | ✅ |
| 14 | Chrome en iPhone: también muestra «Elegir fecha» y «Elegir hora» | ✅ |
| 15 | computadora: sin pista (el navegador ya muestra su ícono y dd/mm/aaaa) | ✅ |
| 16 | sin errores de JavaScript | ✅ |

### 17. Avisos al celular de solicitudes para organizar

| # | Caso | Resultado |
|---|---|---|
| 1 | servidor: detecta las solicitudes nuevas | ✅ |
| 2 | servidor: una solicitud ya avisada no se vuelve a avisar | ✅ |
| 3 | servidor: al aprobarla o rechazarla se olvida | ✅ |
| 4 | servidor: si la rechazan y la vuelve a mandar, avisa otra vez | ✅ |
| 5 | texto: «Nueva solicitud de organizador · nombre · ciudad · mensaje» | ✅ |
| 6 | texto: varias juntas en un solo aviso («A, B, C y 2 más») | ✅ |
| 7 | texto: dos solicitudes («A y B») | ✅ |
| 8 | solo a administradores vigentes y aparatos activados | ✅ |
| 9 | vuelta completa: un aviso por aparato con todas las nuevas | ✅ |
| 10 | vuelta completa: el aviso abre «Mis eventos» del mismo sitio | ✅ |
| 11 | vuelta completa: guarda lo avisado antes de mandar (no repite si falla) | ✅ |
| 12 | vuelta completa: borra aparatos que ya no reciben avisos | ✅ |
| 13 | sin aparatos activados no marca nada (te llegan al activarlos) | ✅ |
| 14 | la siguiente vuelta (5 min después) no repite | ✅ |
| 15 | worker: «Entrar con Google» desde el ícono se reenvía a Firebase | ✅ |
| 16 | quien no es administrador no ve la tarjeta de avisos | ✅ |
| 17 | una organizadora tampoco la ve | ✅ |
| 18 | administrador: sin la clave de avisos dice «todavía no están configurados» | ✅ |
| 19 | administrador: ve «Activar avisos en este aparato» | ✅ |
| 20 | al activar se guarda el código del aparato (sin correo) | ✅ |
| 21 | la tarjeta cambia a «ACTIVADOS AQUÍ» con «Mandarme un aviso de prueba» | ✅ |
| 22 | al volver a entrar, recuerda que este aparato ya tiene avisos | ✅ |
| 23 | «Mandarme un aviso de prueba» llama a /api/aviso-prueba con la sesión | ✅ |
| 24 | al desactivar se borra el aparato y vuelve «DESACTIVADOS AQUÍ» | ✅ |
| 25 | si no da permiso, explica cómo darlo | ✅ |
| 26 | sin desborde horizontal a 390 px | ✅ |
| 27 | al «Salir» se quitan los avisos de esta cuenta en este aparato | ✅ |
| 28 | iPhone en Safari: avisa que primero hay que agregar Ligas a la pantalla de inicio | ✅ |
| 29 | iPhone en Safari: al tocar «Activar» sale la guía de 4 pasos | ✅ |
| 30 | iPhone en Safari: no se guarda nada todavía | ✅ |
| 31 | la página se puede instalar (manifiesto «Ligas», pantalla completa) | ✅ |
| 32 | el código del servidor no se publica como parte del sitio | ✅ |
| 33 | sin errores de JavaScript | ✅ |

### 18. Eventos En línea: modalidad, plataforma y hora de cada quien

| # | Caso | Resultado |
|---|---|---|
| 1 | crear: hay selector «Presencial / En línea», con Presencial marcado | ✅ |
| 2 | crear: en Presencial se ven país y ciudad | ✅ |
| 3 | crear: al elegir En línea desaparecen país y ciudad | ✅ |
| 4 | crear: en En línea sale «Plataforma (opcional)» y no hay selector de zona | ✅ |
| 5 | crear: dice la zona detectada «Santiago de Chile (detectada de tu aparato)» | ✅ |
| 6 | crear: sin desborde horizontal a 390 px | ✅ |
| 7 | se crea sin país ni ciudad, con modalidad, plataforma y zona | ✅ |
| 8 | su página dice «🌐 En línea · Lackey» | ✅ |
| 9 | torneo en línea sin plataforma: se crea sin ese campo | ✅ |
| 10 | presencial sin ciudad → «Elige el país y escribe la ciudad.» | ✅ |
| 11 | presencial: se guarda igual que antes (país y ciudad, sin modalidad) | ✅ |
| 12 | portada en CDMX (misma zona): «sáb 7 nov · 20:00» sin «(tu hora)» | ✅ |
| 13 | portada: la tarjeta dice «🌐 En línea · Discord» | ✅ |
| 14 | en CDMX no sale la nota de zona horaria | ✅ |
| 15 | portada en Madrid: el torneo sale a «dom 8 nov · 03:00 (tu hora)» | ✅ |
| 16 | portada en Madrid: próxima jornada de la liga «dom 15 nov · 02:30 (tu hora)» | ✅ |
| 17 | portada en Madrid: la liga presencial no cambia | ✅ |
| 18 | página del torneo en Madrid: nota «Los horarios se muestran en tu hora… hora de Ciudad de México» | ✅ |
| 19 | calendario en Madrid: «Jornada 1 · dom 15 nov · 02:30 (tu hora)» | ✅ |
| 20 | portada en Santiago de Chile: «sáb 7 nov · 23:00 (tu hora)» | ✅ |
| 21 | calendario del equipo: hora original «(hora de Ciudad de México)» aunque estés en Madrid | ✅ |
| 22 | al agregar jornada, el campo dice «Hora (opcional) · hora de Ciudad de México» | ✅ |
| 23 | filtro de país: incluye «🌐 En línea» | ✅ |
| 24 | filtro «🌐 En línea»: solo los eventos en línea | ✅ |
| 25 | filtro «🌐 En línea»: la ciudad queda desactivada | ✅ |
| 26 | filtro «México»: no incluye los eventos en línea | ✅ |
| 27 | ajustes de una liga en línea: En línea marcado, sin país ni ciudad | ✅ |
| 28 | ajustes: no sale el aviso «Este evento no tiene país» | ✅ |
| 29 | ajustes: se puede poner o cambiar la plataforma | ✅ |
| 30 | ajustes desde Madrid: la liga conserva su zona (Ciudad de México) | ✅ |
| 31 | pasar a Presencial sin ciudad → pide país y ciudad | ✅ |
| 32 | pasar a Presencial: guarda país y ciudad y borra modalidad, zona y plataforma | ✅ |
| 33 | pasar a En línea: borra país y ciudad y guarda la zona del aparato (Madrid) | ✅ |
| 34 | aviso de cambio de fecha: «a las 19:30 (hora de Ciudad de México)» | ✅ |
| 35 | sin errores de JavaScript | ✅ |

### 19. Inscripciones con Google y pegar lista de jugadores

| # | Caso | Resultado |
|---|---|---|
| 1 | Jugadores: tarjeta «📝 Inscripciones» CERRADAS con «Abrir inscripciones» | ✅ |
| 2 | al abrirlas se guarda inscripciones: «abiertas» | ✅ |
| 3 | abiertas: botones «Compartir por WhatsApp» y «Copiar enlace» | ✅ |
| 4 | el mensaje de WhatsApp trae el enlace de la liga | ✅ |
| 5 | Jugadores: hay «Pegar varios nombres» | ✅ |
| 6 | sin desborde horizontal a 390 px | ✅ |
| 7 | portada: la tarjeta dice «📝 Inscripciones abiertas» | ✅ |
| 8 | sin sesión: «📝 Inscripciones abiertas» con botón «Inscribirme» | ✅ |
| 9 | al tocar «Inscribirme» entra con Google y sale el campo de nick | ✅ |
| 10 | el nick viene sugerido con su primer nombre («Pepe») | ✅ |
| 11 | se guarda su inscripción pendiente con nick y nombre de Google, sin correo | ✅ |
| 12 | cambia a «✓ Inscripción enviada como «Toni»» | ✅ |
| 13 | la página pública no muestra el nombre de Google | ✅ |
| 14 | recuerda el nick para la próxima liga | ✅ |
| 15 | en vivo: al aceptarlo dice «✅ Estás inscrito como «Toni»» | ✅ |
| 16 | en vivo: le avisa «¡Ya te aceptaron en la liga!» | ✅ |
| 17 | puede cancelar su inscripción pendiente (dos toques) | ✅ |
| 18 | aceptado pero ya no está en la liga: vuelve a salir el formulario | ✅ |
| 19 | y se reemplaza por una inscripción nueva pendiente | ✅ |
| 20 | inscripciones cerradas: no sale nada para inscribirse | ✅ |
| 21 | el equipo ve «Por aceptar» con nick y nombre de Google («Lalo · Eduardo Ruiz») | ✅ |
| 22 | nick repetido: pregunta «¿Es la misma persona?» para Toni | ✅ |
| 23 | «Aceptar todas»: entran Lalo y Mau como jugadores | ✅ |
| 24 | sus inscripciones quedan «aceptada» con su jugador | ✅ |
| 25 | «Aceptar todas» deja pendiente al del nick repetido | ✅ |
| 26 | «Sí, es el mismo»: se une al Toni que ya estaba (no se duplica) | ✅ |
| 27 | ya no quedan pendientes | ✅ |
| 28 | «No, es otra persona»: propone otro nick («Toni 2») | ✅ |
| 29 | se acepta como jugador nuevo «Toni Pepe» | ✅ |
| 30 | «Rechazar» (dos toques) borra la inscripción | ✅ |
| 31 | «Cerrar inscripciones» (dos toques) borra el campo | ✅ |
| 32 | ayudante: ve las pendientes, sin botón de abrir/cerrar | ✅ |
| 33 | ayudante: puede aceptar | ✅ |
| 34 | pegar lista: quita números y viñetas, salta vacíos y repetidos | ✅ |
| 35 | pegar lista: avisa «Se agregaron 3 jugadores (2 ya estaban)» | ✅ |
| 36 | guía: paso «Inscribe a los jugadores» con el enlace | ✅ |
| 37 | guía: «¿Los jugadores necesitan cuenta?» explica lo de Google | ✅ |
| 38 | guía: nueva pregunta «¿Se puede hacer una liga en línea?» | ✅ |
| 39 | sin errores de JavaScript | ✅ |

### 20. Ligas de partidas libres (en línea)

| # | Caso | Resultado |
|---|---|---|
| 1 | media de la liga = 1 VP por partida | ✅ |
| 2 | Carla: partidas, VP, rendimiento, participación, total y provisional como el documento | ✅ |
| 3 | Ana J: partidas, VP, rendimiento, participación, total y provisional como el documento | ✅ |
| 4 | Beto J: partidas, VP, rendimiento, participación, total y provisional como el documento | ✅ |
| 5 | orden: Carla, Ana J, Beto J, Toni | ✅ |
| 6 | Toni (12 partidas): participación 100 (tope) | ✅ |
| 7 | una mesa con 2 jugadores de la liga cuenta una partida para cada uno | ✅ |
| 8 | si nadie tiene VP (media 0), no hay división entre cero: rendimiento 100 | ✅ |
| 9 | invitados: «Pedro, Lucía y Toño» son 3 | ✅ |
| 10 | portada: «Partidas libres · en juego», 23 mesas y líder con puntos | ✅ |
| 11 | portada: dice «🌐 En línea · Lackey» | ✅ |
| 12 | pestañas públicas: Tabla y Mesas (sin Calendario ni Hazañas) | ✅ |
| 13 | cabecera: un jugador de la mesa la reporta completa | ✅ |
| 14 | tabla: «Clasificación provisional», media 1 VP y 23 mesas | ✅ |
| 15 | tabla: Carla 1.º con 1 partida, 5 VP, 200, 8.3, 142.5 y PROVISIONAL | ✅ |
| 16 | tabla: Beto J sin marca de provisional | ✅ |
| 17 | «¿Cómo se calcula?» explica 70/30, relleno de 3 partidas, 12 partidas y que cada mesa cuenta para todos | ✅ |
| 18 | WhatsApp: «clasificación provisional» y «Carla · 142.5 pts» | ✅ |
| 19 | Excel: hojas Clasificación (4 jugadores) y Mesas (23 renglones) | ✅ |
| 20 | sin desborde horizontal a 390 px | ✅ |
| 21 | pestaña Mesas pública: lista sin formulario ni botones de corregir | ✅ |
| 22 | cada mesa muestra jugadores con VP, invitados y la suma | ✅ |
| 23 | sin sesión: invita a entrar e inscribirse para reportar | ✅ |
| 24 | sin mesas: «Todavía no hay mesas reportadas» | ✅ |
| 25 | jugador inscrito: «Estás inscrito como «Toni»» con botón «🎲 Reportar mesa» | ✅ |
| 26 | formulario: explica que una sola persona reporta la mesa completa | ✅ |
| 27 | él mismo ya está marcado en la mesa y no se puede quitar | ✅ |
| 28 | VP de 0 a 5 en mesa de 5 | ✅ |
| 29 | cuenta en vivo: suma 7 de 5 y lugares 5 de 5 | ✅ |
| 30 | EL CASO DE LA PRUEBA: suma de 7 VP en mesa de 5 no deja guardar | ✅ |
| 31 | confirmación: fecha, mesa, cada jugador con sus VP e invitados | ✅ |
| 32 | confirmación: avisa que después no podrá cambiarla | ✅ |
| 33 | sin mesas parecidas: no avisa de repetida | ✅ |
| 34 | todavía no se guarda nada antes de confirmar | ✅ |
| 35 | «Volver a editar» conserva lo capturado | ✅ |
| 36 | se guarda UNA mesa con los 3 jugadores y sus VP, invitados, por y creada | ✅ |
| 37 | la mesa cuenta como partida para los 3 jugadores de la liga | ✅ |
| 38 | aparece en la lista sin botones de corregir para el jugador | ✅ |
| 39 | mismo día y 2 jugadores en común: avisa «¿Es una mesa repetida?» con los jugadores de esa mesa | ✅ |
| 40 | el aviso deja guardar («Es otra mesa: guardar») | ✅ |
| 41 | si es otra mesa, se guarda | ✅ |
| 42 | mismo día pero solo 1 jugador en común: no avisa de repetida | ✅ |
| 43 | más personas que lugares (2 + 3 invitados en mesa de 4): no deja seguir | ✅ |
| 44 | fecha antes del inicio: no deja seguir | ✅ |
| 45 | falta elegir VP de un jugador: dice de quién | ✅ |
| 46 | un jugador no puede reportar una mesa en la que no jugó | ✅ |
| 47 | cuenta no inscrita: no ve el formulario de reportar | ✅ |
| 48 | organizador: pestañas Tabla, Mesas, Jugadores, Equipo y Ajustes | ✅ |
| 49 | organizador: nadie viene marcado (puede reportar mesas que no jugó) | ✅ |
| 50 | organizador: la confirmación dice que después puede corregirla | ✅ |
| 51 | se guarda la mesa reportada por el organizador | ✅ |
| 52 | corregir: abre la mesa con sus datos | ✅ |
| 53 | corregir: cambia VP y jugadores, conserva quién la reportó y cuándo | ✅ |
| 54 | borrar (dos toques) quita la mesa | ✅ |
| 55 | no se puede quitar a un jugador que aparece en una mesa | ✅ |
| 56 | Ajustes: «Liga de partidas libres (no se puede cambiar)», sin hazañas | ✅ |
| 57 | Ajustes: «Presencial» deshabilitado (solo en línea) | ✅ |
| 58 | Ajustes: no deja mover el inicio si deja mesas fuera | ✅ |
| 59 | Ajustes: guardar no cambia formato, modalidad ni hazañas | ✅ |
| 60 | Cerrar temporada (dos toques) guarda temporada: «cerrada» | ✅ |
| 61 | tabla: «Clasificación definitiva · temporada cerrada» | ✅ |
| 62 | temporada cerrada: ya no hay formulario de reportar | ✅ |
| 63 | Reabrir temporada borra el campo | ✅ |
| 64 | ayudante: ve el formulario para reportar | ✅ |
| 65 | ayudante: no ve Corregir ni Borrar | ✅ |
| 66 | ayudante: la confirmación avisa que no habrá cambios | ✅ |
| 67 | ayudante: se guarda la mesa | ✅ |
| 68 | Equipo (partidas libres): el ayudante reporta mesas aunque no las haya jugado y no corrige | ✅ |
| 69 | Equipo (liga por jornadas): el ayudante sigue igual que antes | ✅ |
| 70 | crear: el formato no se ve si es presencial | ✅ |
| 71 | crear en línea: aparece «🎲 Partidas libres» | ✅ |
| 72 | al elegir partidas libres se ocultan las hazañas | ✅ |
| 73 | se crea con formato «libre», en línea y sin hazañas | ✅ |
| 74 | presencial: aunque se haya marcado «libre», se crea por jornadas | ✅ |
| 75 | torneo en línea: no ofrece partidas libres | ✅ |
| 76 | guía: «¿Qué es una liga de partidas libres?» explica la mesa completa | ✅ |
| 77 | guía: el ayudante reporta mesas en partidas libres | ✅ |
| 78 | Mis eventos: «Partidas libres · 23 mesas» | ✅ |
| 79 | sin errores de JavaScript | ✅ |

### 21. Organizadores: lista, quitar permiso y transferir (superusuario)

| # | Caso | Resultado |
|---|---|---|
| 1 | organizador normal: no ve «Organizadores» en Mis eventos | ✅ |
| 2 | organizador normal: #/organizadores dice que es solo para el superusuario | ✅ |
| 3 | superusuario: «👥 Organizadores (3)» en Mis eventos | ✅ |
| 4 | la página muestra también las solicitudes pendientes | ✅ |
| 5 | lista ordenada: nombre guardado (Carla Ruiz), el de sus ligas (Ana López) y el del superusuario | ✅ |
| 6 | Carla: ciudad, desde cuándo, 1 evento y su torneo con «Transferir» | ✅ |
| 7 | el superusuario no tiene botón para quitarse el permiso a sí mismo | ✅ |
| 8 | «Ligas y torneos sin organizador activo»: Liga Vieja | ✅ |
| 9 | sin desborde horizontal a 390 px | ✅ |
| 10 | cada organizador muestra su identificador abreviado y «Copiar identificador» | ✅ |
| 11 | explica dónde buscar el identificador (Authentication → Users) | ✅ |
| 12 | liga sin organizador: muestra el dueño anterior y su identificador | ✅ |
| 13 | «Copiar identificador» copia el identificador completo | ✅ |
| 14 | cambiar nombre: se guarda en organizadoresInfo | ✅ |
| 15 | cambiar nombre: no toca la página pública de sus ligas | ✅ |
| 16 | transferir: solo ofrece a otros organizadores (no al dueño actual) | ✅ |
| 17 | transferir: cambia el dueño y el nombre del organizador | ✅ |
| 18 | transferir: los ayudantes se quedan (Beto), y el nuevo dueño deja de ser ayudante | ✅ |
| 19 | la lista se actualiza: Carla ahora con 2 eventos | ✅ |
| 20 | Liga Vieja pasa a Ana y desaparece de «sin organizador» | ✅ |
| 21 | quitar permiso: se borra de organizadores y organizadoresInfo | ✅ |
| 22 | sus ligas y torneos se quedan como están (mismo dueño) | ✅ |
| 23 | ahora salen en «sin organizador activo» | ✅ |
| 24 | aprobar: guarda nombre, ciudad y fecha en organizadoresInfo | ✅ |
| 25 | Pepe aparece en la lista | ✅ |
| 26 | sin errores de JavaScript | ✅ |

### 22. Historial de cambios (solo superusuario)

| # | Caso | Resultado |
|---|---|---|
| 1 | corregir mesa: una anotación nueva | ✅ |
| 2 | anotación: cuenta, nombre de Google, fecha y liga | ✅ |
| 3 | anotación: «Corrigió la mesa del lun 5 oct: Ana J 2 VP · Beto J 1 VP · X (invitados)» | ✅ |
| 4 | detalle con el antes y el después, con nicks | ✅ |
| 5 | la liga apunta a la anotación (reg) | ✅ |
| 6 | borrar mesa: anota qué tenía la mesa | ✅ |
| 7 | el organizador NO ve «Historial de cambios» en Mis eventos | ✅ |
| 8 | organizador en #/historial: «solo para el superusuario» y sin datos | ✅ |
| 9 | VP en torneo: «VP de Toni: — → 1.5» | ✅ |
| 10 | cambiar VP: «VP de Lasombra: 2 → 3» con el detalle | ✅ |
| 11 | agregar jugador: «Lalo agregado · La Jyhad Eterna» | ✅ |
| 12 | aprobar solicitud: «Aprobó a Pepe como organizador», sin liga | ✅ |
| 13 | transferir: anota a quién y de quién, con el dueño antes y después | ✅ |
| 14 | superusuario: «📜 Historial de cambios» en Mis eventos | ✅ |
| 15 | dice que solo tú lo ves y que nadie lo puede editar ni borrar | ✅ |
| 16 | lista los 3 cambios (2 nuevos + 1 anterior) | ✅ |
| 17 | el más nuevo primero, con fecha y hora, nombre e identificador | ✅ |
| 18 | un evento borrado se muestra como «(borrado)» | ✅ |
| 19 | «Detalle» se abre con el antes y el después | ✅ |
| 20 | filtro por persona: solo lo de Carla | ✅ |
| 21 | filtro «Sin liga»: la aprobación | ✅ |
| 22 | buscar texto: «transfir» | ✅ |
| 23 | sin desborde horizontal a 390 px | ✅ |
| 24 | detalle de una mesa nueva legible (sin «.sv») | ✅ |
| 25 | jugador reporta: «Reportó la mesa del mar 20 oct: Carla 2 VP» a su nombre | ✅ |
| 26 | sin errores de JavaScript | ✅ |

### 23. Revisión de Archon: mesas que no cuadran, TP y lugares

| # | Caso | Resultado |
|---|---|---|
| 1 | mesa 2: «⚠️ Los VP no cuadran: … suman 7, y la mesa tiene 5 jugadores» | ✅ |
| 2 | la mesa 1 (3·1·1·0·0) cuadra: sin aviso y con GW | ✅ |
| 3 | la mesa 2 no da GW a Fer (2 VP, único máximo) | ✅ |
| 4 | clasificación: Fer con 0 GW y 0 TP, pero sus 2 VP sí cuentan | ✅ |
| 5 | «Terminar torneo» bloqueado: dice qué mesa no cuadra | ✅ |
| 6 | confirmar: guarda el motivo y los VP de ese momento | ✅ |
| 7 | la mesa dice «✔ Confirmada aunque no cuadra: Hugo abandonó…» | ✅ |
| 8 | confirmada: Fer recupera su GW y su TP de 60 | ✅ |
| 9 | ya se puede terminar el torneo | ✅ |
| 10 | queda en el historial: «Confirmó ronda 1, mesa 2 aunque no cuadra: Hugo abandonó…» | ✅ |
| 11 | si cambian los VP después, hay que volver a confirmar | ✅ |
| 12 | sin desborde horizontal a 390 px | ✅ |
| 13 | ayudante: ve el aviso, sin botón de confirmar | ✅ |
| 14 | VP corregidos (2·1·1·1·0): sin aviso y Fer con GW | ✅ |
| 15 | mesa de 3 jugadores: no da GW ni TP («las mesas son de 4 o de 5») | ✅ |
| 16 | incompleta / 2·1·1·0 cuadra / 1.5·1·1·1·0.5 no cuadra | ✅ |
| 17 | liga: D primero (1 GW); A, C y E empatados exactos (2 VP, 72 TP) | ✅ |
| 18 | liga: X e Y con 0 GW y 1 VP; X va arriba por TP (48 contra 36) | ✅ |
| 19 | liga: empates exactos comparten lugar | ✅ |
| 20 | tabla de liga: columna TP y explica el orden (GW, VP y TP) | ✅ |
| 21 | tabla de liga: 5 empatados exactos, todos en el lugar 1 | ✅ |
| 22 | sin desborde horizontal a 390 px (tabla con TP) | ✅ |
| 23 | final: Ana gana (empate a 2 VP, mejor clasificada) y los otros 4 finalistas son «2» | ✅ |
| 24 | los que no llegaron a la final van del 6 en adelante, con empates (Hugo e Iván empataron con Gabi en el corte) | ✅ |
| 25 | en pantalla: 1, 2, 2, 2, 2 | ✅ |
| 26 | final que no cuadra (2·2·2·0·0): aviso y «Terminar torneo» bloqueado | ✅ |
| 27 | libre: 4 de la liga sin invitados, 1.5·1·1·0.5 (redondeando 5) → no cuadra | ✅ |
| 28 | libre: 2·1·1·0 en mesa de 4 → cuadra | ✅ |
| 29 | libre con invitados: 2.5·1.5·0.5 (redondeando 6) en mesa de 5 → se pasa | ✅ |
| 30 | libre con invitados: 2·0.5·0.5 (redondeando 4) → se acepta (los invitados completan) | ✅ |
| 31 | guía: «¿Cómo se calculan GW, VP y TP?» y «¿Por qué dice que los VP de una mesa no cuadran?» | ✅ |
| 32 | sin errores de JavaScript | ✅ |
