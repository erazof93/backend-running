import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'runner@example.com', description: 'Correo del usuario' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'superSecret123', minLength: 8, description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
