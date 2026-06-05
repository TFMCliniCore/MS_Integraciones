import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailPayload, EmailProvider } from './email-provider.interface';

@Injectable()
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  // Inicialización lazy: el cliente se crea solo cuando se necesita,
  // para no fallar en el arranque si RESEND_API_KEY no está configurada.
  private client: Resend | null = null;

  private getClient(): Resend {
    if (!this.client) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error(
          'RESEND_API_KEY no está configurada. Ajusta la variable de entorno o cambia EMAIL_PROVIDER=smtp.',
        );
      }
      this.client = new Resend(apiKey);
    }
    return this.client;
  }

  async send(payload: EmailPayload): Promise<string> {
    const from = payload.from
      ? `${payload.fromName ?? 'CliniCore'} <${payload.from}>`
      : `${process.env.EMAIL_FROM_NAME ?? 'CliniCore'} <${process.env.EMAIL_FROM}>`;

    const { data, error } = await this.getClient().emails.send({
      from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (error) throw new Error(error.message);

    this.logger.log(`Resend enviado: ${data?.id}`);
    return data?.id ?? 'resend-ok';
  }
}
