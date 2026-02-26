import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';

type AdapterOptions = ConstructorParameters<typeof PrismaClient>[0];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const options = PrismaService.buildAdapterOptions();
    super(options);
  }

  private static buildAdapterOptions(): AdapterOptions | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaPg } = require('@prisma/adapter-pg');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require('pg');

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      const adapter = new PrismaPg(pool);
      return { adapter };
    } catch {
      return undefined;
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
