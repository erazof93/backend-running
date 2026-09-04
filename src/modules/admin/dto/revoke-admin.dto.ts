import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class RevokeAdminDto {
  @ApiProperty({
    example: 'b3f1c2a4-0000-0000-0000-000000000000',
    description: 'ID del usuario ADMIN a degradar a CLIENTE',
  })
  @IsString()
  @IsUUID()
  adminId!: string;
}
