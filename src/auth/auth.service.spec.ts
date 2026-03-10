import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../infrastructure/security/jwt.service';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
import { MailService } from '../mail/mail.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  clientApplication: {
    findUnique: jest.fn(),
  },
  loginLog: {
    create: jest.fn(),
  },
};

const mockJwtService = {
  signAccessToken: jest.fn().mockReturnValue('signed.jwt.token'),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue(900),
};

const mockEmailVerificationService = {
  generate: jest.fn().mockResolvedValue('raw-verification-token'),
};

const mockMailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = { email: 'test@example.com', password: 'Password1!' };

    it('should create user and return without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: dto.email,
        createdAt: new Date(),
      });

      const result = await service.register(dto);

      expect(result.email).toBe(dto.email);
      expect(result).not.toHaveProperty('password');
      expect(mockEmailVerificationService.generate).toHaveBeenCalledWith('1');
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        'raw-verification-token',
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should return emailSent=false when mail delivery fails', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: dto.email,
        createdAt: new Date(),
      });
      mockMailService.sendVerificationEmail.mockRejectedValue(
        new Error('SMTP error'),
      );

      const result = await service.register(dto);

      expect(result.emailSent).toBe(false);
      expect(result.email).toBe(dto.email);
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('login', () => {
    const plainPassword = 'Password1!';
    const loginDto = {
      email: 'user@example.com',
      password: plainPassword,
      clientId: 'my-client',
    };

    let hashedPassword: string;

    beforeAll(async () => {
      hashedPassword = await bcrypt.hash(plainPassword, 10);
    });

    const buildUser = (overrides: Record<string, unknown> = {}) => ({
      id: 'user-1',
      email: loginDto.email,
      password: hashedPassword,
      isEmailVerified: true,
      roles: [{ role: { name: 'user' } }],
      ...overrides,
    });

    it('should return accessToken on valid login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser());
      mockPrisma.clientApplication.findUnique.mockResolvedValue({
        id: 'client-1',
        clientId: loginDto.clientId,
      });
      mockPrisma.loginLog.create.mockResolvedValue({});
      mockConfigService.getOrThrow.mockReturnValue(900);
      mockJwtService.signAccessToken.mockReturnValue('signed.jwt.token');

      const result = await service.login(loginDto, '127.0.0.1', 'jest');

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(900);
      expect(mockPrisma.loginLog.create).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        buildUser({ password: await bcrypt.hash('different-password', 10) }),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when email is not verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        buildUser({ isEmailVerified: false }),
      );

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException when client is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser());
      mockPrisma.clientApplication.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should NOT create a login log when JWT signing fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(buildUser());
      mockPrisma.clientApplication.findUnique.mockResolvedValue({
        id: 'client-1',
        clientId: loginDto.clientId,
      });
      mockJwtService.signAccessToken.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        'JWT signing failed',
      );
      expect(mockPrisma.loginLog.create).not.toHaveBeenCalled();
    });
  });

  describe('resendVerificationEmail', () => {
    const dto = { email: 'unverified@example.com' };

    it('should return silently when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resendVerificationEmail(dto),
      ).resolves.toBeUndefined();
      expect(mockEmailVerificationService.generate).not.toHaveBeenCalled();
    });

    it('should return silently when email is already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        isEmailVerified: true,
      });

      await expect(
        service.resendVerificationEmail(dto),
      ).resolves.toBeUndefined();
      expect(mockEmailVerificationService.generate).not.toHaveBeenCalled();
    });

    it('should generate token and send email for unverified user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        isEmailVerified: false,
      });

      await service.resendVerificationEmail(dto);

      expect(mockEmailVerificationService.generate).toHaveBeenCalledWith('u1');
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        'raw-verification-token',
      );
    });

    it('should not throw when mail send fails', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        isEmailVerified: false,
      });
      mockMailService.sendVerificationEmail.mockRejectedValue(
        new Error('SMTP error'),
      );

      await expect(
        service.resendVerificationEmail(dto),
      ).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
});
