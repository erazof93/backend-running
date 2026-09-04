import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../../modules/auth/strategies/jwt.strategy.js';

/**
 * Exige rol ADMIN o SUPERADMIN. Debe usarse SIEMPRE junto a `JwtAuthGuard`
 * (necesita `request.user`, resuelto por `JwtStrategy` desde la BD).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Se requiere rol ADMIN');
    }

    return true;
  }
}
