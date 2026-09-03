import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BecomeCoachDto {
  @ApiPropertyOptional({ example: 'Entrenador certicado nivel II. Fondo y trail.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
