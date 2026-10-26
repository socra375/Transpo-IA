# Decisiones tomadas por defecto

Lo que el cliente aún no confirmó se decidió así. Lo marcado **(config)** se cambia en `src/config.js` sin tocar código.

## Arquitectura

| # | Decisión | Por qué |
|---|----------|---------|
| A1 | La interfaz de `store.js` es **asíncrona** (devuelve Promises) aunque localStorage sea síncrono. | Supabase es asíncrono. Si hoy fuera síncrona, migrar obligaría a tocar todos los módulos. |
| A2 | Las horas se guardan como **instantes ISO UTC completos** (`2026-10-26T13:30:00.000Z`), no como "HH:MM". | El cruce de medianoche se resuelve una vez, al capturar la hora. Después el retraso es una resta. |
| A3 | La zona horaria del negocio (`America/Santo_Domingo`) se aplica siempre, sin importar la zona del teléfono. **(config)** | Un teléfono mal configurado no debe mover los viajes de día. |
| A4 | Rutas por **hash** (`#/viajes`). | Funciona en GitHub Pages sin configurar el servidor ni una página 404. |
| A5 | Archivos añadidos a la estructura pedida: `src/app.js` (arranque), `src/core/form.js` (formularios desde config), `src/core/crud.js` (lista/buscar/crear/editar/archivar genérico), `src/core/prefs.js` (ajustes del dispositivo), `src/modules/mas.js` (pestaña "Más"), `scripts/` (servidor local y QA). | Evita repetir la misma lógica en cada módulo. |
| A6 | Las **preferencias del dispositivo** (tema, letra, tolerancia) viven en `prefs.js`, fuera del store. | Son de este teléfono. Al migrar a Supabase no hace falta una tabla para ellas. Si la tolerancia debe compartirse entre dispositivos, se mueve a una tabla `ajustes`. |
| A7 | Campos marcados `fijo: true` en config (p. ej. llegada programada) ignoran `activo: false`. | La lógica de retrasos no funciona sin ellos. |
| A8 | Se pide `navigator.storage.persist()` al arrancar. | En iPhone, Safari puede borrar los datos de un sitio que no se abre en 7 días si **no** está instalado en la pantalla de inicio. Instalarlo como PWA y hacer respaldos es la protección real. |

## Interfaz

| # | Decisión |
|---|----------|
| U1 | Barra inferior de 5 pestañas: **Inicio, Viajes, Choferes, Combustible, Más**. "Más" contiene Rutas, Vehículos, Reportes y Ajustes (y extensiones futuras). Son las que se usan a diario en la calle. |
| U2 | Fuentes: **Barlow Semi Condensed** (títulos; condensada, estilo rotulación vial, y cabe en pantallas estrechas) y **Atkinson Hyperlegible** (lectura; diseñada para máxima legibilidad, útil al sol). Letra base 17 px. **(config)** |
| U3 | Color principal azul `#0F4C81` y acento ámbar `#F5A524`. El tema oscuro **deriva** el principal automáticamente (`color-mix`). Cambiar el color es una sola línea. **(config)** |
| U4 | El aviso "Datos de ejemplo" es una franja visible bajo el encabezado en todas las pantallas. Lleva a Ajustes, donde se borran todos de una vez. |
| U5 | Botón rápido de tema claro/oscuro en el encabezado (útil al pasar del sol a la noche). En Ajustes también está la opción "Sistema". |
| U6 | Formularios en **hoja inferior** (`<dialog>` nativo: atrapa el foco y cierra con Esc o gesto atrás). En pantallas táctiles no se enfoca el primer campo al abrir, para que el teclado no tape la hoja. |
| U7 | El esqueleto de carga solo aparece si los datos tardan más de 150 ms. Con localStorage casi nunca se ve; con Supabase sí. |
| U8 | En las listas no hay "eliminar", solo **archivar/restaurar** (como pidió el cliente). Así no se rompen viajes o cargas que apunten al registro. |

## Validaciones (config)

- Teléfono: 10 dígitos que empiezan por 809, 829 u 849.
- Cédula: 11 dígitos. Se muestra como `001-1234567-8`. No se valida el dígito verificador: algunas cédulas antiguas no lo cumplen.
- Placa: 1–2 letras + 5–6 dígitos (`I045821`). Patrón editable en config.
