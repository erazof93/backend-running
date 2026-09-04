import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  const ctxFor = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('permite el acceso a ADMIN', () => {
    expect(guard.canActivate(ctxFor({ id: 'a-1', role: 'ADMIN' }))).toBe(true);
  });

  it('permite el acceso a SUPERADMIN', () => {
    expect(guard.canActivate(ctxFor({ id: 'root-1', role: 'SUPERADMIN' }))).toBe(
      true,
    );
  });

  it('rechaza a CLIENTE', () => {
    expect(() =>
      guard.canActivate(ctxFor({ id: 'c-1', role: 'CLIENTE' })),
    ).toThrow(ForbiddenException);
  });

  it('rechaza a COACH', () => {
    expect(() =>
      guard.canActivate(ctxFor({ id: 'co-1', role: 'COACH' })),
    ).toThrow(ForbiddenException);
  });

  it('rechaza si no hay usuario autenticado', () => {
    expect(() => guard.canActivate(ctxFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
