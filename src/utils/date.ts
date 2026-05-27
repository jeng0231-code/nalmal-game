export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}

export function getRelativeLocalDate(offsetDays: number, baseDate = new Date()): string {
  const shifted = new Date(baseDate);
  shifted.setDate(shifted.getDate() + offsetDays);
  return formatLocalDate(shifted);
}

export function getWeekStartMonday(baseDate = new Date()): Date {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - ((dayOfWeek + 6) % 7));
  return start;
}

export function getThisWeekDays(baseDate = new Date()): string[] {
  const monday = getWeekStartMonday(baseDate);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return formatLocalDate(day);
  });
}

export function getCurrentWeekKey(baseDate = new Date()): string {
  const monday = getWeekStartMonday(baseDate);
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const diffDays = Math.floor((monday.getTime() - startOfYear.getTime()) / 86_400_000);
  const week = Math.floor(diffDays / 7) + 1;
  return `${monday.getFullYear()}-W${week}`;
}
