import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearVideollamadaDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  citaId!: number;

  @IsString()
  tipoCita!: string; // debe ser 'TELEMEDICINA'

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  duracionMinutos?: number;
}
