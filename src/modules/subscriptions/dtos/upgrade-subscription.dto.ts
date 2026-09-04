import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

/**
 * Tiers a los que un usuario puede escalar mediante un pago.
 * (FREE se excluye: es el estado por defecto, no se "compra".)
 */
export enum UpgradeTier {
  PREMIUM = 'PREMIUM',
  PRO_COACHING = 'PRO_COACHING',
}

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: UpgradeTier, example: UpgradeTier.PREMIUM })
  @IsEnum(UpgradeTier)
  tier!: UpgradeTier;
}
