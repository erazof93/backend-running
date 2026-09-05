import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserTier } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** `POST /coach/applications` — el usuario pide ser coach. */
export class SubmitCoachApplicationDto {
  @ApiProperty({ example: '+34 600 123 456' })
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: '8 años entrenando corredores populares, nivel II.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  experience!: string;

  @ApiPropertyOptional({ example: 'Fondo y trail. Enfoque en técnica y ritmo.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

/** `POST /coach/applications/:id/approve|reject`. */
export class ReviewCoachApplicationDto {
  @ApiPropertyOptional({ example: 'Perfil validado por videollamada.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ enum: UserTier, description: 'Solo en approve: tier a asignar' })
  @IsOptional()
  @IsEnum(UserTier)
  tier?: UserTier;
}
