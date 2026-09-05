import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CoachApplicationStatus } from '@prisma/client';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import {
  ReviewCoachApplicationDto,
  SubmitCoachApplicationDto,
} from './dto/coach-application.dto.js';
import {
  CoachApplicationsService,
  type CoachApplicationView,
  type MyCoachApplication,
} from './coach-applications.service.js';

@ApiTags('coach')
@Controller('coach')
export class CoachApplicationsController {
  constructor(private readonly applications: CoachApplicationsService) {}

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar ser coach' })
  @ApiResponse({ status: 201, description: 'Solicitud registrada' })
  @ApiResponse({ status: 409, description: 'Ya eres coach o tienes una solicitud pendiente' })
  submit(
    @Body() dto: SubmitCoachApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyCoachApplication> {
    return this.applications.submit(user.id, dto);
  }

  @Get('applications/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de mi solicitud de coach (null si no hay)' })
  mine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyCoachApplication | null> {
    return this.applications.mine(user.id);
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: listar solicitudes de coach' })
  @ApiQuery({ name: 'status', required: false, enum: CoachApplicationStatus })
  list(
    @Query('status') status?: CoachApplicationStatus,
  ): Promise<CoachApplicationView[]> {
    const valid =
      status && Object.values(CoachApplicationStatus).includes(status)
        ? status
        : undefined;
    return this.applications.list(valid);
  }

  @Post('applications/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ADMIN: aprobar (crea el coach y promueve el rol)' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiResponse({ status: 409, description: 'La solicitud ya fue revisada' })
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewCoachApplicationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<CoachApplicationView> {
    return this.applications.approve(id, admin.id, dto);
  }

  @Post('applications/:id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ADMIN: rechazar la solicitud' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewCoachApplicationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<CoachApplicationView> {
    return this.applications.reject(id, admin.id, dto);
  }
}
