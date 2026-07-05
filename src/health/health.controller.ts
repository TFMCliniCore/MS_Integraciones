import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { swaggerDocument } from '../main'; // 👈 Importamos el JSON generado en el bootstrap

@ApiTags('Health & Docs')
@Controller() // 🚀 Vacío para heredar el prefijo global 'api/v1' limpiamente
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // 🚀 PROXY SWAGGER: Hace match milimétrico con lo que pide el API Gateway
  @Get('integraciones/docs-json')
  @ApiOperation({ summary: 'Proxy JSON Swagger para el API Gateway' })
  getSwaggerJson() {
    return swaggerDocument;
  }

  // 🚀 Movemos el 'health' aquí abajo para mantener tu ruta actual idéntica
  @Get('health')
  @ApiOperation({ summary: 'Verificar el estado operativo del MS Integraciones' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'ms-integraciones',
        db: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'degraded',
        service: 'ms-integraciones',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }
}