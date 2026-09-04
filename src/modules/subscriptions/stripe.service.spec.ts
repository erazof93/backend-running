import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserTier } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { StripeService } from './stripe.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

describe('StripeService', () => {
  let service: StripeService;
  let subs: {
    updateByUserId: ReturnType<typeof vi.fn>;
    getByUserId: ReturnType<typeof vi.fn>;
    createTransaction: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };
  let users: { update: ReturnType<typeof vi.fn> };

  const createdEvent = (over: Record<string, unknown> = {}) => ({
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_ext_1',
        customer: 'cus_1',
        latest_invoice: 'in_1',
        metadata: { userId: 'user-1', tier: 'PREMIUM' },
        items: { data: [{ price: { unit_amount: 999, currency: 'usd' } }] },
        ...over,
      },
    },
  });

  beforeEach(async () => {
    subs = {
      updateByUserId: vi.fn().mockResolvedValue({}),
      getByUserId: vi.fn().mockResolvedValue({ id: 'sub-1' }),
      createTransaction: vi.fn().mockResolvedValue({}),
      cancel: vi.fn().mockResolvedValue({}),
    };
    users = { update: vi.fn().mockResolvedValue({}) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: SubscriptionsService, useValue: subs },
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(StripeService);
  });

  describe('createCheckoutSession', () => {
    it('devuelve un sessionId y una url de checkout coherentes', async () => {
      const result = await service.createCheckoutSession('user-1', UserTier.PREMIUM);

      expect(result.sessionId).toMatch(/^cs_test_/);
      expect(result.url).toContain(result.sessionId);
    });
  });

  describe('handleWebhook - customer.subscription.created', () => {
    it('actualiza la suscripción, sincroniza el tier y registra la transacción', async () => {
      await service.handleWebhook(createdEvent());

      expect(subs.updateByUserId).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          tier: UserTier.PREMIUM,
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_ext_1',
          stripeCustomerId: 'cus_1',
          platform: 'stripe',
        }),
      );
      expect(users.update).toHaveBeenCalledWith('user-1', {
        tier: UserTier.PREMIUM,
      });
      expect(subs.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-1',
          amount: 9.99,
          currency: 'USD',
          status: 'SUCCESS',
          description: 'Stripe subscription created - PREMIUM',
          stripeInvoiceId: 'in_1',
        }),
      );
    });

    it('lanza BadRequestException si falta userId o tier en metadata', async () => {
      await expect(
        service.handleWebhook(createdEvent({ metadata: {} })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(subs.updateByUserId).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el tier no está soportado', async () => {
      await expect(
        service.handleWebhook(
          createdEvent({ metadata: { userId: 'user-1', tier: 'GOLD' } }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('usa 0 y USD cuando el price viene incompleto', async () => {
      await service.handleWebhook(createdEvent({ items: { data: [{}] } }));

      expect(subs.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 0, currency: 'USD' }),
      );
    });
  });

  describe('handleWebhook - customer.subscription.deleted', () => {
    it('cancela la suscripción del usuario indicado en metadata', async () => {
      await service.handleWebhook({
        type: 'customer.subscription.deleted',
        data: { object: { metadata: { userId: 'user-1' } } },
      });

      expect(subs.cancel).toHaveBeenCalledWith('user-1');
    });

    it('lanza BadRequestException si falta userId', async () => {
      await expect(
        service.handleWebhook({
          type: 'customer.subscription.deleted',
          data: { object: { metadata: {} } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('ignora eventos no soportados sin efectos secundarios', async () => {
    await service.handleWebhook({ type: 'invoice.paid', data: { object: {} } });

    expect(subs.updateByUserId).not.toHaveBeenCalled();
    expect(subs.cancel).not.toHaveBeenCalled();
  });
});
