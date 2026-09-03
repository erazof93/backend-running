import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { CoachService } from './coach.service.js';
import { BecomeCoachDto } from './dto/become-coach.dto.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { AssignAthleteDto } from './dto/assign-athlete.dto.js';
import {
  AthleteProfileEntity,
  CoachAthleteEntity,
  CoachEntity,
} from './entities/coach.entity.js';
import { FeedbackEntity, PlanEntity } from './entities/plan.entity.js';

@ApiTags('coach')
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrarse como coach (idempotente)' })
  @ApiResponse({ status: 200, type: CoachEntity })
  becomeCoach(
    @Body() dto: BecomeCoachDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CoachEntity> {
    return this.coachService.becomeCoach(user.id, dto);
  }

  @Get('athletes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis atletas' })
  @ApiResponse({ status: 200, type: [CoachAthleteEntity] })
  @ApiResponse({ status: 403, description: 'No estás registrado como coach' })
  getMyAthletes(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CoachAthleteEntity[]> {
    return this.coachService.getMyAthletes(user.id);
  }

  @Get('athletes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil detallado de un atleta asignado' })
  @ApiParam({ name: 'id', description: 'ID del atleta' })
  @ApiResponse({ status: 200, type: AthleteProfileEntity })
  @ApiResponse({ status: 403, description: 'Atleta no asignado a ti' })
  getAthleteProfile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AthleteProfileEntity> {
    return this.coachService.getAthleteProfile(user.id, id);
  }

  @Post('athletes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar un atleta a mi roster (idempotente)' })
  @ApiParam({ name: 'id', description: 'ID del atleta' })
  @ApiResponse({ status: 200, type: CoachAthleteEntity })
  @ApiResponse({ status: 404, description: 'Atleta no encontrado' })
  assignAthlete(
    @Param('id') id: string,
    @Body() dto: AssignAthleteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CoachAthleteEntity> {
    return this.coachService.assignAthlete(user.id, id, dto.notes);
  }

  @Delete('athletes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar un atleta de mi roster' })
  @ApiParam({ name: 'id', description: 'ID del atleta' })
  @ApiResponse({ status: 200, description: 'Atleta removido' })
  removeAthlete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.coachService.removeAthlete(user.id, id);
  }

  @Post('plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un plan de entrenamiento semanal' })
  @ApiResponse({ status: 201, type: PlanEntity })
  @ApiResponse({ status: 403, description: 'No estás registrado como coach' })
  createPlan(
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PlanEntity> {
    return this.coachService.createPlan(user.id, dto);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Obtener un plan detallado' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, type: PlanEntity })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  getPlan(@Param('id') id: string): Promise<PlanEntity> {
    return this.coachService.getPlan(id);
  }

  @Put('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un plan propio' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, type: PlanEntity })
  @ApiResponse({ status: 403, description: 'No eres el propietario del plan' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PlanEntity> {
    return this.coachService.updatePlan(id, user.id, dto);
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un plan propio' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, description: 'Plan eliminado' })
  @ApiResponse({ status: 403, description: 'No eres el propietario del plan' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  deletePlan(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.coachService.deletePlan(id, user.id);
  }

  @Post('athletes/:id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar feedback sobre una actividad del atleta' })
  @ApiParam({ name: 'id', description: 'ID del atleta' })
  @ApiResponse({ status: 201, type: FeedbackEntity })
  @ApiResponse({ status: 400, description: 'La actividad no pertenece al atleta' })
  @ApiResponse({ status: 403, description: 'Atleta no asignado a ti' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  giveFeedback(
    @Param('id') id: string,
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedbackEntity> {
    return this.coachService.giveFeedback(user.id, id, dto);
  }
}
