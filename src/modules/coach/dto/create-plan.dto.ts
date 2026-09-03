import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Semana 1 - Base aeróbica' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '2026-09-07T00:00:00.000Z', description: 'Lunes de la semana del plan' })
  @Type(() => Date)
  @IsDate()
  weekStart!: Date;

  @ApiPropertyOptional({ example: 'Volumen bajo, foco en técnica' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Lista de sesiones del plan (array JSON)',
    example: [
      { day: 'monday', type: 'easy', distanceKm: 8 },
      { day: 'wednesday', type: 'intervals', sets: '6x800m' },
      { day: 'sunday', type: 'long', distanceKm: 18 },
    ],
  })
  @IsArray()
  exercises!: unknown[];
}
