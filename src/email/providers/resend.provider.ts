import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailPayload, EmailProvider } from './email-provider.interface';

@Injectable()
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async send(payload: EmailPayload): Promise<string> {
    const from = payload.from
      ? `${payload.fromName ?? 'CliniCore'} <${payload.from}>`
      : `${process.env.EMAIL_FROM_NAME ?? 'CliniCore'} <${process.env.EMAIL_FROM}>`;

    const { data, error } = await this.client.emails.send({
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
