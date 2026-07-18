/**
 * Catálogo central de permisos (`modulo.accion`) y definición de los roles base.
 * Ampliar aquí cuando se agreguen módulos en fases posteriores.
 */
export const PERMISSIONS = {
  // Usuarios y roles
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  // Terceros
  THIRD_PARTIES_READ: 'third_parties.read',
  THIRD_PARTIES_WRITE: 'third_parties.write',
  // Inventario
  INVENTORY_READ: 'inventory.read',
  INVENTORY_WRITE: 'inventory.write',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);

export const ROLE_NAMES = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  CAJERO: 'Cajero',
} as const;

/** Mapa rol -> permisos base para la Fase 1. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  [ROLE_NAMES.ADMIN]: ALL_PERMISSIONS,
  [ROLE_NAMES.VENDEDOR]: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.THIRD_PARTIES_READ,
    PERMISSIONS.THIRD_PARTIES_WRITE,
  ],
  [ROLE_NAMES.CAJERO]: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.THIRD_PARTIES_READ,
  ],
};
