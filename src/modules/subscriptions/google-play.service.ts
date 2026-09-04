import { BadRequestException, Injectable } from '@nestjs/common';
import { UserTier } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

// Real Time Developer Notification types (Google Play Billing).
const NOTIF_RENEWED = 2;
const NOTIF_CANCELED = 3;
const NOTIF_PURCHASED = 4;

/**
 * Integración Google Play Billing (simplificada). En producción se valida la
 * firma del mensaje Pub/Sub y se consulta la Android Publisher API para
 * resolver el `userId` a partir del `obfuscatedExternalAccountId`.
 */
@Injectable()
export class GooglePlayService {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usersService: UsersService,
  ) {}

  async handleWebhook(message: any): Promise<void> {
    const notification = message?.subscriptionNotification;
    if (!notification) {
      // Otros tipos (test/voided/oneTimeProduct): se ignoran.
      return;
    }

    switch (notification.notificationType) {
      case NOTIF_PURCHASED:
        await this.handlePurchase(notification);
        break;
      case NOTIF_RENEWED:
        await this.handleRenewal(notification);
        break;
      case NOTIF_CANCELED:
        await this.handleCancellation(notification);
        break;
      default:
        break;
    }
  }

  private async handlePurchase(notification: any): Promise<void> {
    const token: string | undefined = notification?.purchaseToken;
    const subscriptionId: string | undefined = notification?.subscriptionId;
    const userId: string | undefined = notification?.userId;

    if (!token || !subscriptionId || !userId) {
      throw new BadRequestException(
        'Missing purchaseToken, subscriptionId or userId',
      );
    }

    const tier =
      subscriptionId === 'premium_monthly'
        ? UserTier.PREMIUM
        : UserTier.PRO_COACHING;

    await this.subscriptionsService.updateByUserId(userId, {
      tier,
      status: 'ACTIVE',
      googlePlayToken: token,
      googlePlaySubscriptionId: subscriptionId,
      platform: 'google_play',
    });

    await this.usersService.update(userId, { tier });
  }

  private async handleRenewal(notification: any): Promise<void> {
    const token: string | undefined = notification?.purchaseToken;
    if (!token) {
      throw new BadRequestException('Missing purchaseToken');
    }

    const subscription =
      await this.subscriptionsService.findByGooglePlayToken(token);
    if (!subscription) {
      return;
    }

    const renewsAt = notification?.expiryTimeMillis
      ? new Date(Number(notification.expiryTimeMillis))
      : undefined;

    await this.subscriptionsService.update(subscription.id, {
      status: 'ACTIVE',
      renewsAt,
    });
  }

  private async handleCancellation(notification: any): Promise<void> {
    const token: string | undefined = notification?.purchaseToken;
    if (!token) {
      throw new BadRequestException('Missing purchaseToken');
    }

    const subscription =
      await this.subscriptionsService.findByGooglePlayToken(token);
    if (subscription) {
      await this.subscriptionsService.cancel(subscription.userId);
    }
  }
}
