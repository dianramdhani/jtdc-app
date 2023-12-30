import { formatInTimeZone } from 'date-fns-tz';

export function formatDate(date: Date): string {
  return formatInTimeZone(date, 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss');
}
