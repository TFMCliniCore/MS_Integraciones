import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'; // 👈 Importación esencial
import { Request, Response } from 'express';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrearConfiguracionBackupDto, ForzarBackupDto } from './dto/configuracion-backup.dto';
import { encrypt } from '../common/crypto.util';

@ApiTags('Integraciones - Backups y Respaldo') // 🎯 Agrupador en Swagger
@Controller('integraciones/backups')
export class BackupsController {
  constructor(
    private readonly backupService: BackupService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('configuraciones')
  @ApiOperation({ summary: 'Listar todas las configuraciones de respaldos registradas' })
  async listar() {
    return this.prisma.configuracionBackup.findMany({
      select: {
        id: true, nombre: true, host: true, puerto: true, nombreBd: true,
        usuario: true, frecuencia: true, retencionDias: true, activo: true,
        ultimoBackup: true, createdAt: true,
      },
    });
  }

  @Post('configuraciones')
  @ApiOperation({ summary: 'Crear una nueva configuración para copias de seguridad automáticas' })
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
  @ApiOperation({ summary: 'Forzar la ejecución inmediata de un backup pasando la configuración en el cuerpo' })
  async forzar(@Body() dto: ForzarBackupDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    void this.backupService.ejecutar(dto.configuracionId, usuarioId);
    return { mensaje: 'Backup iniciado', configuracionId: dto.configuracionId };
  }

  @Post('ejecutar/:id')
  @ApiOperation({ summary: 'Forzar la ejecución inmediata de un backup por ID de configuración' })
  @ApiParam({ name: 'id', description: 'ID de la configuración de backup a ejecutar' })
  async ejecutar(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    void this.backupService.ejecutar(id, usuarioId);
    return { mensaje: 'Backup iniciado', configuracionId: id };
  }

  @Put('configuraciones/:id')
  @ApiOperation({ summary: 'Actualizar los parámetros de una configuración de backup específica' })
  @ApiParam({ name: 'id', description: 'ID de la configuración a modificar' })
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
  @ApiOperation({ summary: 'Consultar el historial y logs de auditoría de respaldos (Paginado)' })
  @ApiQuery({ name: 'configuracionId', required: false, description: 'Filtrar logs por una configuración específica' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de registros por página', example: '20' })
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
  @ApiOperation({ summary: 'Obtener el detalle extendido de un log de respaldo por ID' })
  @ApiParam({ name: 'id', description: 'ID del log de backup' })
  async log(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.backupLog.findUniqueOrThrow({
      where: { id },
      include: { configuracion: { select: { nombre: true, nombreBd: true } } },
    });
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Descargar el archivo físico cifrado (.dump) de una copia de seguridad' })
  @ApiParam({ name: 'id', description: 'ID del log de backup cuyo archivo se desea descargar' })
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const log = await this.prisma.backupLog.findUnique({ where: { id } });

    if (!log) throw new NotFoundException(`BackupLog ${id} no existe`);
    if (!log.rutaArchivo) throw new NotFoundException(`El backup ${id} no tiene archivo asociado`);
    if (!existsSync(log.rutaArchivo)) throw new NotFoundException(`El archivo no se encontró en el disco.`);

    const stat = statSync(log.rutaArchivo);
    const filename = basename(log.rutaArchivo);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('X-Backup-BaseDatos', log.baseDatos);
    res.setHeader('X-Backup-Estado', log.estado);

    createReadStream(log.rutaArchivo).pipe(res);
  }
}