export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  /** Número de decimales sugerido para esta moneda (ej: CLP=0, USD=2). */
  decimals?: number;
}

export interface CurrencyInputChangeDetail {
  /** Valor numérico en bruto (null si el campo está vacío). */
  value: number | null;
  /** Código de la moneda seleccionada (ej: 'USD'). */
  currency: string;
  /** Valor formateado según el locale del componente. */
  formatted: string;
}
