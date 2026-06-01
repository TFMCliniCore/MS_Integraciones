export interface WhatsappPayload {
  to: string;         // número en formato internacional: +57300...
  templateName: string;
  language: string;
  params: string[];   // parámetros posicionales {{1}}, {{2}}...
}

export interface WhatsappProvider {
  send(payload: WhatsappPayload): Promise<string>; // returns messageId
}
