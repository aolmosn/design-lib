/** Tamaños estándar compartidos por todos los componentes de formulario */
export type ComponentSize = 'sm' | 'md' | 'lg';

/** Contrato mínimo que todo campo de formulario debe cumplir */
export interface FieldProps {
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  helperText?: string;
  errorText?: string;
  size?: ComponentSize;
}

/** Payload de los eventos que emiten los campos */
export interface FieldChangeDetail<T = string> {
  value: T;
}

/** Estado interno de un campo de formulario */
export interface FieldState {
  focused: boolean;
  touched: boolean;
  dirty: boolean;
}
