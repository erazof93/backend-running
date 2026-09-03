import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { CommunityService } from './community.service.js';
import {
  FeedActivityEntity,
  RankingUserEntity,
} from './entities/community.entity.js';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feed de actividades de los usuarios que sigo' })
  @ApiResponse({ status: 200, type: [FeedActivityEntity] })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getFeed(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedActivityEntity[]> {
    return this.communityService.getFeed(user.id);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Ranking semanal por distancia (últimos 7 días)' })
  @ApiResponse({ status: 200, type: [RankingUserEntity] })
  getRanking(): Promise<RankingUserEntity[]> {
    return this.communityService.getWeeklyRanking();
  }
}
