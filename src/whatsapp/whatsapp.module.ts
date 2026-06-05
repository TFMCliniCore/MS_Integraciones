import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappSchedulerService } from './whatsapp-scheduler.service';
import { TwilioProvider } from './providers/twilio.provider';
import { MetaProvider } from './providers/meta.provider';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappSchedulerService, TwilioProvider, MetaProvider],
  exports: [WhatsappService],
})
export class WhatsappModule {}
