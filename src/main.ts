import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Enable Helmet for security
  app.use(helmet());

  // Get port from environment or default to 3000
  const port = configService.get<number>('PORT') || 3000;

  // Get CORS origin from environment
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || '*';

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  });

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini Auth Server')
    .setDescription('Mini OAuth 2.0 Authorization Server')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);

  logger.log(`Application running on http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/docs`,
  );
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
