import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus, UserTier } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Filtros de `GET /users` (admin). */
export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 'ana' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: UserTier })
  @IsOptional()
  @IsEnum(UserTier)
  tier?: UserTier;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'SUSPENDED';
}

/** Alta de usuario desde el panel admin (contraseña temporal autogenerada). */
export class AdminCreateUserDto {
  @ApiPropertyOptional({ example: 'Ana Corredora' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'ana@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: UserTier })
  @IsOptional()
  @IsEnum(UserTier)
  tier?: UserTier;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'SUSPENDED';
}

/** Edición de usuario desde el panel admin. */
export class AdminUpdateUserDto {
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

  @ApiPropertyOptional({ enum: UserTier })
  @IsOptional()
  @IsEnum(UserTier)
  tier?: UserTier;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

/** `POST /users/bulk-action`. */
export class BulkActionDto {
  @ApiPropertyOptional({ example: ['id-1', 'id-2'] })
  @IsString({ each: true })
  ids!: string[];

  @ApiPropertyOptional({ enum: ['ban', 'promote', 'delete'] })
  @IsIn(['ban', 'promote', 'delete'])
  action!: 'ban' | 'promote' | 'delete';
}
