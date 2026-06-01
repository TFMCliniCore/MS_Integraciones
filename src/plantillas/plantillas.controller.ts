import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class UpsertPlantillaEmailDto {
  @IsString() tipo!: string;
  @IsString() nombre!: string;
  @IsString() asunto!: string;
  @IsString() cuerpoHtml!: string;
  @IsOptional() @IsString() cuerpoTexto?: string;
  @IsOptional() variables?: string[];
}

class UpsertPlantillaWaDto {
  @IsString() tipo!: string;
  @IsString() nombre!: string;
  @IsString() nombreMeta!: string;
  @IsOptional() @IsString() idioma?: string;
  @IsOptional() parametros?: string[];
}

class ToggleDto {
  @IsBoolean() activa!: boolean;
}

@Controller('integraciones/plantillas')
export class PlantillasController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Email ──────────────────────────────────────────────────────────────────

  @Get('email')
  getEmail() {
    return this.prisma.plantillaEmail.findMany({ orderBy: { tipo: 'asc' } });
  }

  @Get('email/:id')
  getEmailById(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.plantillaEmail.findUniqueOrThrow({ where: { id } });
  }

  @Post('email')
  createEmail(@Body() dto: UpsertPlantillaEmailDto) {
    return this.prisma.plantillaEmail.create({ data: dto });
  }

  @Patch('email/:id')
  updateEmail(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<UpsertPlantillaEmailDto>) {
    return this.prisma.plantillaEmail.update({ where: { id }, data: dto });
  }

  @Patch('email/:id/toggle')
  toggleEmail(@Param('id', ParseIntPipe) id: number, @Body() dto: ToggleDto) {
    return this.prisma.plantillaEmail.update({ where: { id }, data: { activa: dto.activa } });
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  @Get('whatsapp')
  getWa() {
    return this.prisma.plantillaWhatsApp.findMany({ orderBy: { tipo: 'asc' } });
  }

  @Get('whatsapp/:id')
  getWaById(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.plantillaWhatsApp.findUniqueOrThrow({ where: { id } });
  }

  @Post('whatsapp')
  createWa(@Body() dto: UpsertPlantillaWaDto) {
    return this.prisma.plantillaWhatsApp.create({ data: dto });
  }

  @Patch('whatsapp/:id')
  updateWa(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<UpsertPlantillaWaDto>) {
    return this.prisma.plantillaWhatsApp.update({ where: { id }, data: dto });
  }
}
