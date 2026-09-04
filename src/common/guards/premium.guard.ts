import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserTier } from '@prisma/client';
import type { AuthenticatedUser } from '../../modules/auth/strategies/jwt.strategy.js';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service.js';

/**
 * Exige una suscripción de pago ACTIVA (cualquier tier != FREE).
 * Debe usarse SIEMPRE junto a `JwtAuthGuard` (necesita `request.user`).
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const subscription = await this.subscriptionsService.getByUserId(user.id);

    if (subscription.tier === UserTier.FREE) {
      throw new ForbiddenException('Requiere suscripción PREMIUM');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('Suscripción inactiva');
    }

    return true;
  }
}
