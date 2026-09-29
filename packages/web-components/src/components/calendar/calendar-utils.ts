export interface DayCell {
  date: Date;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isHoverRange: boolean;
  isHoverStart: boolean;
  isHoverEnd: boolean;
  disabled: boolean;
  disabledReason: string;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m, d);
}

export function parseISO(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return localDate(y, m - 1, d);
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

/** Returns the date of the nth business day counting from start (start = day 1). */
export function nthBusinessDay(start: Date, n: number): Date {
  const result = new Date(start);
  let count = 1;
  while (count < n) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) count++;
  }
  return result;
}
