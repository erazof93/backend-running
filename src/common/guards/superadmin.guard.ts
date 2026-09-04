import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../../modules/auth/strategies/jwt.strategy.js';

/**
 * Exige rol SUPERADMIN. Debe usarse SIEMPRE junto a `JwtAuthGuard`
 * (necesita `request.user`, resuelto por `JwtStrategy` desde la BD).
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Solo SUPERADMIN puede acceder a este recurso');
    }

    return true;
  }
}
