import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BackupService } from './backup.service';

@Injectable()
export class BackupCronService {
  private readonly logger = new Logger(BackupCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupService: BackupService,
  ) {}

  // Evalúa cada hora qué backups deben ejecutarse
  @Cron(CronExpression.EVERY_HOUR)
  async evaluarBackups(): Promise<void> {
    const configs = await this.prisma.configuracionBackup.findMany({
      where: { activo: true },
    });

    const ahora = new Date();

    for (const config of configs) {
      if (this.deberiEjecutarse(config.frecuencia, config.ultimoBackup, ahora)) {
        this.logger.log(`Ejecutando backup: ${config.nombre} (${config.frecuencia})`);
        // Ejecutar de forma no bloqueante
        void this.backupService.ejecutar(config.id).catch((err: Error) => {
          this.logger.error(`Error en backup ${config.nombre}: ${err.message}`);
        });
      }
    }
  }

  private deberiEjecutarse(
    frecuencia: string,
    ultimoBackup: Date | null,
    ahora: Date,
  ): boolean {
    if (!ultimoBackup) return true; // nunca ejecutado

    const diffHoras = (ahora.getTime() - ultimoBackup.getTime()) / (1000 * 60 * 60);

    switch (frecuencia.toUpperCase()) {
      case 'DIARIO':
        return diffHoras >= 24 && ahora.getHours() === 2;
      case 'SEMANAL':
        return diffHoras >= 24 * 7 && ahora.getDay() === 0 && ahora.getHours() === 3;
      case 'MENSUAL':
        return diffHoras >= 24 * 28 && ahora.getDate() === 1 && ahora.getHours() === 4;
      default:
        return false;
    }
  }
}
