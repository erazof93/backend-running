import { Injectable } from '@nestjs/common';
import type { Prisma, Subscription, Transaction } from '@prisma/client';
import { UserTier } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Devuelve la suscripción del usuario. Si no existe todavía, crea una
   * suscripción FREE por defecto (así el resto del sistema siempre tiene fila).
   */
  async getByUserId(userId: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    return subscription ?? this.createFreeSubscription(userId);
  }

  async createFreeSubscription(userId: string): Promise<Subscription> {
    return this.prisma.subscription.create({
      data: {
        userId,
        tier: UserTier.FREE,
        status: 'ACTIVE',
        platform: 'none',
      },
    });
  }

  async create(data: Prisma.SubscriptionCreateInput): Promise<Subscription> {
    return this.prisma.subscription.create({ data });
  }

  async update(
    id: string,
    data: Prisma.SubscriptionUpdateInput,
  ): Promise<Subscription> {
    return this.prisma.subscription.update({ where: { id }, data });
  }

  /**
   * Upsert por `userId`: crea la suscripción si el usuario aún no tiene una,
   * o la actualiza si ya existe. Evita fallos cuando el webhook llega antes
   * de que se haya materializado la fila FREE.
   */
  async updateByUserId(
    userId: string,
    data: Prisma.SubscriptionUpdateInput & { tier?: UserTier; status?: string },
  ): Promise<Subscription> {
    return this.prisma.subscription.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        tier: data.tier ?? UserTier.FREE,
        status: data.status ?? 'ACTIVE',
        platform:
          typeof data.platform === 'string' ? data.platform : 'stripe',
        stripeSubscriptionId:
          typeof data.stripeSubscriptionId === 'string'
            ? data.stripeSubscriptionId
            : undefined,
        stripeCustomerId:
          typeof data.stripeCustomerId === 'string'
            ? data.stripeCustomerId
            : undefined,
        googlePlayToken:
          typeof data.googlePlayToken === 'string'
            ? data.googlePlayToken
            : undefined,
        googlePlaySubscriptionId:
          typeof data.googlePlaySubscriptionId === 'string'
            ? data.googlePlaySubscriptionId
            : undefined,
      },
    });
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELED',
        tier: UserTier.FREE,
        canceledAt: new Date(),
      },
    });
    // Mantener sincronizado el espejo `users.tier`.
    await this.usersService.update(userId, { tier: UserTier.FREE });
    return subscription;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) {
      return [];
    }

    return this.prisma.transaction.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransaction(
    data: Prisma.TransactionUncheckedCreateInput,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({ data });
  }

  async findByGooglePlayToken(token: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { googlePlayToken: token },
    });
  }

  async findByStripeSubscriptionId(id: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: id },
    });
  }
}
