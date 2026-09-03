import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import { GpsPointEntity } from './gps-point.entity.js';

export class ActivityEntity {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ example: 'f0e1d2c3-...' })
  userId!: string;

  @ApiProperty({ example: 'Fondo dominical' })
  title!: string;

  @ApiProperty({ example: 'Ritmo cómodo por el parque', nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ActivityType, example: ActivityType.run })
  activityType!: ActivityType;

  @ApiProperty({ example: 10.5, description: 'Distancia en kilómetros' })
  distance!: number;

  @ApiProperty({ example: 3600, description: 'Duración en segundos' })
  duration!: number;

  @ApiProperty({ example: 'Piernas cansadas', nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [GpsPointEntity], description: 'Ruta GPS (solo en el detalle)' })
  gpsPoints?: GpsPointEntity[];

  constructor(partial: Partial<ActivityEntity>) {
    Object.assign(this, partial);
  }
}
