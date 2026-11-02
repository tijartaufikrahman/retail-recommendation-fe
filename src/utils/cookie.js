/**
 * Utility helper untuk mengelola browser cookies (Token JWT & Sesi)
 */

/**
 * Menyimpan cookie ke browser dengan masa kedaluwarsa dalam jumlah hari.
 * Default 1 hari (24 jam).
 *
 * @param {string} name - Nama cookie
 * @param {string} value - Nilai token / data
 * @param {number} days - Masa berlaku (dalam hari, contoh: 1 untuk 24 jam)
 */
export const setCookie = (name, value, days = 1) => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax`;
};

/**
 * Mengambil nilai cookie berdasarkan nama.
 *
 * @param {string} name - Nama cookie yang dicari
 * @returns {string|null} - Nilai cookie atau null jika tidak ditemukan
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

/**
 * Menghapus cookie dari browser.
 *
 * @param {string} name - Nama cookie yang ingin dihapus
 */
export const removeCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=-99999999; path=/; SameSite=Lax`;
};
