import { Module } from '@nestjs/common';
import { VideollamadaService } from './videollamada.service';
import { VideollamadaController } from './videollamada.controller';
import { GoogleMeetProvider } from './providers/google-meet.provider';
import { ZoomProvider } from './providers/zoom.provider';

@Module({
  controllers: [VideollamadaController],
  providers: [VideollamadaService, GoogleMeetProvider, ZoomProvider],
})
export class VideollamadaModule {}
