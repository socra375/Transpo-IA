// Preferencias de ESTE dispositivo (tema, letra, tolerancia, marcas internas).
// No forman parte de la capa de datos: al migrar a Supabase siguen en localStorage.
import { config } from '../config.js';

const CLAVE = 'ct:prefs';

const porDefecto = () => ({
  tema: config.apariencia.tema,
  tamanoLetra: config.apariencia.tamanoLetra,
  toleranciaMin: config.negocio.toleranciaMin,
  sembrado: false,
  ultimoRespaldo: null,
});

let actual = null;

function cargar() {
  if (actual) return actual;
  let guardado = {};
  try {
    guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}');
  } catch {
    guardado = {};
  }
  actual = { ...porDefecto(), ...guardado };
  return actual;
}

export function pref(clave) {
  return cargar()[clave];
}

export function setPref(clave, valor) {
  cargar()[clave] = valor;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actual));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la preferencia vive solo en esta sesión.
  }
  window.dispatchEvent(new CustomEvent('prefs', { detail: { clave, valor } }));
}

export const tolerancia = () => Number(pref('toleranciaMin')) || 0;
