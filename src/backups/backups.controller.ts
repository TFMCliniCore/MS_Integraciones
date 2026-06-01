import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrearConfiguracionBackupDto, ForzarBackupDto } from './dto/configuracion-backup.dto';
import { encrypt } from '../common/crypto.util';

@Controller('integraciones/backups')
export class BackupsController {
  constructor(
    private readonly backupService: BackupService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('configuraciones')
  async listar() {
    const configs = await this.prisma.configuracionBackup.findMany({
      select: {
        id: true, nombre: true, host: true, puerto: true, nombreBd: true,
        usuario: true, frecuencia: true, retencionDias: true, activo: true,
        ultimoBackup: true, createdAt: true,
        // password se omite intencionalmente
      },
    });
    return configs;
  }

  @Post('configuraciones')
  async crear(@Body() dto: CrearConfiguracionBackupDto) {
    const passwordEncriptada = encrypt(dto.password);
    return this.prisma.configuracionBackup.create({
      data: { ...dto, password: passwordEncriptada },
      select: {
        id: true, nombre: true, host: true, puerto: true, nombreBd: true,
        usuario: true, frecuencia: true, retencionDias: true, activo: true,
      },
    });
  }

  @Post('forzar')
  async forzar(@Body() dto: ForzarBackupDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    void this.backupService.ejecutar(dto.configuracionId, usuarioId);
    return { mensaje: 'Backup iniciado', configuracionId: dto.configuracionId };
  }

  @Post('ejecutar/:id')
  async ejecutar(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    void this.backupService.ejecutar(id, usuarioId);
    return { mensaje: 'Backup iniciado', configuracionId: id };
  }

  @Put('configuraciones/:id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CrearConfiguracionBackupDto>,
  ) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data['password'] = encrypt(dto.password);
    }
    return this.prisma.configuracionBackup.update({
      where: { id },
      data,
      select: {
        id: true, nombre: true, host: true, puerto: true, nombreBd: true,
        usuario: true, frecuencia: true, retencionDias: true, activo: true,
      },
    });
  }

  @Get('logs')
  async logs(
    @Query('configuracionId') configuracionId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = configuracionId ? { configuracionBackupId: Number(configuracionId) } : {};

    const [data, total] = await Promise.all([
      this.prisma.backupLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { configuracion: { select: { nombre: true, nombreBd: true } } },
      }),
      this.prisma.backupLog.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  @Get('logs/:id')
  async log(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.backupLog.findUniqueOrThrow({
      where: { id },
      include: { configuracion: { select: { nombre: true, nombreBd: true } } },
    });
  }
}
