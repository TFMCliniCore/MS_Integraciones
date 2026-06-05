import { Injectable, Logger } from '@nestjs/common';
import type { WhatsappPayload, WhatsappProvider } from './whatsapp-provider.interface';

@Injectable()
export class MetaProvider implements WhatsappProvider {
  private readonly logger = new Logger(MetaProvider.name);

  async send(payload: WhatsappPayload): Promise<string> {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const token = process.env.META_ACCESS_TOKEN;
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: payload.to.replace('+', ''),
      type: 'template',
      template: {
        name: payload.templateName,
        language: { code: payload.language },
        components: payload.params.length > 0
          ? [{
              type: 'body',
              parameters: payload.params.map((p) => ({ type: 'text', text: p })),
            }]
          : [],
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Meta API error ${res.status}`);
    }

    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    const msgId = data.messages?.[0]?.id ?? 'meta-ok';
    this.logger.log(`Meta enviado: ${msgId}`);
    return msgId;
  }
}
