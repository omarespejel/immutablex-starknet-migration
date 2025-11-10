import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    console.log('Redis config:', {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      skip: process.env.SKIP_REDIS
    });

    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    });
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for extra properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }));

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log('✅ All modules loaded successfully');
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
