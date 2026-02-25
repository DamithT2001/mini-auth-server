import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
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

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.email,
            password: 'hashed_password',
          }),
        }),
      );
      expect(result.email).toBe(dto.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should normalize email to lowercase and trimmed', async () => {
      const dtoWithUpperEmail = { email: '  Test@Example.COM  ', password: 'Password1!' };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '2',
        email: 'test@example.com',
        createdAt: new Date(),
      });

      const result = await service.register(dtoWithUpperEmail);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on Prisma unique constraint violation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });
});
