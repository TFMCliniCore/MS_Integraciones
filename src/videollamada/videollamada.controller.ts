import { Body, Controller, Delete, Logger, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { VideollamadaService } from './videollamada.service';
import { CrearVideollamadaDto } from './dto/crear-videollamada.dto';

@Controller('integraciones/videollamada')
export class VideollamadaController {
  private readonly logger = new Logger(VideollamadaController.name);

  constructor(private readonly videollamadaService: VideollamadaService) {}

  @Post('crear')
  crear(@Body() dto: CrearVideollamadaDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    return this.videollamadaService.crearSala(dto, usuarioId);
  }

  @Delete(':citaId')
  async cancelar(@Param('citaId', ParseIntPipe) citaId: number) {
    this.logger.log(`Solicitud de cancelación de videollamada para cita ${citaId}`);
    return { mensaje: 'Videollamada cancelada (registro informativo)', citaId };
  }
}
