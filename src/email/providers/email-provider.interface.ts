export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<string>; // returns messageId
}
