import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin@velora.com', description: 'Correo del nuevo ADMIN' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Ada Admin', description: 'Nombre visible del ADMIN' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'superSecret123', minLength: 8, description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
