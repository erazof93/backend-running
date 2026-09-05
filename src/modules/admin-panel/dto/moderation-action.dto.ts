import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * `POST /moderation/action`.
 * - Individual: `{ commentId, action, reason? }`
 * - En lote:   `{ action: 'approve' | 'reject', bulk: true }`
 */
export class ModerationActionDto {
  @ApiPropertyOptional({ example: 'comment-uuid' })
  @IsOptional()
  @IsString()
  commentId?: string;

  @ApiProperty({ enum: ['approve', 'reject', 'delete', 'ban'] })
  @IsIn(['approve', 'reject', 'delete', 'ban'])
  action!: 'approve' | 'reject' | 'delete' | 'ban';

  @ApiPropertyOptional({ example: 'Lenguaje ofensivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  bulk?: boolean;
}
