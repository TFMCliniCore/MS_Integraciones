import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { SmtpProvider } from './providers/smtp.provider';
import { ResendProvider } from './providers/resend.provider';

@Module({
  controllers: [EmailController],
  providers: [EmailService, SmtpProvider, ResendProvider],
  exports: [EmailService],
})
export class EmailModule {}
