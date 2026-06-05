import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { EnviarEmailDto } from './dto/enviar-email.dto';

class ActualizarPlantillaEmailDto {
  @IsOptional() @IsString() asunto?: string;
  @IsOptional() @IsString() cuerpoHtml?: string;
  @IsOptional() @IsString() cuerpoTexto?: string;
}

class DestinatarioMasivoDto {
  @IsString() to!: string;
  @IsOptional() variables?: Record<string, string>;
}

class EnviarEmailMasivoDto {
  @IsString() tipoPlantilla!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => DestinatarioMasivoDto)
  destinatarios!: DestinatarioMasivoDto[];
}

@Controller('integraciones/email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('enviar')
  async enviar(@Body() dto: EnviarEmailDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    return this.emailService.enviarConPlantilla(dto, usuarioId);
  }

  @Post('masivo')
  async masivo(@Body() dto: EnviarEmailMasivoDto, @Req() req: Request) {
    if (dto.destinatarios.length > 100) {
      throw new BadRequestException('Máximo 100 destinatarios por llamada');
    }
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    const resultados = await Promise.allSettled(
      dto.destinatarios.map((d) =>
        this.emailService.enviarConPlantilla(
          { to: d.to, tipoPlantilla: dto.tipoPlantilla, variables: d.variables ?? {} },
          usuarioId,
        ),
      ),
    );
    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;
    const fallidos  = resultados.filter((r) => r.status === 'rejected').length;
    return { mensaje: 'Envío masivo completado', total: dto.destinatarios.length, exitosos, fallidos };
  }

  @Get('plantillas')
  listarPlantillas() {
    return this.prisma.plantillaEmail.findMany({ where: { activa: true }, orderBy: { tipo: 'asc' } });
  }

  @Get('plantillas/:tipo')
  obtenerPlantilla(@Param('tipo') tipo: string) {
    return this.prisma.plantillaEmail.findUniqueOrThrow({ where: { tipo } });
  }

  @Put('plantillas/:tipo')
  actualizarPlantilla(@Param('tipo') tipo: string, @Body() dto: ActualizarPlantillaEmailDto) {
    return this.prisma.plantillaEmail.update({ where: { tipo }, data: dto });
  }
}
