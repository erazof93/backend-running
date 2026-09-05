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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { PatchUserDto } from './dto/patch-user.dto.js';
import {
  AdminCreateUserDto,
  BulkActionDto,
  ListUsersQueryDto,
} from '../admin-panel/dto/admin-user.dto.js';
import type {
  ActivityItemDto,
  ActivityPointDto,
  AdminUserDto,
} from '../admin-panel/admin-panel.types.js';
import { UserProfileEntity } from './entities/user.entity.js';
import { AdminUsersService } from '../admin-panel/users-admin.service.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminUsers: AdminUsersService,
  ) {}

  // ─────────────────────────── Panel admin (ADMIN/SUPERADMIN) ───────────────
  // Se declaran ANTES de las rutas `:id` para que `/users/activity` no matchee
  // como `:id = "activity"`.

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: listar usuarios (con filtros)' })
  listUsers(@Query() query: ListUsersQueryDto): Promise<AdminUserDto[]> {
    return this.adminUsers.list(query);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: altas de usuarios por día (últimos 30)' })
  usersActivity(): Promise<ActivityPointDto[]> {
    return this.adminUsers.signupsSeries();
  }

  @Get('activity/recent')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: actividades recientes (feed del dashboard)' })
  recentActivity(): Promise<ActivityItemDto[]> {
    return this.adminUsers.recentActivity();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: crear usuario (contraseña temporal)' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  createUser(@Body() dto: AdminCreateUserDto): Promise<AdminUserDto> {
    return this.adminUsers.create(dto);
  }

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ADMIN: acción en lote (ban / promote / delete)' })
  bulkAction(
    @Body() dto: BulkActionDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<{ affected: number }> {
    return this.adminUsers.bulk(dto, current.id);
  }

  // ─────────────────────────────── Perfil / social ─────────────────────────

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
  @ApiOperation({
    summary: 'Actualizar un usuario (propio perfil, o cualquiera si ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'No puedes editar otro perfil' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: PatchUserDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserProfileEntity | AdminUserDto> {
    const isAdmin =
      current.role === Role.ADMIN || current.role === Role.SUPERADMIN;

    if (isAdmin) {
      return this.adminUsers.update(id, dto);
    }
    if (current.id !== id) {
      throw new ForbiddenException('Solo puedes editar tu propio perfil');
    }
    return this.usersService.updateUser(id, {
      name: dto.name,
      email: dto.email,
      bio: dto.bio,
      profilePicture: dto.profilePicture,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ADMIN: eliminar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 409, description: 'No se puede eliminar el último admin' })
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.adminUsers.remove(id, current.id);
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
