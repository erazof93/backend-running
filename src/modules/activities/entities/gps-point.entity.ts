import { ApiProperty } from '@nestjs/swagger';

export class GpsPointEntity {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ example: -33.4489 })
  latitude!: number;

  @ApiProperty({ example: -70.6693 })
  longitude!: number;

  @ApiProperty({ example: 570.2, nullable: true })
  altitude!: number | null;

  @ApiProperty({ example: '2026-09-02T12:34:56.000Z' })
  timestamp!: Date;

  @ApiProperty({ example: 0, description: 'Posición dentro de la ruta' })
  order!: number;

  constructor(partial: Partial<GpsPointEntity>) {
    Object.assign(this, partial);
  }
}
