import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from '../../modules/roles/permissions.catalog';

export const PERMISSIONS_KEY = 'permissions';

/** Exige que el usuario tenga todos los permisos indicados. */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
