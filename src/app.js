// Arranque: apariencia, datos de ejemplo, enrutador y service worker.
import { config } from './config.js';
import { pref, setPref } from './core/prefs.js';
import { icon } from './core/ui.js';
import { iniciarRouter, ir } from './core/router.js';
import { sembrarSiPrimeraVez, hayDatosEjemplo } from './data/seed.js';
import { pedirPersistencia } from './data/store.js';

const raiz = document.documentElement;
const oscuroSistema = window.matchMedia('(prefers-color-scheme: dark)');

export const temaEfectivo = () => {
  const t = pref('tema');
  return t === 'sistema' ? (oscuroSistema.matches ? 'oscuro' : 'claro') : t;
};

export function aplicarApariencia() {
  const tema = pref('tema');
  if (tema === 'claro' || tema === 'oscuro') raiz.dataset.theme = tema;
  else delete raiz.dataset.theme;
  raiz.style.fontSize = `${pref('tamanoLetra')}px`;
  raiz.style.setProperty('--brand', config.apariencia.colorPrincipal);
  raiz.style.setProperty('--accent', config.apariencia.colorAcento);

  const oscuro = temaEfectivo() === 'oscuro';
  document.getElementById('theme-color')?.setAttribute('content', oscuro ? '#0c1218' : '#f2f4f7');
  const b = document.getElementById('tema-rapido');
  if (b) {
    b.innerHTML = icon(oscuro ? 'sun' : 'moon');
    b.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  }
}

async function actualizarInsignia() {
  document.getElementById('badge-ejemplo').hidden = !(await hayDatosEjemplo());
}

async function iniciar() {
  document.getElementById('header-company').textContent = config.empresa.nombre;
  // Altura real de la cabecera para los títulos de día "pegajosos" (cambia con la franja de ejemplo y la letra).
  const cabecera = document.querySelector('.app-header');
  new ResizeObserver(() => raiz.style.setProperty('--header-h', `${cabecera.offsetHeight}px`)).observe(cabecera);
  aplicarApariencia();
  oscuroSistema.addEventListener('change', aplicarApariencia);
  window.addEventListener('prefs', (e) => {
    if (['tema', 'tamanoLetra'].includes(e.detail.clave)) aplicarApariencia();
  });

  document.getElementById('tema-rapido').addEventListener('click', () => {
    setPref('tema', temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro');
  });
  document.getElementById('badge-ejemplo').addEventListener('click', () => ir('ajustes'));
  // El enlace "Saltar al contenido" no debe cambiar el hash (el hash es la ruta).
  document.querySelector('[data-saltar]').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main').focus();
  });

  try {
    await sembrarSiPrimeraVez();
  } catch (e) {
    console.error('No se pudieron cargar los datos de ejemplo', e);
  }
  await actualizarInsignia();
  let pendiente = null;
  window.addEventListener('datos', () => {
    clearTimeout(pendiente);
    pendiente = setTimeout(actualizarInsignia, 200);
  });

  await iniciarRouter();
  pedirPersistencia();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker no registrado', e));
  }
}

iniciar();
