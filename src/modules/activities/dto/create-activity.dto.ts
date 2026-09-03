import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: 'Fondo dominical' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Ritmo cómodo por el parque' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: ActivityType, example: ActivityType.run })
  @IsEnum(ActivityType)
  activityType!: ActivityType;

  @ApiProperty({ example: 10.5, description: 'Distancia en kilómetros' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  distance!: number;

  @ApiProperty({ example: 3600, description: 'Duración en segundos' })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({ example: 'Piernas cansadas del gimnasio' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
