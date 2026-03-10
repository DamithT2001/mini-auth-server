import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

/** Records a successful login event for audit and anomaly-detection purposes. */
@Injectable()
export class LoginAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.loginLog.create({
      data: { userId, ipAddress, userAgent },
    });
  }
}
