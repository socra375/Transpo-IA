// Capa de datos. Interfaz única y ASÍNCRONA (igual que la tendrá Supabase):
//   list(col, { archivados })   get(col, id)   create(col, datos)   update(col, id, cambios)   remove(col, id)
// Para migrar a Supabase se reescribe SOLO este archivo (ver README). Ningún módulo toca localStorage.

export const COLECCIONES = ['choferes', 'rutas', 'vehiculos', 'viajes', 'combustible', 'turnos'];

const PREFIJO = 'ct:v1:';
const cache = new Map();

function verificar(col) {
  if (!COLECCIONES.includes(col)) throw new Error(`Colección desconocida: ${col}`);
}

function leer(col) {
  verificar(col);
  if (!cache.has(col)) {
    let items = [];
    try {
      items = JSON.parse(localStorage.getItem(PREFIJO + col) || '[]');
    } catch {
      items = [];
    }
    cache.set(col, Array.isArray(items) ? items : []);
  }
  return cache.get(col);
}

function escribir(col, items) {
  try {
    localStorage.setItem(PREFIJO + col, JSON.stringify(items));
  } catch (e) {
    throw new Error('No hay espacio para guardar. Exporta un respaldo y borra datos antiguos.', { cause: e });
  }
  cache.set(col, items);
  window.dispatchEvent(new CustomEvent('datos', { detail: { col } }));
}

// Otra pestaña cambió datos: olvidar la caché.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith(PREFIJO)) cache.delete(e.key.slice(PREFIJO.length));
  });
}

function nuevoId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const copia = (x) => (x == null ? x : structuredClone(x));

/**
 * @param {string} col
 * @param {{ archivados?: boolean | 'todos' }} [opciones] false = solo activos (por defecto), true = solo archivados
 */
export async function list(col, { archivados = false } = {}) {
  const items = leer(col);
  const filtrados = archivados === 'todos' ? items : items.filter((i) => Boolean(i.archivado) === Boolean(archivados));
  return copia(filtrados);
}

export async function get(col, id) {
  return copia(leer(col).find((i) => i.id === id) ?? null);
}

export async function create(col, datos) {
  const ahora = new Date().toISOString();
  const item = { archivado: false, ...datos, id: datos.id ?? nuevoId(), creado: ahora, actualizado: ahora };
  escribir(col, [...leer(col), item]);
  return copia(item);
}

export async function update(col, id, cambios) {
  const items = leer(col);
  const i = items.findIndex((x) => x.id === id);
  if (i < 0) throw new Error('El registro ya no existe.');
  const item = { ...items[i], ...cambios, id, actualizado: new Date().toISOString() };
  const nuevos = items.slice();
  nuevos[i] = item;
  escribir(col, nuevos);
  return copia(item);
}

export async function remove(col, id) {
  const items = leer(col);
  const nuevos = items.filter((x) => x.id !== id);
  if (nuevos.length === items.length) return false;
  escribir(col, nuevos);
  return true;
}

// --- Operaciones en bloque (respaldo, datos de ejemplo) ---

export async function removeMany(col, ids) {
  const quitar = new Set(ids);
  const items = leer(col);
  const nuevos = items.filter((x) => !quitar.has(x.id));
  if (nuevos.length !== items.length) escribir(col, nuevos);
  return items.length - nuevos.length;
}

export async function createMany(col, lista) {
  const ahora = new Date().toISOString();
  const nuevos = lista.map((d) => ({ archivado: false, ...d, id: d.id ?? nuevoId(), creado: d.creado ?? ahora, actualizado: ahora }));
  escribir(col, [...leer(col), ...nuevos]);
  return nuevos.length;
}

/** Copia completa de todas las colecciones (para respaldo). */
export async function exportAll() {
  return Object.fromEntries(COLECCIONES.map((c) => [c, copia(leer(c))]));
}

/** Reemplaza TODAS las colecciones (restaurar respaldo). */
export async function replaceAll(datos) {
  for (const c of COLECCIONES) {
    if (!Array.isArray(datos[c])) throw new Error(`El respaldo no tiene la lista "${c}".`);
  }
  for (const c of COLECCIONES) escribir(c, datos[c]);
}

/** Pide al navegador no borrar los datos por falta de espacio o inactividad (Safari/Chrome). */
export async function pedirPersistencia() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
