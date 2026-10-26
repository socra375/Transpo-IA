# Mapa / GPS (fuera de alcance por ahora)

Punto de extensión reservado. Para activarlo:

1. Crear `index.js` aquí que exporte por defecto `{ titulo: 'Mapa / GPS', pestana: 'mas', render(el, params) {} }`.
2. Si necesita datos propios, agregar la colección a `COLECCIONES` en `src/data/store.js` y sus campos en `config.modulos`.
3. Poner `activo: true` en la entrada `'mapa'` de `config.extensiones`. Aparecerá en la pestaña "Más".
4. Agregar `./src/modules/extensiones/mapa/index.js` a `ARCHIVOS` en `sw.js`.
