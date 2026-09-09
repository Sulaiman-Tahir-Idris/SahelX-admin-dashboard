export function getNigerianDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || "0", 10);
  
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second')
  };
}

export function getNigerianStartOfDay(d: Date = new Date()): Date {
  const { year, month, day } = getNigerianDateParts(d);
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+01:00`);
}

export function getNigerianStartOfWeek(d: Date = new Date()): Date {
  // Get the Nigerian day of week
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', weekday: 'short' });
  const dayStr = formatter.format(d);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = days.indexOf(dayStr);
  
  const startOfDay = getNigerianStartOfDay(d);
  return new Date(startOfDay.getTime() - (dayIndex * 24 * 60 * 60 * 1000));
}

export function getNigerianStartOfMonth(d: Date = new Date()): Date {
  const { year, month } = getNigerianDateParts(d);
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+01:00`);
}

export function getNigerianStartOfPrevMonth(d: Date = new Date()): Date {
  let { year, month } = getNigerianDateParts(d);
  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+01:00`);
}

export function getNigerianEndOfPrevMonth(d: Date = new Date()): Date {
  const startOfThisMonth = getNigerianStartOfMonth(d);
  return new Date(startOfThisMonth.getTime() - 1);
}

export function getNigerianStartOfYear(d: Date = new Date()): Date {
  const { year } = getNigerianDateParts(d);
  return new Date(`${year}-01-01T00:00:00+01:00`);
}

export function formatNigerianMonthYear(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    month: 'short',
    year: '2-digit'
  });
  return formatter.format(d);
}

export function formatNigerianWeekday(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short'
  });
  return formatter.format(d);
}
