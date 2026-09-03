# 📋 TEMPLATE - Cómo presentaré cada módulo

Cuando diga "Vamos a crear el módulo AUTH", seguiré este template exacto:

---

## EJEMPLO: FASE 2 - AUTH MODULE

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                🔴 FASE 2 - AUTH MODULE                         ║
║                                                                ║
║         Autenticación JWT + Bcrypt + Validación               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📊 ESPECIFICACIÓN:
─────────────────────────────────────────────────────────────────
Endpoints: 5
  - POST /auth/register
  - POST /auth/login
  - POST /auth/logout
  - POST /auth/refresh-token
  - GET /auth/me

DTOs: 3
  - RegisterDto
  - LoginDto
  - RefreshTokenDto

Tests: 12+
  - AuthService: 8 tests
  - AuthController: 4 tests

Coverage: >85%


🛠️  PASO 1: GENERAR CON CLI
─────────────────────────────────────────────────────────────────
Ejecuta EXACTAMENTE esto:

$ nest generate module modules/auth
$ nest generate controller modules/auth
$ nest generate service modules/auth
$ mkdir -p src/modules/auth/{dto,entities,strategies}

✅ Verifica que existan estas carpetas:
   src/modules/auth/
   ├── auth.module.ts
   ├── auth.controller.ts
   ├── auth.service.ts
   ├── dto/
   ├── entities/
   └── strategies/


📝 PASO 2: COPIAR CÓDIGO - auth.module.ts
─────────────────────────────────────────────────────────────────

Archivo: src/modules/auth/auth.module.ts
Contenido:

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

---

📝 PASO 3: COPIAR CÓDIGO - auth.controller.ts
─────────────────────────────────────────────────────────────────

Archivo: src/modules/auth/auth.controller.ts
Contenido:

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthEntity } from './entities/auth.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado',
    type: AuthEntity,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthEntity,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actual',
    type: AuthEntity,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  async logout() {
    return { success: true };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refrescar JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token actualizado',
    type: AuthEntity,
  })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }
}

---

📝 PASO 4: COPIAR CÓDIGO - auth.service.ts
─────────────────────────────────────────────────────────────────

Archivo: src/modules/auth/auth.service.ts
Contenido:

import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Verificar que el email no existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email ya existe');
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
      },
    });

    // Generar JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const token = this.jwtService.sign({
        sub: decoded.sub,
        email: decoded.email,
      });

      return { token };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}

---

📝 PASO 5: COPIAR CÓDIGO - DTOs
─────────────────────────────────────────────────────────────────

Archivo: src/modules/auth/dto/register.dto.ts
Contenido:

import { IsEmail, MinLength, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Carlos Ruiz' })
  @IsString()
  name: string;
}

---

Archivo: src/modules/auth/dto/login.dto.ts
Contenido:

import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8)
  password: string;
}

---

📝 PASO 6: COPIAR CÓDIGO - auth.service.spec.ts
─────────────────────────────────────────────────────────────────

Archivo: src/modules/auth/auth.service.spec.ts
Contenido:

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt_token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBe('jwt_token');
    });

    it('should throw ConflictException if email exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash password with bcrypt', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should generate JWT token', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(jwt.sign).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBe('jwt_token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    it('should get user by id', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getMe('1');

      expect(result.id).toBe('1');
      expect(result.email).toBe('test@example.com');
    });
  });
});

---

🧪 PASO 7: EJECUTAR TESTS
─────────────────────────────────────────────────────────────────

$ pnpm test src/modules/auth/auth.service.spec.ts

✅ Esperado:
PASS src/modules/auth/auth.service.spec.ts
  AuthService
    ✓ should be defined (5ms)
    ✓ should register a new user (10ms)
    ✓ should throw ConflictException (5ms)
    ✓ should hash password (8ms)
    ✓ should generate JWT token (6ms)
    ✓ should login user (10ms)
    ✓ should throw UnauthorizedException (5ms)
    ✓ should check password (7ms)
    ✓ should get user by id (5ms)

9 passed (62ms)
Coverage: 92% Statements


🏗️ PASO 8: BUILD
─────────────────────────────────────────────────────────────────

$ pnpm build

✅ Esperado:
[Nest] Successfully compiled
...
8 files created in 150ms


🚀 PASO 9: VERIFICAR EN SWAGGER
─────────────────────────────────────────────────────────────────

$ pnpm start:dev

1. Abre: http://localhost:3000/docs
2. Expande "auth" 
3. Prueba cada endpoint:
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh-token
   - GET /auth/me

✅ Todos deben responder correctamente


✅ PASO 10: AVISAR AL AUDITOR
─────────────────────────────────────────────────────────────────

Cuando termines, copia y pega en chat:

---
✅ AUTH MODULE COMPLETADO

Tests: 9/9 pasando
Coverage: 92%
Build: ✅ Exitoso
Swagger: ✅ Completo
Endpoints: ✅ Funcionan

Comandos ejecutados:
- pnpm test src/modules/auth/auth.service.spec.ts ✅
- pnpm build ✅
- pnpm start:dev ✅

Archivos creados/modificados:
- src/modules/auth/auth.module.ts ✅
- src/modules/auth/auth.controller.ts ✅
- src/modules/auth/auth.service.ts ✅
- src/modules/auth/auth.service.spec.ts ✅
- src/modules/auth/dto/register.dto.ts ✅
- src/modules/auth/dto/login.dto.ts ✅
- src/modules/auth/entities/auth.entity.ts (pendiente)

Listo para auditoría.
---

Entonces SUB AGENTE hace auditoría y actualiza CLAUDE.md 🎯

═══════════════════════════════════════════════════════════════
```

---

## ESTRUCTURA DEL TEMPLATE

Cada módulo sigue este orden:

1. **Especificación** - Qué se va a crear
2. **CLI Commands** - Comandos exactos a ejecutar
3. **Código paso a paso** - Para cada archivo
4. **Tests** - Código de tests
5. **Build & Run** - Cómo compilar y probar
6. **Verificación** - Qué esperar
7. **Reporte** - Cómo avisar al auditor

---

## CUANDO ESTÉS LISTO

Cuando termines de integrar, avísame:

```
"Integración completada y listo para FASE 2 con CLI workflow"
```

Entonces empiezo a darte prompts con este formato exacto 🚀
