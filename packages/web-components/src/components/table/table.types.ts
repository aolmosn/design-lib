export interface TableColumn<T = any> {
  key: string;
  label: string;
  /** Activa la cabecera clicable para ordenar. Default: false. */
  sortable?: boolean;
  /** Alineación del contenido. Default: 'left'. */
  align?: 'left' | 'center' | 'right';
  /** Ancho CSS explícito (ej: '120px', '10%'). */
  width?: string;
  /** Función de formato. Recibe el valor crudo y la fila completa. */
  formatter?: (value: any, row: T) => string;
}

export interface TableSelectDetail {
  /** Claves de las filas actualmente seleccionadas. */
  selectedKeys: string[];
  /** Si todas las filas visibles están seleccionadas. */
  allSelected: boolean;
  /** Clave de la fila que disparó el cambio (undefined = select-all). */
  triggerKey?: string;
}

export interface TableSortDetail {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TablePageDetail {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
