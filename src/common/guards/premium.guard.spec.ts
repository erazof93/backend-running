import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserTier } from '@prisma/client';
import type { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service.js';
import { PremiumGuard } from './premium.guard.js';

describe('PremiumGuard', () => {
  let guard: PremiumGuard;
  let getByUserId: ReturnType<typeof vi.fn>;

  const ctxFor = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    getByUserId = vi.fn();
    guard = new PremiumGuard({
      getByUserId,
    } as unknown as SubscriptionsService);
  });

  it('permite el acceso con una suscripción de pago ACTIVA', async () => {
    getByUserId.mockResolvedValue({ tier: UserTier.PREMIUM, status: 'ACTIVE' });

    await expect(guard.canActivate(ctxFor({ id: 'user-1' }))).resolves.toBe(
      true,
    );
    expect(getByUserId).toHaveBeenCalledWith('user-1');
  });

  it('rechaza si no hay usuario autenticado', async () => {
    await expect(
      guard.canActivate(ctxFor(undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getByUserId).not.toHaveBeenCalled();
  });

  it('rechaza si el tier es FREE', async () => {
    getByUserId.mockResolvedValue({ tier: UserTier.FREE, status: 'ACTIVE' });

    await expect(
      guard.canActivate(ctxFor({ id: 'user-1' })),
    ).rejects.toThrow('Requiere suscripción PREMIUM');
  });

  it('rechaza si la suscripción no está ACTIVA', async () => {
    getByUserId.mockResolvedValue({
      tier: UserTier.PREMIUM,
      status: 'CANCELED',
    });

    await expect(
      guard.canActivate(ctxFor({ id: 'user-1' })),
    ).rejects.toThrow('Suscripción inactiva');
  });
});
