const TZ = 'Asia/Jakarta';

export function todayWib(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function formatDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, day)),
  );
}

export function formatDateTime(iso: string): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(iso))
      .replace(/\./g, ':') + ' WIB'
  );
}

export function addDaysStr(d: string, n: number): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
}
