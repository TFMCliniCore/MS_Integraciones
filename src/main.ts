import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // 👈 Importamos Swagger
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';

// JSON.stringify no serializa BigInt de forma nativa.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

// 🚀 Exportamos el documento de forma global para usarlo en el controlador
export let swaggerDocument: any;

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

  // 🎯 Configuración de Swagger para Integraciones
  const config = new DocumentBuilder()
    .setTitle('CliniCore - MS Integraciones')
    .setDescription('Módulo centralizado para notificaciones (Email, WhatsApp), videollamadas (Meet/Zoom) y backups automatizados')
    .setVersion('1.0')
    .build();

  swaggerDocument = SwaggerModule.createDocument(app, config);

  // Dejamos la UI disponible localmente por si acaso
  SwaggerModule.setup('api/v1/integraciones/docs', app, swaggerDocument, {
    swaggerOptions: { jsonEditor: true },
  });

  const port = process.env.PORT || 3009;
  await app.listen(port, '0.0.0.0');
  console.log(`MS Integraciones corriendo en puerto ${port}`);
}
void bootstrap();