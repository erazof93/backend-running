import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { ModerationActionDto } from './dto/moderation-action.dto.js';
import { ModerationService } from './moderation.service.js';
import { RevenueService } from './revenue.service.js';
import { StatsService } from './stats.service.js';
import { SystemService } from './system.service.js';
import type {
  ChurnPointDto,
  DashboardStatsDto,
  ErrorRatePointDto,
  FlaggedCommentDto,
  HealthMetricsDto,
  ModerationHistoryEntryDto,
  ModerationStatsDto,
  ReportedUserDto,
  RevenueBundleDto,
  RevenueCoachDto,
  TopCoachDto,
  UptimeStatsDto,
} from './admin-panel.types.js';

@ApiTags('admin-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'ADMIN: métricas del dashboard' })
  get(): Promise<DashboardStatsDto> {
    return this.stats.dashboard();
  }
}

@ApiTags('admin-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenue: RevenueService) {}

  @Get()
  @ApiOperation({ summary: 'ADMIN: resumen de ingresos (MRR, tiers, churn)' })
  overview(): Promise<RevenueBundleDto> {
    return this.revenue.bundle();
  }

  @Get('top-coaches')
  @ApiOperation({ summary: 'ADMIN: coaches por MRR' })
  topCoaches(): Promise<RevenueCoachDto[]> {
    return this.revenue.topCoaches();
  }

  @Get('churn')
  @ApiOperation({ summary: 'ADMIN: churn diario (últimos 30 días)' })
  churn(): Promise<ChurnPointDto[]> {
    return this.revenue.churn();
  }
}

@ApiTags('admin-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('flagged')
  @ApiOperation({ summary: 'ADMIN: comentarios reportados pendientes' })
  flagged(): Promise<FlaggedCommentDto[]> {
    return this.moderation.getFlagged();
  }

  @Get('users')
  @ApiOperation({ summary: 'ADMIN: usuarios más reportados' })
  users(): Promise<ReportedUserDto[]> {
    return this.moderation.getReportedUsers();
  }

  @Get('history')
  @ApiOperation({ summary: 'ADMIN: historial de acciones de moderación' })
  history(): Promise<ModerationHistoryEntryDto[]> {
    return this.moderation.getHistory();
  }

  @Get('stats')
  @ApiOperation({ summary: 'ADMIN: contadores de moderación' })
  stats(): Promise<ModerationStatsDto> {
    return this.moderation.getStats();
  }

  @Post('action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ADMIN: aplicar acción (approve/reject/delete/ban)' })
  action(
    @Body() dto: ModerationActionDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<{ affected: number }> {
    return this.moderation.action(dto, current.id);
  }
}

@ApiTags('admin-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('coach')
export class AdminCoachController {
  constructor(private readonly system: SystemService) {}

  @Get('top')
  @ApiOperation({ summary: 'ADMIN: top coaches por ingresos (dashboard)' })
  top(): Promise<TopCoachDto[]> {
    return this.system.topCoaches();
  }
}

@ApiTags('admin-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('health')
export class AdminHealthController {
  constructor(private readonly system: SystemService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'ADMIN: latencia y tasa de éxito' })
  metrics(): Promise<HealthMetricsDto> {
    return this.system.metrics();
  }

  @Get('errors')
  @ApiOperation({ summary: 'ADMIN: tasa de errores por día' })
  errors(): ErrorRatePointDto[] {
    return this.system.errors();
  }

  @Get('uptime')
  @ApiOperation({ summary: 'ADMIN: uptime (24h / 7d / 30d)' })
  uptime(): UptimeStatsDto {
    return this.system.uptime();
  }
}
