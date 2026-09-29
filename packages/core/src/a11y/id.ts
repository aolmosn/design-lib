let _counter = 0;

/**
 * Genera un ID único y estable para asociar elementos del DOM (label → input,
 * input → aria-describedby, etc.). Usar en constructores de componentes,
 * no en render, para evitar cambios en cada ciclo.
 */
export function generateId(prefix = 'wk'): string {
  return `${prefix}-${++_counter}`;
}
