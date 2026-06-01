import { IsArray, IsDateString, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportarDto {
  @IsString()
  nombrePlantilla!: string; // 'Siigo Colombia', 'World Office', 'CSV Genérico'

  @IsArray()
  datos!: Record<string, unknown>[]; // registros a exportar (del MS Ventas)

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;
}
