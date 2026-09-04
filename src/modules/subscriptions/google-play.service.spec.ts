import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserTier } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { GooglePlayService } from './google-play.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

describe('GooglePlayService', () => {
  let service: GooglePlayService;
  let subs: {
    updateByUserId: ReturnType<typeof vi.fn>;
    findByGooglePlayToken: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };
  let users: { update: ReturnType<typeof vi.fn> };

  const notif = (over: Record<string, unknown> = {}) => ({
    subscriptionNotification: {
      notificationType: 4,
      purchaseToken: 'gp_tok_1',
      subscriptionId: 'premium_monthly',
      userId: 'user-1',
      ...over,
    },
  });

  beforeEach(async () => {
    subs = {
      updateByUserId: vi.fn().mockResolvedValue({}),
      findByGooglePlayToken: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      cancel: vi.fn().mockResolvedValue({}),
    };
    users = { update: vi.fn().mockResolvedValue({}) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GooglePlayService,
        { provide: SubscriptionsService, useValue: subs },
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(GooglePlayService);
  });

  it('ignora el mensaje si no trae subscriptionNotification', async () => {
    await service.handleWebhook({ testNotification: { version: '1.0' } });

    expect(subs.updateByUserId).not.toHaveBeenCalled();
  });

  describe('compra (notificationType 4)', () => {
    it('premium_monthly => tier PREMIUM y plataforma google_play', async () => {
      await service.handleWebhook(notif());

      expect(subs.updateByUserId).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          tier: UserTier.PREMIUM,
          status: 'ACTIVE',
          googlePlayToken: 'gp_tok_1',
          googlePlaySubscriptionId: 'premium_monthly',
          platform: 'google_play',
        }),
      );
      expect(users.update).toHaveBeenCalledWith('user-1', {
        tier: UserTier.PREMIUM,
      });
    });

    it('cualquier otro productId => tier PRO_COACHING', async () => {
      await service.handleWebhook(
        notif({ subscriptionId: 'pro_coaching_yearly' }),
      );

      expect(subs.updateByUserId).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ tier: UserTier.PRO_COACHING }),
      );
    });

    it('lanza BadRequestException si falta token/subscriptionId/userId', async () => {
      await expect(
        service.handleWebhook(notif({ userId: undefined })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('renovación (notificationType 2)', () => {
    it('actualiza estado y renewsAt cuando encuentra la suscripción', async () => {
      subs.findByGooglePlayToken.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
      });
      const expiry = '1830000000000';

      await service.handleWebhook(
        notif({ notificationType: 2, expiryTimeMillis: expiry }),
      );

      expect(subs.update).toHaveBeenCalledWith('sub-1', {
        status: 'ACTIVE',
        renewsAt: new Date(Number(expiry)),
      });
    });

    it('no hace nada si el token no corresponde a ninguna suscripción', async () => {
      subs.findByGooglePlayToken.mockResolvedValue(null);

      await service.handleWebhook(notif({ notificationType: 2 }));

      expect(subs.update).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si falta el purchaseToken', async () => {
      await expect(
        service.handleWebhook(
          notif({ notificationType: 2, purchaseToken: undefined }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('cancelación (notificationType 3)', () => {
    it('cancela la suscripción del dueño del token', async () => {
      subs.findByGooglePlayToken.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-9',
      });

      await service.handleWebhook(notif({ notificationType: 3 }));

      expect(subs.cancel).toHaveBeenCalledWith('user-9');
    });

    it('no falla si el token no existe', async () => {
      subs.findByGooglePlayToken.mockResolvedValue(null);

      await expect(
        service.handleWebhook(notif({ notificationType: 3 })),
      ).resolves.toBeUndefined();
      expect(subs.cancel).not.toHaveBeenCalled();
    });
  });

  it('ignora notificationType desconocido', async () => {
    await service.handleWebhook(notif({ notificationType: 99 }));

    expect(subs.updateByUserId).not.toHaveBeenCalled();
    expect(subs.cancel).not.toHaveBeenCalled();
  });
});
