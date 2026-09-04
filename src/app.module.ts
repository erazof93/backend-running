import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ActivitiesModule } from './modules/activities/activities.module.js';
import { CoachModule } from './modules/coach/coach.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
    CoachModule,
    CommunityModule,
    SubscriptionsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
