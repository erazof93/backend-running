import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { GooglePlayService } from './google-play.service.js';
import { StripeService } from './stripe.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  imports: [UsersModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService, GooglePlayService],
  exports: [SubscriptionsService, StripeService, GooglePlayService],
})
export class SubscriptionsModule {}
