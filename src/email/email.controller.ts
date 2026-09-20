import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Integraciones - Notificaciones por Email')
@Controller('integraciones/email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('enviar')
  @ApiOperation({ summary: 'Enviar un correo electrónico transaccional individual usando plantillas dinámicas' })
  async enviar(@Body() dto: EnviarEmailDto, @Req() req: Request) {
    const usuarioId = Number(req.headers['x-usuario-id'] ?? 0) || undefined;
    return this.emailService.enviarConPlantilla(dto, usuarioId);
  }

  @Post('masivo')
  @ApiOperation({ summary: 'Disparar campañas de correo masivo parametrizado (Límite: 100 correos por tanda)' })
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
  @ApiOperation({ summary: 'Listar plantillas de correo electrónico activas y disponibles' })
  listarPlantillas() {
    return this.prisma.plantillaEmail.findMany({ where: { activa: true }, orderBy: { tipo: 'asc' } });
  }

  @Get('plantillas/:tipo')
  @ApiOperation({ summary: 'Obtener el diseño y estructura de una plantilla por su código de tipo único' })
  @ApiParam({ name: 'tipo', description: 'Código identificador (Ej: recordatorio_cita_v1)' })
  obtenerPlantilla(@Param('tipo') tipo: string) {
    return this.prisma.plantillaEmail.findUniqueOrThrow({ where: { tipo } });
  }

  @Put('plantillas/:tipo')
  @ApiOperation({ summary: 'Actualizar el asunto o cuerpos (HTML/Texto) de una plantilla de correo' })
  @ApiParam({ name: 'tipo', description: 'Código identificador de la plantilla' })
  actualizarPlantilla(@Param('tipo') tipo: string, @Body() dto: ActualizarPlantillaEmailDto) {
    return this.prisma.plantillaEmail.update({ where: { tipo }, data: dto });
  }
}