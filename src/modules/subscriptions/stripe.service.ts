import { BadRequestException, Injectable } from '@nestjs/common';
import { UserTier } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

const BILLING_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Integración Stripe (simplificada). En producción se reemplaza el cuerpo de
 * `createCheckoutSession` / la verificación de firma por la librería `stripe`.
 */
@Injectable()
export class StripeService {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usersService: UsersService,
  ) {}

  async createCheckoutSession(
    userId: string,
    tier: UserTier,
  ): Promise<{ sessionId: string; url: string }> {
    const sessionId = `cs_test_${Math.random().toString(36).slice(2, 15)}`;

    // El userId/tier viajarían como `client_reference_id` + `metadata` en la
    // sesión real de Stripe, y volverían en el webhook.
    void userId;
    void tier;

    return {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
    };
  }

  async handleWebhook(event: any): Promise<void> {
    switch (event?.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      default:
        // Evento no manejado: se ignora silenciosamente (Stripe reintenta solo
        // los que devuelven error).
        break;
    }
  }

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    const userId: string | undefined = subscription?.metadata?.userId;
    const rawTier: string | undefined = subscription?.metadata?.tier;

    if (!userId || !rawTier) {
      throw new BadRequestException('Missing userId or tier in metadata');
    }
    const tier = this.parseTier(rawTier);

    await this.subscriptionsService.updateByUserId(userId, {
      tier,
      status: 'ACTIVE',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      platform: 'stripe',
    });

    await this.usersService.update(userId, { tier });

    const sub = await this.subscriptionsService.getByUserId(userId);
    const price = subscription?.items?.data?.[0]?.price ?? {};
    const now = new Date();

    await this.subscriptionsService.createTransaction({
      subscriptionId: sub.id,
      amount: (price.unit_amount ?? 0) / 100,
      currency: (price.currency ?? 'usd').toUpperCase(),
      status: 'SUCCESS',
      description: `Stripe subscription created - ${tier}`,
      stripeInvoiceId: subscription?.latest_invoice ?? null,
      billingPeriodStart: now,
      billingPeriodEnd: new Date(now.getTime() + BILLING_PERIOD_MS),
    });
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const userId: string | undefined = subscription?.metadata?.userId;
    if (!userId) {
      throw new BadRequestException('Missing userId in metadata');
    }
    await this.subscriptionsService.cancel(userId);
  }

  private parseTier(value: string): UserTier {
    if (value === UserTier.PREMIUM || value === UserTier.PRO_COACHING) {
      return value;
    }
    throw new BadRequestException(`Tier no soportado: ${value}`);
  }
}
