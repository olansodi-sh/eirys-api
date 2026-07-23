import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  /** El valor devuelto se inyecta en `request.user`. */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findByIdWithPermissions(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario inválido o inactivo');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      permissions: user.role?.permissions?.map((p) => p.code) ?? [],
    };
  }
}
