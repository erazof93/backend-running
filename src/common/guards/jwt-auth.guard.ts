import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protege rutas exigiendo un JWT de acceso válido en el header Authorization.
 * El constructor explícito evita que Nest intente inyectar `AuthModuleOptions`
 * (metadata heredada del mixin `AuthGuard`).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
