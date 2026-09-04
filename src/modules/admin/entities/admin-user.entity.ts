import { ApiProperty } from '@nestjs/swagger';
import { Role, UserTier } from '@prisma/client';

export class AdminUserEntity {
  @ApiProperty({ example: 'b3f1c2a4-...' })
  id!: string;

  @ApiProperty({ example: 'admin@velora.com' })
  email!: string;

  @ApiProperty({ example: 'Ada Admin' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role!: Role;

  @ApiProperty({ enum: UserTier, example: UserTier.FREE })
  tier!: UserTier;

  @ApiProperty({ example: '2026-09-04T12:00:00.000Z' })
  createdAt!: Date;

  constructor(partial: Partial<AdminUserEntity>) {
    Object.assign(this, partial);
  }
}
