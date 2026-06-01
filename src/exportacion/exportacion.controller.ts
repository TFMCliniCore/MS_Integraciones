import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExportacionService } from './exportacion.service';
import { ExportarDto } from './dto/exportar.dto';

@Controller('integraciones/exportacion')
export class ExportacionController {
  constructor(private readonly exportacionService: ExportacionService) {}

  @Get('plantillas')
  listarPlantillas() {
    return this.exportacionService.listarPlantillas();
  }

  @Post('generar')
  async generar(@Body() dto: ExportarDto, @Req() req: Request, @Res() res: Response) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    const result = await this.exportacionService.exportar(dto, usuarioId);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('X-Total-Registros', String(result.totalRegistros));
    res.setHeader('X-Estado-Exportacion', result.estado);
    if (result.camposFaltantes.length > 0) {
      res.setHeader('X-Campos-Faltantes', result.camposFaltantes.join(','));
    }
    res.end(result.buffer);
  }
}
