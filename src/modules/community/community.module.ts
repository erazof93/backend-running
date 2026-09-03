import { Module } from '@nestjs/common';
import { ActivitySocialController } from './activity-social.controller.js';
import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';

@Module({
  controllers: [CommunityController, ActivitySocialController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
