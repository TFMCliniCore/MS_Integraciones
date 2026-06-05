import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';

// JSON.stringify no serializa BigInt de forma nativa.
// tamanioBytes en BackupLog es BigInt — lo convertimos a Number en la respuesta.
// Number es seguro hasta ~9 PB (MAX_SAFE_INTEGER), suficiente para backups de BD.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile();

  const app = await NestFactory.create(AppModule);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapterHost));

  await app.listen(process.env.PORT || 3009, '0.0.0.0');
  console.log(`MS Integraciones corriendo en puerto ${process.env.PORT ?? 3009}`);
}
void bootstrap();
