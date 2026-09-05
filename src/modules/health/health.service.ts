import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { round2 } from '../../common/pricing.js';

/**
 * Superset: mantiene los campos que espera Railway (`status`, `db`, `uptime`,
 * `timestamp`) y añade los que consume el panel admin (`SystemHealth`).
 */
export interface HealthReport {
  status: 'ok';
  db: 'up';
  database: 'up';
  api: 'up';
  uptime: number;
  uptimePct: number;
  latencyMs: { p50: number; p95: number; p99: number };
  checkedAt: string;
  startedAt: string;
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthReport> {
    const latency: number[] = [];
    // 1) ¿Hay conexión a la BD? (no depende de ninguna tabla)
    try {
      for (let i = 0; i < 3; i += 1) {
        const t0 = performance.now();
        await this.prisma.$queryRaw`SELECT 1`;
        latency.push(round2(performance.now() - t0));
      }
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'down',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }

    // 2) ¿Está el esquema aplicado? Un deploy sin migraciones responde a
    //    `SELECT 1` pero rompe cualquier endpoint real con 500.
    try {
      await this.prisma.user.count();
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        db: 'schema-missing',
        database: 'down',
        hint: 'La BD conecta pero faltan tablas. Ejecuta `prisma migrate deploy` contra DATABASE_URL.',
        timestamp: new Date().toISOString(),
      });
    }

    const now = new Date();
    const uptimeSec = Math.round(process.uptime());
    const sorted = [...latency].sort((a, b) => a - b);

    return {
      status: 'ok',
      db: 'up',
      database: 'up',
      api: 'up',
      uptime: uptimeSec,
      uptimePct: 100,
      latencyMs: {
        p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
        p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0,
        p99: sorted[sorted.length - 1] ?? 0,
      },
      checkedAt: now.toISOString(),
      startedAt: new Date(now.getTime() - uptimeSec * 1000).toISOString(),
      timestamp: now.toISOString(),
    };
  }
}
