import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { WhatsappSchedulerService } from './whatsapp-scheduler.service';
import { EnviarWhatsappDto, ProgramarWhatsappDto } from './dto/enviar-whatsapp.dto';
import { randomUUID } from 'node:crypto';

@ApiTags('Integraciones - Notificaciones por WhatsApp')
@Controller('integraciones/whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly scheduler: WhatsappSchedulerService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('enviar')
  @ApiOperation({ summary: 'Enviar un mensaje interactivo de WhatsApp transaccional de ejecución inmediata' })
  async enviar(@Body() dto: EnviarWhatsappDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    return this.whatsappService.enviar(dto, usuarioId);
  }

  @Post('programar')
  @ApiOperation({ summary: 'Encolar y programar un WhatsApp para dispararse en un diferido cronológico exacto' })
  async programar(@Body() dto: ProgramarWhatsappDto) {
    const id = dto.idempotencyKey ?? randomUUID();
    this.scheduler.programar(id, dto, new Date(dto.programadoPara));
    return { mensaje: 'Mensaje programado', id, programadoPara: dto.programadoPara };
  }

  @Delete('programar/:id')
  @ApiOperation({ summary: 'Remover un mensaje en cola del planificador de tareas diferidas antes de su emisión' })
  @ApiParam({ name: 'id', description: 'IdempotencyKey o ID único del mensaje en cola' })
  cancelar(@Param('id') id: string) {
    const cancelado = this.scheduler.cancelar(id);
    return { cancelado, id };
  }

  @Get('programados')
  @ApiOperation({ summary: 'Auditar la cola activa de mensajes de WhatsApp que están pendientes por procesar' })
  listar() {
    return { programados: this.scheduler.listar() };
  }

  @Get('plantillas')
  @ApiOperation({ summary: 'Listar plantillas autorizadas de WhatsApp aprobadas comercialmente' })
  listarPlantillas() {
    return this.prisma.plantillaWhatsApp.findMany({ where: { activa: true }, orderBy: { tipo: 'asc' } });
  }
}