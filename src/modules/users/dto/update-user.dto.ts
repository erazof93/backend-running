import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'nuevo@example.com', description: 'Nuevo correo (debe ser único)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Ana Corredora', description: 'Nombre visible' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'Maratonista amateur. 10k en 42:00.', description: 'Biografía corta' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/ana.png', description: 'URL de la foto de perfil' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  profilePicture?: string;
}
