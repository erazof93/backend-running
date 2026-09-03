import { ApiProperty } from '@nestjs/swagger';

export class PlanEntity {
  @ApiProperty({ example: 'p1l2a3n4-...' })
  id!: string;

  @ApiProperty({ example: 'f0e1d2c3-...' })
  coachId!: string;

  @ApiProperty({ example: 'Semana 1 - Base aeróbica' })
  name!: string;

  @ApiProperty({ example: '2026-09-07T00:00:00.000Z' })
  weekStart!: Date;

  @ApiProperty({ example: 'Volumen bajo', nullable: true })
  description!: string | null;

  @ApiProperty({
    description: 'Sesiones del plan (JSON)',
    example: [{ day: 'monday', type: 'easy', distanceKm: 8 }],
  })
  exercises!: unknown;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<PlanEntity>) {
    Object.assign(this, partial);
  }
}

export class FeedbackEntity {
  @ApiProperty({ example: 'fb1c2d3e-...' })
  id!: string;

  @ApiProperty({ example: 'a1b2c3d4-...' })
  activityId!: string;

  @ApiProperty({ example: 'f0e1d2c3-...' })
  coachId!: string;

  @ApiProperty({ example: 'Buen control del ritmo.' })
  text!: string;

  @ApiProperty({ example: 4, nullable: true, minimum: 1, maximum: 5 })
  rating!: number | null;

  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<FeedbackEntity>) {
    Object.assign(this, partial);
  }
}
