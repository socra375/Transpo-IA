// Pestaña "Más": accesos a módulos secundarios y extensiones activas.
import { config } from '../config.js';
import { esc, icon } from '../core/ui.js';

const ENTRADAS = [
  { ruta: 'rutas', titulo: 'Rutas', texto: 'Origen, destino y duración estimada', icono: 'route' },
  { ruta: 'vehiculos', titulo: 'Vehículos', texto: 'Placas, descripción y estado', icono: 'truck' },
  { ruta: 'reportes', titulo: 'Reportes', texto: 'Retrasos, combustible y exportar CSV', icono: 'chart' },
  { ruta: 'ajustes', titulo: 'Ajustes', texto: 'Tema, letra, tolerancia y respaldo', icono: 'settings' },
];

export default {
  titulo: 'Más',
  pestana: 'mas',
  render(el) {
    const extras = config.extensiones
      .filter((x) => x.activo)
      .map((x) => ({ ruta: x.id, titulo: x.titulo, texto: 'Extensión', icono: 'grid' }));
    el.innerHTML = `<ul class="menu stagger">${[...ENTRADAS, ...extras]
      .map((x, i) => `<li style="--i:${i}"><a href="#/${x.ruta}">${icon(x.icono)}<span class="menu__text"><strong>${esc(x.titulo)}</strong><small>${esc(x.texto)}</small></span>${icon('chevron', 'icon--sm')}</a></li>`)
      .join('')}</ul>`;
  },
};
