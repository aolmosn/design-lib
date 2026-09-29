/** Variantes semánticas soportadas por el componente de alerta */
export type AlertType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

/**
 * Íconos por defecto (nombres de Material Icons) para cada variante.
 * Un consumidor puede sobreescribir alguno o todos vía la property
 * `icons` del componente, sin necesidad de forkear la librería.
 */
export const DEFAULT_ALERT_ICONS: Record<AlertType, string> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'check_circle',
};
