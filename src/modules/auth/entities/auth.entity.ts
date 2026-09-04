import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserEntity {
  @ApiProperty({ example: 'b3f1c2a4-...' })
  id!: string;

  @ApiProperty({ example: 'runner@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.CLIENTE })
  role!: Role;

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

  @ApiProperty({ description: 'JWT de acceso (Bearer)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT de refresco' })
  refreshToken!: string;

  constructor(partial: Partial<AuthEntity>) {
    Object.assign(this, partial);
  }
}
