export const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.has(String(role));
}
