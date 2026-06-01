import { IsDateString, IsInt, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class EnviarWhatsappDto {
  @IsString()
  to!: string; // número internacional +57...

  @IsString()
  tipoPlantilla!: string;

  @IsObject()
  parametros!: Record<string, string>; // { nombre, fecha, ... }

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  referenciaId?: number;

  @IsOptional()
  @IsString()
  referenciaTipo?: string;
}

export class ProgramarWhatsappDto extends EnviarWhatsappDto {
  @IsDateString()
  programadoPara!: string; // ISO datetime cuando debe enviarse
}
