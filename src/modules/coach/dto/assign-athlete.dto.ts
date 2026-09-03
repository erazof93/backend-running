import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignAthleteDto {
  @ApiPropertyOptional({ example: 'Viene de lesión de gemelo, carga progresiva' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
