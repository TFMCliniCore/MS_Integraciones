import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { EmailPayload, EmailProvider } from './email-provider.interface';

@Injectable()
export class SmtpProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(payload: EmailPayload): Promise<string> {
    // Falla rápido si las credenciales SMTP no están configuradas,
    // evitando 3 reintentos innecesarios de backoff exponencial.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        'SMTP_USER o SMTP_PASS no están configurados. Ajusta el .env o cambia EMAIL_PROVIDER=resend.',
      );
    }

    const from = payload.from
      ? `"${payload.fromName ?? 'CliniCore'}" <${payload.from}>`
      : `"${process.env.EMAIL_FROM_NAME ?? 'CliniCore'}" <${process.env.EMAIL_FROM}>`;

    const info = await this.transporter.sendMail({
      from,
      to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    this.logger.log(`SMTP enviado: ${info.messageId}`);
    return info.messageId as string;
  }
}
