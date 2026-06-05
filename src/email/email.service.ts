import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../prisma/prisma.service';
import { SmtpProvider } from './providers/smtp.provider';
import { ResendProvider } from './providers/resend.provider';
import type { EmailProvider } from './providers/email-provider.interface';
import { retryWithBackoff } from '../common/retry.util';
import type { EnviarEmailDto, EnviarEmailDirectoDto } from './dto/enviar-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly smtp: SmtpProvider,
    private readonly resend: ResendProvider,
  ) {
    const prov = process.env.EMAIL_PROVIDER ?? 'smtp';
    this.provider = prov === 'resend' ? this.resend : this.smtp;
    this.logger.log(`Proveedor de email activo: ${prov}`);
  }

  // ── Envío con plantilla + idempotencia + reintentos ────────────────────────

  async enviarConPlantilla(dto: EnviarEmailDto, usuarioId?: number) {
    const inicio = Date.now();

    // Idempotencia
    if (dto.idempotencyKey) {
      const existing = await this.prisma.integracionLog.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing?.estado === 'ENVIADO') {
        this.logger.log(`Idempotencia: email ${dto.idempotencyKey} ya enviado`);
        return { mensaje: 'Ya enviado (idempotente)', logId: existing.id };
      }
    }

    // Buscar plantilla
    const plantilla = await this.prisma.plantillaEmail.findUnique({
      where: { tipo: dto.tipoPlantilla },
    });
    if (!plantilla) throw new NotFoundException(`Plantilla ${dto.tipoPlantilla} no encontrada`);
    if (!plantilla.activa) throw new Error(`Plantilla ${dto.tipoPlantilla} no está activa`);

    const asunto = Handlebars.compile(plantilla.asunto)(dto.variables);
    const html   = Handlebars.compile(plantilla.cuerpoHtml)(dto.variables);
    const texto  = plantilla.cuerpoTexto
      ? Handlebars.compile(plantilla.cuerpoTexto)(dto.variables)
      : undefined;

    let logId: number | undefined;
    let estado = 'ENVIADO';
    let errorDetalle: string | undefined;
    let respuestaProveedor: string | undefined;
    let intentos = 1;

    try {
      const { result, intentos: att } = await retryWithBackoff(
        () => this.provider.send({ to: dto.to, subject: asunto, html, text: texto }),
        3,
        this.logger,
        `email:${dto.tipoPlantilla}`,
      );
      respuestaProveedor = result;
      intentos = att;
    } catch (err) {
      estado = 'FALLIDO';
      errorDetalle = (err as Error).message?.slice(0, 1000);
      this.logger.error(`Email fallido a ${dto.to}: ${errorDetalle}`);
    }

    const log = await this.prisma.integracionLog.create({
      data: {
        tipo: 'EMAIL',
        canal: process.env.EMAIL_PROVIDER ?? 'smtp',
        estado,
        destinatario: dto.to,
        asunto,
        plantillaId: plantilla.id,
        payload: dto.variables,
        respuestaProveedor,
        intentos,
        idempotencyKey: dto.idempotencyKey,
        usuarioId,
        sucursalId: dto.sucursalId ? Number(dto.sucursalId) : undefined,
        referenciaId: dto.referenciaId,
        referenciaTipo: dto.referenciaTipo,
        errorDetalle,
        duracionMs: Date.now() - inicio,
      },
    });

    logId = log.id;
    if (estado === 'FALLIDO') throw new Error(errorDetalle);
    return { mensaje: 'Email enviado', logId };
  }

  // ── Envío directo sin plantilla (para backups y notificaciones internas) ───

  async enviarDirecto(payload: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await retryWithBackoff(
        () => this.provider.send(payload),
        3,
        this.logger,
        'email:directo',
      );

      await this.prisma.integracionLog.create({
        data: {
          tipo: 'EMAIL',
          canal: process.env.EMAIL_PROVIDER ?? 'smtp',
          estado: 'ENVIADO',
          destinatario: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
          asunto: payload.subject,
        },
      });
    } catch (err) {
      this.logger.error(`Email directo fallido: ${(err as Error).message}`);
      await this.prisma.integracionLog.create({
        data: {
          tipo: 'EMAIL',
          canal: process.env.EMAIL_PROVIDER ?? 'smtp',
          estado: 'FALLIDO',
          destinatario: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
          asunto: payload.subject,
          errorDetalle: (err as Error).message?.slice(0, 1000),
        },
      });
    }
  }
}
