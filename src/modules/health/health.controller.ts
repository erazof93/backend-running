import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * Liveness + readiness. Se sirve SIN el prefijo global (`/health`), tal como
   * lo esperan el healthcheck de Railway y el de docker-compose.
   */
  @Get('health')
  @ApiOperation({ summary: 'Estado del servicio y de la base de datos' })
  @ApiResponse({ status: 200, description: 'Servicio arriba' })
  @ApiResponse({ status: 503, description: 'Base de datos inaccesible' })
  check() {
    return this.health.check();
  }
}
