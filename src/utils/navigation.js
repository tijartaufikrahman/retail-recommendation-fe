/**
 * Menemukan URL menu pertama yang dapat diakses dari struktur navigasi role.
 * Mendukung item mandiri (type === 'menu') maupun submenu dalam grup (type === 'group').
 */
export const getFirstMenuUrl = (navItems) => {
  if (!navItems || !Array.isArray(navItems) || navItems.length === 0) {
    return null;
  }
  for (const item of navItems) {
    if (item.type === 'menu' && item.url && item.url !== '#') {
      return item.url;
    }
    if (item.type === 'group' && Array.isArray(item.subMenus) && item.subMenus.length > 0) {
      for (const sub of item.subMenus) {
        if (sub.url && sub.url !== '#') {
          return sub.url;
        }
      }
    }
  }
  return null;
};
