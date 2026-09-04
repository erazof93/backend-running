import { ApiProperty } from '@nestjs/swagger';
import { UserTier } from '@prisma/client';

/**
 * Forma de respuesta de una suscripción. Se usa para la documentación Swagger;
 * el servicio devuelve directamente el modelo Prisma `Subscription`, que es
 * estructuralmente compatible con esta clase.
 */
export class SubscriptionDto {
  @ApiProperty({ example: 'c1s2u3b4-...' })
  id!: string;

  @ApiProperty({ example: 'u1s2e3r4-...' })
  userId!: string;

  @ApiProperty({ enum: UserTier, example: UserTier.PREMIUM })
  tier!: UserTier;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 'stripe' })
  platform!: string;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty({ nullable: true, required: false })
  expiresAt?: Date | null;

  @ApiProperty({ nullable: true, required: false })
  renewsAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TransactionDto {
  @ApiProperty({ example: 't1r2a3n4-...' })
  id!: string;

  @ApiProperty({ example: 'c1s2u3b4-...' })
  subscriptionId!: string;

  @ApiProperty({ example: 9.99 })
  amount!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'SUCCESS' })
  status!: string;

  @ApiProperty({ example: 'Stripe subscription created - PREMIUM' })
  description!: string;

  @ApiProperty()
  billingPeriodStart!: Date;

  @ApiProperty()
  billingPeriodEnd!: Date;

  @ApiProperty()
  createdAt!: Date;
}
