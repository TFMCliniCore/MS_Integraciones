import { Module } from '@nestjs/common';
import { ExportacionService } from './exportacion.service';
import { ExportacionController } from './exportacion.controller';

@Module({
  controllers: [ExportacionController],
  providers: [ExportacionService],
})
export class ExportacionModule {}
