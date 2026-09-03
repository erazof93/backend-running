import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Post,
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
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserProfileEntity } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: UserProfileEntity })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getUser(@Param('id') id: string): Promise<UserProfileEntity> {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el perfil propio' })
  @ApiParam({ name: 'id', description: 'ID del usuario (debe ser el propio)' })
  @ApiResponse({ status: 200, type: UserProfileEntity })
  @ApiResponse({ status: 403, description: 'No puedes editar otro perfil' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserProfileEntity> {
    if (current.id !== id) {
      throw new ForbiddenException('Solo puedes editar tu propio perfil');
    }
    return this.usersService.updateUser(id, dto);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Actividades del usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de actividades' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getActivities(@Param('id') id: string): Promise<unknown[]> {
    return this.usersService.getUserActivities(id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Usuarios que siguen a este usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: [UserProfileEntity] })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getFollowers(@Param('id') id: string): Promise<UserProfileEntity[]> {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Usuarios que este usuario sigue' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: [UserProfileEntity] })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getFollowing(@Param('id') id: string): Promise<UserProfileEntity[]> {
    return this.usersService.getFollowing(id);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seguir a un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a seguir' })
  @ApiResponse({ status: 200, type: UserProfileEntity })
  @ApiResponse({ status: 400, description: 'No puedes seguirte a ti mismo' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  follow(
    @Param('id') id: string,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserProfileEntity> {
    return this.usersService.followUser(current.id, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dejar de seguir a un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a dejar de seguir' })
  @ApiResponse({ status: 200, type: UserProfileEntity })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  unfollow(
    @Param('id') id: string,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserProfileEntity> {
    return this.usersService.unfollowUser(current.id, id);
  }
}
