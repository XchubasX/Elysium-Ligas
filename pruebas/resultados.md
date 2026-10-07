# Resultados de las pruebas

**✅ TODO BIEN** — 13 de 13 casos pasaron.

- Fecha: 07/10/2026 10:14 (hora de Ciudad de México)
- Versión probada: `dfc2932`
- Duración: 3 s
- Grupos corridos: solo los que contienen «prueba_16»
- Cómo se prueba: navegador automatizado con Firebase simulado (no toca datos reales). **Las reglas de la base de datos se aplicaron** en cada lectura y escritura (simulador de reglas). No sustituye la revisión en el sitio de pruebas: estilos y servicios de Google reales solo se ven ahí.

## Resumen por grupo

| # | Grupo | Casos | Resultado |
|---|---|---|---|
| 1 | Fecha y hora en iPhone: pista visible en campos vacíos | 13 | ✅ |

## Todos los casos

### 1. Fecha y hora en iPhone: pista visible en campos vacíos

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
| 10 | portada en iPhone: el filtro de fecha también muestra «Elegir fecha» | ✅ |
| 11 | Chrome en iPhone: también muestra «Elegir fecha» y «Elegir hora» | ✅ |
| 12 | computadora: sin pista (el navegador ya muestra su ícono y dd/mm/aaaa) | ✅ |
| 13 | sin errores de JavaScript | ✅ |
