import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface HealthReport {
  status: 'ok';
  db: 'up';
  uptime: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthReport> {
    // 1) ¿Hay conexión a la BD? (no depende de ninguna tabla)
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'down',
        timestamp: new Date().toISOString(),
      });
    }

    // 2) ¿Está el esquema aplicado? Un deploy sin migraciones responde a
    //    `SELECT 1` pero rompe cualquier endpoint real con 500. Lo detectamos
    //    aquí para no reportar "ok" en falso.
    try {
      await this.prisma.user.count();
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        db: 'schema-missing',
        hint: 'La BD conecta pero faltan tablas. Ejecuta `prisma migrate deploy` contra DATABASE_URL (conexión directa, puerto 5432).',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      db: 'up',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
