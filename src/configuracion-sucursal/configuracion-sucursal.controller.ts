import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ConfiguracionSucursalDto {
  @Type(() => Number) @IsInt() @IsPositive() sucursalId!: number;
  @IsOptional() @IsString() emailRemitente?: string;
  @IsOptional() @IsString() nombreRemitente?: string;
  @IsOptional() @IsString() whatsappNumero?: string;
  @IsOptional() @IsString() videoProveedor?: string;
  @IsOptional() @IsBoolean() activa?: boolean;
}

@ApiTags('Integraciones - Configuración por Sucursal')
@Controller('integraciones/configuracion-sucursal')
export class ConfiguracionSucursalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar credenciales y canales de integración mapeados por sucursal' })
  findAll() {
    return this.prisma.configuracionSucursal.findMany({ orderBy: { sucursalId: 'asc' } });
  }

  @Get(':sucursalId')
  @ApiOperation({ summary: 'Obtener la configuración de integraciones de una sucursal específica' })
  @ApiParam({ name: 'sucursalId', description: 'ID de la sucursal clínica' })
  findOne(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.prisma.configuracionSucursal.findUniqueOrThrow({ where: { sucursalId } });
  }

  @Post()
  @ApiOperation({ summary: 'Registrar o sobrescribir (Upsert) los canales de comunicación de una sucursal' })
  create(@Body() dto: ConfiguracionSucursalDto) {
    return this.prisma.configuracionSucursal.upsert({
      where: { sucursalId: dto.sucursalId },
      update: dto,
      create: dto,
    });
  }

  @Put(':sucursalId')
  @ApiOperation({ summary: 'Actualizar parcialmente la configuración de integraciones de una sucursal' })
  @ApiParam({ name: 'sucursalId', description: 'ID de la sucursal a modificar' })
  update(@Param('sucursalId', ParseIntPipe) sucursalId: number, @Body() dto: Partial<ConfiguracionSucursalDto>) {
    return this.prisma.configuracionSucursal.update({ where: { sucursalId }, data: dto });
  }
}