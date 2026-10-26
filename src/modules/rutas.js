import { pantallaCrud } from '../core/crud.js';
import { formatoDuracion } from '../core/time.js';

export default pantallaCrud({
  modulo: 'rutas',
  titulo: 'Rutas',
  pestana: 'mas',
  icono: 'route',
  ordenar: (a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }),
  describir: (r) => ({
    titulo: r.nombre,
    subtitulo: [r.origen, r.destino].filter(Boolean).join(' → '),
    meta: r.duracionMin ? [`Duración estimada: ${formatoDuracion(r.duracionMin)}`] : [],
  }),
});
