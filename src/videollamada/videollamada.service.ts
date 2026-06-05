import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleMeetProvider } from './providers/google-meet.provider';
import { ZoomProvider } from './providers/zoom.provider';
import type { CrearVideollamadaDto } from './dto/crear-videollamada.dto';

@Injectable()
export class VideollamadaService {
  private readonly logger = new Logger(VideollamadaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMeet: GoogleMeetProvider,
    private readonly zoom: ZoomProvider,
  ) {}

  async crearSala(dto: CrearVideollamadaDto, usuarioId?: number) {
    if (dto.tipoCita !== 'TELEMEDICINA') {
      throw new UnprocessableEntityException(
        'Solo se puede crear videollamada para citas de tipo TELEMEDICINA',
      );
    }

    const proveedor = process.env.VIDEOLLAMADA_PROVIDER ?? 'google_meet';
    const duracion  = dto.duracionMinutos ?? Number(process.env.MEET_DURACION_MINUTOS ?? 60);
    const inicio    = Date.now();

    let meetUrl: string;
    let eventId: string;
    let expiresAt: Date;
    let estado = 'EXITOSO';
    let errorDetalle: string | undefined;

    try {
      let result;
      if (proveedor === 'zoom') {
        result = await this.zoom.crearSala(dto.citaId, duracion, dto.titulo);
      } else {
        result = await this.googleMeet.crearSala(dto.citaId, duracion, dto.titulo);
      }
      meetUrl  = result.meetUrl;
      eventId  = result.eventId;
      expiresAt = result.expiresAt;
    } catch (err) {
      estado = 'FALLIDO';
      errorDetalle = (err as Error).message?.slice(0, 1000);
      this.logger.error(`Videollamada fallida: ${errorDetalle}`);

      await this.prisma.integracionLog.create({
        data: {
          tipo: 'VIDEOLLAMADA',
          canal: proveedor,
          estado,
          referenciaId: dto.citaId,
          referenciaTipo: 'CITA',
          sucursalId: dto.sucursalId,
          usuarioId,
          errorDetalle,
          duracionMs: Date.now() - inicio,
        },
      });

      throw new Error(`Error al crear videollamada: ${errorDetalle}`);
    }

    await this.prisma.integracionLog.create({
      data: {
        tipo: 'VIDEOLLAMADA',
        canal: proveedor,
        estado,
        referenciaId: dto.citaId,
        referenciaTipo: 'CITA',
        sucursalId: dto.sucursalId,
        usuarioId,
        payload: { meetUrl, eventId, expiresAt: expiresAt.toISOString() },
        duracionMs: Date.now() - inicio,
      },
    });

    return { meetUrl, eventId, expiresAt, proveedor };
  }
}
