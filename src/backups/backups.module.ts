import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupCronService } from './backup-cron.service';
import { BackupsController } from './backups.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [BackupsController],
  providers: [BackupService, BackupCronService],
  exports: [BackupService],
})
export class BackupsModule {}
