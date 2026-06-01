import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
import type { WhatsappPayload, WhatsappProvider } from './whatsapp-provider.interface';

@Injectable()
export class TwilioProvider implements WhatsappProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async send(payload: WhatsappPayload): Promise<string> {
    // Twilio usa content templates — armamos el cuerpo interpolando parámetros
    const body = payload.params.length > 0
      ? payload.params.join(' | ')  // simplificado; en producción usar Content API
      : `Mensaje de CliniCore`;

    const message = await this.client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
      to: `whatsapp:${payload.to}`,
      body,
    });

    this.logger.log(`Twilio enviado: ${message.sid}`);
    return message.sid;
  }
}
