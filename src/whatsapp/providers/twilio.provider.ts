import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
import type { WhatsappPayload, WhatsappProvider } from './whatsapp-provider.interface';

// Mapa de nombres legibles para cada tipo de plantilla
const TEMPLATE_LABELS: Record<string, string> = {
  recordatorio_cita_clinicore:   'Recordatorio de cita',
  confirmacion_cita_clinicore:   'Confirmacion de cita',
  alerta_vacuna_clinicore:       'Alerta de vacuna',
  resultado_consulta_clinicore:  'Resultado de consulta',
  mensaje_personalizado_clinicore: 'Mensaje',
};

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
    const body = this.buildBody(payload);

    const message = await this.client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
      to: `whatsapp:${payload.to}`,
      body,
    });

    this.logger.log(`Twilio enviado: ${message.sid}`);
    return message.sid;
  }

  /**
   * Construye el cuerpo del mensaje.
   * - Si hay rawParams (clave→valor), genera un mensaje estructurado y legible.
   * - Si solo hay params posicionales, los une con saltos de línea.
   * - El Twilio Sandbox acepta texto libre; en producción se usaría Content Templates API.
   */
  private buildBody(payload: WhatsappPayload): string {
    const titulo = TEMPLATE_LABELS[payload.templateName] ?? 'CliniCore';
    const encabezado = `*${titulo}* — CliniCore\n`;

    if (payload.rawParams && Object.keys(payload.rawParams).length > 0) {
      const lineas = Object.entries(payload.rawParams)
        .map(([k, v]) => `• *${k}*: ${v}`)
        .join('\n');
      return `${encabezado}\n${lineas}`;
    }

    if (payload.params.length > 0) {
      return `${encabezado}\n${payload.params.join('\n')}`;
    }

    return encabezado.trim();
  }
}
