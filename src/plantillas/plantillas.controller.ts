import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Integraciones - Gestión Global de Plantillas (Maestros)')
@Controller('integraciones/plantillas')
export class PlantillasController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Email ──────────────────────────────────────────────────────────────────

  @Get('email')
  @ApiOperation({ summary: 'Obtener el catálogo maestro de todas las plantillas de Email' })
  getEmail() {
    return this.prisma.plantillaEmail.findMany({ orderBy: { tipo: 'asc' } });
  }

  @Get('email/:id')
  @ApiOperation({ summary: 'Consultar una plantilla de email por ID' })
  @ApiParam({ name: 'id', description: 'ID incremental de la plantilla' })
  getEmailById(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.plantillaEmail.findUniqueOrThrow({ where: { id } });
  }

  @Post('email')
  @ApiOperation({ summary: 'Dar de alta una nueva plantilla estructural de correo electrónico' })
  createEmail(@Body() dto: UpsertPlantillaEmailDto) {
    return this.prisma.plantillaEmail.create({ data: dto });
  }

  @Patch('email/:id')
  @ApiOperation({ summary: 'Modificar campos específicos de una plantilla de correo por ID' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  updateEmail(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<UpsertPlantillaEmailDto>) {
    return this.prisma.plantillaEmail.update({ where: { id }, data: dto });
  }

  @Patch('email/:id/toggle')
  @ApiOperation({ summary: 'Habilitar o deshabilitar el uso operativo de una plantilla de correo' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  toggleEmail(@Param('id', ParseIntPipe) id: number, @Body() dto: ToggleDto) {
    return this.prisma.plantillaEmail.update({ where: { id }, data: { activa: dto.activa } });
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  @Get('whatsapp')
  @ApiOperation({ summary: 'Obtener el catálogo de plantillas registradas para WhatsApp' })
  getWa() {
    return this.prisma.plantillaWhatsApp.findMany({ orderBy: { tipo: 'asc' } });
  }

  @Get('whatsapp/:id')
  @ApiOperation({ summary: 'Consultar una plantilla de WhatsApp por su identificador único' })
  @ApiParam({ name: 'id', description: 'ID único de la plantilla de WhatsApp' })
  getWaById(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.plantillaWhatsApp.findUniqueOrThrow({ where: { id } });
  }

  @Post('whatsapp')
  @ApiOperation({ summary: 'Registrar una plantilla homologada de WhatsApp HSM (Twilio/Meta)' })
  createWa(@Body() dto: UpsertPlantillaWaDto) {
    return this.prisma.plantillaWhatsApp.create({ data: dto });
  }

  @Patch('whatsapp/:id')
  @ApiOperation({ summary: 'Actualizar las variables o metadatos de configuración de WhatsApp' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla WhatsApp' })
  updateWa(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<UpsertPlantillaWaDto>) {
    return this.prisma.plantillaWhatsApp.update({ where: { id }, data: dto });
  }
}