import { ApiProperty } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

class FeedActivityUser {
  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/a.png', nullable: true })
  profilePicture!: string | null;
}

export class KudoEntity {
  @ApiProperty({ example: 'k1u2d3o4-...' })
  id!: string;

  @ApiProperty({ example: 'u1s2e3r4-...' })
  userId!: string;

  @ApiProperty({ example: 'a1c2t3i4-...' })
  activityId!: string;

  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<KudoEntity>) {
    Object.assign(this, partial);
  }
}

export class KudoUserEntity {
  @ApiProperty({ example: 'u1s2e3r4-...' })
  userId!: string;

  @ApiProperty({ example: 'Beto Runner' })
  name!: string;

  @ApiProperty({ example: null, nullable: true })
  profilePicture!: string | null;

  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<KudoUserEntity>) {
    Object.assign(this, partial);
  }
}

export class CommentEntity {
  @ApiProperty({ example: 'c1o2m3m4-...' })
  id!: string;

  @ApiProperty({ example: 'u1s2e3r4-...' })
  userId!: string;

  @ApiProperty({ example: 'a1c2t3i4-...' })
  activityId!: string;

  @ApiProperty({ example: '¡Grande!' })
  text!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: FeedActivityUser, required: false })
  user?: FeedActivityUser;

  constructor(partial: Partial<CommentEntity>) {
    Object.assign(this, partial);
  }
}

export class FeedActivityEntity {
  @ApiProperty({ example: 'a1c2t3i4-...' })
  id!: string;

  @ApiProperty({ example: 'u1s2e3r4-...' })
  userId!: string;

  @ApiProperty({ example: 'Fondo dominical' })
  title!: string;

  @ApiProperty({ example: 10.5 })
  distance!: number;

  @ApiProperty({ example: 3600 })
  duration!: number;

  @ApiProperty({ enum: ActivityType, example: ActivityType.run })
  activityType!: ActivityType;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: FeedActivityUser })
  user!: FeedActivityUser;

  @ApiProperty({ example: 12 })
  kudosCount!: number;

  @ApiProperty({ example: 3 })
  commentsCount!: number;

  constructor(partial: Partial<FeedActivityEntity>) {
    Object.assign(this, partial);
  }
}

export class RankingUserEntity {
  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ example: 'u1s2e3r4-...' })
  userId!: string;

  @ApiProperty({ example: 'Ana Corredora' })
  name!: string;

  @ApiProperty({ example: 62.4, description: 'Km acumulados en la semana' })
  totalDistance!: number;

  @ApiProperty({ example: 5 })
  activityCount!: number;

  @ApiProperty({ example: 128 })
  followerCount!: number;

  constructor(partial: Partial<RankingUserEntity>) {
    Object.assign(this, partial);
  }
}
