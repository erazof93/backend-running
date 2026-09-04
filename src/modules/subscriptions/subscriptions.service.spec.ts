import { Test, type TestingModule } from '@nestjs/testing';
import { UserTier } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: {
    subscription: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    transaction: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let users: { update: ReturnType<typeof vi.fn> };

  const subRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'sub-1',
    userId: 'user-1',
    tier: UserTier.FREE,
    status: 'ACTIVE',
    googlePlayToken: null,
    googlePlayPackageId: null,
    googlePlaySubscriptionId: null,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    startsAt: new Date('2026-01-01'),
    expiresAt: null,
    renewsAt: null,
    canceledAt: null,
    platform: 'stripe',
    paymentMethod: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      subscription: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      transaction: { findMany: vi.fn(), create: vi.fn() },
    };
    users = { update: vi.fn().mockResolvedValue({}) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(SubscriptionsService);
  });

  describe('getByUserId', () => {
    it('devuelve la suscripción existente', async () => {
      prisma.subscription.findUnique.mockResolvedValue(
        subRow({ tier: UserTier.PREMIUM }),
      );

      const result = await service.getByUserId('user-1');

      expect(result.tier).toBe(UserTier.PREMIUM);
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('crea una suscripción FREE si el usuario no tiene', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue(
        subRow({ platform: 'none' }),
      );

      const result = await service.getByUserId('user-1');

      expect(result.tier).toBe(UserTier.FREE);
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tier: UserTier.FREE,
          status: 'ACTIVE',
          platform: 'none',
        },
      });
    });
  });

  describe('update / create', () => {
    it('update delega en prisma.subscription.update', async () => {
      prisma.subscription.update.mockResolvedValue(subRow());

      await service.update('sub-1', { status: 'PAST_DUE' });

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'PAST_DUE' },
      });
    });

    it('create delega en prisma.subscription.create', async () => {
      prisma.subscription.create.mockResolvedValue(subRow());

      await service.create({
        user: { connect: { id: 'user-1' } },
        tier: UserTier.PREMIUM,
      });

      expect(prisma.subscription.create).toHaveBeenCalledOnce();
    });
  });

  describe('updateByUserId', () => {
    it('hace upsert por userId con fallbacks en create', async () => {
      prisma.subscription.upsert.mockResolvedValue(
        subRow({ tier: UserTier.PREMIUM, platform: 'stripe' }),
      );

      await service.updateByUserId('user-1', {
        tier: UserTier.PREMIUM,
        status: 'ACTIVE',
        stripeSubscriptionId: 'sub_ext_1',
      });

      const arg = prisma.subscription.upsert.mock.calls[0][0];
      expect(arg.where).toEqual({ userId: 'user-1' });
      expect(arg.update.tier).toBe(UserTier.PREMIUM);
      expect(arg.create).toMatchObject({
        userId: 'user-1',
        tier: UserTier.PREMIUM,
        status: 'ACTIVE',
        platform: 'stripe',
        stripeSubscriptionId: 'sub_ext_1',
      });
    });

    it('usa defaults cuando faltan tier/status/platform', async () => {
      prisma.subscription.upsert.mockResolvedValue(subRow());

      await service.updateByUserId('user-1', { canceledAt: new Date() });

      const arg = prisma.subscription.upsert.mock.calls[0][0];
      expect(arg.create.tier).toBe(UserTier.FREE);
      expect(arg.create.status).toBe('ACTIVE');
      expect(arg.create.platform).toBe('stripe');
      expect(arg.create.stripeSubscriptionId).toBeUndefined();
      expect(arg.create.googlePlayToken).toBeUndefined();
    });

    it('propaga los campos de Google Play al bloque create', async () => {
      prisma.subscription.upsert.mockResolvedValue(subRow());

      await service.updateByUserId('user-1', {
        tier: UserTier.PRO_COACHING,
        platform: 'google_play',
        googlePlayToken: 'gp_tok_1',
        googlePlaySubscriptionId: 'pro_coaching_monthly',
      });

      const arg = prisma.subscription.upsert.mock.calls[0][0];
      expect(arg.create).toMatchObject({
        platform: 'google_play',
        googlePlayToken: 'gp_tok_1',
        googlePlaySubscriptionId: 'pro_coaching_monthly',
      });
    });
  });

  describe('createTransaction', () => {
    it('delega en prisma.transaction.create', async () => {
      prisma.transaction.create.mockResolvedValue({ id: 'tx-1' });

      const result = await service.createTransaction({
        subscriptionId: 'sub-1',
        amount: 9.99,
        currency: 'USD',
        status: 'SUCCESS',
        description: 'x',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
      });

      expect(prisma.transaction.create).toHaveBeenCalledOnce();
      expect(result).toEqual({ id: 'tx-1' });
    });
  });

  describe('cancel', () => {
    it('marca CANCELED + FREE y sincroniza users.tier', async () => {
      const canceled = subRow({ status: 'CANCELED', canceledAt: new Date() });
      prisma.subscription.update.mockResolvedValue(canceled);

      const result = await service.cancel('user-1');

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          status: 'CANCELED',
          tier: UserTier.FREE,
          canceledAt: expect.any(Date),
        }),
      });
      expect(users.update).toHaveBeenCalledWith('user-1', {
        tier: UserTier.FREE,
      });
      expect(result.status).toBe('CANCELED');
    });
  });

  describe('getTransactions', () => {
    it('devuelve [] si el usuario no tiene suscripción', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.getTransactions('user-1')).resolves.toEqual([]);
      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
    });

    it('devuelve las transacciones de la suscripción, más recientes primero', async () => {
      prisma.subscription.findUnique.mockResolvedValue(subRow());
      const txs = [{ id: 'tx-2', amount: 199 }, { id: 'tx-1', amount: 9.99 }];
      prisma.transaction.findMany.mockResolvedValue(txs);

      const result = await service.getTransactions('user-1');

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('lookups', () => {
    it('findByGooglePlayToken consulta por googlePlayToken', async () => {
      prisma.subscription.findUnique.mockResolvedValue(subRow());

      await service.findByGooglePlayToken('gp_tok_1');

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { googlePlayToken: 'gp_tok_1' },
      });
    });

    it('findByStripeSubscriptionId consulta por stripeSubscriptionId', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      const result = await service.findByStripeSubscriptionId('sub_ext_9');

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_ext_9' },
      });
      expect(result).toBeNull();
    });
  });
});
