import { Module } from '@nestjs/common';
import {
  AdminCoachController,
  AdminHealthController,
  ModerationController,
  RevenueController,
  StatsController,
} from './admin-panel.controllers.js';
import { ModerationService } from './moderation.service.js';
import { RevenueService } from './revenue.service.js';
import { StatsService } from './stats.service.js';
import { SystemService } from './system.service.js';

/**
 * Endpoints que consume `admin-velora` (dashboard, ingresos, moderación,
 * salud del sistema). Los de `/users` viven en `UsersModule` para reutilizar
 * ese controlador.
 */
@Module({
  controllers: [
    StatsController,
    RevenueController,
    ModerationController,
    AdminCoachController,
    AdminHealthController,
  ],
  providers: [StatsService, RevenueService, ModerationService, SystemService],
})
export class AdminPanelModule {}
