import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestMetadataResult = {
  ipAddress?: string;
  userAgent?: string;
};

export const RequestMetadata = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestMetadataResult => {
    const request = ctx.switchToHttp().getRequest();

    return {
      ipAddress: request.ip,
      userAgent: request.headers?.['user-agent'],
    };
  },
);
