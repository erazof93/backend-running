import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsLatitude, IsLongitude, IsNumber, IsOptional } from 'class-validator';

export class CreateGpsPointDto {
  @ApiProperty({ example: -33.4489, description: 'Latitud en grados decimales' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: -70.6693, description: 'Longitud en grados decimales' })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 570.2, description: 'Altitud en metros' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  altitude?: number;

  @ApiProperty({ example: '2026-09-02T12:34:56.000Z', description: 'Momento de la muestra' })
  @Type(() => Date)
  @IsDate()
  timestamp!: Date;
}
