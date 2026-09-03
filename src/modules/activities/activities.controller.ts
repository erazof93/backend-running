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
import { ActivitiesService } from './activities.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { CreateGpsPointDto } from './dto/create-gps-point.dto.js';
import { ActivityEntity } from './entities/activity.entity.js';
import { GpsPointEntity } from './entities/gps-point.entity.js';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una actividad (entrenamiento)' })
  @ApiResponse({ status: 201, type: ActivityEntity })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ActivityEntity> {
    return this.activitiesService.createActivity(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una actividad con su ruta GPS' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, type: ActivityEntity })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  getOne(@Param('id') id: string): Promise<ActivityEntity> {
    return this.activitiesService.getActivity(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una actividad propia' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, type: ActivityEntity })
  @ApiResponse({ status: 403, description: 'No eres el propietario' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ActivityEntity> {
    return this.activitiesService.updateActivity(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una actividad propia' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, description: 'Actividad eliminada' })
  @ApiResponse({ status: 403, description: 'No eres el propietario' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.activitiesService.deleteActivity(id, user.id);
  }

  @Post(':id/gps-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar un punto GPS a la ruta' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 201, type: GpsPointEntity })
  @ApiResponse({ status: 403, description: 'No eres el propietario' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  addGpsPoint(
    @Param('id') id: string,
    @Body() dto: CreateGpsPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GpsPointEntity> {
    return this.activitiesService.addGpsPoint(id, user.id, dto);
  }

  @Get(':id/gps-points')
  @ApiOperation({ summary: 'Obtener la ruta GPS ordenada por tiempo' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, type: [GpsPointEntity] })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  getGpsPoints(@Param('id') id: string): Promise<GpsPointEntity[]> {
    return this.activitiesService.getGpsPoints(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar las actividades de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: [ActivityEntity] })
  getUserActivities(
    @Param('userId') userId: string,
  ): Promise<ActivityEntity[]> {
    return this.activitiesService.getUserActivities(userId);
  }
}
