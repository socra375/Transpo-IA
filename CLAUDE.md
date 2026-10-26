# Instrucciones para Claude en este repositorio

## Fusión automática (regla del dueño del repositorio)

Al terminar un cambio, ejecutar las tres suites:

```bash
npm test          # pruebas unitarias
npm run e2e       # flujos en navegador headless
npm run qa        # pantallas a 390 px, claro/oscuro, contraste, offline, letra grande
```

- **Si las tres pasan en local Y el check `CI` de GitHub Actions (`.github/workflows/ci.yml`) está en verde en el último commit:** fusionar el cambio a `main` sin pedir confirmación.
- **Si alguna falla o no se puede ejecutar:** no fusionar. Corregir, o informar qué falla y por qué.
- Nunca saltar, desactivar ni debilitar una prueba para conseguir el verde.

## Convenciones

- Interfaz y documentación en español (RD). Ver `README.md` y `DECISIONES.md`.
- Lo configurable va en `src/config.js`; las decisiones por defecto se anotan en `DECISIONES.md`.
- Al agregar un archivo `.js`/`.css`, añadirlo a `ARCHIVOS` en `sw.js` (lo verifica `npm test`) y subir `VERSION`.
