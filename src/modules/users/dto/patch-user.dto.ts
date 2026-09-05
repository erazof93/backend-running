import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus, UserTier } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Body de `PUT /users/:id`. Un usuario normal solo puede tocar name/email/bio/
 * profilePicture de su propio perfil; un ADMIN puede además cambiar tier/status/
 * role de cualquiera. El gateo por rol se hace en el controlador/servicio.
 */
export class PatchUserDto {
  @ApiPropertyOptional({ example: 'Ana Corredora' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'ana@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Maratonista amateur.' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/a.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  profilePicture?: string;

  @ApiPropertyOptional({ enum: UserTier, description: 'Solo ADMIN' })
  @IsOptional()
  @IsEnum(UserTier)
  tier?: UserTier;

  @ApiPropertyOptional({ enum: UserStatus, description: 'Solo ADMIN' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: Role, description: 'Solo ADMIN' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
