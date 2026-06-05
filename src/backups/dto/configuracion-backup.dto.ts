import { IsIn, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearConfiguracionBackupDto {
  @IsString()
  nombre!: string;

  @IsString()
  host!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  puerto?: number = 5432;

  @IsString()
  nombreBd!: string;

  @IsString()
  usuario!: string;

  @IsString()
  password!: string; // se almacenará encriptada

  @IsIn(['DIARIO', 'SEMANAL', 'MENSUAL'])
  frecuencia!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  retencionDias?: number = 7;

  @IsOptional()
  @IsString()
  backupPath?: string;
}

export class ForzarBackupDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  configuracionId!: number;
}
