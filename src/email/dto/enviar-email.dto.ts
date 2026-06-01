import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export class EnviarEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  tipoPlantilla!: string;

  @IsObject()
  variables!: Record<string, string>;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  sucursalId?: string;

  @IsOptional()
  referenciaId?: number;

  @IsOptional()
  @IsString()
  referenciaTipo?: string;
}

export class EnviarEmailDirectoDto {
  @IsEmail()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  html!: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
