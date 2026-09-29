import './_shell.css';
import '@design-lib/tokens/tokens.css';

// Registro central de componentes — agregar aquí cada componente nuevo
const COMPONENTS = [
  { slug: 'text-input', label: 'Text Input', tag: 'ui-text-input' },
  { slug: 'alert',      label: 'Alert',      tag: 'ui-alert' },
];

// Marcar el link activo según la URL actual
const currentSlug = location.pathname.match(/\/demo\/(.+?)\.html/)?.[1] ?? '';

COMPONENTS.forEach(({ slug }) => {
  const link = document.querySelector(`[data-slug="${slug}"]`);
  if (link && slug === currentSlug) {
    link.classList.add('dl-nav-link--active');
  }
});
