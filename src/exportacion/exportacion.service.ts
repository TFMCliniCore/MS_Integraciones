import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatCsv } from './formatters/csv.formatter';
import { formatXml } from './formatters/xml.formatter';
import { formatJson } from './formatters/json.formatter';
import type { ExportarDto } from './dto/exportar.dto';

interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
  totalRegistros: number;
  camposFaltantes: string[];
  estado: 'EXITOSO' | 'PARCIAL';
}

@Injectable()
export class ExportacionService {
  constructor(private readonly prisma: PrismaService) {}

  async exportar(dto: ExportarDto, usuarioId?: number): Promise<ExportResult> {
    const inicio = Date.now();

    const plantilla = await this.prisma.plantillaExportacion.findUnique({
      where: { nombre: dto.nombrePlantilla },
    });
    if (!plantilla) throw new NotFoundException(`Plantilla "${dto.nombrePlantilla}" no encontrada`);
    if (!plantilla.activa) throw new Error(`Plantilla "${dto.nombrePlantilla}" no está activa`);

    const mapeo = plantilla.mapeoColumnas as Record<string, string>;

    // Detectar campos faltantes en los datos
    const camposFaltantes: string[] = [];
    const camposRequeridos = Object.keys(mapeo);
    for (const campo of camposRequeridos) {
      const falta = dto.datos.some((row) => row[campo] === undefined || row[campo] === null);
      if (falta) camposFaltantes.push(campo);
    }

    const estado: 'EXITOSO' | 'PARCIAL' = camposFaltantes.length > 0 ? 'PARCIAL' : 'EXITOSO';

    // Generar archivo
    let buffer: Buffer;
    let contentType: string;
    let ext: string;

    const fmt = plantilla.formato.toUpperCase();
    if (fmt === 'XML') {
      buffer = formatXml(dto.datos, mapeo);
      contentType = 'application/xml';
      ext = 'xml';
    } else if (fmt === 'JSON') {
      buffer = formatJson(dto.datos, mapeo);
      contentType = 'application/json';
      ext = 'json';
    } else {
      buffer = formatCsv(
        dto.datos,
        mapeo,
        plantilla.separador ?? ',',
        plantilla.incluirCabecera,
      );
      contentType = 'text/csv';
      ext = 'csv';
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `exportacion_${plantilla.sistema}_${fecha}.${ext}`;

    await this.prisma.integracionLog.create({
      data: {
        tipo: 'EXPORTACION_CONTABLE',
        canal: plantilla.sistema,
        estado,
        sucursalId: dto.sucursalId,
        usuarioId,
        payload: {
          plantilla: dto.nombrePlantilla,
          desde: dto.desde,
          hasta: dto.hasta,
          totalRegistros: dto.datos.length,
          camposFaltantes,
        },
        duracionMs: Date.now() - inicio,
      },
    });

    return { buffer, contentType, filename, totalRegistros: dto.datos.length, camposFaltantes, estado };
  }

  async listarPlantillas() {
    return this.prisma.plantillaExportacion.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, sistema: true, formato: true, activa: true },
    });
  }
}
