import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioProvider } from './providers/twilio.provider';
import { MetaProvider } from './providers/meta.provider';
import type { WhatsappProvider } from './providers/whatsapp-provider.interface';
import { retryWithBackoff } from '../common/retry.util';
import type { EnviarWhatsappDto } from './dto/enviar-whatsapp.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly provider: WhatsappProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilio: TwilioProvider,
    private readonly meta: MetaProvider,
  ) {
    const prov = process.env.WHATSAPP_PROVIDER ?? 'twilio';
    this.provider = prov === 'meta' ? this.meta : this.twilio;
    this.logger.log(`Proveedor WhatsApp activo: ${prov}`);
  }

  async enviar(dto: EnviarWhatsappDto, usuarioId?: number) {
    const inicio = Date.now();

    // Idempotencia
    if (dto.idempotencyKey) {
      const existing = await this.prisma.integracionLog.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing?.estado === 'ENVIADO') {
        return { mensaje: 'Ya enviado (idempotente)', logId: existing.id };
      }
    }

    const plantilla = await this.prisma.plantillaWhatsApp.findUnique({
      where: { tipo: dto.tipoPlantilla },
    });
    if (!plantilla) throw new NotFoundException(`Plantilla WA ${dto.tipoPlantilla} no encontrada`);
    if (!plantilla.activa) throw new Error(`Plantilla ${dto.tipoPlantilla} no está activa`);

    // Construir parámetros posicionales en orden de plantilla.parametros
    const params = plantilla.parametros.map((key) => dto.parametros[key] ?? '');

    let estado = 'ENVIADO';
    let errorDetalle: string | undefined;
    let respuestaProveedor: string | undefined;
    let intentos = 1;

    try {
      const { result, intentos: att } = await retryWithBackoff(
        () => this.provider.send({
          to: dto.to,
          templateName: plantilla.nombreMeta,
          language: plantilla.idioma,
          params,
        }),
        3,
        this.logger,
        `whatsapp:${dto.tipoPlantilla}`,
      );
      respuestaProveedor = result;
      intentos = att;
    } catch (err) {
      estado = 'FALLIDO';
      errorDetalle = (err as Error).message?.slice(0, 1000);
    }

    const log = await this.prisma.integracionLog.create({
      data: {
        tipo: 'WHATSAPP',
        canal: process.env.WHATSAPP_PROVIDER ?? 'twilio',
        estado,
        destinatario: dto.to,
        plantillaId: plantilla.id,
        payload: dto.parametros,
        respuestaProveedor,
        intentos,
        idempotencyKey: dto.idempotencyKey,
        usuarioId,
        sucursalId: dto.sucursalId,
        referenciaId: dto.referenciaId,
        referenciaTipo: dto.referenciaTipo,
        errorDetalle,
        duracionMs: Date.now() - inicio,
      },
    });

    if (estado === 'FALLIDO') throw new Error(errorDetalle);
    return { mensaje: 'WhatsApp enviado', logId: log.id };
  }
}
