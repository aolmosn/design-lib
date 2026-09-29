import { css } from 'lit';

export const defaultFontFamily = css`
    :host{
        font-family: var(--ui-font-family, ui-sans-serif, system-ui, sans-serif);
    }
`