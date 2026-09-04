import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../../common/guards/superadmin.guard.js';
import { AdminService } from './admin.service.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { RevokeAdminDto } from './dto/revoke-admin.dto.js';
import { AdminUserEntity } from './entities/admin-user.entity.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-admin')
  @ApiOperation({ summary: 'SUPERADMIN: crear un nuevo usuario ADMIN' })
  @ApiResponse({ status: 201, description: 'ADMIN creado', type: AdminUserEntity })
  @ApiResponse({ status: 400, description: 'El email ya está registrado' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN' })
  createAdmin(@Body() dto: CreateAdminDto): Promise<AdminUserEntity> {
    return this.adminService.createAdmin(dto);
  }

  @Post('revoke-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SUPERADMIN: degradar un ADMIN a CLIENTE' })
  @ApiResponse({ status: 200, description: 'Rol revocado', type: AdminUserEntity })
  @ApiResponse({ status: 400, description: 'El usuario no tiene rol ADMIN' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  revokeAdmin(@Body() dto: RevokeAdminDto): Promise<AdminUserEntity> {
    return this.adminService.revokeAdmin(dto.adminId);
  }
}
