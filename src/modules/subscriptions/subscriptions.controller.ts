import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { SubscriptionDto, TransactionDto } from './dtos/subscription.dto.js';
import { UpgradeSubscriptionDto } from './dtos/upgrade-subscription.dto.js';
import { GooglePlayService } from './google-play.service.js';
import { StripeService } from './stripe.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
    private readonly googlePlayService: GooglePlayService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suscripción del usuario autenticado' })
  @ApiResponse({ status: 200, type: SubscriptionDto })
  getMySubscription(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubscriptionDto> {
    return this.subscriptionsService.getByUserId(user.id);
  }

  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una sesión de checkout de Stripe' })
  stripeCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpgradeSubscriptionDto,
  ): Promise<{ sessionId: string; url: string }> {
    return this.stripeService.createCheckoutSession(user.id, dto.tier);
  }

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Webhook de eventos de Stripe' })
  async stripeWebhook(@Body() event: any): Promise<{ received: true }> {
    await this.stripeService.handleWebhook(event);
    return { received: true };
  }

  @Post('google-play/webhook')
  @ApiOperation({ summary: 'Webhook (Pub/Sub) de Google Play Billing' })
  async googlePlayWebhook(
    @Body() message: any,
  ): Promise<{ received: true }> {
    await this.googlePlayService.handleWebhook(message);
    return { received: true };
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela la suscripción y vuelve a FREE' })
  @ApiResponse({ status: 200, type: SubscriptionDto })
  cancelSubscription(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubscriptionDto> {
    return this.subscriptionsService.cancel(user.id);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historial de transacciones del usuario' })
  @ApiResponse({ status: 200, type: [TransactionDto] })
  getTransactions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransactionDto[]> {
    return this.subscriptionsService.getTransactions(user.id);
  }
}
