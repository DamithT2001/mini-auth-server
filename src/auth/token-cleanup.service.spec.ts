import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { TokenCleanupService } from './token-cleanup.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  emailVerificationToken: {
    deleteMany: jest.fn(),
  },
};

describe('TokenCleanupService', () => {
  let service: TokenCleanupService;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TokenCleanupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(TokenCleanupService);
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should delete expired tokens and log when tokens are removed', async () => {
    mockPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 3 });

    await service.deleteExpiredVerificationTokens();

    expect(mockPrisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
    expect(logSpy).toHaveBeenCalledWith(
      'Deleted 3 expired email verification token(s)',
    );
  });

  it('should not log when no expired tokens exist', async () => {
    mockPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 0 });

    await service.deleteExpiredVerificationTokens();

    expect(mockPrisma.emailVerificationToken.deleteMany).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
