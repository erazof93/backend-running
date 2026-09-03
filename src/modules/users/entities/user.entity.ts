import { ApiProperty } from '@nestjs/swagger';

/**
 * Representación pública de un usuario (nunca incluye `passwordHash`).
 * Se llama `UserProfileEntity` para no colisionar en el esquema OpenAPI con
 * el `UserEntity` mínimo del módulo auth.
 */
export class UserProfileEntity {
  @ApiProperty({ example: 'b3f1c2a4-...' })
  id!: string;

  @ApiProperty({ example: 'runner@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ example: 'Maratonista amateur.', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/a.png', nullable: true })
  profilePicture!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ example: 12, description: 'Cantidad de usuarios que lo siguen' })
  followerCount!: number;

  @ApiProperty({ example: 8, description: 'Cantidad de usuarios que sigue' })
  followingCount!: number;

  constructor(partial: Partial<UserProfileEntity>) {
    Object.assign(this, partial);
  }
}
