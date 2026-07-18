import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/** Verifica que el usuario tenga los permisos exigidos por @RequirePermissions(). */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const user: AuthUser | undefined = context
      .switchToHttp()
      .getRequest().user;
    const granted = new Set(user?.permissions ?? []);
    const hasAll = required.every((p) => granted.has(p));
    if (!hasAll) {
      throw new ForbiddenException('No tiene permisos para esta acción');
    }
    return true;
  }
}
