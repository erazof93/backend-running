import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller.js';
import { CoachService } from './coach.service.js';
import { CoachApplicationsController } from './coach-applications.controller.js';
import { CoachApplicationsService } from './coach-applications.service.js';

@Module({
  controllers: [CoachController, CoachApplicationsController],
  providers: [CoachService, CoachApplicationsService],
  exports: [CoachService],
})
export class CoachModule {}
