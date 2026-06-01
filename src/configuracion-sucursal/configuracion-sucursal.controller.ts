import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
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

@Controller('integraciones/configuracion-sucursal')
export class ConfiguracionSucursalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.configuracionSucursal.findMany({ orderBy: { sucursalId: 'asc' } });
  }

  @Get(':sucursalId')
  findOne(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.prisma.configuracionSucursal.findUniqueOrThrow({ where: { sucursalId } });
  }

  @Post()
  create(@Body() dto: ConfiguracionSucursalDto) {
    return this.prisma.configuracionSucursal.upsert({
      where: { sucursalId: dto.sucursalId },
      update: dto,
      create: dto,
    });
  }

  @Put(':sucursalId')
  update(@Param('sucursalId', ParseIntPipe) sucursalId: number, @Body() dto: Partial<ConfiguracionSucursalDto>) {
    return this.prisma.configuracionSucursal.update({ where: { sucursalId }, data: dto });
  }
}
