import { css } from 'lit';

/**
 * Reglas de la clase `.material-icons` de Google Fonts, reempaquetadas
 * como estilo de Lit para que atraviesen el Shadow DOM.
 *
 * El `<link>` a la fuente (ver demos/index.html) sigue siendo necesario:
 * carga el `@font-face`, que es global. Este módulo solo aporta la clase
 * que aplica ese font-family dentro de cada shadow root.
 *
 * Uso en un componente:
 *   static override styles = [materialIconsStyles, css`...`];
 */
export const materialIconsStyles = css`
  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
    font-display: block; 
  }
`;
