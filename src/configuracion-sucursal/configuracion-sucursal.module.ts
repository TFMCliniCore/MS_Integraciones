import { Module } from '@nestjs/common';
import { ConfiguracionSucursalController } from './configuracion-sucursal.controller';

@Module({ controllers: [ConfiguracionSucursalController] })
export class ConfiguracionSucursalModule {}
