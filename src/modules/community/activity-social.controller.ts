import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { CommunityService } from './community.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import {
  CommentEntity,
  KudoEntity,
  KudoUserEntity,
} from './entities/community.entity.js';

@ApiTags('community')
@Controller()
export class ActivitySocialController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('activities/:id/kudos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar kudo a una actividad (idempotente)' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, type: KudoEntity })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  giveKudo(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<KudoEntity> {
    return this.communityService.giveKudo(id, user.id);
  }

  @Delete('activities/:id/kudos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar el kudo de una actividad' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, description: 'Kudo eliminado' })
  removeKudo(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.communityService.removeKudo(id, user.id);
  }

  @Get('activities/:id/kudos')
  @ApiOperation({ summary: 'Listar quiénes dieron kudo a una actividad' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, type: [KudoUserEntity] })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  getKudos(@Param('id') id: string): Promise<KudoUserEntity[]> {
    return this.communityService.getKudos(id);
  }

  @Post('activities/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comentar en una actividad' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 201, type: CommentEntity })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommentEntity> {
    return this.communityService.createComment(id, user.id, dto);
  }

  @Get('activities/:id/comments')
  @ApiOperation({ summary: 'Listar los comentarios de una actividad' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, type: [CommentEntity] })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  getComments(@Param('id') id: string): Promise<CommentEntity[]> {
    return this.communityService.getComments(id);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Borrar un comentario propio' })
  @ApiParam({ name: 'id', description: 'ID del comentario' })
  @ApiResponse({ status: 200, description: 'Comentario eliminado' })
  @ApiResponse({ status: 403, description: 'No eres el autor del comentario' })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado' })
  deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.communityService.deleteComment(id, user.id);
  }
}
