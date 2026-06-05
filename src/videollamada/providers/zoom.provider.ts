import { Injectable, Logger } from '@nestjs/common';
import type { MeetResult } from './google-meet.provider';

@Injectable()
export class ZoomProvider {
  private readonly logger = new Logger(ZoomProvider.name);

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
    ).toString('base64');

    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}` },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) throw new Error(`Zoom OAuth error: ${res.status}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  async crearSala(citaId: number, duracionMinutos: number, titulo?: string): Promise<MeetResult> {
    const token = await this.getAccessToken();
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + duracionMinutos * 60 * 1000);

    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: titulo ?? `Telemedicina CliniCore — Cita #${citaId}`,
        type: 1, // instant meeting
        duration: duracionMinutos,
        settings: { join_before_host: true, waiting_room: false },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Zoom API error: ${res.status}`);
    const data = (await res.json()) as { join_url: string; id: number };

    this.logger.log(`Zoom meeting creado: ${data.join_url}`);
    return { meetUrl: data.join_url, eventId: String(data.id), expiresAt: fin };
  }
}
