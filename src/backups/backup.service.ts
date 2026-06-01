import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { decrypt } from '../common/crypto.util';

const execFileAsync = promisify(execFile);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async ejecutar(configuracionId: number, usuarioId?: number): Promise<void> {
    const config = await this.prisma.configuracionBackup.findUnique({
      where: { id: configuracionId },
    });
    if (!config || !config.activo) {
      this.logger.warn(`Configuración backup ${configuracionId} no existe o está inactiva`);
      return;
    }

    const inicio = Date.now();
    const backupPath = config.backupPath ?? process.env.BACKUP_PATH ?? '/backups';
    const dbDir = join(backupPath, config.nombreBd);

    try {
      mkdirSync(dbDir, { recursive: true });
    } catch { /* ya existe */ }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename  = `${config.nombreBd}_${timestamp}.dump`;
    const filepath  = join(dbDir, filename);
    const password  = decrypt(config.password);

    let estado: 'EXITOSO' | 'FALLIDO' = 'EXITOSO';
    let errorDetalle: string | undefined;
    let tamanioBytes: bigint | undefined;
    let s3Url: string | undefined;

    try {
      // pg_dump -F c -Z 9 (custom format, máxima compresión)
      await execFileAsync('pg_dump', [
        '-h', config.host,
        '-p', String(config.puerto),
        '-U', config.usuario,
        '-d', config.nombreBd,
        '-F', 'c',
        '-Z', '9',
        '-f', filepath,
      ], {
        env: { ...process.env, PGPASSWORD: password },
        timeout: 30 * 60 * 1000, // 30 min max
      });

      const stat = statSync(filepath);
      tamanioBytes = BigInt(stat.size);
      this.logger.log(`Backup exitoso: ${filename} (${tamanioBytes} bytes)`);

      // Subir a S3 si está habilitado
      if (process.env.S3_ENABLED === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = config as any;
        s3Url = await this.subirS3(filepath, config.nombreBd, filename, cfg.s3Bucket ?? undefined, cfg.s3Prefijo ?? undefined);
      }

      // Limpiar backups vencidos
      this.limpiarVencidos(dbDir, config.retencionDias);

    } catch (err) {
      estado = 'FALLIDO';
      errorDetalle = (err as Error).message?.slice(0, 1000);
      this.logger.error(`Backup fallido ${config.nombreBd}: ${errorDetalle}`);
    }

    const duracionMs = Date.now() - inicio;

    // Registrar en BackupLog
    const log = await this.prisma.backupLog.create({
      data: {
        configuracionBackupId: config.id,
        baseDatos: config.nombreBd,
        tamanioBytes: tamanioBytes ?? null,
        duracionMs,
        rutaArchivo: estado === 'EXITOSO' ? filepath : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(s3Url !== undefined && { s3Url } as any),
        estado,
        errorDetalle,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ disparadoPor: usuarioId ? 'MANUAL' : 'CRON' } as any),
        usuarioId: usuarioId ?? null,
      },
    });

    // Actualizar ultimoBackup
    await this.prisma.configuracionBackup.update({
      where: { id: config.id },
      data: { ultimoBackup: new Date() },
    });

    // Notificar por email
    await this.notificarEmail(config.nombreBd, estado, {
      fecha: new Date().toLocaleString('es-CO'),
      tamanio: tamanioBytes ? `${(Number(tamanioBytes) / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      duracion: `${(duracionMs / 1000).toFixed(1)}s`,
      ruta: filepath,
      errorDetalle: errorDetalle ?? '',
    });
  }

  private async subirS3(
    filepath: string,
    baseDatos: string,
    filename: string,
    bucket?: string,
    prefijo?: string,
  ): Promise<string> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { readFileSync } = await import('node:fs');

    const resolvedBucket = bucket ?? process.env.S3_BUCKET ?? 'clinicore-backups';
    const folder = prefijo ? `${prefijo}/${baseDatos}` : `backups/${baseDatos}`;
    const key = `${folder}/${filename}`;

    const client = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
    });

    await client.send(new PutObjectCommand({
      Bucket: resolvedBucket,
      Key: key,
      Body: readFileSync(filepath),
      ContentType: 'application/octet-stream',
    }));

    const url = `s3://${resolvedBucket}/${key}`;
    this.logger.log(`Backup subido a S3: ${url}`);
    return url;
  }

  private limpiarVencidos(dir: string, retencionDias: number): void {
    const limite = Date.now() - retencionDias * 24 * 60 * 60 * 1000;
    try {
      const archivos = readdirSync(dir);
      for (const archivo of archivos) {
        const ruta = join(dir, archivo);
        const stat = statSync(ruta);
        if (stat.mtimeMs < limite) {
          unlinkSync(ruta);
          this.logger.log(`Backup vencido eliminado: ${archivo}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Error limpiando vencidos: ${(err as Error).message}`);
    }
  }

  private async notificarEmail(
    baseDatos: string,
    estado: string,
    vars: Record<string, string>,
  ): Promise<void> {
    const emails = (process.env.BACKUP_NOTIFY_EMAILS ?? '').split(',').filter(Boolean);
    if (emails.length === 0) return;

    const tipo = estado === 'EXITOSO' ? 'BACKUP_EXITOSO' : 'BACKUP_FALLIDO';

    for (const email of emails) {
      try {
        await this.emailService.enviarConPlantilla({
          to: email.trim(),
          tipoPlantilla: tipo,
          variables: { baseDatos, ...vars },
        });
      } catch (err) {
        this.logger.warn(`No se pudo notificar ${email}: ${(err as Error).message}`);
      }
    }
  }
}
