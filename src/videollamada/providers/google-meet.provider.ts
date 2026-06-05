import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { randomUUID } from 'node:crypto';

export interface MeetResult {
  meetUrl: string;
  eventId: string;
  expiresAt: Date;
}

@Injectable()
export class GoogleMeetProvider {
  private readonly logger = new Logger(GoogleMeetProvider.name);

  async crearSala(citaId: number, duracionMinutos: number, titulo?: string): Promise<MeetResult> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const ahora = new Date();
    const fin = new Date(ahora.getTime() + duracionMinutos * 60 * 1000);

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: titulo ?? `Telemedicina CliniCore — Cita #${citaId}`,
        start: { dateTime: ahora.toISOString() },
        end: { dateTime: fin.toISOString() },
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    const meetUrl = event.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === 'video',
    )?.uri;

    if (!meetUrl) throw new Error('Google Meet no devolvió URL de reunión');

    this.logger.log(`Google Meet creado: ${meetUrl}`);
    return { meetUrl, eventId: event.data.id ?? '', expiresAt: fin };
  }
}
