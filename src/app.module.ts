import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { VideollamadaModule } from './videollamada/videollamada.module';
import { ExportacionModule } from './exportacion/exportacion.module';
import { BackupsModule } from './backups/backups.module';
import { PlantillasModule } from './plantillas/plantillas.module';
import { ConfiguracionSucursalModule } from './configuracion-sucursal/configuracion-sucursal.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    WhatsappModule,
    VideollamadaModule,
    ExportacionModule,
    BackupsModule,
    PlantillasModule,
    ConfiguracionSucursalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
