import { ApiProperty } from '@nestjs/swagger';

export class CoachEntity {
  @ApiProperty({ example: 'f0e1d2c3-...', description: 'Coincide con el id del usuario' })
  id!: string;

  @ApiProperty({ example: 'Entrenador nivel II', nullable: true })
  bio!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<CoachEntity>) {
    Object.assign(this, partial);
  }
}

export class CoachAthleteEntity {
  @ApiProperty({ example: 'c0a1t2h3-...' })
  id!: string;

  @ApiProperty({ example: 'a1t2h3l4-...' })
  athleteId!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  email!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status!: string;

  @ApiProperty({ example: 'Viene de lesión de gemelo', nullable: true })
  notes!: string | null;

  @ApiProperty()
  assignedAt!: Date;

  constructor(partial: Partial<CoachAthleteEntity>) {
    Object.assign(this, partial);
  }
}

export class AthleteProfileEntity {
  @ApiProperty({ example: 'a1t2h3l4-...' })
  id!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  email!: string;

  @ApiProperty({ example: 'Maratonista amateur', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 42 })
  activityCount!: number;

  @ApiProperty({ example: 128 })
  followerCount!: number;

  @ApiProperty({ example: 512.4, description: 'Suma de km de todas las actividades' })
  totalDistance!: number;

  @ApiProperty({ example: 183600, description: 'Suma de segundos de todas las actividades' })
  totalDuration!: number;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status!: string;

  constructor(partial: Partial<AthleteProfileEntity>) {
    Object.assign(this, partial);
  }
}
