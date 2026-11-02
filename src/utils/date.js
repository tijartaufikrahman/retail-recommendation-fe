/**
 * Memformat nilai datetime menjadi format DD/MM/YYYY HH:mm:ss dalam zona waktu WIB (UTC+7).
 * Contoh output: 19/10/2026 04:04:50
 */
export const formatDateTimeWib = (val) => {
  if (!val || val === '-') return '-';

  let dateObj = null;

  if (typeof val === 'string' && val.includes('/')) {
    const parts = val.trim().split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const [d, m, y] = dateParts;
      const isoCandidate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}${parts[1] ? 'T' + parts[1] : ''}`;
      dateObj = new Date(isoCandidate);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date(val);
  }

  if (isNaN(dateObj.getTime())) return '-';

  // Konversi eksplisit ke WIB (UTC+7)
  const utc = dateObj.getTime() + dateObj.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);

  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(wib.getDate());
  const month = pad(wib.getMonth() + 1);
  const year = wib.getFullYear();
  const hours = pad(wib.getHours());
  const minutes = pad(wib.getMinutes());
  const seconds = pad(wib.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
