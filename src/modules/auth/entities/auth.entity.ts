import { ApiProperty } from '@nestjs/swagger';
import { Role, UserTier } from '@prisma/client';

export class UserEntity {
  @ApiProperty({ example: 'b3f1c2a4-...' })
  id!: string;

  @ApiProperty({ example: 'runner@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.CLIENTE })
  role!: Role;

  @ApiProperty({ enum: UserTier, example: UserTier.FREE })
  tier!: UserTier;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class AuthEntity {
  @ApiProperty({ example: 'b3f1c2a4-...' })
  id!: string;

  @ApiProperty({ example: 'runner@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.CLIENTE })
  role!: Role;

  @ApiProperty({ enum: UserTier, example: UserTier.FREE })
  tier!: UserTier;

  @ApiProperty({ description: 'JWT de acceso (Bearer)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT de refresco' })
  refreshToken!: string;

  constructor(partial: Partial<AuthEntity>) {
    Object.assign(this, partial);
  }
}
