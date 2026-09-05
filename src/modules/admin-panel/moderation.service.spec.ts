import { Test, type TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: {
    report: {
      findMany: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    comment: {
      findUnique: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    user: { update: ReturnType<typeof vi.fn> };
    moderationLog: {
      findMany: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      report: {
        findMany: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        groupBy: vi.fn(),
        count: vi.fn(),
      },
      comment: { findUnique: vi.fn(), delete: vi.fn().mockResolvedValue({}) },
      user: { update: vi.fn().mockResolvedValue({}) },
      moderationLog: {
        findMany: vi.fn(),
        groupBy: vi.fn(),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ModerationService);
  });

  it('agrega los reportes por comentario y toma la severidad más alta', async () => {
    const comment = {
      id: 'c1',
      text: 'malo',
      createdAt: new Date('2026-09-01'),
      user: { id: 'u1', name: 'Autor' },
    };
    prisma.report.findMany.mockResolvedValue([
      {
        commentId: 'c1',
        severity: 'LOW',
        reason: 'spam',
        createdAt: new Date('2026-09-02'),
        reporter: { name: 'R1' },
        comment,
      },
      {
        commentId: 'c1',
        severity: 'HIGH',
        reason: 'acoso',
        createdAt: new Date('2026-09-03'),
        reporter: { name: 'R2' },
        comment,
      },
    ]);

    const flagged = await service.getFlagged();

    expect(flagged).toHaveLength(1);
    expect(flagged[0].flagsCount).toBe(2);
    expect(flagged[0].severity).toBe('HIGH');
    expect(flagged[0].reportReason).toBe('acoso');
  });

  it('la acción delete borra el comentario y registra el log', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 'c1',
      user: { id: 'u1', name: 'Autor' },
    });

    const res = await service.action(
      { commentId: 'c1', action: 'delete', reason: 'spam' },
      'admin-1',
    );

    expect(res.affected).toBe(1);
    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(prisma.moderationLog.create).toHaveBeenCalled();
  });

  it('la acción ban marca al autor como BANNED', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 'c1',
      user: { id: 'u1', name: 'Autor' },
    });

    await service.action({ commentId: 'c1', action: 'ban' }, 'admin-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { status: 'BANNED' },
    });
    expect(prisma.comment.delete).not.toHaveBeenCalled();
  });
});
