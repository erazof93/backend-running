import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ example: 'b3f1c2a4-...' })
  id!: string;

  @ApiProperty({ example: 'runner@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

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

  @ApiProperty({ description: 'JWT de acceso (Bearer)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT de refresco' })
  refreshToken!: string;

  constructor(partial: Partial<AuthEntity>) {
    Object.assign(this, partial);
  }
}
