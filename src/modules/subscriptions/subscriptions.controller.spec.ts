import { Test, type TestingModule } from '@nestjs/testing';
import { UserTier } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { GooglePlayService } from './google-play.service.js';
import { StripeService } from './stripe.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let subs: Record<string, ReturnType<typeof vi.fn>>;
  let stripe: Record<string, ReturnType<typeof vi.fn>>;
  let googlePlay: Record<string, ReturnType<typeof vi.fn>>;

  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'runner@example.com',
    name: 'Ana',
  };

  beforeEach(async () => {
    subs = {
      getByUserId: vi.fn().mockResolvedValue({ id: 'sub-1', tier: 'FREE' }),
      cancel: vi.fn().mockResolvedValue({ id: 'sub-1', status: 'CANCELED' }),
      getTransactions: vi.fn().mockResolvedValue([]),
    };
    stripe = {
      createCheckoutSession: vi
        .fn()
        .mockResolvedValue({ sessionId: 'cs_test_x', url: 'https://pay/cs_test_x' }),
      handleWebhook: vi.fn().mockResolvedValue(undefined),
    };
    googlePlay = { handleWebhook: vi.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        { provide: SubscriptionsService, useValue: subs },
        { provide: StripeService, useValue: stripe },
        { provide: GooglePlayService, useValue: googlePlay },
      ],
    }).compile();

    controller = moduleRef.get(SubscriptionsController);
  });

  it('GET /me delega en subscriptionsService.getByUserId', async () => {
    await controller.getMySubscription(user);
    expect(subs.getByUserId).toHaveBeenCalledWith('user-1');
  });

  it('POST /stripe/checkout pasa el userId y el tier del DTO', async () => {
    const result = await controller.stripeCheckout(user, {
      tier: UserTier.PREMIUM as never,
    });

    expect(stripe.createCheckoutSession).toHaveBeenCalledWith(
      'user-1',
      UserTier.PREMIUM,
    );
    expect(result.sessionId).toBe('cs_test_x');
  });

  it('POST /stripe/webhook reenvía el evento y responde { received: true }', async () => {
    const event = { type: 'customer.subscription.created' };

    await expect(controller.stripeWebhook(event)).resolves.toEqual({
      received: true,
    });
    expect(stripe.handleWebhook).toHaveBeenCalledWith(event);
  });

  it('POST /google-play/webhook reenvía el mensaje y responde { received: true }', async () => {
    const message = { subscriptionNotification: {} };

    await expect(controller.googlePlayWebhook(message)).resolves.toEqual({
      received: true,
    });
    expect(googlePlay.handleWebhook).toHaveBeenCalledWith(message);
  });

  it('POST /cancel delega en subscriptionsService.cancel', async () => {
    const result = await controller.cancelSubscription(user);

    expect(subs.cancel).toHaveBeenCalledWith('user-1');
    expect(result.status).toBe('CANCELED');
  });

  it('GET /transactions delega en subscriptionsService.getTransactions', async () => {
    await controller.getTransactions(user);
    expect(subs.getTransactions).toHaveBeenCalledWith('user-1');
  });
});
