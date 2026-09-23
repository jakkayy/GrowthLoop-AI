import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only the Next.js frontend is allowed to call this API from a browser.
  // Server-to-server calls (frontend route handlers, LINE/Facebook
  // webhooks) aren't subject to CORS at all, so this only needs to cover
  // the origin(s) a browser might load the frontend from.
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'https://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: allowedOrigins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
