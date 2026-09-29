export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  /** Material Icons name, e.g. "person" */
  icon?: string;
  description?: string;
}

export interface SelectChangeDetail {
  value: string;
  option: SelectOption;
}
