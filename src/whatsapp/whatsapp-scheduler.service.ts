import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import type { EnviarWhatsappDto } from './dto/enviar-whatsapp.dto';

@Injectable()
export class WhatsappSchedulerService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappSchedulerService.name);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly whatsappService: WhatsappService) {}

  programar(id: string, dto: EnviarWhatsappDto, programadoPara: Date): void {
    const ahora = Date.now();
    const delay = programadoPara.getTime() - ahora;

    if (delay <= 0) {
      this.logger.warn(`Mensaje ${id} ya debería haberse enviado, enviando ahora`);
      void this.whatsappService.enviar(dto);
      return;
    }

    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
    }

    const timer = setTimeout(async () => {
      this.logger.log(`Enviando mensaje programado: ${id}`);
      try {
        await this.whatsappService.enviar(dto);
      } catch (err) {
        this.logger.error(`Error enviando mensaje programado ${id}: ${(err as Error).message}`);
      } finally {
        this.timers.delete(id);
      }
    }, delay);

    this.timers.set(id, timer);
    this.logger.log(`WhatsApp programado: ${id} en ${Math.round(delay / 1000)}s`);
  }

  cancelar(id: string): boolean {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      this.timers.delete(id);
      this.logger.log(`WhatsApp cancelado: ${id}`);
      return true;
    }
    return false;
  }

  listar(): string[] {
    return Array.from(this.timers.keys());
  }

  onModuleDestroy() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
