import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  emailVerificationToken: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(EmailVerificationService);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should return a raw token and execute transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        isEmailVerified: false,
      });
      mockPrisma.$transaction.mockResolvedValue([{ count: 0 }, { id: 'tok1' }]);

      const token = await service.generate('u1');

      expect(token).toHaveLength(64);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.generate('missing')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when email already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        isEmailVerified: true,
      });

      await expect(service.generate('u1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verify', () => {
    it('should throw BadRequestException for unknown token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verify('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete expired token and throw BadRequestException', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'tok1',
        userId: 'u1',
        expiresAt: new Date(Date.now() - 1000),
        user: { isEmailVerified: false },
      });
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({});

      await expect(service.verify('expired-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'tok1' },
      });
    });

    it('should throw BadRequestException when email already verified', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'tok1',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60000),
        user: { isEmailVerified: true },
      });

      await expect(service.verify('some-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify user and delete token atomically', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'tok1',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60000),
        user: { isEmailVerified: false },
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.verify('valid-token');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
