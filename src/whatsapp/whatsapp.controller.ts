import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { WhatsappSchedulerService } from './whatsapp-scheduler.service';
import { EnviarWhatsappDto, ProgramarWhatsappDto } from './dto/enviar-whatsapp.dto';
import { randomUUID } from 'node:crypto';

@Controller('integraciones/whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly scheduler: WhatsappSchedulerService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('enviar')
  async enviar(@Body() dto: EnviarWhatsappDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    return this.whatsappService.enviar(dto, usuarioId);
  }

  @Post('programar')
  async programar(@Body() dto: ProgramarWhatsappDto) {
    const id = dto.idempotencyKey ?? randomUUID();
    this.scheduler.programar(id, dto, new Date(dto.programadoPara));
    return { mensaje: 'Mensaje programado', id, programadoPara: dto.programadoPara };
  }

  @Delete('programar/:id')
  cancelar(@Param('id') id: string) {
    const cancelado = this.scheduler.cancelar(id);
    return { cancelado, id };
  }

  @Get('programados')
  listar() {
    return { programados: this.scheduler.listar() };
  }

  @Get('plantillas')
  listarPlantillas() {
    return this.prisma.plantillaWhatsApp.findMany({ where: { activa: true }, orderBy: { tipo: 'asc' } });
  }
}
